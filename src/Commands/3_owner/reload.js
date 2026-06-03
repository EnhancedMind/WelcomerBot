const Command = require('../../Structures/Command');

const { ActivityType } = require('discord.js');

const { bot: { ownerID, adminIDs, devIDs }, status: { status, game }, emoji: { success, error }, response: { invalidPermissions } } = require('../../../config/config.json');


module.exports = new Command({
    name: 'reload',
    aliases: [ 'rld' ],
    category: 'owner',
    description: 'Reloads the status and activity to default.',
    async run(message, args, client) {
        const senderId = message.author.id;
        if (senderId != ownerID && !devIDs.includes(senderId)) return await message.channel.send(`${error} ${invalidPermissions}`);
        client.user.setStatus(status);
        client.user.setActivity(
            game,
            { type: ActivityType.Playing }
        );
        await message.channel.send(`${success} Reloaded!`);
    }
});
