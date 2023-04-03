const Command = require('../../Structures/Command');

const { emoji: { success, warning }, response: { missingArguments }, player: { maxTime, allowedExtensions } } = require('../../../config/config.json')
const https = require('https');
const { readdirSync, existsSync, renameSync, createWriteStream, unlink, writeFile } = require('fs');
const { spawn } = require('child_process');
const ffprobe = require('ffprobe-static');
const { consoleLog } = require('../../Data/Log.js');

module.exports = new Command({
	name: 'setsong',
	aliases: [ 'set' ],
	syntax: 'setsong [comment] [send attachment file]',
	description: 'Sets the song sent in the attachment as your join song. It must be under 15 seconds and has to be a music file. You can only have one song at a time. If you send a new song, the old one will be replaced.',
	async run(message, args, client) {
		if (!message.attachments.size) return message.channel.send(`${warning} ${missingArguments} (No attachment found)`);
		if (!message.attachments.size > 1) return message.channel.send(`${warning} Too many attachments!`);
		if (!allowedExtensions.some(ext => message.attachments.first().name.endsWith(ext))) return message.channel.send(`${warning} Invalid file type! Supported types: ${allowedExtensions.join(', ')}`);
		if (args[0] && args[0].length > 15) return message.channel.send(`${warning} Comment too long! Max length: 15 characters`);

		const filePath = `./music/users/${message.author.id}_${message.author.username}${args[0] ? `_${args[0]}` : ''}${message.attachments.first().name.slice(message.attachments.first().name.lastIndexOf('.'))}`;
		const tempPath = `./music/users/temp/${message.attachments.first().name}`;
		await new Promise((resolve) => https.get(message.attachments.first().url, (res) => res.pipe(createWriteStream(tempPath)).on('finish', () => resolve())));

		const ffprobeProcess = spawn(`${ffprobe.path}`,
			[ '-i', tempPath, //input file
			'-show_entries', 'format=duration', //only show duration
			'-v', 'quiet', //prevent output spam
			'-of', 'csv=p=0' //output only the duration in seconds 
			]
		);

		ffprobeProcess.stdout.on('data', (data) => {
			const duration = parseFloat(data);
			if (duration > maxTime) {
				unlink(tempPath, (err) => {
					if (err) consoleLog(err);
				});
				return message.channel.send(`${warning} The song is too long! Max length: ${maxTime} seconds`);
			}
			const files = readdirSync('./music/users');
			for (const file of files) {
				if (file.startsWith(message.author.id) && !(/\.old(\d*)?$/).test(file)) {
					let i = 1;
					while (existsSync(`./music/users/${file}.old${i}`)) i++;
					renameSync(`./music/users/${file}`, `./music/users/${file}.old${i}`);
				}
			}
			renameSync(tempPath, filePath);
			message.channel.send(`${success} Successfully set song!`);

			const settingsFile = __dirname + '/../../../config/settings.json';
        	const settings = require(settingsFile);
			if (settings.user[message.author.id] && !settings.user[message.author.id].enabledJoin) {
				settings.user[message.author.id].enabledJoin = true;
				message.channel.send(`${success} Your join sound has been enabled!`);

				writeFile(settingsFile, JSON.stringify(settings, null, 4), (err) => {
					if (err) consoleLog(err);
				});
			}
		});
	}
});
