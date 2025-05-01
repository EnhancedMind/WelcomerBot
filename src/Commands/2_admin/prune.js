const Command = require('../../Structures/Command.js');

const { PermissionsBitField } = require('discord.js');
const { bot: { prefix, ownerID }, emoji: { success, warning }, response: { missingArguments, invalidPermissions, invalidNumber } } = require('../../../config/config.json');

module.exports = new Command({
	name: 'prune',
    aliases: [ 'purge', 'clean' ],
    syntax: 'prune <amount>',
	description: 'Deletes the amount of messages send by the bot and the commands used to invoke the bot. Requires Manage Messages permission.',
	async run(message, args, client) {
		if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages) && message.author.id != ownerID) return message.channel.send(`${warning} ${invalidPermissions} (Manage Messages)`);
        if (!args[0]) return message.channel.send(`${warning} ${missingArguments}`);
        if (isNaN(args[0])) return message.channel.send(`${warning} ${invalidNumber}`);
        if (args[0] > 100 || args[0] < 1) return message.channel.send(`${warning} Outside of number range!`);

        const result = await message.channel.messages.fetch({limit: 100});

        const resultArray = new Array();
        result.each(message => resultArray.push(message));

        let messagesDeleted = 0;
        for (let i = 0; i < resultArray.length; i++) {
            if (resultArray[i].author.id == client.user.id) {
                if ( (await message.channel.messages.fetch({ limit: 1, cache: false, around: resultArray[i].id })).has(resultArray[i].id) ) resultArray[i].delete();
                messagesDeleted++;
                if (resultArray[i+1].content.startsWith(prefix)) {
                    if ( (await message.channel.messages.fetch({ limit: 1, cache: false, around: resultArray[i+1].id })).has(resultArray[i+1].id) )resultArray[i+1].delete();
                    messagesDeleted++;
                }
            }
            if (messagesDeleted >= args[0]) break;
        }

        const response = await message.channel.send(`${success} Deleting ${args[0]} messages`)
        setTimeout(async () => {
            if ( (await response.channel.messages.fetch({ limit: 1, cache: false, around: response.id })).has(response.id) )response.delete();
            if ( (await message.channel.messages.fetch({ limit: 1, cache: false, around: message.id })).has(message.id) ) message.delete();
        }, 3750);
	}
});
