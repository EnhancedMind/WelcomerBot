const Command = require('../../Structures/Command.js');

const { 
	bot: { prefix, ownerID, devIDs }, 
	emoji: { success, warning }, 
	response: { missingArguments }, 
	player: { maxTime, allowedExtensions }, 
	directories: {userMusicDir, everyoneMusicDir, defaultMusicDir, tempMusicDir}
} = require('../../../config/config.json')

const https = require('https');
const { existsSync, statSync, renameSync } = require('fs');
const path = require('path');
const { PermissionsBitField } = require('discord.js');
const { getSetting, setSetting, writeSettingsFile } = require('../../Structures/settingsManager.js');
const { syncSoundFiles, compareDefault, compareEveryone, compareUser } = require('../../Structures/musicFilesManager.js');

const helpText = 
`To rename your song, use write the following \`${prefix}renamesong <originPath> <destinationPath>\`.
If you are unsure about the file path to your file, use \`${prefix}playable -p\`
`;

module.exports = new Command({
	name: 'renamesong',
	aliases: [ 'renamefile', 'mv' ],
	syntax: 'renamesong <origin> <destination>',
	description: `This command allows you rename/move your songs`,
	help: helpText,
	async run(message, args, client) {
		const channel = message.channel;
		const senderId = message.author.id;

		if(args.length < 2) {
			return channel.send(`${warning} ${missingArguments}`);
		}
		const origin = args[0];
		const destination = args[1];

		if (!existsSync(origin)) return channel.send(`${warning} file \`${origin}\` doesn't exist!`);
		if (existsSync(destination)) return channel.send(`${warning} file \`${destination}\` already exists!`);
		if (!existsSync(path.dirname(destination))) return channel.send(`${warning} directory \`${path.dirname(destination)}\` for destination doesn't exist!`);

		const permissionFail = senderId != ownerID && !devIDs.includes(senderId);
		if (permissionFail) {
			if (origin.startsWith(`${compareDefault}${path.sep}`) || destination.startsWith(`${compareDefault}${path.sep}`)) {
				return channel.send(`${warning} You do not have the permission to change songs for default! (Developer)`);
			}
			else if (origin.startsWith(`${compareEveryone}${path.sep}`) || destination.startsWith(`${compareEveryone}${path.sep}`)) {
				return channel.send(`${warning} You do not have the permission to change songs for everyone! (Developer)`);
			}
			else if (!origin.startsWith(`${compareUser}${path.sep}${senderId}`)) {
				return channel.send(`${warning} You do not have the permission to change songs for other users! (Developer)`);
			}
		}

		renameSync(origin, destination);
		channel.send(`Song succesfully renamed \nFrom: \`${origin}\`\nTo: \`${destination}\``);
		syncSoundFiles(client);
	}
});