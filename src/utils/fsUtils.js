const { stat } = require('fs/promises');

/**
 * Safely asynchronously checks if a file system path exists without throwing errors.
 * @param {string} path - The path to the file or directory to verify.
 * @returns {Promise<{boolean}>} - True if the path exists, false otherwise.
 */
async function exists(path) {
    try {
        await stat(path);
        return true;
    }
    catch {
        return false;
    }
}


module.exports = { exists };
