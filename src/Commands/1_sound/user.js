const Command = require('../../Structures/Command.js');

const { getSetting, setSetting, writeSettingsFile } = require('../../Structures/settingsManager.js');
const { bot: { ownerID, devIDs }, emoji: { success, error }, response: { invalidPermissions } } = require('../../../config/config.json');


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
                if (args.length > 1 && message.author.id != ownerID && !devIDs.includes(message.author.id)) return message.channel.send(`${error} ${invalidPermissions} (Bot owner)`);
                break;
            }
        }


        if ( (args.length > 0 && member == message.author.id) || (args.length > 1 && member != message.author.id) ) { //only execute if there is at least one argument (args[0]) and the user is not tagged OR there is only a tagged user in args[0] 
            if ([ 'reset', 'r' ].includes(args[0])) {
                setSetting(client, 'guild', member, 'enabledJoin', true);
                setSetting(client, 'guild', member, 'enabledLeave', true);
                setSetting(client, 'guild', member, 'enabledDefaultJoin', true);
                setSetting(client, 'guild', member, 'enabledDefaultLeave', true);
            }
            else if (!['enable', 'en', 'disable', 'dis' ].includes(args[0])) {} // skip invalid value
            else {
                let setting = true;

                if ([ 'enable', 'en' ].includes(args[0])) {
                    setting = true;
                }
                else if ([ 'disable', 'dis' ].includes(args[0])) {
                    setting = false;
                }

                if (args.includes('join') || args.includes('all')) {
                    setSetting(client, 'guild', member, 'enabledJoin', setting);
                }
                if (args.includes('leave') || args.includes('all')) {
                    setSetting(client, 'guild', member, 'enabledLeave', setting);
                }
                if (args.includes('defaultJoin') || args.includes('defaultjoin') || args.includes('all')) {
                    setSetting(client, 'guild', member, 'enabledDefaultJoin', setting);
                }
                if (args.includes('defaultLeave') || args.includes('defaultleave') || args.includes('all')) {
                    setSetting(client, 'guild', member, 'enabledDefaultLeave', setting);
                }
            }

            writeSettingsFile(client).catch(err => {
                message.channel.send(`${error} An error occured while writing the settings file, the settings are only applied until the bot restarts!`);
            });
        }
        
        message.channel.send(`${success} The current settings for this user are:\n\`\`\`\n${JSON.stringify(getSetting(client, 'user', member), null, 4)} \n\`\`\``);
	}
});
