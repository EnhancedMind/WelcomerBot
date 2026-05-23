const Command = require('../../Structures/Command');

const { bot: { prefix, ownerID , devIDs}, emoji: { success, warning }, response: { missingArguments } } = require('../../../config/config.json')
const { rm } = require('fs/promises');
const path = require('path');

const { exists } = require('../../utils/fsUtils.js');
const { invalidateSoundFile } = require('../../Structures/musicFilesManager.js');
const { syncSoundFiles, defaultDirComparison, everyoneDirComparison, userDirComparison, musicDirComparison } = require('../../Structures/musicFilesManager.js');

const helpText = 
`This command allows you to mark songs not be used or remove them completely.
Removing a song requires specifying its file path or name in the following format: 
\`${prefix}renamesong <file_to_be_marked>\`

To find the names or paths, use the command \`${prefix}playable\` for all or \`${prefix}playable -p\` for your files.

If you want to remove the file completely, use the tag \`-f\` or \`--force\` like so: \`${prefix}renamesong -f <file_to_be_removed>\`.
Example usage:
\`${prefix}removesong --force ${userDirComparison}${path.sep}$yourID${path.sep}mysong.mp3\`
\`${prefix}removesong mysong.mp3\`
`;

module.exports = new Command({
	name: 'removesong',
	aliases: [ 'rm' ],
	syntax: 'removesong [--force] <filepath>',
	description: `Marks the song from the first argument as used. Send the path from \`${prefix}playable\` as an argument.\nTo remove the sound completely, use the tag \`-f\` or \`--force\`.`,
	help: helpText,
	async run(message, args, client) {
		const channel = message.channel;
		const senderId = message.author.id;

		const forceFlag = args.includes('-f') || args.includes('--force');
		const enoughArguments = (forceFlag) ? args.length >= 2 : args.length >= 1

		if(!enoughArguments) return await channel.send(`${warning} ${missingArguments}`);

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
				return await channel.send(`${warning} file \`${file}\` doesn't exist in your library!`);
			}
		}

		if(!file.startsWith(musicDirComparison)) return await channel.send(`${warning}${warning}${warning} You tried to make changes outside the music database${warning}${warning}${warning}\nAttempted move from: \`${file}\``);
		if (!(await exists(file))) return await channel.send(`${warning} file \`${file}\` doesn't exist!`);

		const permissionFail = senderId != ownerID && !devIDs.includes(senderId);
		if (permissionFail) {
			if (file.startsWith(`${defaultDirComparison}${path.sep}`)) {
				return await channel.send(`${warning} You do not have the permission to remove songs from default! (Developer)`);
			}
			else if (file.startsWith(`${everyoneDirComparison}${path.sep}`)) {
				return await channel.send(`${warning} You do not have the permission to remove songs from everyone! (Developer)`);
			}
			else if (!file.startsWith(`${userDirComparison}${path.sep}${senderId}`)) {
				return await channel.send(`${warning} You do not have the permission to remove songs from other users! (Developer)`);
			}
		}

		if(forceFlag) {
			await rm(file);
			await channel.send(`${success} Successfully removed the file ${file} from database`);
		}
		else {
			await invalidateSoundFile(client, file);
			await channel.send(`${success} Successfully invalidated the file ${file}!`);
		}
		
		await syncSoundFiles(client);
	}
});
