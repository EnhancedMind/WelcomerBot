const Event = require('../Structures/Event.js');

const { prefix } = require('../Data/data.js');

module.exports = new Event('messageCreate', async (client, message) => {
    if(message.author.bot) return;
    if(!message.content.startsWith(prefix)) return;

    const args = message.content.substring(prefix.length).split(/ +/);
    const command = client.commands.find(cmd => cmd.name == args[0]);
	if (!command) return message.channel.send(`${args[0]} is not a valid command!`);
	command.run(message, args, client);


    switch (false) {
        case 'status':
            message.channel.send(`Play at join:    ${enabledJoin}\nPlay at leave: ${enabledLeave}`);
            break;
    
        case 'wlcm':
            if (message.author.id != owner) return message.channel.send('Invalid permission!');
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
            break;

    }
});