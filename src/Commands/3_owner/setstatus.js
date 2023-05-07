const Command = require('../../Structures/Command');

const { bot: { ownerID }, status: { status }, emoji: { success, error }, response: { invalidPermissions } } = require('../../../config/config.json');


module.exports = new Command({
	name: 'setstatus',
	aliases: [ ' ' ],
	syntax: 'setstatus [ online | idle | dnd | invisible ]',
	description: 'Sets the status the bot displays',
	async run(message, args, client) {
		if (message.author.id != ownerID) return message.channel.send(`${error} ${invalidPermissions}`);
		if ( [ 'online', 'idle', 'dnd', 'invisible' ].includes(args[0].toLowerCase()) ) {
			client.user.setStatus(args[0]);
        	message.channel.send(`${success} Status set to \`${args[0]}\``);
		}
        else {
			client.user.setStatus(status);
			return message.channel.send(`${success} Status set to \`${status}\` (default)`);
		}
	}
});
