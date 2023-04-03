const Command = require('../../Structures/Command.js');

const { Permissions } = require('discord.js');
const { writeFile } = require('fs');
const { consoleLog } = require('../../Data/Log.js');
const { bot: { ownerID }, emoji: { success, error }, response: { invalidPermissions } } = require('../../../config/config.json');


module.exports = new Command({
	name: 'user',
    aliases: [ ' ' ],
    //syntax: 'user <action> <optionaltype> <optionaltype> <userIDAdminOnly>',
    syntax: 'user <action> <optionalType> <optionalType> <userIDOwnerOnly>',
	description: 'Sets whether the bot is enabled for the user or not',
	async run(message, args, client) {
        let member = message.author.id;
        for (const arg of args) {
            const modifiedArg = arg.replace(/[<@!>]/g, '');
            if (!isNaN(modifiedArg) && modifiedArg.length == 18) {
                member = modifiedArg;
                //if (args.length > 1 && !message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) return message.channel.send(`${error} ${invalidPermissions}`);
                if (args.length > 1 && message.author.id != ownerID) return message.channel.send(`${error} ${invalidPermissions} (Bot owner)`);
                break;
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

        if ( (args.length > 0 && member == message.author.id) || (args.length > 1 && member != message.author.id) ) { //only execute if there is at least one argument (args[0]) and the user is not tagged OR there is only a tagged user in args[0] 
            if ([ 'enable', 'en' ].includes(args[0])) {
                if (args.includes('join')) {
                    settings.user[member].enabledJoin = true;
                }
                else if (args.includes('leave')) {
                    settings.user[member].enabledLeave = true;
                }
                else if (!args[1] || args.includes('all') || member != message.author.id) { // member != author is true if the user is tagged in args[1]
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
                else if (!args[1] || args.includes('all') || member != message.author.id) {
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
        }
        
        message.channel.send(`${success} The current settings for this user are:\n${JSON.stringify(settings.user[member], null, 4)}`);
	}
});
