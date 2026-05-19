const Command = require('../../Structures/Command');

const { bot: { prefix, ownerID , devIDs}, emoji: { success, warning }, response: { missingArguments } } = require('../../../config/config.json')
const { existsSync, rmSync} = require('fs');
const path = require('path');
const { invalidateSoundFile } = require('../../Structures/musicFilesManager.js');
const { syncSoundFiles, defaultDirComparison, everyoneDirComparison, userDirComparison, musicDirComparison } = require('../../Structures/musicFilesManager.js');

const helpText = 
`This command allows you to mark a song as used. This means the song will not play again.
To use this command, send the file path of the song you want to remove from the list. You can get the file path from the \`${prefix}playable\` command.
Keep in mind that this command does not remove the file from the server, it only marks it as used. The only way to fully remove the file is to contact the owner of the bot.
Example usage: \`${prefix}removesong music${path.sep}users${path.sep}$yourID${path.sep}mysong.mp3\`
`;

module.exports = new Command({
	name: 'removesong',
	aliases: [ '' ],
	syntax: 'removesong <filepath>',
	description: `Marks the song from the first argument as used. Send the whole path from \`${prefix}playable\` as an argument. Does not remove the song completely from the server, for that contact the owner of the bot.`,
	help: helpText,
	async run(message, args, client) {
		const channel = message.channel;
		const senderId = message.author.id;

		console.log(args);
		const forceFlag = args.includes('-f') || args.includes('--force');
		console.log(forceFlag);
		const enoughArguments = (forceFlag) ? args.length >= 2 : args.length >= 1

		if(!enoughArguments) return channel.send(`${warning} ${missingArguments}`);

		let file = (forceFlag) ? args[1] : args[0];

		if(path.dirname(file) === '.') {
			const songs = client.soundFiles.get(senderId);
			let foundPath = false;
			for(const song of songs) { // Find the path to the song
				if(song.filename === file) {
					file = song.path;
					foundPath = true;
					break;
				}
			}

			if(!foundPath) {
				return channel.send(`${warning} file \`${file}\` doesn't exist in your library!`);
			}
		}

		if(!file.startsWith(musicDirComparison)) return channel.send(`${warning}${warning}${warning} You tried to make changes outside the music database${warning}${warning}${warning}\nAttempted move from: \`${file}\``);
		if (!existsSync(file)) return channel.send(`${warning} file \`${file}\` doesn't exist!`);

		const permissionFail = senderId != ownerID && !devIDs.includes(senderId);
		if (permissionFail) {
			if (file.startsWith(`${defaultDirComparison}${path.sep}`)) {
				return channel.send(`${warning} You do not have the permission to remove songs from default! (Developer)`);
			}
			else if (file.startsWith(`${everyoneDirComparison}${path.sep}`)) {
				return channel.send(`${warning} You do not have the permission to remove songs from everyone! (Developer)`);
			}
			else if (!file.startsWith(`${userDirComparison}${path.sep}${senderId}`)) {
				return channel.send(`${warning} You do not have the permission to remove songs from other users! (Developer)`);
			}
		}

		if(forceFlag) {
			rmSync(file);
			channel.send(`${success} Successfully removed the file ${file} from database`);
		}
		else {
			invalidateSoundFile(client, file);
			channel.send(`${success} Successfully invalidated the file ${file}!`);
		}
		
		syncSoundFiles(client);
	}
});
