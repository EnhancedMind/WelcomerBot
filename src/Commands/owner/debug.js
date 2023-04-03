const Command = require('../../Structures/Command');

const { readdirSync } = require('fs');
const { bot: { ownerID }, emoji: { success, error }, response: { invalidPermissions } } = require('../../../config/config.json');


module.exports = new Command({
	name: 'debug',
	aliases: [ 'getlog' ],
	syntax: 'debug <logFile>',
	description: 'Sends selected log as a message attachment',
	async run(message, args, client) {
		if (message.author.id != ownerID) return message.channel.send(`${error} ${invalidPermissions}`);

		const files = readdirSync('./logs/');

        if (!args[0]) return message.channel.send(`${success} Logs: **${files.join('**, **')}**`);

		for (const file of files) {
			if (file.startsWith(args[0])) {
				message.channel.send({ content: `${success} File: **./logs/${file}**`, files: [ `./logs/${file}` ] });
				return;
			}
		}
        message.channel.send(`${error} That file doesn't exist!`);
	}
});
