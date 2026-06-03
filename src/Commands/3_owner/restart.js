const Command = require('../../Structures/Command');

const { consoleLog } = require('../../Data/Log');
const { bot: { token, ownerID, devIDs }, emoji: { success, error, loading }, response: { invalidPermissions } } = require('../../../config/config.json');


module.exports = new Command({
    name: 'restart',
    aliases: [ 'reboot' ],
    category: 'owner',
    description: "Restarts the bot's client",
    async run(message, args, client) {
        const senderId = message.author.id;
        if (senderId != ownerID && !devIDs.includes(senderId)) return awaitmessage.channel.send(`${error} ${invalidPermissions}`);

        consoleLog('[INFO] Restarting...');

        await message.channel.send(`${loading} Restarting...`);

        await client.destroy();
        await client.login(token);

        consoleLog(`[INFO] ${client.user.username} is online and ready on ${client.guilds.cache.size} servers!`);
        
        const response = await message.channel.messages.fetch({ limit: 1 });
        try {
            await response.first().edit(`${success} Restarted!`);
        }
        catch (error) {
            consoleLog(`[WARN] Restart response edit error`, error);
            await message.channel.send(`${success} Restarted!`);
        }
    }
});
