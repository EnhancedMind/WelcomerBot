const crypto = require('crypto');
const url = require('url');

const { consoleLog } = require('../../Data/Log');

const { player: { allowedExtensions }, filebrowser: { filebrowserApiUrl } } = require('../../../config/config.json');


/**
 * Performs a passwordless handshake with File Browser.
 * Exchanges the admin proxy header for a temporary cryptographic JWT token.
 * @returns {string} the admin JWT token
 */
async function getAdminToken() {
    const response = await fetch(`${filebrowserApiUrl}/login`, {
        method: 'POST',
        headers: {
            'X-Welcomer-User': 'admin',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    });

    if (!response.ok) {
        throw new Error(`Admin proxy handshake failed: ${response.status} ${response.statusText}`);
    }

    // return the raw plain-text JWT token
    return await response.text();
}

/**
 * Generates a cryptographically secure, random 20-character password string.
 * @returns {string} A random password string.
 */
function generateRandomPassword() {
    // 15 bytes converts to a 20-character base64 string according to AI
    return crypto.randomBytes(15).toString('base64')
        .replace(/\+/g, 'a') // Clean up characters that might trip up URL encoding or APIs
        .replace(/\//g, 'b')
        .slice(0, 20);
}

/**
 * Checks if a user profile exists. 
 * If missing, it creates it.
 * @param {string} username - the username for the filebrowser account, typically the Discord user ID or a special role identifier like "developer"
 * @param {string} scopePath - the scopePath of the user. Relative to topMusicDir.
 * @returns {Promise<void>} Resolves when the user is verified to exist or is successfully created. Rejects on any error.
 */
async function ensureUserExists(username, scopePath) {
    try {
        // ensure standard forward slashes
        const normalizedScope = scopePath.replace(/\\/g, '/');

        const token = await getAdminToken();
        
        const authHeaders = {
            'X-Auth': token,
            'Content-Type': 'application/json'
        };

        // Fetch the current user list from the database
        const listResponse = await fetch(`${filebrowserApiUrl}/users`, {
            method: 'GET',
            headers: authHeaders
        });

        if (!listResponse.ok) {
            throw new Error(`Failed to retrieve user database: ${listResponse.statusText}`);
        }

        const users = await listResponse.json();
        const existingUser = users.find(u => u.username === username);

        // Define strict configuration blueprint
        const targetConfig = {
            scope: normalizedScope,
            locale: 'en',
            viewMode: 'list',
            singleClick: false,
            redirectAfterCopyMove: false,
            sorting: {
                by: 'name',
                asc: false
            },
            perm: {
                admin: false,
                execute: false, // disabled
                create: true,
                rename: true,
                modify: true,
                delete: true,
                share: false,   // disabled
                download: true
            },
            commands: [],
            hideDotfiles: false,
            dateFormat: false,
            aceEditorTheme: '',
            username: username,
            password: generateRandomPassword(),
            rules: [  // only allow music files with config allowed extensions
                {
                    'allow': false,
                    'path': '',
                    'regex': true,
                    'regexp': {
                        'raw': '[.][a-zA-Z][^/]*$'  // match a literal dot '[.]', followed by a letter '[a-zA-Z]' and not followed with a / until the end of string '[^/]*$'
                    }
                },
                {
                    'allow': true,
                    'path': '',
                    'regex': true,
                    'regexp': {
                        'raw': `(?i)[.](${allowedExtensions.join('|')})$` // match a literal dot '[.]', followed by case insensitive '(?i)' extension '(...|...)' at the end of string '$'
                    }
                }
            ],
            lockPassword: true
        };

        // handle existing users - verify/correct their settings
        if (existingUser) {
            if (existingUser.scope !== normalizedScope) {
                consoleLog(`[INFO] Reconfiguring misconfigured profile for filebrowser user ${username} (ID: ${existingUser.id})...`);
                
                // PUT requests to /api/users/:id, use the envelope structure too
                const updatePayload = {
                    what: 'user',
                    which: [],
                    current_password: '',
                    data: {
                        ...existingUser,
                        ...targetConfig,
                        id: existingUser.id // maintain ID integrity
                    }
                };

                const updateResponse = await fetch(`${filebrowserApiUrl}/users/${existingUser.id}`, {
                    method: 'PUT',
                    headers: authHeaders,
                    body: JSON.stringify(updatePayload)
                });

                if (!updateResponse.ok) {
                    throw new Error(`Failed to update user profile: ${await updateResponse.text()}`);
                }
                consoleLog(`[INFO] Profile for filebrowser user "${username}" successfully configured.`);
            }
            return;
        }

        // make a new jailed profile inside the strict schema envelope
        consoleLog(`[INFO] Creating new profile for filebrowser user "${username}" locked to scope: ${normalizedScope}`);
        
        const createPayload = {
            what: 'user',
            which: [],
            current_password: '',
            data: {
                ...targetConfig,
                id: 0 // 0 instructs the DB to assign the next auto-incremented primary key
            }
        };

        const createResponse = await fetch(`${filebrowserApiUrl}/users`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify(createPayload)
        });

        if (!createResponse.ok) {
            throw new Error(`Failed to provision user: ${createResponse.status} ${await createResponse.text()}`);
        }

        consoleLog(`[INFO] Jailed account layout for filebrowser user "${username}" cleanly created.`);
    }
    catch (error) {
        consoleLog(`[ERROR] Error while creating filebrowser user`, error);
        throw new Error(error);
    }
}

module.exports = { ensureUserExists };
