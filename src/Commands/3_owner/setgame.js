const Command = require('../../Structures/Command');

const { ActivityType } = require('discord.js');

const { bot: { ownerID, devIDs }, status: { game }, emoji: { success, error }, response: { invalidPermissions } } = require('../../../config/config.json');


module.exports = new Command({
	name: 'setgame',
	aliases: [ ' ' ],
	syntax: 'setgame <game>',
	description: 'Sets the game the bot is playing',
	async run(message, args, client) {
		const senderId = message.author.id;
        if (senderId != ownerID && !devIDs.includes(senderId)) return await message.channel.send(`${error} ${invalidPermissions}`);
        if (!args[0]) {
			client.user.setActivity(
				game,
				{ type: ActivityType.Playing }
			);
			return await message.channel.send(`${success} I'm now playing \`**${game}**\` (default)`);
		}
        client.user.setActivity(
			args.slice(0).join(' '),
			{ type: ActivityType.Playing }
		);
        await message.channel.send(`${success} I'm now playing \`${args.slice(0).join(' ')}\``);
	}
});
