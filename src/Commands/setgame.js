const Command = require('../Structures/Command.js');

const { owner } = require('../Data/data.js');

module.exports = new Command({
	name: 'setgame',
	description: 'setgame',
	async run(message, args, client) {
		if (message.author.id != owner) return message.channel.send('Invalid permission!');
        if (!args[1]) return message.channel.send('Invalid argument!');
        client.user.setActivity(args.slice(1).join(' '), { type: 'PLAYING'});
        message.channel.send(`I'm now playing ${args.slice(1).join(' ')}`);
	}
});
