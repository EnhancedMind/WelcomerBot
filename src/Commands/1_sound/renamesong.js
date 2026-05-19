const Command = require('../../Structures/Command.js');

const { 
	bot: { prefix, ownerID, devIDs }, 
	emoji: { success, warning }, 
	response: { missingArguments }, 
	player: { maxTime, allowedExtensions }, 
	directories: {userMusicDir, everyoneMusicDir, defaultMusicDir, tempMusicDir}
} = require('../../../config/config.json')

const https = require('https');
const { existsSync, readdirSync, statSync, renameSync, mkdirSync, createWriteStream, rmSync, readdir } = require('fs');
const { spawn } = require('child_process');
const path = require('path');
const { PermissionsBitField } = require('discord.js');
const { getSetting, setSetting, writeSettingsFile } = require('../../Structures/settingsManager.js');
const { runtimeSyncSoundFile } = require('../../Structures/musicFilesManager.js')

const helpText = 
`To rename your song, use write the following \`${prefix}renamesong <originPath> <destinationPath>\`.
If you are unsure about the file path to your file, use \`${prefix}playable -p\`
`;

module.exports = new Command({
	name: 'renamesong',
	aliases: [ 'renamefile' ],
	syntax: 'addsong <origin> <destination>',
	description: `This command allows you rename/move your songs`,
	help: helpText,
	async run(message, args, client) {
		const channel = message.channel;

		if(args.length < 2) {
			return channel.send(`${warning} ${missingArguments}`);
		}
		const origin = args[0];
		const destination = args[1];

		if (existsSync(origin)) return channel.send(`${warning} file \`${destination}\` doesn't exists!`);
		if (existsSync(destination)) return channel.send(`${warning} file \`${destination}\` already exists!`);

		if (!message.attachments.size) return channel.send(`${warning} ${missingArguments} (No attachment found)`);
		const permissionFail = senderId != ownerID && !devIDs.includes(senderId);

		if (args[0] == '--default' || args[0] == '-d') {
			if (permissionFail) return channel.send(`${warning} You do not have the permission to add songs to default! (Administrator)`);
			addSongCore(message, client, defaultMusicDir);
		}
		else if (args[0] == '--everyone' || args[0] == '-e') {
			if (permissionFail) return channel.send(`${warning} You do not have the permission to add songs to everyone! (Administrator)`);
			addSongCore(message, client, everyoneMusicDir);
		}
		else if (args[0] == '--user' || args[0] == '-u') {
			if (permissionFail) return channel.send(`${warning} You do not have the permission to add songs to other users! (Administrator)`);

			var userId;
			if (args[1].startsWith('<@') && args[1].endsWith('>')) {
				userId = args[1].replace(/[<@!>]/g, '');
				addUserSong(message, client, userId)
			}
			else {
				return channel.send(`${warning} user ${args[0]} does not exist.`);
			}
		}
		else { // typical user file
			addUserSong(message, client, senderId)
		}
	}
});

async function addUserSong(message, client, targetId) {
	const userDirReader = readdirSync(userMusicDir);
	let fileOrDir = undefined;
	for(fileOrDir of userDirReader) {
		if(!fileOrDir.startsWith(targetId)) { //Check if fileOrDir matches the user ID pattern
			fileOrDir = undefined;
			continue;
		} 
		if(statSync(path.join(userMusicDir, fileOrDir)).isDirectory()) break; //User's directory found
		fileOrDir = undefined;
	}

	const dirTag = (await client.users.fetch(targetId)).globalName;
	const userDirName = (fileOrDir !== undefined) ? fileOrDir : [targetId, dirTag].join('_');
	const userDirPath = path.join(`${userMusicDir}`, `${userDirName}`);

	if(fileOrDir === undefined) {
		mkdirSync(`${userDirPath}`, { recursive: true });
	}

	addSongCore(message, client, userDirPath);
}

async function addSongCore(message, client, targetDir) {
	const allAttachments = message.attachments;
	const channel = message.channel;
	const senderId = message.author.id;

	for(const [_, attachment] of allAttachments) {
		const fileName = attachment.title ? `${attachment.title}${path.extname(attachment.name)}` : attachment.name;

		if (!allowedExtensions.some(ext => fileName.endsWith(ext))) return channel.send(`${warning} Invalid file type! Supported types: ${allowedExtensions.join(', ')}`);

		const filePath = path.join(targetDir,fileName);
		if (existsSync(filePath)) return channel.send(`${warning} A file with that name already exists! Please rename the file and try again.`);
		const tempPath = path.join(tempMusicDir,fileName);
		if (!existsSync(`${tempMusicDir}`)) mkdirSync(`${tempMusicDir}`, { recursive: true });
		await new Promise((resolve) => https.get(attachment.url, (res) => res.pipe(createWriteStream(tempPath)).on('finish', () => resolve())));

		const ffprobeProcess = spawn(`ffprobe`,
			[ '-i', tempPath, //input file
			'-show_entries', 'format=duration', //only show duration
			'-v', 'quiet', //prevent output spam
			'-of', 'csv=p=0' //output only the duration in seconds 
			]
		);

		ffprobeProcess.stdout.on('data', async (data) => {
			const duration = parseFloat(data);
			if (duration > maxTime) {
				rmSync(tempPath, { force: true });
				return channel.send(`${warning} The song is too long! Max length: ${maxTime} seconds`);
			}

			renameSync(tempPath, filePath);
			channel.send(`${success} Successfully uploaded song!`);
			runtimeSyncSoundFile(channel, client, filePath);

			let settingModified = false;
			const setting = getSetting(client, 'user', senderId);
			if (!setting) return;
			if (!setting.enabledJoin && fileName.includes('$join')) {
				setSetting(client, 'user', senderId, 'enabledJoin', true);
				settingModified = true;
			}
			else if (!setting.enabledLeave && fileName.includes('$leave')) {
				setSetting(client, 'user', senderId, 'enabledLeave', true);
				settingModified = true;
			}

			await writeSettingsFile(client).catch(err => {
				return channel.send(`${warning} An error occurred while writing the settings file, your sound is activated only until the bot restarts!`);
			});

			if (settingModified) channel.send(`${success} Your settings have been updated to play the sound!`);
		});
	}
}
