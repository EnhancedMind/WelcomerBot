const crypto = require('crypto');

const tokenPool = new Map();

/**
 * Generates a single-use token for a specific user.
 * @param {string} username - The filebrowser user.
 * @returns {string} The cryptographically secure token string.
 */
function generateLoginToken(username) {
    const token = crypto.randomBytes(20).toString('hex');
    const expiresAt = Date.now() + 10 * 60 * 1000;

    tokenPool.set(token, { username, expiresAt });

    // auto cleanup
    setTimeout(() => {
        tokenPool.delete(token);
    }, 10 * 60 * 1000);

    return token;
}

/**
 * Validates and consumes a single-use token.
 * @param {string} token - The token string from the URL parameter.
 * @returns {string|null} The linked username, or null if invalid/expired.
 */
function consumeLoginToken(token) {
    const record = tokenPool.get(token);

    if (!record) return null;

    // delete to enforce single use
    tokenPool.delete(token);

    if (Date.now() > record.expiresAt) {
        return null; // Expired
    }

    return record.username;
}

module.exports = {
    generateLoginToken,
    consumeLoginToken
};
