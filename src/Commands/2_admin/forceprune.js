const Command = require('../../Structures/Command.js');

const { PermissionsBitField } = require('discord.js');

const ButtonPrompt = require('../../Structures/ButtonPrompt.js');
const { bot: { ownerID, devIDs }, emoji: { success, warning }, response: { missingArguments, invalidPermissions, invalidNumber } } = require('../../../config/config.json');


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
        args[0] = Math.round(args[0]);
        if (args[0] > 99 || args[0] < 1) return await message.channel.send(`${warning} Outside of number range!`);
        if (args[0] != args[1]) return await message.channel.send(`${warning} Invalid confirmation!`);

        const prompt = await ButtonPrompt.create({
            message,
            content: `${warning} Are you sure you want to delete ${args[0]} messages from all users?`,
            buttons: [
                {
                    id: 'yes',
                    emoji: '✅',
                    label: 'Yes',
                    style: 'danger'
                },
                {
                    id: 'no',
                    emoji: '❌',
                    label: 'No',
                    style: 'primary'
                }
            ],
            deferUpdate: false,
            resetTimer: false,
            timeout: 15000
        });

        if (!prompt) return;

        const result = await message.channel.messages.fetch({limit: args[0]});
        result.delete(result.firstKey());  //remove the response message from the bulk delete

        prompt.on('click', async (interaction, customId) => {
            switch (customId) {
                case 'yes':
                    await interaction.update(`${success} Deleting ${args[0]} messages`).catch(() => {});

                    message.channel.bulkDelete(result).catch(() => {});

                    setTimeout(async () => {
                        await interaction.message.delete().catch(() => {});
                    }, 3750);

                    prompt.destroy(false);
                    break;

                case 'no':
                    interaction.deferUpdate().catch(() => {});
                    prompt.destroy();
                    break
            }
        });
    }
});
