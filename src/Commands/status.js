const Command = require('../Structures/Command.js');

module.exports = new Command({
	name: 'status',
	aliases: [ ],
	description: "Shows if the bot's play at join or leave functions are enabled",
	async run(message, args, client) {
		//return message.channel.send('This is not working at the moment')
		const { enabledJoin, enabledLeave } = require('../Data/data.js');
		message.channel.send(`Play at join:    ${enabledJoin}\nPlay at leave: ${enabledLeave}`);
	}
});