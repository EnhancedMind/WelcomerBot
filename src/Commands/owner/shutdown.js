const Command = require('../../Structures/Command.js');

const { consoleLog } = require('../../Data/Log.js');
const { owner } = require('../../Data/data.js');

module.exports = new Command({
	name: 'shutdown',
    aliases: [ 'gosleep' ],
	description: 'Safely shuts down the bot',
	async run(message, args, client) {
		if (message.author.id != owner) return message.channel.send('Invalid permission!');
        consoleLog('[INFO] Powering off...');
        message.channel.send(':bulb: Shutting down...').then(() => {
            client.destroy();
            process.exit(0);
        });
	}
});
