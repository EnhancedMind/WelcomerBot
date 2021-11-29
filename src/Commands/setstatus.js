const Command = require('../Structures/Command.js');

const { owner } = require('../Data/data.js');

module.exports = new Command({
	name: 'setstatus',
	description: 'setstatus',
	async run(message, args, client) {
		if (message.author.id != owner) return message.channel.send('Invalid permission!');
        if (!(args[1] == 'online' || args[1] == 'idle' || args[1] == 'dnd' || args[1] == 'invisible')) return message.channel.send('Invalid argument!');
        client.user.setStatus(args[1]);
        message.channel.send(`Status set to ${args[1]}`);
	}
});
