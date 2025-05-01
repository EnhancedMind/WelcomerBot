const Command = require('../../Structures/Command.js');

const { PermissionsBitField } = require('discord.js');
const { getSetting, setSetting, writeSettingsFile } = require('../../Structures/settingsManager.js');
const { bot: { ownerID }, emoji: { success }, response: { invalidPermissions } } = require('../../../config/config.json');


module.exports = new Command({
	name: 'guild',
    aliases: [ 'server' ],
    syntax: 'guild <action> <optionalType> <optionalType> <optionalType> <optionalType>',
	description: 'Sets whether the bot is enabled in the guild or not. Requires Manage Server permission.',
	async run(message, args, client) {
		if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild) && message.author.id != ownerID) return message.channel.send(`${error} ${invalidPermissions} (Manage Server)`);


        if (args.length > 0) {
            if ([ 'enable', 'en' ].includes(args[0])) {
                if (args.includes('join')) {
                    setSetting(client, 'guild', message.guild.id, 'enabledJoin', true);
                }
                if (args.includes('leave')) {
                    setSetting(client, 'guild', message.guild.id, 'enabledLeave', true);
                }
                if (args.includes('defaultJoin') || args.includes('defaultjoin')) {
                    setSetting(client, 'guild', message.guild.id, 'enabledDefaultJoin', true);
                }
                if (args.includes('defaultLeave') || args.includes('defaultleave')) {
                    setSetting(client, 'guild', message.guild.id, 'enabledDefaultLeave', true);
                }
                if (!args[1] || args.includes('all')) {
                    setSetting(client, 'guild', message.guild.id, 'enabledJoin', true);
                    setSetting(client, 'guild', message.guild.id, 'enabledLeave', true);
                    setSetting(client, 'guild', message.guild.id, 'enabledDefaultJoin', true);
                    setSetting(client, 'guild', message.guild.id, 'enabledDefaultLeave', true);
                }
            }
            else if ([ 'disable', 'dis' ].includes(args[0])) {
                if (args.includes('join')) {
                    setSetting(client, 'guild', message.guild.id, 'enabledJoin', false);
                }
                if (args.includes('leave')) {
                    setSetting(client, 'guild', message.guild.id, 'enabledLeave', false);
                }
                if (args.includes('defaultJoin') || args.includes('defaultjoin')) {
                    setSetting(client, 'guild', message.guild.id, 'enabledDefaultJoin', false);
                }
                if (args.includes('defaultLeave') || args.includes('defaultleave')) {
                    setSetting(client, 'guild', message.guild.id, 'enabledDefaultLeave', false);
                }
                if (args.includes('all')) {
                    setSetting(client, 'guild', message.guild.id, 'enabledJoin', false);
                    setSetting(client, 'guild', message.guild.id, 'enabledLeave', false);
                    setSetting(client, 'guild', message.guild.id, 'enabledDefaultJoin', false);
                    setSetting(client, 'guild', message.guild.id, 'enabledDefaultLeave', false);
                }
            }
            else if ([ 'reset', 'r' ].includes(args[0])) {
                setSetting(client, 'guild', message.guild.id, 'enabledJoin', true);
                setSetting(client, 'guild', message.guild.id, 'enabledLeave', true);
                setSetting(client, 'guild', message.guild.id, 'enabledDefaultJoin', true);
                setSetting(client, 'guild', message.guild.id, 'enabledDefaultLeave', true);
            }


            writeSettingsFile(client).catch(err => {
                message.channel.send(`${error} An error occured while writing the settings file, the settings are only applied until the bot restarts!`);
            });
        }

        message.channel.send(`${success} The current setting for this server are:\n\`\`\`\n${JSON.stringify(getSetting(client, 'guild', message.guild.id), null, 4)} \n\`\`\``);
	}
});
