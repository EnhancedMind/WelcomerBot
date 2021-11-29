const Command = require('../Structures/Command.js');



module.exports = new Command({
	name: 'status',
	description: 'status',
	async run(message, args, client) {
		//return message.channel.send('This is not working at the moment')
		const { enabledJoin, enabledLeave } = require('../Data/data.js');
		//let { enabledJoin, enabledLeave } = require('../Commands/wlcm.js');
		message.channel.send(`Play at join:    ${enabledJoin}\nPlay at leave: ${enabledLeave}`);
	}
});