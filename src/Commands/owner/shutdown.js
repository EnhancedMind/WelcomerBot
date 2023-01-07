const Command = require('../../Structures/Command');

const { consoleLog } = require('../../Data/Log');
const { bot: { owner }, emoji: { info, error }, response: { invalidPermissions } } = require('../../../config/config.json');


module.exports = new Command({
	name: 'shutdown',
    aliases: [ 'gosleep' ],
	description: 'Safely shuts down the bot',
	async run(message, args, client) {
		if (message.author.id != owner) return message.channel.send(`${error} ${invalidPermissions}`);
        consoleLog('[INFO] Powering off...');
        await message.channel.send(`${info} Shutting down...`);
        client.destroy();
        process.exit(0);
}
});
