const Command = require('../Structures/Command.js');

const { owner, status, game } = require('../Data/data.js');

module.exports = new Command({
	name: 'reset',
	aliases: [ ' ' ],
	description: 'Resets the status and activity to default.',
	async run(message, args, client) {
        if (message.author.id != owner) return message.channel.send('Invalid permission!');
        client.user.setStatus(status);
        client.user.setActivity(game, { type: 'PLAYING'});
		message.channel.send('Ok!');
	}
});
