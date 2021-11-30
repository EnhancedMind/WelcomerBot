const Command = require('../Structures/Command.js');

const { token, owner } = require('../Data/data.js');

module.exports = new Command({
	name: 'restart',
	aliases: [ 'reboot' ],
	description: "Restarts the bot's client",
	async run(message, args, client) {
		if (message.author.id != owner) return message.channel.send('Invalid permission!');
		console.log('Restarting...');
		message.channel.send('Restarting...')
		.then(() => client.destroy())
		.then(() => client.login(token))
		.then(() => { console.log(`${client.user.username} is online!`);
					  message.channel.send('Done!')});
	}
});
