const Command = require('../../Structures/Command');

const { readdirSync, existsSync } = require('fs');
const { bot: { owner }, emoji: { success, error }, response: { invalidPermissions } } = require('../../../config/config.json');

module.exports = new Command({
	name: 'debug',
	aliases: [ 'getlog' ],
	syntax: 'debug <logFile>',
	description: 'Sends selected log as a message attachment',
	async run(message, args, client) {
		if (message.author.id != owner) return message.channel.send(`${error} ${invalidPermissions}`);
        if (!args[0]) return message.channel.send(`${success} Logs: ${readdirSync('./logs/').join(', ')}`);
        if (existsSync(`./logs/${args[0]}`)) message.channel.send({ content: `${success} File: ./logs/${args[0]}`, files: [ `./logs/${args[0]}` ] });
        else message.channel.send(`${error} That file doesn't exist!`);
	}
});
