const Command = require('../../Structures/Command');

const { 
	bot: { prefix, ownerID, devIDs }, 
	emoji: { success, warning }, 
	response: { missingArguments }, 
	player: { maxTime, allowedExtensions }
} = require('../../../config/config.json')

const https = require('https');
const { existsSync, readdirSync, statSync, renameSync, mkdirSync, createWriteStream, rmSync, readdir } = require('fs');
const { spawn } = require('child_process');
const path = require('path');
const { PermissionsBitField } = require('discord.js');
const { getSetting, setSetting, writeSettingsFile } = require('../../Structures/settingsManager.js');
const { syncSoundFiles } = require('../../Structures/musicFilesManager.js')

const helpText = 
`This command allows you to add a song to your library in the database.
The song must be under ${maxTime} seconds and must be a music file. The supported file types are: \`${allowedExtensions.join(', ')}\`
To use this, send the file you want to add as an attachment in the message.
 
You can also add various tags in the filenameseperated by underscores that will affect the behavior. The tags are:
- \`$join\` - This will make the sound play when you join a voice channel. This is the default behavior even if you don't add this tag.
- \`$leave\` - This will make the sound play when you leave a voice channel.
- \`$once\` - This will make the sound play only once. After that, it will be marked as used and will not play again.
- \`$ch=0.5\` - This will set the chance of the sound playing to 50%. You can set this to any value between 0 and 1. If you don't set this, the chance will be divided between all the sounds you have minus the files that have a chance set.
An example file name would be: \`myname_$join_$leave_$once_$ch=0.5.mp3\` or \`myname_$ch=0.3.mp3\` or even just \`myname.mp3\`.
Keep in mind that any file sent will be kept on the server, even after using removesound, as that will only mark it as used. The only way to fully remove the sound is to contact the owner of the bot.

This command supports the following arguments for developers:
- \`--default\` or \`-d\` - Adds song to the default library
- \`--everyone\` or \`-e\` - Adds song to the everyone library
- \`--user @user\` or \`-u @user\` - Adds song to \`user\`'s library
`;

module.exports = new Command({
	name: 'addsong',
	aliases: [ 'setsong' ],
	syntax: 'addsong [send attachment file]',
	description: `Adds the song sent in the attachment as your join song. For more info type \`${prefix}addsong -help\``,
	help: helpText,
	async run(message, args, client) {
		const channel = message.channel;
		const senderId = message.author.id;

		if (!message.attachments.size) return channel.send(`${warning} ${missingArguments} (No attachment found)`);
		const permissionFail = senderId != ownerID && !devIDs.includes(senderId);

		if (args[0] == '--default' || args[0] == '-d') {
			if (permissionFail) return channel.send(`${warning} You do not have the permission to add songs to default! (Developer)`);
			addSongCore(message, client, defaultMusicDir);
		}
		else if (args[0] == '--everyone' || args[0] == '-e') {
			if (permissionFail) return channel.send(`${warning} You do not have the permission to add songs to everyone! (Developer)`);
			addSongCore(message, client, everyoneMusicDir);
		}
		else if (args[0] == '--user' || args[0] == '-u') {
			if (permissionFail) return channel.send(`${warning} You do not have the permission to add songs to other users! (Developer)`);

			var userId;
			if (args[1].startsWith('<@') && args[1].endsWith('>')) {
				userId = args[1].replace(/[<@!>]/g, '');
				addUserSong(message, client, userId)
			}
			else {
				return channel.send(`${warning} user ${args[0]} does not exist.`);
			}
		}
		else { // Typical user file
			addUserSong(message, client, senderId)
		}
	}
});

async function addUserSong(message, client, targetId) {
	const userDirReader = readdirSync(userMusicDir);

	// Attempting to find users directory
	let fileOrDir = undefined;
	for(fileOrDir of userDirReader) {
		if(!fileOrDir.startsWith(targetId)) { // Check if fileOrDir matches the user ID pattern
			fileOrDir = undefined;
			continue;
		} 
		if(statSync(path.join(userMusicDir, fileOrDir)).isDirectory()) break; // User's directory found
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
			channel.send(`${success} Successfully uploaded \`${fileName}!\``);
			syncSoundFiles(client);

			// Modifying settings if audio is diabled
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
