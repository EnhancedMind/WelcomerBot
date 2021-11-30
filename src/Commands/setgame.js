const Command = require('../Structures/Command.js');

const { owner } = require('../Data/data.js');

module.exports = new Command({
	name: 'setgame',
	aliases: [ ],
	description: 'Sets the game the bot is playing',
	async run(message, args, client) {
		if (message.author.id != owner) return message.channel.send('Invalid permission!');
        if (!args[0]) return message.channel.send('Invalid argument!');
        client.user.setActivity(args.slice(0).join(' '), { type: 'PLAYING'});
        message.channel.send(`I'm now playing ${args.slice(0).join(' ')}`);
	}
});