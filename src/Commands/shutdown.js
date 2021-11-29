const Command = require('../Structures/Command.js');

const { owner } = require('../Data/data.js');

module.exports = new Command({
	name: 'shutdown',
	description: 'shutdown',
	async run(message, args, client) {
		if (message.author.id != owner) return message.channel.send('Invalid permission!');
        console.log('Powering off...');
        message.channel.send(':bulb: Shutting down...').then(() => {
            client.destroy();
            process.exit(0);
        });
	}
});
