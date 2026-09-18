

/**
 * Extracts a valid Discord user ID from a mention or a raw ID string.
 * @param {string | string[]} input - The raw input string (e.g., "<@!123456789012345678>" or "123456789012345678"), or array of strings.
 * @returns { [ string | null, string[] ] } Array[ The extracted 18-19 digit user ID or null if the input is invalid or does not contain an id, remaining input (positionals)].
 */
function extractUserId(input) {
    if (typeof input === 'string') input = [input];

    if (!Array.isArray(input) || input.length === 0) return [null, input];

    for (let i = 0; i < input.length; i++) {
        if (typeof input[i] !== 'string') continue;

        const mentionMatch = input[i].match(/^<@!?([0-9]{18,19})>$/);
        if (mentionMatch) {
            const positionals = [...input.slice(0, i), ...input.slice(i + 1)];
            return [ mentionMatch[1], positionals ];
        }

        const userIdMatch = input[i].match(/^([0-9]{18,19})$/);
        if (userIdMatch) {
            const positionals = [...input.slice(0, i), ...input.slice(i + 1)];
            return [ userIdMatch[1], positionals ];
        }
    }

    return [null, input];
}


/**
 * Extracts a page number from the input, taking 1-indexed input and returning 0-indexed output
 * @param {string | string[]} input - Array of string or string to extract the page number from
 * @returns { [ number, string[] ] } The extracted page number, 0-indexed, and the remaining input (positionals) as an array of strings, or 0 if invalid
 */
function extractPageNumber(input) {
    if (typeof input === 'string') input = [input];

    if (!Array.isArray(input) || input.length === 0) return [0, input];

    for (let i = 0; i < input.length; i++) {
        if (typeof input[i] !== 'string') continue;

        const pageMatch = input[i].match(/^([0-9]{1,3})$/);
        if (pageMatch) {
            const pageNumber = Math.max(0, parseInt(pageMatch[1], 10) - 1);
            const positionals = [ ...input.slice(0, i), ...input.slice(i + 1) ];
            return [pageNumber, positionals];
        }
    }

    return [0, input];
}

module.exports = {
    extractUserId,
    extractPageNumber
};
