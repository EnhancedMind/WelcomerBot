const Discord = require('discord.js');
const Client = require('./Client');

/**
 * @param {Discord.Message | Discord.Interaction} message
 * @param {string[]} args
 * @param {Client} client
 */
function RunFunction(message, args, client) {}


class Command {
	/**
	 * @typedef {{name: string, description: string, run: RunFunction}} CommandOptions
	 * @param {CommandOptions} options
	 */
	constructor(options) {
		this.name = options.name;
		this.aliases = options.aliases;
		this.syntax = options.syntax;
		this.description = options.description;
		this.run = options.run;
	}
}

module.exports = Command;
