const Command = require('../Structures/Command.js');

let { owner } = require('../Data/data.js');

module.exports = new Command({
	name: 'wlcm',
	description: 'wlcm',
	async run(message, args, client) {
		if (message.author.id != owner) return message.channel.send('Invalid permission!');
        return message.channel.send('This is not working at the moment')
        if (args[1] == 'enable') {
            if (args[2] == 'join' || args[3] == 'join') {
                enabledJoin = true;
            }
            if (args[2] == 'leave' || args[3] == 'leave') {
                enabledLeave = true;
            }
            if (args[2] == 'all') {
                enabledJoin = true;
                enabledLeave = true;
            }
        }
        if (args[1] == 'disable') {
            if (args[2] == 'join' || args[3] == 'join') {
                enabledJoin = false;
            }
            if (args[2] == 'leave' || args[3] == 'leave') {
                enabledLeave = false;
            }
            if (args[2] == 'all') {
                enabledJoin = false;
                enabledLeave = false;
            }
        }
        message.channel.send(`The bot is now configured to:\nPlay at join:    ${enabledJoin}\nPlay at leave: ${enabledLeave}`);
	}
});
