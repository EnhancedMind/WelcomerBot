const Command = require('../../Structures/Command');

const { bot: { prefix, ownerID }, emoji: { success, warning }, response: { missingArguments }, player: { maxTime, allowedExtensions } } = require('../../../config/config.json')
const https = require('https');
const { existsSync, renameSync, mkdirSync, createWriteStream, rmSync } = require('fs');
const { spawn } = require('child_process');
const ffprobe = require('ffprobe-static');
const path = require('path');
const { getSetting, setSetting, writeSettingsFile } = require('../../Structures/settingsManager.js');

module.exports = new Command({
	name: 'addsong',
	aliases: [ 'setsong' ],
	syntax: 'addsong [send attachment file]',
	description: `Adds the song sent in the attachment as your join song. For more info type \`${prefix}addsong -help\``,
	async run(message, args, client) {
		if (args[0] == '-help') return message.channel.send(
`This command allows you to add a song for you in the database.
The song must be under ${maxTime} seconds and must be a music file. The supported file types are: \`${allowedExtensions.join(', ')}\`
To use this, send the file you want to add as an attachment in the message. 
The file must be named in a specific way: 
It must start with your user ID, in case you don't know it, it is: \`${message.author.id}\`
Then you can add a comment, which is optional. It must be separated by an underscore. It can be for example your display name.
You can also add various tags that will affect the behavior, they must also be separated by an underscore. The tags are:
- \`$join\` - This will make the sound play when you join a voice channel. This is the default behavior even if you don't add this tag.
- \`$leave\` - This will make the sound play when you leave a voice channel.
- \`$once\` - This will make the sound play only once. After that, it will be marked as used and will not play again.
- \`$ch=0.5\` - This will set the chance of the sound playing to 50%. You can set this to any value between 0 and 1. If you don't set this, the chance will be divided between all the sounds you have minus the files that have a chance set.
An example file name would be: \`${message.author.id}_myname_$join_$leave_$once_$ch=0.5.mp3\` or \`${message.author.id}_myname_$ch=0.3.mp3\` or even just \`${message.author.id}.mp3\`.
Keep in mind that any file send will be kept on the server, even after using removesound, as that will only mark it as used. The only way to fully remove the sound is to contact the owner of the bot.
`);


		if (!message.attachments.size) return message.channel.send(`${warning} ${missingArguments} (No attachment found)`);
		if (!message.attachments.size > 1) return message.channel.send(`${warning} Too many attachments!`);

		const attachmentName = message.attachments.first().title ? `${message.attachments.first().title}${path.extname(message.attachments.first().name)}` : message.attachments.first().name;

		if (!allowedExtensions.some(ext => attachmentName.endsWith(ext))) return message.channel.send(`${warning} Invalid file type! Supported types: ${allowedExtensions.join(', ')}`);
		if (!attachmentName.startsWith(message.author.id) && message.author.id != ownerID) return message.channel.send(`${warning} Invalid file name! It must start with your user ID: \`${message.author.id}\``); 

		console.log(message.attachments.first().name);
		console.log(message.attachments.first().title);
		console.log(path.extname(message.attachments.first().name));
		console.log(attachmentName);

		const filePath = `./music/users/${attachmentName}`;
		if (existsSync(filePath)) return message.channel.send(`${warning} A file with that name already exists! Please rename the file and try again.`);
		const tempPath = `./music/users/temp/${attachmentName}`;
		if (!existsSync('./music/users/temp')) mkdirSync('./music/users/temp', { recursive: true });
		await new Promise((resolve) => https.get(message.attachments.first().url, (res) => res.pipe(createWriteStream(tempPath)).on('finish', () => resolve())));

		const ffprobeProcess = spawn(`${ffprobe.path}`,
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
				return message.channel.send(`${warning} The song is too long! Max length: ${maxTime} seconds`);
			}

			renameSync(tempPath, filePath);
			message.channel.send(`${success} Successfully uploaded song!`);

			let settingModified = false;
			const setting = getSetting(client, 'user', message.author.id);
			if (!setting) return;
			if (!setting.enabledJoin && attachmentName.includes('$join')) {
				setSetting(client, 'user', message.author.id, 'enabledJoin', true);
				settingModified = true;
			}
			else if (!setting.enabledLeave && attachmentName.includes('$leave')) {
				setSetting(client, 'user', message.author.id, 'enabledLeave', true);
				settingModified = true;
			}

			await writeSettingsFile(client).catch(err => {
				return message.channel.send(`${warning} An error occurred while writing the settings file, your sound is activated only until the bot restarts!`);
			});

			if (settingModified) message.channel.send(`${success} Your settings have been updated to play the sound!`);
		});
	}
});
