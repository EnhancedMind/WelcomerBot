const Command = require('../Structures/Command.js');

const { consoleLog } = require('../Data/Log.js');
const { token, owner } = require('../Data/data.js');

module.exports = new Command({
	name: 'restart',
	aliases: [ 'reboot' ],
	description: "Restarts the bot's client",
	async run(message, args, client) {
		if (message.author.id != owner) return message.channel.send('Invalid permission!');
		consoleLog('[INFO] Restarting...');
		message.channel.send('Restarting...')
		.then(() => client.destroy())
		.then(() => client.login(token))
		.then(() => { 
			consoleLog(`[INFO] ${client.user.username} is online and ready on ${client.guilds.cache.size} servers!`);
			message.channel.messages.fetch({limit: 1}).then(result => {
				message.channel.bulkDelete(result);
			});
			message.channel.send('Done!')
		});
	}
});
