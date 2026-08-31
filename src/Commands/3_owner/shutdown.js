const Command = require('../../Structures/Command');

const { consoleLog } = require('../../Data/Log');
const { gracefulShutdown } = require('../../utils/shutdown');
const { bot: { ownerID, devIDs }, emoji: { info, error }, response: { invalidPermissions } } = require('../../../config/config.json');


module.exports = new Command({
    name: 'shutdown',
    aliases: [ 'gosleep', 'poweroff' ],
    category: 'owner',
    description: 'Safely shuts down the bot',
    async run(message, args, client) {
        const senderId = message.author.id;
        if (senderId != ownerID && !devIDs.includes(senderId)) return await message.channel.send(`${error} ${invalidPermissions}`);

        consoleLog('[INFO] Powering off on command...');
        await message.channel.send(`${info} Shutting down...`);

        await gracefulShutdown('shutdownCommand');
    }
});
