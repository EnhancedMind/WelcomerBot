const Command = require('../Structures/Command.js');

module.exports = new Command({
	name: 'ping',
	aliases: [ ' ' ],
	description: 'Shows the ping of the bot',
	async run(message, args, client) {
		const msg = await message.channel.send(`Pong!... :smile:  The ping is ${client.ws.ping} ms.`);
		msg.edit(`Pong!... :smile:  The ping is ${client.ws.ping} ms.\nMessage Ping: ${msg.createdTimestamp - message.createdTimestamp} ms.`);
	}
});
