const Command = require('../Structures/Command.js');

const { owner } = require('../Data/data.js');

let enabledJoin = true;
let enabledLeave = true;

module.exports = new Command({
	name: 'welcome',
    aliases: [ 'wlcm' ],
	description: 'Enables or disables the play at join or leave function',
	async run(message, args, client) {
		if (message.author.id != owner) return message.channel.send('Invalid permission!');
        return message.channel.send('This is not working at the moment');
        if (args[0] == 'enable') {
            if (args[1] == 'join' || args[2] == 'join') {
                enabledJoin = true;
            }
            if (args[1] == 'leave' || args[2] == 'leave') {
                enabledLeave = true;
            }
            if (args[1] == 'all') {
                enabledJoin = true;
                enabledLeave = true;
            }
        }
        if (args[0] == 'disable') {
            if (args[1] == 'join' || args[2] == 'join') {
                enabledJoin = false;
            }
            if (args[1] == 'leave' || args[2] == 'leave') {
                enabledLeave = false;
            }
            if (args[1] == 'all') {
                enabledJoin = false;
                enabledLeave = false;
            }
        }
        message.channel.send(`The bot is now configured to:\nPlay at join:    ${enabledJoin}\nPlay at leave: ${enabledLeave}`);
	}
});
