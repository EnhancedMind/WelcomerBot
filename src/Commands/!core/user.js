const Command = require('../../Structures/Command.js');

const { Permissions } = require('discord.js');
const { writeFile } = require('fs');
const { consoleLog } = require('../../Data/Log.js');
const { emoji: { success, warning }, response: { missingArguments, invalidPermissions } } = require('../../../config/config.json');


module.exports = new Command({
	name: 'user',
    aliases: [ ' ' ],
    syntax: 'user <action> <optionaltype> <optionaltype> <useridAdminonly>',
	description: 'Sets whether the bot is enabled in the guild or not',
	async run(message, args, client) {
        if (!args[0]) return message.channel.send(`${warning} ${missingArguments}`);

        let member = message.member.id;
        for (const arg of args) {
            arg.replace(/[<@!>]/g, '');
            if (!isNaN(arg) && arg.length == 18) {
                if (!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) return message.channel.send(`${error} ${invalidPermissions}`);
                member = arg;
                return;
            }
        }
        
        const settingsFile = __dirname + '/../../../config/settings.json';
        const settings = require(settingsFile);

        if (!settings.user[member]) {
            settings.user[member] = {
                enabledJoin: true,
                enabledLeave: true
            }
        }

        if ([ 'enable', 'en' ].includes(args[0])) {
            if (args.includes('join')) {
                settings.user[member].enabledJoin = true;
            }
            else if (args.includes('leave')) {
                settings.user[member].enabledLeave = true;
            }
            else if (!args[1] || args.includes('all')) {
                settings.user[member].enabledJoin = true;
                settings.user[member].enabledLeave = true;
            }
        }
        else if ([ 'disable', 'dis' ].includes(args[0])) {
            if (args.includes('join')) {
                settings.user[member].enabledJoin = false;
            }
            else if (args.includes('leave')) {
                settings.user[member].enabledLeave = false;
            }
            else if (!args[1] || args.includes('all')) {
                settings.user[member].enabledJoin = false;
                settings.user[member].enabledLeave = false;
            }
        }
        else if ([ 'reset', 'r' ].includes(args[0])) {
            settings.user[member].enabledJoin = true;
            settings.user[member].enabledLeave = true;
        }
        

        writeFile(settingsFile, JSON.stringify(settings, null, 4), err => {
            if (err) consoleLog('Error occured when writing config/settings.json file', err);
        });

        message.channel.send(`${success} The actual setting for this user are:\n${JSON.stringify(settings.user[member], null, 4)}`);
	}
});
