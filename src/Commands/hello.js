const Command = require('../Structures/Command.js');

module.exports = new Command({
	name: 'hello',
	aliases: [ 'hi', 'hey' ],
	description: 'Says Hello!',
	async run(message, args, client) {
		message.channel.send('Hello!');
	}
});
