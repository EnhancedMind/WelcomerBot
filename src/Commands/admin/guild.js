const Command = require('../../Structures/Command.js');

const { Permissions } = require('discord.js');
const { writeFile } = require('fs');
const { consoleLog } = require('../../Data/Log.js');

module.exports = new Command({
	name: 'guild',
    aliases: [ ' ' ],
    syntax: 'guild <action> <optionaltype> <optionaltype>',
	description: 'Sets whether the bot is enabled in the guild or not',
	async run(message, args, client) {
		if (!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) return message.channel.send('Invalid permission!');
        
        if (!args[0]) return message.channel.send('Invalid argument!');

        const settingsFile = __dirname + '/../../../config/settings.json';
        let settings = require(settingsFile);

        if (!settings.guild[`${message.guild.id}`]) {
            settings.guild[`${message.guild.id}`] = {
                enabledJoin: true,
                enabledLeave: true
            }
        }
        
        if (args[0] == 'enable' || args[0] == 'en') {
            if (args[1] == 'join' || args[2] == 'join') {
                settings.guild[`${message.guild.id}`].enabledJoin = true;
            }
            else if (args[1] == 'leave' || args[2] == 'leave') {
                settings.guild[`${message.guild.id}`].enabledLeave = true;
            }
            else if (!args[1] || args[1] == 'all') {
                settings.guild[`${message.guild.id}`].enabledJoin = true;
                settings.guild[`${message.guild.id}`].enabledLeave = true;
            }
        }
        else if (args[0] == 'disable' || args[0] == 'dis') {
            if (args[1] == 'join' || args[2] == 'join') {
                settings.guild[`${message.guild.id}`].enabledJoin = false;
            }
            else if (args[1] == 'leave' || args[2] == 'leave') {
                settings.guild[`${message.guild.id}`].enabledLeave = false;
            }
            else if (!args[1] || args[1] == 'all') {
                settings.guild[`${message.guild.id}`].enabledJoin = false;
                settings.guild[`${message.guild.id}`].enabledLeave = false;
            }
        }
        else return message.channel.send('Invalid argument!');

        writeFile(settingsFile, JSON.stringify(settings, null, 4), err => {
            if (err) consoleLog('Error occured when writing config/settings.json file: ', err);
        });

        message.channel.send(`The actual setting for this server are: ${JSON.stringify(settings.guild[`${message.guild.id}`], null, 4)}`);
	}
});
