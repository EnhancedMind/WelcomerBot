const Command = require('../../Structures/Command.js');

const { 
	bot: { prefix, ownerID, devIDs }, 
	emoji: { success, warning }, 
	response: { missingArguments }, 
	player: { maxTime, allowedExtensions }
} = require('../../../config/config.json')

const https = require('https');
const { existsSync, renameSync } = require('fs');
const path = require('path');
const { PermissionsBitField } = require('discord.js');
const { getSetting, setSetting, writeSettingsFile } = require('../../Structures/settingsManager.js');
const { syncSoundFiles, defaultDirComparison, everyoneDirComparison, userDirComparison, musicDirComparison } = require('../../Structures/musicFilesManager.js');

const helpText = 
`To rename your song, use \`${prefix}renamesong <originalFileNameOrPath> <newFileNameOrPath>\`.
If you are unsure about the file of your file, use \`${prefix}playable -p\`

If you are a developer, rename/move music files with \`${prefix}renamesong <originalPath> <newPath>\`.
This command only moves files, it does NOT create directories.
`;

module.exports = new Command({
	name: 'renamesong',
	aliases: [ 'renamefile' ],
	syntax: 'addsong <origin> <destination>',
	description: `This command allows you rename/move your songs`,
	help: helpText,
	async run(message, args, client) {
		const channel = message.channel;
		const senderId = message.author.id;

		if(args.length < 2) {
			return channel.send(`${warning} ${missingArguments}`);
		}
		let origin = args[0];
		let destination = args[1];

		if(path.dirname(origin) === '.') {
			const songs = client.soundFiles.get(senderId);
			let foundPath = false;
			for(const song of songs) { // Find the path to the song
				if(song.filename === origin) {
					origin = song.path;
					foundPath = true;
					break;
				}
			}

			if(!foundPath) {
				return channel.send(`${warning} file \`${origin}\` doesn't exist in your library!`);
			}
		}
		if(path.dirname(destination) === '.') destination = path.join(path.dirname(origin), destination); // Make destination into a path from base

		if(!origin.startsWith(musicDirComparison)) return channel.send(`${warning}${warning}${warning} you tried to make changes outside the music database${warning}${warning}${warning}\nAttempted move from: \`${origin}\``);
		if(!destination.startsWith(musicDirComparison)) return channel.send(`${warning}${warning}${warning} you tried to make changes outside the music database${warning}${warning}${warning}\nAttempted move to: \`${destination}\``);

		if (!existsSync(origin)) return channel.send(`${warning} file \`${origin}\` doesn't exist!`);
		if (existsSync(destination)) return channel.send(`${warning} file \`${destination}\` already exists!`);

		if (!existsSync(path.dirname(destination))) return channel.send(`${warning} directory \`${path.dirname(destination)}\` for destination doesn't exist!`);

		const permissionFail = senderId != ownerID && !devIDs.includes(senderId);
		if (permissionFail) {
			if (origin.startsWith(`${defaultDirComparison}${path.sep}`) || destination.startsWith(`${defaultDirComparison}${path.sep}`)) {
				return channel.send(`${warning} You do not have the permission to change songs for default! (Developer)`);
			}
			else if (origin.startsWith(`${everyoneDirComparison}${path.sep}`) || destination.startsWith(`${everyoneDirComparison}${path.sep}`)) {
				return channel.send(`${warning} You do not have the permission to change songs for everyone! (Developer)`);
			}
			else if (!origin.startsWith(`${userDirComparison}${path.sep}${senderId}`)) {
				return channel.send(`${warning} You do not have the permission to change songs for other users! (Developer)`);
			}
		}

		renameSync(origin, destination);
		channel.send(`Song succesfully renamed \nFrom: \`${origin}\`\nTo: \`${destination}\``);
		syncSoundFiles(client);
	}
});