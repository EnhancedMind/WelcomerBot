const Command = require('../../Structures/Command.js');

const { Permissions } = require('discord.js');

module.exports = new Command({
	name: 'clear',
    aliases: [ 'purge' ],
	description: 'Deletes the amount of messages **!ALL MESSAGES!**',
	async run(message, args, client) {
		if (!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) return message.channel.send('Invalid permission!');
        if (!args[0]) return message.channel.send('Invalid argument!');
        if (isNaN(args[0])) return message.channel.send('Not a number!');
        if (args[0] > 99 || args[0] < 1) return message.channel.send('Outside of number range!');
        if (args[0] != args[1]) return message.channel.send('Confirmation is not equal!');

        await message.channel.messages.fetch({limit: args[0] + 1}).then(result =>{
            message.channel.bulkDelete(result);
        });

        message.channel.send(`Cleared ${args[0]} messages`)
            .then(message => {
                setTimeout(() => message.delete(), 3750);
            });
	}
});
