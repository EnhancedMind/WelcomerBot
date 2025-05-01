const Command = require('../../Structures/Command');

const { ActivityType } = require('discord.js');

const { bot: { ownerID }, status: { game }, emoji: { success, error }, response: { invalidPermissions } } = require('../../../config/config.json');


module.exports = new Command({
	name: 'setgame',
	aliases: [ ' ' ],
	syntax: 'setgame <game>',
	description: 'Sets the game the bot is playing',
	async run(message, args, client) {
		if (message.author.id != ownerID) return message.channel.send(`${error} ${invalidPermissions}`);
        if (!args[0]) {
			client.user.setActivity(
				game,
				{ type: ActivityType.Playing }
			);
			return message.channel.send(`${success} I'm now playing \`**${game}**\` (default)`);
		}
        client.user.setActivity(
			args.slice(0).join(' '),
			{ type: ActivityType.Playing }
		);
        message.channel.send(`${success} I'm now playing \`${args.slice(0).join(' ')}\``);
	}
});
