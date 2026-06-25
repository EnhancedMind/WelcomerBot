const Command = require('../../Structures/Command.js');

const { getSetting, setSetting } = require('../../Structures/settingsManager.js');
const { bot: { ownerID, devIDs }, emoji: { success, error }, response: { invalidPermissions } } = require('../../../config/config.json');


module.exports = new Command({
    name: 'user',
    aliases: [ ' ' ],
    category: 'sound',
    syntax: 'user <action> <optionalType> <optionalType> <optionalType> <optionalType> <userIDOwnerOnly>',
    description: 'Sets whether the bot is enabled for the user or not. Can only set the settings for yourself unless you are the owner of the bot.',
    async run(message, args, client) {
        let member = message.author.id;
        for (const arg of args) {
            const modifiedArg = arg.replace(/[<@!>]/g, '');
            if (!isNaN(modifiedArg) && (modifiedArg.length == 18 || modifiedArg.length == 19)) {
                member = modifiedArg;
                if (args.length > 1 && message.author.id != ownerID && !devIDs.includes(message.author.id)) return await message.channel.send(`${error} ${invalidPermissions} (Bot owner)`);
                break;
            }
        }


        if ( (args.length > 0 && member == message.author.id) || (args.length > 1 && member != message.author.id) ) { //only execute if there is at least one argument (args[0]) and the user is not tagged OR there is only a tagged user in args[0] 
            const newSettings = {};
            if ([ 'reset', 'r' ].includes(args[0])) {
                newSettings.enabledJoin = true;
                newSettings.enabledLeave = true;
                newSettings.enabledDefaultJoin = true;
                newSettings.enabledDefaultLeave = true;
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
                    newSettings.enabledJoin = setting;
                }
                if (args.includes('leave') || args.includes('all')) {
                    newSettings.enabledLeave = setting;
                }
                if (args.includes('defaultJoin') || args.includes('defaultjoin') || args.includes('all')) {
                    newSettings.enabledDefaultJoin = setting;
                }
                if (args.includes('defaultLeave') || args.includes('defaultleave') || args.includes('all')) {
                    newSettings.enabledDefaultLeave = setting;
                }
            }

            setSetting('user', message.guild.id, newSettings);
        }
        
        await message.channel.send(`${success} The current settings for this user are:\n\`\`\`\n${JSON.stringify(getSetting('user', member), null, 4)} \n\`\`\``);
    }
});
