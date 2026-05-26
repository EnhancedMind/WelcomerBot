const Command = require('../../Structures/Command');

const { 
	bot: { prefix, ownerID, devIDs }, 
	emoji: { success, info, warning }, 
	response: { missingArguments }, 
	player: { maxTime, allowedExtensions },
	directories: {userMusicDir, defaultMusicDir, everyoneMusicDir, tempMusicDir}
} = require('../../../config/config.json');

const https = require('https');
const { createWriteStream } = require('fs');
const { readdir, stat, rename, mkdir, rm } = require('fs/promises');
const { spawn } = require('child_process');
const path = require('path');

const { exists } = require('../../utils/fsUtils.js');
const { consoleLog } = require('../../Data/Log.js');
const { getSetting, setSetting, writeSettingsFile } = require('../../Structures/settingsManager.js');
const { syncSoundFiles, getUserPath, getFileDuration, defaultDirComparison, everyoneDirComparison } = require('../../Structures/musicFilesManager.js');

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

This command supports the following arguments for developers:
- \`--default\` or \`-d\` - Adds default song to \`${defaultDirComparison}\`
- \`--everyone\` or \`-e\` - Adds song for everyone to \`${everyoneDirComparison}\`
- \`--user @user\` or \`-u @user\` - Adds song to \`user\`'s personal library
`;

module.exports = new Command({
	name: 'addsong',
	aliases: [ 'setsong' ],
	syntax: 'addsong [--default/--user @user/--everyone] ^fileInAttachment',
	description: `Adds the song sent in the attachment as your join song. For more info type \`${prefix}addsong -help\``,
	help: helpText,
	async run(message, args, client) {
		const channel = message.channel;
		const senderId = message.author.id;

		if (!message.attachments.size) return await channel.send(`${warning} ${missingArguments} (No attachment found)`);
		const permissionFail = senderId != ownerID && !devIDs.includes(senderId);

		if (args[0] == '--default' || args[0] == '-d') {
			if (permissionFail) return await channel.send(`${warning} You do not have the permission to add songs to default! (Developer)`);
			await addSongCore(message, client, defaultMusicDir);
		}
		else if (args[0] == '--everyone' || args[0] == '-e') {
			if (permissionFail) return await channel.send(`${warning} You do not have the permission to add songs to everyone! (Developer)`);
			await addSongCore(message, client, everyoneMusicDir);
		}
		else if (args[0] == '--user' || args[0] == '-u') {
			if (permissionFail) return await channel.send(`${warning} You do not have the permission to add songs to other users! (Developer)`);

			let userId;
			if (args[1].startsWith('<@') && args[1].endsWith('>')) {
				userId = args[1].replace(/[<@!>]/g, '');
				const userPath = await getUserPath(client, userId);
				await addSongCore(message, client, userPath)
			}
			else {
				return await channel.send(`${warning} user ${args[1]} is not a valid user.`);
			}
		}
		else { // Typical user file
			const userPath = await getUserPath(client, senderId);
			await addSongCore(message, client, userPath)
		}
	}
});

/**
 * Adds a song from message to the target directory
 * @param {Discord.Message<boolean> | Discord.Interaction<Discord.CacheType} message - The message with the command.
 * @param {Client} client - The client instance.
 * @param {string} targetDir - The target directory for the song file.
 * @returns {void}
 */
async function addSongCore(message, client, targetDir) {
	const allAttachments = message.attachments;
	const channel = message.channel;
	const senderId = message.author.id;

	const response = await channel.send(`${info} Working...`)

	const channelResponse = [];

	// Modifying settings if they are disabled
	let settingModified = false;
	const setting = getSetting(client, 'user', senderId);

	for(const [_, attachment] of allAttachments) {
		const fileName = attachment.title ? `${attachment.title}${path.extname(attachment.name)}` : attachment.name;

		if (!allowedExtensions.some(ext => fileName.endsWith(ext))) {
			channelResponse.push(`${warning} Invalid file type in \`${fileName}\`! Supported types: ${allowedExtensions.join(', ')}`);
			continue;
		}

		const filePath = path.join(targetDir,fileName);
		if (await exists(filePath))  {
			channelResponse.push(`${warning} A file with the name \`${fileName}\` already exists! Please rename the file and try again.`);
			continue;
		}
		const tempPath = path.join(tempMusicDir,fileName);
		if (!(await exists(`${tempMusicDir}`))) await mkdir(`${tempMusicDir}`, { recursive: true });

		await new Promise((resolve) => https.get(attachment.url, (res) => res.pipe(createWriteStream(tempPath)).on('finish', () => resolve())));

		let duration;
		try {
			duration = await getFileDuration(tempPath);
		}
		catch (err) {
			consoleLog(`[ERR] Failed analyzing ${fileName}:`, err);
			channelResponse.push(`${warning} Failed to analyze \`${fileName}\`. The file might be corrupted.`);
			await rm(tempPath, { force: true }).catch(() => {});
			continue;
		}

		if (duration > maxTime) {
			await rm(tempPath, { force: true }).catch(() => {});
			channelResponse.push(`${warning} The song \`${fileName}\` is too long! Max length: ${maxTime} seconds`);
			continue;
		}

		try {
			await rename(tempPath, filePath);
		}
		catch (err) {
			channelResponse.push(`${warning} Failed to move \`${fileName}\`. Terminating...`);
			continue;
		}
		channelResponse.push(`${success} Successfully uploaded \`${fileName}\`!`);

		if (!setting) continue;
		if (!setting.enabledJoin && (fileName.includes('$join') || !fileName.includes('$leave')) ) {
			setSetting(client, 'user', senderId, 'enabledJoin', true);
			settingModified = true;
		}
		else if (!setting.enabledLeave && fileName.includes('$leave')) {
			setSetting(client, 'user', senderId, 'enabledLeave', true);
			settingModified = true;
		}
	}

	await syncSoundFiles(client);

	if (settingModified) {
		try {
			await writeSettingsFile(client);
			channelResponse.push(`${success} Your settings have been updated to play the sound!`);
		}
		catch {
			channelResponse.push(`${warning} An error occurred while writing the settings file, your sound is activated only until the bot restarts!`);
		}
	}

	// ensure message is not empty
	if (channelResponse.length === 0) {
        channelResponse.push(`${warning} No valid files were processed, or other problem occured.`);
    }

	try {
		await response.edit(channelResponse.join('\n'));
	}
	catch (_) {
		await channel.send(channelResponse.join('\n')).catch(() => {});
	}
}
