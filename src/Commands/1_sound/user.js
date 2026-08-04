const Command = require('../../Structures/Command.js');

const { parseArgs } = require('node:util');

const { getSetting, setSetting } = require('../../Structures/settingsManager.js');
const { bot: { ownerID, devIDs }, emoji: { success, error }, response: { invalidPermissions } } = require('../../../config/config.json');


const helpText = `
This command allows you to set whether the bot is enabled for a specific user or not.
You can only set the settings for yourself unless you are set as a developer for the bot.

There are 4 settings that can be set:
- enabledJoin: Whether the bot is enabled for the user when they join a voice channel.
- enabledLeave: Whether the bot is enabled for the user when they leave a voice channel.
- enabledDefaultJoin: Whether the bot is enabled for the user when they don't have a custom join sound set.
- enabledDefaultLeave: Whether the bot is enabled for the user when they don't have a custom leave sound set.

You can set these settings using the following arguments:
- \`--enable\` or \`-e\`: To enable the setting(s) specified by later arguments. This has priority over the \`--disable\` argument.
- \`--disable\` or \`-d\`: To disable the setting(s) specified by later arguments.
- \`--join\` or \`-j\`: To set the enabledJoin setting.
- \`--leave\` or \`-l\`: To set the enabledLeave setting.
- \`--defaultJoin\`: To set the enabledDefaultJoin setting.
- \`--defaultLeave\`: To set the enabledDefaultLeave setting.
- \`--all\` or \`-a\`: To set all 4 settings at once.
- \`--reset\` or \`-r\`: To reset all 4 settings to their default values (enabled). This has priority over the \`--enable\` and \`--disable\` arguments.

All the arguments are optional and additive and can be used at the same time.
`;

module.exports = new Command({
    name: 'user',
    aliases: [ ' ' ],
    category: 'sound',
    syntax: 'user <action> <optionalType> <optionalType> <optionalType> <optionalType> <userIDOwnerOnly>',
    description: 'Sets whether the bot is enabled for the user or not. Can only set the settings for yourself unless you are the owner of the bot.',
    help: helpText,
    async run(message, args, client) {
        let member = message.author.id;
        for (const arg of args) {
            const mentionMatch = arg.match((/^<@!?([0-9]{18,19})>/));
            if (mentionMatch) {
                if (message.author.id != ownerID && !devIDs.includes(message.author.id)) return await message.channel.send(`${error} ${invalidPermissions} (Developer)`);
                member = mentionMatch[1];
                // pull out this arg from the args array
                args.splice(args.indexOf(arg), 1);
                break;
            }
        }


        if (args.length > 0) {
            const parsed = parseArgs({
                args: args,
                strict: false, // Essential for dynamic handling
                options: {
                    'reset': { type: 'boolean', short: 'r' },
                    'enable': { type: 'boolean', short: 'e' },
                    'disable': { type: 'boolean', short: 'd' },
                    'join': { type: 'boolean', short: 'j' },
                    'leave': { type: 'boolean', short: 'l' },
                    'defaultJoin': { type: 'boolean' },
                    'defaultjoin': { type: 'boolean' },
                    'defaultLeave': { type: 'boolean' },
                    'defaultleave': { type: 'boolean' },
                    'all': { type: 'boolean', short: 'a' },
                }
            });

            const flags = parsed.values;

            if (flags.reset) {
                flags.enable = true;
                flags.all = true;
            }

            const newSettings = {};
            if (flags.enable || flags.disable) {
                let setting = true;

                if (flags.enable) {
                    setting = true;
                }
                else if (flags.disable) {
                    setting = false;
                }

                if (flags.join || flags.all) {
                    newSettings.enabledJoin = setting;
                }
                if (flags.leave || flags.all) {
                    newSettings.enabledLeave = setting;
                }
                if (flags.defaultJoin || flags.defaultjoin || flags.all) {
                    newSettings.enabledDefaultJoin = setting;
                }
                if (flags.defaultLeave || flags.defaultleave || flags.all) {
                    newSettings.enabledDefaultLeave = setting;
                }
            }

            setSetting('user', member, newSettings);
        }

        await message.channel.send(`${success} The current settings for this user are:\n\`\`\`json\n${JSON.stringify(getSetting('user', member), null, 4)} \n\`\`\``);
    }
});
