const Command = require('../../Structures/Command.js');

const { PermissionsBitField } = require('discord.js');
const { getSetting, setSetting, writeSettingsFile } = require('../../Structures/settingsManager.js');
const { bot: { ownerID }, emoji: { success, error }, response: { invalidPermissions } } = require('../../../config/config.json');


module.exports = new Command({
	name: 'guild',
    aliases: [ 'server' ],
	category: 'sound',
    syntax: 'guild <action> <optionalType> <optionalType> <optionalType> <optionalType>',
	description: 'Sets whether the bot is enabled in the guild or not. Requires Manage Server permission.',
	async run(message, args, client) {
		if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild) && message.author.id != ownerID && !devIDs.includes(message.author.id)) return await message.channel.send(`${error} ${invalidPermissions} (Manage Server)`);

        if (args.length > 0) {
            if ([ 'reset', 'r' ].includes(args[0])) {
                setSetting(client, 'guild', message.guild.id, 'enabledJoin', true);
                setSetting(client, 'guild', message.guild.id, 'enabledLeave', true);
                setSetting(client, 'guild', message.guild.id, 'enabledDefaultJoin', true);
                setSetting(client, 'guild', message.guild.id, 'enabledDefaultLeave', true);
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
                    setSetting(client, 'guild', message.guild.id, 'enabledJoin', setting);
                }
                if (args.includes('leave') || args.includes('all')) {
                    setSetting(client, 'guild', message.guild.id, 'enabledLeave', setting);
                }
                if (args.includes('defaultJoin') || args.includes('defaultjoin') || args.includes('all')) {
                    setSetting(client, 'guild', message.guild.id, 'enabledDefaultJoin', setting);
                }
                if (args.includes('defaultLeave') || args.includes('defaultleave') || args.includes('all')) {
                    setSetting(client, 'guild', message.guild.id, 'enabledDefaultLeave', setting);
                }
            }

            try {
                await writeSettingsFile(client)
            }
            catch (err) {
                await message.channel.send(`${error} An error occured while writing the settings file, the settings are only applied until the bot restarts!`);
            }
        }

        await message.channel.send(`${success} The current setting for this server are:\n\`\`\`\n${JSON.stringify(getSetting(client, 'guild', message.guild.id), null, 4)} \n\`\`\``);
	}
});
