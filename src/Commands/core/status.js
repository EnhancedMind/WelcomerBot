const Command = require('../../Structures/Command.js');

const { getPlayType } = require('../../Data/data.js');

module.exports = new Command({
	name: 'status',
	aliases: [ ' ' ],
	description: "Shows if the bot's play at join or leave functions are enabled",
	async run(message, args, client) {
		message.channel.send(`Play at join:    ${getPlayType('join')}\nPlay at leave: ${getPlayType('leave')}`);
	}
});
