const Command = require('../Structures/Command.js');

const { owner } = require('../Data/data.js');

module.exports = new Command({
	name: 'welcome',
    aliases: [ 'wlcm' ],
	description: 'Enables or disable the play at join or leave function',
	async run(message, args, client) {
		if (message.author.id != owner) return message.channel.send('Invalid permission!');
        return message.channel.send('This is not working at the moment')
        if (args[0] == 'enable') {
            if (args[1] == 'join' || args[2] == 'join') {

            }
            if (args[1] == 'leave' || args[2] == 'leave') {

            }
            if (args[1] == 'all') {

            }
        }
        if (args[0] == 'disable') {
            if (args[1] == 'join' || args[2] == 'join') {

            }
            if (args[1] == 'leave' || args[2] == 'leave') {

            }
            if (args[1] == 'all') {

            }
        }
        const { enabledJoin, enabledLeave } = require('../Data/data.js');
        message.channel.send(`The bot is now configured to:\nPlay at join:    ${enabledJoin}\nPlay at leave: ${enabledLeave}`);
	}
});
