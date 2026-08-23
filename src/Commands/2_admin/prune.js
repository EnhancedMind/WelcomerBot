const Command = require('../../Structures/Command.js');

const { PermissionsBitField } = require('discord.js');

const { consoleLog } = require('../../Data/Log.js');
const { bot: { prefix, ownerID, devIDs }, emoji: { success, warning }, response: { missingArguments, invalidPermissions, invalidNumber } } = require('../../../config/config.json');

module.exports = new Command({
    name: 'prune',
    aliases: [ 'purge', 'clean' ],
    category: 'admin',
    syntax: 'prune <amount>',
    description: 'Deletes the amount of messages send by the bot and the commands used to invoke the bot. Requires Manage Messages permission.',
    async run(message, args, client) {
        const senderId = message.author.id;
        const permissionFail = senderId != ownerID && !devIDs.includes(senderId) && !message.member.permissions.has(PermissionsBitField.Flags.ManageMessages);
        if (permissionFail) return await message.channel.send(`${warning} ${invalidPermissions} (Manage Messages)`);
        if (!args[0]) return await message.channel.send(`${warning} ${missingArguments}`);
        if (isNaN(args[0])) return await message.channel.send(`${warning} ${invalidNumber}`);
        if (args[0] > 100 || args[0] < 1) return await message.channel.send(`${warning} Outside of number range!`);

        const response = await message.channel.send(`${success} Deleting ${args[0]} messages...`);

        const result = await message.channel.messages.fetch({limit: 100});
        const resultArray = Array.from(result.values());

        const fourteenDays = 14 * 24 * 60 * 60 * 1000 - 25000;
        const now = Date.now();

        const toBulkDelete = [];
        const singleDeletePromises = [];
        for (let i = 1; i < resultArray.length; i++) {
            if (resultArray[i].author.id == client.user.id) {
                if (now - resultArray[i].createdTimestamp < fourteenDays) toBulkDelete.push(resultArray[i]);
                else singleDeletePromises.push( resultArray[i].delete().catch(() => {}) );

                if (resultArray[i+1]?.content.startsWith(prefix)) {
                    if (now - resultArray[i+1].createdTimestamp < fourteenDays) toBulkDelete.push(resultArray[i+1]);
                    else singleDeletePromises.push( resultArray[i+1].delete().catch(() => {}) );
                    i++; // skip next message in loop as it just got added to deletion
                }
            }

            if (toBulkDelete.length + singleDeletePromises.length >= args[0]) break;
        }

        if (toBulkDelete.length > 0) {
            try {
                await message.channel.bulkDelete(toBulkDelete, true);
            }
            catch (error) {
                consoleLog('Error bulk deleting from prune command:\n', error);
                await message.channel.send(`The deletion failed. :( \`${error?.message}\``).catch(() => {});
            }
        }

        if (singleDeletePromises.length > 0) {
            await Promise.allSettled(singleDeletePromises);
        }

        await new Promise(resolve => setTimeout(resolve, 3750));
        // response is by bot, message is by user to trigger bot
        await response.delete().catch(() => {});
        await message.delete().catch(() => {});
    }
});
