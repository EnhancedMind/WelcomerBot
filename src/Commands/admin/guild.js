const Command = require('../../Structures/Command.js');

const { Permissions } = require('discord.js');
const { writeFile } = require('fs');
const { consoleLog } = require('../../Data/Log.js');
const { emoji: { success, warning }, response: { missingArguments, invalidPermissions } } = require('../../../config/config.json');


module.exports = new Command({
	name: 'guild',
    aliases: [ ' ' ],
    syntax: 'guild <action> <optionaltype> <optionaltype>',
	description: 'Sets whether the bot is enabled in the guild or not',
	async run(message, args, client) {
		if (!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) return message.channel.send(`${error} ${invalidPermissions}`);

        if (!args[0]) return message.channel.send(`${warning} ${missingArguments}`);
        
        const settingsFile = __dirname + '/../../../config/settings.json';
        const settings = require(settingsFile);

        if (!settings.guild[message.guild.id]) {
            settings.guild[message.guild.id] = {
                enabledJoin: true,
                enabledLeave: true
            }
        }

        if ([ 'enable', 'en' ].includes(args[0])) {
            if (args.includes('join')) {
                settings.guild[message.guild.id].enabledJoin = true;
            }
            else if (args.includes('leave')) {
                settings.guild[message.guild.id].enabledLeave = true;
            }
            else if (!args[1] || args.includes('all')) {
                settings.guild[message.guild.id].enabledJoin = true;
                settings.guild[message.guild.id].enabledLeave = true;
            }
        }
        else if ([ 'disable', 'dis' ].includes(args[0])) {
            if (args.includes('join')) {
                settings.guild[message.guild.id].enabledJoin = false;
            }
            else if (args.includes('leave')) {
                settings.guild[message.guild.id].enabledLeave = false;
            }
            else if (!args[1] || args.includes('all')) {
                settings.guild[message.guild.id].enabledJoin = false;
                settings.guild[message.guild.id].enabledLeave = false;
            }
        }
        else if ([ 'reset', 'r' ].includes(args[0])) {
            settings.guild[message.guild.id].enabledJoin = true;
            settings.guild[message.guild.id].enabledLeave = true;
        }


        writeFile(settingsFile, JSON.stringify(settings, null, 4), err => {
            if (err) consoleLog('Error occured when writing config/settings.json file', err);
        });

        message.channel.send(`${success} The actual setting for this server are:\n${JSON.stringify(settings.guild[message.guild.id], null, 4)}`);
	}
});
