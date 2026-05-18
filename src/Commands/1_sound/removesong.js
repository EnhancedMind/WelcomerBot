const Command = require('../../Structures/Command');

const { bot: { prefix, ownerID , devIDs}, emoji: { success, warning }, response: { missingArguments } } = require('../../../config/config.json')
const { existsSync} = require('fs');
const path = require('path');
const { invalidateSoundFile } = require('../../Structures/musicFilesManager.js');

module.exports = new Command({
	name: 'removesong',
	aliases: [ '' ],
	syntax: 'removesong <filepath>',
	description: `Marks the song from the first argument as used. Send the whole path from \`${prefix}playable\` as an argument. Does not remove the song completely from the server, for that contact the owner of the bot.`,
	help: helpText,
	async run(message, args, client) {
		const channel = message.channel;
		const senderId = message.author.id;

		const permissionFail = senderId != ownerID && !devIDs.includes(senderId);
		if (!args[0]) return channel.send(`${warning} ${missingArguments}`);

		const splitPath = args[0].split(path.sep);
		if(splitPath.length <= 2) return channel.send(`${warning} The file does not exist!`);

		if (!splitPath[2].startsWith(senderId) && permissionFail) return channel.send(`${warning} You can only remove your songs \`music${path.sep}users${path.sep}${message.author.id}...\``);
		if (!existsSync(`./${args[0]}`)) return channel.send(`${warning} The file does not exist!`);

		invalidateSoundFile(client, args[0]);

		channel.send(`${success} Successfully invalidated (removed) the file!`);
	}
});


const helpText = `
This command allows you to mark a song as used. This means the song will not play again.
To use this command, send the file path of the song you want to remove from the list. You can get the file path from the \`${prefix}playable\` command.
Keep in mind that this command does not remove the file from the server, it only marks it as used. The only way to fully remove the file is to contact the owner of the bot.
Example usage: \`${prefix}removesong music${path.sep}users${path.sep}${message.author.id}${path.sep}mysong.mp3\`
`;