console.clear();
const Client = require('./Structures/Client.js');
const client = new Client();
const { token } = require('./Data/data.js');
client.start(token);

/**
 * to fix
 * wlcm command
 * status command
 * => enabledJoin and enabledLeave variables
 */



/*client.on('messageCreate', async (message) => {

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
});*/
