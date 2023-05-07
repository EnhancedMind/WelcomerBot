const Command = require('../../Structures/Command.js');

const { Permissions, ReactionCollector } = require('discord.js');
const { bot: { ownerID }, emoji: { success, warning }, response: { missingArguments, invalidPermissions, invalidNumber } } = require('../../../config/config.json');


const emojiList = [ '✅', '❌' ];

module.exports = new Command({
	name: 'forceprune',
    aliases: [ ' ' ],
    syntax: 'forceprune <amount> <confirm>',
	description: 'Deletes the amount of messages **!ALL MESSAGES!** Requires Administrator permission.',
	async run(message, args, client) {
		if (!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR) && message.author.id != ownerID) return message.channel.send(`${warning} ${invalidPermissions} (Administrator)`);
        if (!args[0]) return message.channel.send(`${warning} ${missingArguments}`);
        if (isNaN(args[0])) return message.channel.send(`${warning} ${invalidNumber}`);
        if (args[0] > 99 || args[0] < 1) return message.channel.send(`${warning} Outside of number range!`);
        if (args[0] != args[1]) return message.channel.send(`${warning} Invalid confirmation!`);

        const response = await message.channel.send(`${warning} Are you sure you want to delete ${args[0]} messages from all users?`);

        let allEmoji = false;
        const react = async () => { 
            for (const emoji of emojiList) {
                response.react(emoji); 
                await new Promise(resolve => setTimeout(resolve, 750));
            } 
            allEmoji = true;
        }
        react();

        const filter = (reaction, user) => (emojiList.includes(reaction.emoji.name)) && user.bot == false;

        const collector = new ReactionCollector( response, { filter, time: 15000 } );

        collector.on('collect', async (reaction, user) => {
            switch (reaction.emoji.name) {
                case emojiList[0]:
                    const result = await message.channel.messages.fetch({limit: args[0]});
                    result.delete(result.firstKey());  //remove the response message from the bulk delete
                    message.channel.bulkDelete(result);

                    if (response.editable) response.edit(`${success} Deleting ${args[0]} messages`);
                    setTimeout(() => response.delete(), 3750);

                    collector.stop();
                    break;

                case emojiList[1]:
                    //wait for allEMoji to be true
                    collector.stop();
                    while (!allEmoji) await new Promise(resolve => setTimeout(resolve, 100));
                    if (response.deletable) response.reactions.removeAll();
                    break;
            }
        });
	}
});
