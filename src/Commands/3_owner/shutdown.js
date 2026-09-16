const Command = require('../../Structures/Command');

const { consoleLog } = require('../../Data/Log');
const { gracefulShutdown, unregisterCommandExecution } = require('../../utils/shutdown');
const { bot: { ownerID, devIDs }, emoji: { info, error }, response: { invalidPermissions } } = require('../../../config/config.json');


module.exports = new Command({
    name: 'shutdown',
    aliases: [ 'gosleep', 'poweroff' ],
    category: 'owner',
    description: 'Safely shuts down the bot',
    async run(message, args, client) {
        const senderId = message.author.id;
        if (senderId != ownerID && !devIDs.includes(senderId)) return await message.channel.send(`${error} ${invalidPermissions}`);

        // the command is registered in messageCreate, but it cannot unregister normally until it returns. for it to return the shutdown must finish.
        // this creates a circular wait, thus unregistering it here fixes it
        unregisterCommandExecution(message.id);

        consoleLog('[INFO] Powering off on command...');
        await message.channel.send(`${info} Shutting down...`);

        await gracefulShutdown('shutdownCommand');
    }
});
