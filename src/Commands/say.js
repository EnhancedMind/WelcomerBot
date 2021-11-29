const Command = require('../Structures/Command.js');

module.exports = new Command({
	name: 'say',
	description: 'repeats',
	async run(message, args, client) {
		if (!args[1]) return message.channel.send('Invalid argument!');
        message.delete();
        message.channel.send(args.slice(1).join(' '));
	}
});