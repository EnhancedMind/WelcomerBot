const Command = require('../../Structures/Command');

const { consoleLog } = require('../../Data/Log');
const { bot: { ownerID }, emoji: { info, error }, response: { invalidPermissions } } = require('../../../config/config.json');


module.exports = new Command({
	name: 'shutdown',
    aliases: [ 'gosleep', 'poweroff' ],
	description: 'Safely shuts down the bot',
	async run(message, args, client) {
		if (message.author.id != ownerID) return message.channel.send(`${error} ${invalidPermissions}`);
        consoleLog('[INFO] Powering off...');
        await message.channel.send(`${info} Shutting down...`);
        client.destroy();
        process.exit(0);
}
});
