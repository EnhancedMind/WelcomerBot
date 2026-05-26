const http = require('http');
const crypto = require('crypto');
const path = require('path');
const { rm } = require('fs/promises');
const { readFileSync } = require('fs');

const { consumeLoginToken } = require('./tokenStore');
const { consoleLog } = require('../../Data/Log');
const Client = require('../Client');
const { syncSoundFiles, getUserPath, getFileDuration } = require('../musicFilesManager');

const { emoji: { warning }, player: { maxTime }, filebrowser: { port, filebrowserUrl, cookieName, sessionLifetimeMinutes } } = require('../../../config/config.json');

const cookieSecret = crypto.randomBytes(64).toString('hex');
const isProd = process.env.NODE_ENV == 'production';

const htmlPath = path.join(__dirname, 'login.html');
const loginHtmlContent = readFileSync(htmlPath, 'utf8');


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
            // Pass response status and headers immediately back to browser
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);


            // rires when data pipeline with File Browser concludes cleanly
            proxyRes.on('end', async () => {
                if (verifiedUser == 'admin' || verifiedUser == 'developer') return;
                
                // Catch successful TUS protocol chunks stream completions
                if (req.method === 'PATCH' && pathname.startsWith('/api/tus/')) {
                    if (proxyRes.statusCode === 200 || proxyRes.statusCode === 204) {
                        
                        // strip the endpoint namespace and clean up special character encoding
                        const cleanedPath = decodeURIComponent(pathname.replace('/api/tus', ''));
                        
                        await handleFileUploadCompletion(client, cleanedPath, verifiedUser);
                    }
                }
            });
        });

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
    consoleLog(`[INFO] Detected completed upload for user ${userID}: ${filePath}`);
    const absoluteFilePath = path.join(await getUserPath(client, userID), filePath);

    const duration = await getFileDuration(absoluteFilePath).catch(err => {
        consoleLog(`[ERR] Error getting file duration for ${absoluteFilePath}:`, err);
        return null;
    });

    consoleLog(`[INFO] File upload completed: ${absoluteFilePath} (Duration: ${duration}s)`);

    if (duration <= maxTime) {
        syncSoundFiles(client).catch(() => {});
        return;
    }

    try {
        await rm(absoluteFilePath);
    }
    catch (err) {
        consoleLog(`[ERR] Failed to remove file ${absoluteFilePath}:`, err);
        return;
    }

    const user = await client.users.fetch(userID);

    const message = [
        `${warning} A file upload from file browser was traced back to your account.`,
        `The file \`${filePath}\` has a duration of ${duration.toFixed(2)} seconds, which exceeds the maximum allowed duration of ${maxTime} seconds.`,
        `The file was automatically removed to prevent abuse.`
    ];
    user.send(message.join('\n')).catch(err => {
        consoleLog(`[ERR] Error sending message to user ${userID}:`, err);
    });
}

module.exports = { initProxyServer }
