const Command = require('../Structures/Command.js');

module.exports = new Command({
	name: 'say',
	aliases: [ ],
	description: 'Repeats whatever the message said, then quietly deletes the message',
	async run(message, args, client) {
		if (!args[0]) return message.channel.send('Invalid argument!');
        message.delete();
        message.channel.send(args.slice(0).join(' '));
	}
});