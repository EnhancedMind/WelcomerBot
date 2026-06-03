const Discord = require('discord.js');
const Client = require('./Client');

/**
 * @param {Discord.Message | Discord.Interaction} message
 * @param {string[]} args
 * @param {Client} client
 */
function RunFunction(message, args, client) {}


/**
 * @typedef {Object} CommandOptions
 * @property {string} name - The main name of the command.
 * @property {string[]} [aliases] - Alternative triggers for the command.
 * @property {string} [category] - The group this command belongs to.
 * @property {string} [syntax] - How to use the command (e.g. 'kick <user> <reason>').
 * @property {string} description - A brief explanation of what the command does.
 * @property {string} [help] - Longer, detailed help information.
 * @property {RunFunction} run - The actual code execution block.
 */
class Command {
    /**
     * @param {CommandOptions} options
     */
    constructor(options) {
        this.name = options.name;
        this.aliases = options.aliases;
        this.category = options.category;
        this.syntax = options.syntax;
        this.description = options.description;
        this.help = options.help;
        this.run = options.run;
    }
}

module.exports = Command;
