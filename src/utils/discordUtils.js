

/**
 * Extracts a valid Discord user ID from a mention or a raw ID string.
 * * @param {string} input - The raw input string (e.g., "<@!123456789012345678>" or "123456789012345678").
 * @returns {string|null} The extracted 18-19 digit user ID, or null if the input is invalid or does not contain an id.
 */
function extractUserId(input) {
    if (typeof input !== 'string') return null;

    const mentionMatch = input.match(/^<@!?([0-9]{18,19})>/);
    if (mentionMatch) return mentionMatch[1];

    const userIdMatch = input.match(/^([0-9]{18,19})$/);
    if (userIdMatch) return userIdMatch[1];
    
    return null;
}

module.exports = { extractUserId };
