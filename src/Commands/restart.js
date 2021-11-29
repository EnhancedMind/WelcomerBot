const Command = require('../Structures/Command.js');

const { owner } = require('../Data/data.js');

module.exports = new Command({
	name: 'restart',
	description: 'restart',
	async run(message, args, client) {
		if (message.author.id != owner) return message.channel.send('Invalid permission!');
		console.log('Restarting...');
		message.channel.send('Restarting...')
		.then(() => client.destroy())
		.then(() => client.login(process.env.DISCORD_TOKEN))
		.then(() => { console.log(`${client.user.username} is online!`);
					  message.channel.send('Done!')});
	}
});
