const Command = require('../Structures/Command.js');

const { Permissions } = require('discord.js');

module.exports = new Command({
	name: 'clear',
	description: 'clear',
	async run(message, args, client) {
		if (!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) return;
        if (!args[1]) return message.channel.send('Invalid argument!');
        if (isNaN(args[1])) return message.channel.send('Not a number!');
        if (args[1] > 99 || args[1] < 1) return message.channel.send('Outside of number range!');
        if (args[1] != args[2]) return message.channel.send('Confirmation is not equal!');

        await message.channel.messages.fetch({limit: args[1] + 1}).then(result =>{
            message.channel.bulkDelete(result);
        });

        message.channel.send(`Cleared ${args[1]} messages`)
            .then(message => {
                setTimeout(() => message.delete(), 3750);
            });
	}
});
