const Command = require('../../Structures/Command.js');

const { PermissionsBitField } = require('discord.js');
const { parseArgs } = require('node:util');

const { getSetting, setSetting } = require('../../Structures/settingsManager.js');
const { bot: { ownerID, devIDs }, emoji: { success, error }, response: { invalidPermissions } } = require('../../../config/config.json');

const helpText = `
This command allows you to set whether the bot is enabled in the guild or not.
You can only set the settings for the guild if you have the Manage Server permission or if you are set as a developer for the bot.

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
    name: 'guild',
    aliases: [ 'server' ],
    category: 'sound',
    syntax: 'guild <action> <optionalType> <optionalType> <optionalType> <optionalType>',
    description: 'Sets whether the bot is enabled in the guild or not. Requires Manage Server permission.',
    help: helpText,
    async run(message, args, client) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild) && message.author.id != ownerID && !devIDs.includes(message.author.id)) return await message.channel.send(`${error} ${invalidPermissions} (Manage Server)`);

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

            setSetting('guild', message.guild.id, newSettings);
        }

        await message.channel.send(`${success} The current setting for this server are:\n\`\`\`json\n${JSON.stringify(getSetting('guild', message.guild.id), null, 4)} \n\`\`\``);
    }
});
