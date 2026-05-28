const http = require('http');
const crypto = require('crypto');
const path = require('path');
const { rm } = require('fs/promises');
const { readFileSync } = require('fs');

const { consumeLoginToken } = require('./tokenStore');
const { consoleLog } = require('../../Data/Log');
const Client = require('../Client');
const { syncSoundFiles, getUserPath, getFileDuration } = require('../musicFilesManager');

const { emoji: { warning }, player: { maxTime, allowedExtensions }, filebrowser: { port, filebrowserUrl, cookieName, sessionLifetimeMinutes, maxUploadSizeBytes } } = require('../../../config/config.json');

const cookieSecret = crypto.randomBytes(64).toString('hex');
const isProd = process.env.NODE_ENV == 'production';

const htmlPath = path.join(__dirname, 'login.html');
const loginHtmlContent = readFileSync(htmlPath, 'utf8');

const activeUploadsLength = new Map();


// cryptographic cookie helpers
/**
 * Creates a string of `${username}.${signature}`
 * @param {string} username - the username to generate the signature for
 * @returns {string} - `${username}.${signature}`
 */
function signUser(username) {
    const expiresAt = Date.now() + (sessionLifetimeMinutes * 60 * 1000);
    const payload = `${username}:${expiresAt}`;

    const signature = crypto.createHmac('sha256', cookieSecret).update(payload).digest('base64url');
    return `${payload}.${signature}`;
}

/**
 * Verifies the cookies signature
 * @param {string} cookieValue - the cookie string
 * @returns {string|null} - returns the username if signature is correct or null otherwise
 */
function verifyUser(cookieValue) {
    if (!cookieValue) return null;

    const parts = cookieValue.split('.');
    if (parts.length != 2) return null;

    const [ payload, signature ] = parts;
    const [ username, expiresAtString ] = payload.split(':');
    const expectedSignature = crypto.createHmac('sha256', cookieSecret).update(payload).digest('base64url');
    
    // Time-constant comparison prevents timing attacks (AI)
    if (!crypto.timingSafeEqual( Buffer.from(signature), Buffer.from(expectedSignature) )) {
        return null;
    }
    
    const expiresAt = parseInt(expiresAtString, 10);

    if (Date.now() > expiresAt) {
        return null;
    }

    return username;
}

/**
 * Extracts the value of cookie with name from cookie header
 * @param {*} cookieHeader - the cookie header
 * @param {string} name - the cookie name to extract
 * @returns {string} - the cookie value
 */
function parseCookieHeader(cookieHeader, name) {
    if (!cookieHeader) return null;
    const pairs = cookieHeader.split(';');
    for (let pair of pairs) {
        const [key, value] = pair.trim().split('=');
        if (key === name) return decodeURIComponent(value);
    }
    return null;
}


/**
 * Starts the reverse proxy for filebrowser
 * @param {Client} client - the discord.js client
 */
function initProxyServer(client) {
    // core HTTP router
    const server = http.createServer((req, res) => {
        const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
        const pathname = parsedUrl.pathname;

        // scrapers dont usually run js, so a file with js is servered that validates the token with POST request, not get
        if (pathname === '/proxylogin' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            return res.end(loginHtmlContent);
        }

        // login route with token
        if (pathname === '/proxylogin/verify' && req.method === 'POST') {
            const token = parsedUrl.searchParams.get('token');
            
            if (!token) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                return res.end('Bad Request: Token missing.');
            }

            const fbUser = consumeLoginToken(token);

            if (!fbUser) {
                res.writeHead(403, { 'Content-Type': 'text/plain' });
                return res.end('Forbidden: Token/link invalid or already used.');
            }

            // issue signed secure session cookie string manually
            const signedCookie = signUser(fbUser);
            
            res.writeHead(200, {
                'Content-Type': 'text/plain',
                'Set-Cookie': `${cookieName}=${signedCookie}; Path=/; HttpOnly; SameSite=Strict${isProd ? '; Secure' : ''}`
            });
            return res.end();
        }

        // verify cookie from request
        const rawCookie = parseCookieHeader(req.headers.cookie, cookieName);
        const verifiedUser = verifyUser(rawCookie);

        if (!verifiedUser) {
            res.writeHead(401, { 'Content-Type': 'text/plain' });
            return res.end('Unauthorized: Invalid or expired session.');
        }

        const rollingCookie = signUser(verifiedUser);
        res.setHeader('Set-Cookie', `${cookieName}=${rollingCookie}; Path=/; HttpOnly; SameSite=Strict${isProd ? '; Secure' : ''}`);

        // inject user identity context for File Browser upstream
        req.headers['x-welcomer-user'] = verifiedUser;


        // check if manupulated file has a valid extension
        if (pathname.startsWith('/api/resources/') && verifiedUser != 'admin') {
            const isFolder = pathname.endsWith('/');

            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && !isFolder) {
                const ext = path.extname(pathname).toLowerCase().slice(1); // remove the dot
                if (!allowedExtensions.includes(ext)) {
                    res.writeHead(403, { 'Content-Type': 'text/plain' });
                    return res.end('Forbidden: This file type is not allowed.');
                }
            }

            if (req.method === 'PATCH' && !isFolder) {
                const urlObject = new URL(req.url, `http://${req.headers.host}`);
                const destination = urlObject.searchParams.get('destination');

                if (destination) {
                    const ext = path.extname(destination).toLowerCase().slice(1); // remove the dot
                    if (!allowedExtensions.includes(ext)) {
                        res.writeHead(403, { 'Content-Type': 'text/plain' });
                        return res.end('Forbidden: Target file type is not allowed.');
                    }
                }
            }
        }

        // block downloads of non allowed file types
        if (req.method === 'GET' && pathname.startsWith('/api/raw/') && verifiedUser != 'admin') {
            const ext = path.extname(pathname).toLowerCase().slice(1); // remove the dot
            if (!allowedExtensions.includes(ext)) {
                res.writeHead(403, { 'Content-Type': 'text/plain' });
                return res.end('Forbidden: This file type is not allowed.');
            }
        }

        // check if request is a TUS upload initiation and if the declared upload size exceeds the configured maximum
        if (req.method === 'POST' && pathname.startsWith('/api/tus/') && verifiedUser != 'admin') {
            const uploadLength = req.headers['upload-length'];
            if (uploadLength && parseInt(uploadLength, 10) > maxUploadSizeBytes) {
                res.writeHead(413, { 'Content-Type': 'text/plain' });
                return res.end(`Payload Too Large: Maximum allowed upload size is ${maxUploadSizeBytes / 1024 / 1024} MB.`);
            }
            if (verifiedUser != 'admin' && verifiedUser != 'developer') activeUploadsLength.set(`${verifiedUser}:${pathname}`, parseInt(uploadLength, 10));
        }

        // reverse proxy for upstream filebrowser
        // glue the request url onto the filebrowser url (/api/tus => filebrowser:8080/api/tus)
        const targetUrl = new URL(req.url, filebrowserUrl);

        const proxyReq = http.request(
            {
                hostname: targetUrl.hostname,
                port: targetUrl.port || 80,
                path: targetUrl.pathname + targetUrl.search,
                method: req.method,
                headers: req.headers
            }, 
            (proxyRes) => {
                // is a request for directory listing and not from admin user
                const isDirListing = req.method === 'GET' && pathname.startsWith('/api/resources/') && pathname.endsWith('/') && verifiedUser != 'admin';

                // Pass response status and headers immediately back to browser
                if (!isDirListing) {
                    res.writeHead(proxyRes.statusCode, proxyRes.headers);
                    proxyRes.pipe(res);
                }

                let dataBuffer = '';
                if (isDirListing) {
                    proxyRes.on('data', (chunk) => {
                        dataBuffer += chunk.toString();
                    });
                }

                // fires when data pipeline with File Browser concludes cleanly
                proxyRes.on('end', async () => {
                    if (isDirListing) {
                        try {
                            let json = JSON.parse(dataBuffer);

                            if (json.items && Array.isArray(json.items)) {
                                json.items = json.items.filter(item => {
                                    if (item.isDir) return true;
                                    const ext = item.extension.startsWith('.') ? item.extension.slice(1).toLowerCase() : item.extension.toLowerCase();
                                    return allowedExtensions.includes(ext);
                                });

                                json.numFiles = json.items.filter(item => !item.isDir).length;
                                json.numDirs = json.items.filter(item => item.isDir).length;
                            }

                            const modifiedBody = JSON.stringify(json);
                            const modifiedHeaders = { ...proxyRes.headers };
                            modifiedHeaders['content-length'] = Buffer.byteLength(modifiedBody, 'utf8');

                            res.writeHead(proxyRes.statusCode, modifiedHeaders);
                            res.end(modifiedBody);
                        }
                        catch {
                            res.writeHead(proxyRes.statusCode, proxyRes.headers);
                            res.end(dataBuffer);
                        }
                        return;
                    }

                    // Catch successful TUS protocol chunks stream completions
                    if (req.method === 'PATCH' && pathname.startsWith('/api/tus/') && verifiedUser != 'admin' && verifiedUser != 'developer') {
                        if (proxyRes.statusCode === 200 || proxyRes.statusCode === 204) {

                            const currentOffset = parseInt(proxyRes.headers['upload-offset'] || 0, 10);
                            const totalExpectedLength = activeUploadsLength.get(`${verifiedUser}:${pathname}`);

                            if (totalExpectedLength && currentOffset >= totalExpectedLength) {
                                activeUploadsLength.delete(`${verifiedUser}:${pathname}`);

                                // strip the endpoint namespace and clean up special character encoding
                                const cleanedPath = decodeURIComponent(pathname.replace('/api/tus', ''));
                                await handleFileUploadCompletion(client, cleanedPath, verifiedUser);
                            }
                        }
                    }
                });
            }
        );

        // handle sudden proxy or upstream connection dropouts
        proxyReq.on('error', (err) => {
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Reverse Proxy Error.');
            }
        });

        // pipe raw incoming browser chunks straight to the backend socket
        req.pipe(proxyReq);
    });

    // start the server
    server.listen(port, () => {
        consoleLog(`[INFO] Filebrowser reverse proxy running on port ${port}!`);
    });
}

/**
 * This function is called when the filebrowser signals that an upload has completed.
 * @param {Client} client - The discord.js client instance
 * @param {string} filePath - The relative path of the uploaded file from user's scope
 * @param {string} userID - The ID of the user who uploaded the file
 * @returns {void}
 */
async function handleFileUploadCompletion(client, filePath, userID) {
    const absoluteFilePath = path.join(await getUserPath(client, userID), filePath);

    const duration = await getFileDuration(absoluteFilePath).catch(err => {
        consoleLog(`[ERR] Error getting file duration for ${absoluteFilePath}:`, err);
    });

    if (!isNaN(duration) && duration <= maxTime) {
        syncSoundFiles(client).catch(() => {});
        return;
    }

    try {
        await new Promise(resolve => setTimeout(resolve, 200)); // short delay to ensure file is unlocked
        await rm(absoluteFilePath, { force: true });
    }
    catch (err) {
        consoleLog(`[ERR] Failed to remove file ${absoluteFilePath}:`, err);
        return;
    }

    const user = await client.users.fetch(userID);

    const message = [
        `${warning} A file upload from file browser was traced back to your account.`,
        `The file was automatically removed to prevent abuse.`
    ];

    if (!isNaN(duration)) message.splice(1, 0, `The file \`${filePath}\` has a duration of ${duration.toFixed(2)} seconds, which exceeds the maximum allowed duration of ${maxTime} seconds.`,)
    else message.splice(1, 0, `The file \`${filePath}\` could not be processed to determine its duration, and was removed as a precaution.`);

    user.send(message.join('\n')).catch(err => {
        consoleLog(`[ERR] Error sending message to user ${userID}:`, err);
    });
}

module.exports = { initProxyServer }
