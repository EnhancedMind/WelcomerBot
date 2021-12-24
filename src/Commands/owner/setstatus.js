const Command = require('../../Structures/Command.js');

const { owner, status } = require('../../Data/data.js');

module.exports = new Command({
	name: 'setstatus',
	aliases: [ ' ' ],
	description: 'Sets the status the bot displays',
	async run(message, args, client) {
		if (message.author.id != owner) return message.channel.send('Invalid permission!');
        if (!(args[0] == 'online' || args[0] == 'idle' || args[0] == 'dnd' || args[0] == 'invisible')) {
			client.user.setStatus(status);
			return message.channel.send(`Status set to ${status} (default)`);
		}
        client.user.setStatus(args[0]);
        message.channel.send(`Status set to ${args[0]}`);
	}
});
