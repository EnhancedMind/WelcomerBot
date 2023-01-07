const Command = require('../../Structures/Command.js');

const { consoleLog } = require('../../Data/Log.js');
const { bot: { token, owner }, emoji: { success, error, loading }, response: { invalidPermissions } } = require('../../../config/config.json');


module.exports = new Command({
	name: 'restart',
	aliases: [ 'reboot' ],
	description: "Restarts the bot's client",
	async run(message, args, client) {
		if (message.author.id != owner) return message.channel.send(`${error} ${invalidPermissions}`);

		consoleLog('[INFO] Restarting...');

		await message.channel.send(`${loading} Restarting...`);

		client.destroy();
		await client.login(token);
		
		consoleLog(`[INFO] ${client.user.username} is online and ready on ${client.guilds.cache.size} servers!`);
		
		const response = await message.channel.messages.fetch({ limit: 1 });
		try {
			response.first().edit(`${success} Restarted!`);
		}
		catch (error) {
			consoleLog(`[WARN] Restart response edit error`, error);
		}
	}
});
