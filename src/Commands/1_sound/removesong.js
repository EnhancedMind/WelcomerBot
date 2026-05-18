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
