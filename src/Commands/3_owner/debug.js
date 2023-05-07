const Command = require('../../Structures/Command');

const { readdirSync, statSync } = require('fs');
const path = require('path');
const { bot: { ownerID }, emoji: { success, error }, response: { invalidPermissions } } = require('../../../config/config.json');


module.exports = new Command({
	name: 'debug',
	aliases: [ 'getlog' ],
	syntax: 'debug <file>',
	description: 'Sends selected file as a message attachment',
	async run(message, args, client) {
		if (message.author.id != ownerID) return message.channel.send(`${error} ${invalidPermissions}`);

		const getAllFilePaths = (dirPath, arrayOfFilePaths, arrayOfFileNames) => {
			arrayOfFilePaths = arrayOfFilePaths || [];
  			arrayOfFileNames = arrayOfFileNames || [];

			readdirSync(dirPath).forEach((file) => {
				const filePath = path.join(dirPath, file);
				if (statSync(filePath).isDirectory()) {
					[arrayOfFilePaths, arrayOfFileNames] = getAllFilePaths(filePath, arrayOfFilePaths, arrayOfFileNames);
				} else {
					arrayOfFilePaths.push(filePath);
					arrayOfFileNames.push(file);
				} 
			});
		  
			return [arrayOfFilePaths, arrayOfFileNames];
		}

		const [ configFilePaths, configFiles ] = getAllFilePaths('./config/');
		const [ logFilePaths, logFiles ] = getAllFilePaths('./logs/');

		if (!args[0]) return message.channel.send(`${success} Logs: **${logFiles.join('**, **')}**\n${success} Config: **${configFiles.join('**, **')}**`);

		const filePaths = configFilePaths.concat(logFilePaths);
		const files = configFiles.concat(logFiles);

		for (const file of files) {
			if (file.startsWith(args[0])) {
				const filePath = filePaths[files.indexOf(file)];
				message.channel.send({ content: `${success} File: **${filePath}**`, files: [ filePath ] });
				return;
			}
		}
		message.channel.send(`${error} That file doesn't exist!`);
	}
});
