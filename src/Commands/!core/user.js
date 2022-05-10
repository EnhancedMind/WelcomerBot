const Command = require('../../Structures/Command.js');

const { Permissions } = require('discord.js');
const { writeFile } = require('fs');
const { consoleLog } = require('../../Data/Log.js');

module.exports = new Command({
	name: 'user',
    aliases: [ ' ' ],
    syntax: 'user <action> <optionaltype> <optionaltype> <useridAdminonly>',
	description: 'Sets whether the bot is enabled in the guild or not',
	async run(message, args, client) {
        if (!args[0]) return message.channel.send('Invalid argument!');

        let member = message.member.id;
        if (args[1]) {
            for (let i = 1; i < args.length; i++) {
                if (args[i].startsWith('<@') && args[i].endsWith('>') && args[i].length == 21) {
                    if (!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) return message.channel.send('Invalid permission!');
                    member = args[i].substring(2, 2 + 18);
                }
                else if (args[i].startsWith('<@!') && args[i].endsWith('>') && args[i].length == 22) {
                    if (!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) return message.channel.send('Invalid permission!');
                    member = args[i].substring(3, 3 + 18);
                }
            }
        }
        
        const settingsFile = __dirname + '/../../../config/settings.json';
        let settings = require(settingsFile);

        if (!settings.user[`${member}`]) {
            settings.user[`${member}`] = {
                enabledJoin: true,
                enabledLeave: true
            }
        }
        
        if (args[0] == 'enable' || args[0] == 'en') {
            if (args[1] == 'join' || args[2] == 'join') {
                settings.user[`${member}`].enabledJoin = true;
            }
            else if (args[1] == 'leave' || args[2] == 'leave') {
                settings.user[`${member}`].enabledLeave = true;
            }
            else if (!args[1] || args[1] == 'all') {
                settings.user[`${member}`].enabledJoin = true;
                settings.user[`${member}`].enabledLeave = true;
            }
        }
        else if (args[0] == 'disable' || args[0] == 'dis') {
            if (args[1] == 'join' || args[2] == 'join') {
                settings.user[`${member}`].enabledJoin = false;
            }
            else if (args[1] == 'leave' || args[2] == 'leave') {
                settings.user[`${member}`].enabledLeave = false;
            }
            else if (!args[1] || args[1] == 'all') {
                settings.user[`${member}`].enabledJoin = false;
                settings.user[`${member}`].enabledLeave = false;
            }
        }
        else return message.channel.send('Invalid argument!');

        writeFile(settingsFile, JSON.stringify(settings, null, 4), err => {
            if (err) consoleLog('Error occured when writing config/settings.json file: ', err);
        });

        message.channel.send(`The actual setting for this user are: ${JSON.stringify(settings.user[`${member}`], null, 4)}`);
	}
});
