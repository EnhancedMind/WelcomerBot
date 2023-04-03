const Command = require('../../Structures/Command');

const { bot: { ownerID }, status: { status, game }, emoji: { success, error }, response: { invalidPermissions } } = require('../../../config/config.json');


module.exports = new Command({
	name: 'reload',
	aliases: [ 'rld' ],
	description: 'Reloads the status and activity to default.',
	async run(message, args, client) {
        if (message.author.id != ownerID) return message.channel.send(`${error} ${invalidPermissions}`);
        client.user.setStatus(status);
        client.user.setActivity({
			name: game,
			type: 'PLAYING'
		});
		message.channel.send(`${success} Reloaded!`);
	}
});
