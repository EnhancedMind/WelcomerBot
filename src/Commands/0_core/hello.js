const Command = require('../../Structures/Command');

const { emoji: { success } } = require('../../../config/config.json');


module.exports = new Command({
	name: 'hello',
	aliases: [ 'hi', 'hey' ],
	description: 'Says Hello!',
	async run(message, args, client) {
		message.channel.send(`${success} Hello!`);
	}
});
