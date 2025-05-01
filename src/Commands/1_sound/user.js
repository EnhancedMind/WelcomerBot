const Command = require('../../Structures/Command.js');

const { getSetting, setSetting, writeSettingsFile } = require('../../Structures/settingsManager.js');
const { bot: { ownerID }, emoji: { success, error }, response: { invalidPermissions } } = require('../../../config/config.json');


module.exports = new Command({
	name: 'user',
    aliases: [ ' ' ],
    syntax: 'user <action> <optionalType> <optionalType> <optionalType> <optionalType> <userIDOwnerOnly>',
	description: 'Sets whether the bot is enabled for the user or not. Can only set the settings for yourself unless you are the owner of the bot.',
	async run(message, args, client) {
        let member = message.author.id;
        for (const arg of args) {
            const modifiedArg = arg.replace(/[<@!>]/g, '');
            if (!isNaN(modifiedArg) && (modifiedArg.length == 18 || modifiedArg.length == 19)) {
                member = modifiedArg;
                if (args.length > 1 && message.author.id != ownerID) return message.channel.send(`${error} ${invalidPermissions} (Bot owner)`);
                break;
            }
        }


        if ( (args.length > 0 && member == message.author.id) || (args.length > 1 && member != message.author.id) ) { //only execute if there is at least one argument (args[0]) and the user is not tagged OR there is only a tagged user in args[0] 
            if ([ 'enable', 'en' ].includes(args[0])) {
                if (args.includes('join')) {
                    setSetting(client, 'user', member, 'enabledJoin', true);
                }
                if (args.includes('leave')) {
                    setSetting(client, 'user', member, 'enabledLeave', true);
                }
                if (args.includes('defaultJoin') || args.includes('defaultjoin')) {
                    setSetting(client, 'user', member, 'enabledDefaultJoin', true);
                }
                if (args.includes('defaultLeave') || args.includes('defaultleave')) {
                    setSetting(client, 'user', member, 'enabledDefaultLeave', true);
                }
                if (!args[1] || args.includes('all') || member != message.author.id) { // member != author is true if the user is tagged in args[1]
                    setSetting(client, 'user', member, 'enabledJoin', true);
                    setSetting(client, 'user', member, 'enabledLeave', true);
                    setSetting(client, 'user', member, 'enabledDefaultJoin', true);
                    setSetting(client, 'user', member, 'enabledDefaultLeave', true);
                }
            }
            else if ([ 'disable', 'dis' ].includes(args[0])) {
                if (args.includes('join')) {
                    setSetting(client, 'user', member, 'enabledJoin', false);
                }
                if (args.includes('leave')) {
                    setSetting(client, 'user', member, 'enabledLeave', false);
                }
                if (args.includes('defaultJoin') || args.includes('defaultjoin')) {
                    setSetting(client, 'user', member, 'enabledDefaultJoin', false);
                }
                if (args.includes('defaultLeave') || args.includes('defaultleave')) {
                    setSetting(client, 'user', member, 'enabledDefaultLeave', false);
                }
                if (!args[1] || args.includes('all') || member != message.author.id) {
                    setSetting(client, 'user', member, 'enabledJoin', false);
                    setSetting(client, 'user', member, 'enabledLeave', false);
                    setSetting(client, 'user', member, 'enabledDefaultJoin', false);
                    setSetting(client, 'user', member, 'enabledDefaultLeave', false);
                }
            }
            else if ([ 'reset', 'r' ].includes(args[0])) {
                setSetting(client, 'user', member, 'enabledJoin', true);
                setSetting(client, 'user', member, 'enabledLeave', true);
                setSetting(client, 'user', member, 'enabledDefaultJoin', true);
                setSetting(client, 'user', member, 'enabledDefaultLeave', true);
            }


            writeSettingsFile(client).catch(err => {
                message.channel.send(`${error} An error occured while writing the settings file, the settings are only applied until the bot restarts!`);
            });
        }
        
        message.channel.send(`${success} The current settings for this user are:\n\`\`\`\n${JSON.stringify(getSetting(client, 'user', member), null, 4)} \n\`\`\``);
	}
});
