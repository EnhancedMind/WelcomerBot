const Command = require('../../Structures/Command.js');

const { owner } = require('../../Data/data.js');
const { enabledJoinDefault, enabledLeaveDefault, setPlayType, getPlayType } = require('../../Data/data.js');

let argValid;

module.exports = new Command({
	name: 'welcome',
    aliases: [ 'wlcm' ],
	description: 'Enables or disables the play at join or leave function',
	async run(message, args, client) {
		if (message.author.id != owner) return message.channel.send('Invalid permission!');

        argValid = false;

        if (args[0] == 'enable') {
            if (args[1] == 'join' || args[2] == 'join') {
                setPlayType('join', true);
            }
            if (args[1] == 'leave' || args[2] == 'leave') {
                setPlayType('leave', true);
            }
            if (args[1] == 'all') {
                setPlayType('join', true);
                setPlayType('leave', true);
            }
            argValid = true;
            if (!args[1]) return message.channel.send('Missing argument!');
        }
        if (args[0] == 'disable') {
            if (args[1] == 'join' || args[2] == 'join') {
                setPlayType('join', false);
            }
            if (args[1] == 'leave' || args[2] == 'leave') {
                setPlayType('leave', false);
            }
            if (args[1] == 'all') {
                setPlayType('join', false);
                setPlayType('leave', false);
            }
            argValid = true;
            if (!args[1]) return message.channel.send('Missing argument!');
        }
        if (args[0] == 'default') {
            setPlayType('join', enabledJoinDefault);
    	    setPlayType('leave', enabledLeaveDefault);
            argValid = true;
        }

        if (!argValid) return message.channel.send('Invalid argument!');
        message.channel.send(`The bot is now configured to:\nPlay at join:    ${getPlayType('join')}\nPlay at leave: ${getPlayType('leave')}`);
	}
});
