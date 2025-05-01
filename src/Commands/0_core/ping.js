const Command = require('../../Structures/Command');

const { emoji: { success } } = require('../../../config/config.json');


module.exports = new Command({
	name: 'ping',
	aliases: [ 'pong' ],
	description: 'Shows the ping of the bot',
	async run(message, args, client) {
		const response = await message.channel.send(`${success} Pong!... :smile:  The ping is ${client.ws.ping} ms.`);
		if ( (await response.channel.messages.fetch({ limit: 1, cache: false, around: response.id })).has(response.id) )response.edit(`${success} Pong!... :smile:  The ping is ${client.ws.ping} ms.\nMessage Ping: ${response.createdTimestamp - message.createdTimestamp} ms.`);
	}
});
