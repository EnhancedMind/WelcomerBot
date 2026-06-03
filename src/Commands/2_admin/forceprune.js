const Command = require('../../Structures/Command.js');

const { PermissionsBitField, ReactionCollector } = require('discord.js');
const { bot: { ownerID, devIDs }, emoji: { success, warning }, response: { missingArguments, invalidPermissions, invalidNumber } } = require('../../../config/config.json');


const emojiList = [ '✅', '❌' ];

module.exports = new Command({
    name: 'forceprune',
    aliases: [ ' ' ],
    category: 'admin',
    syntax: 'forceprune <amount> <confirm>',
    description: 'Deletes the amount of messages **!ALL MESSAGES!** Requires Administrator permission.',
    async run(message, args, client) {
        const senderId = message.author.id;
        const permissionFail = senderId != ownerID && !devIDs.includes(senderId) && !message.member.permissions.has(PermissionsBitField.Flags.Administrator);
        if (permissionFail) return await message.channel.send(`${warning} ${invalidPermissions} (Administrator)`);
        if (!args[0]) return await message.channel.send(`${warning} ${missingArguments}`);
        if (isNaN(args[0])) return await message.channel.send(`${warning} ${invalidNumber}`);
        if (args[0] > 99 || args[0] < 1) return await message.channel.send(`${warning} Outside of number range!`);
        if (args[0] != args[1]) return await message.channel.send(`${warning} Invalid confirmation!`);

        const response = await message.channel.send(`${warning} Are you sure you want to delete ${args[0]} messages from all users?`);

        const react = async () => { 
            for (const emoji of emojiList) {
                response.react(emoji).catch(() => {}); 
                await new Promise(resolve => setTimeout(resolve, 750));
            } 
        }
        const allReactionsSubmittedPromise = react();

        const filter = (reaction, user) => (emojiList.includes(reaction.emoji.name)) && user.bot == false;

        const collector = new ReactionCollector( response, { filter, time: 15000 } );

        collector.on('collect', async (reaction, user) => {
            switch (reaction.emoji.name) {
                case emojiList[0]:
                    const result = await message.channel.messages.fetch({limit: args[0]});
                    result.delete(result.firstKey());  //remove the response message from the bulk delete
                    message.channel.bulkDelete(result).catch(() => {});

                    response.edit(`${success} Deleting ${args[0]} messages`).catch(() => {});
                    setTimeout(async () => {
                        response.delete().catch(() => {});
                    }, 3750);

                    collector.stop();
                    break;

                case emojiList[1]:
                    collector.stop();
                    await allReactionsSubmittedPromise;
                    response.reactions.removeAll().catch(() => {});
                    break;
            }
        });
    }
});
