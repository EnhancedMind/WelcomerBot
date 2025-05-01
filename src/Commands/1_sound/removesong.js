const Command = require('../../Structures/Command');

const { bot: { prefix, ownerID }, emoji: { success, warning }, response: { missingArguments } } = require('../../../config/config.json')
const { existsSync } = require('fs');
const { invalidateSoundFile } = require('../../Structures/musicFilesManager.js');

module.exports = new Command({
	name: 'removesong',
	aliases: [ '' ],
	syntax: 'removesong <filepath>',
	description: `Marks the song from the first argument as used. Send the whole path from \`${prefix}playable\` as an argument. Does not remove the song completely from the server, for that contact the owner of the bot.`,
	async run(message, args, client) {
		if (!args[0]) return message.channel.send(`${warning} ${missingArguments}`);
		if (!args[0].startsWith(message.author.id) && message.author.id != ownerID) return message.channel.send(`${warning} You can only remove your sounds \`${message.author.id}...\``);
		if (!existsSync(`./${args[0]}`)) return message.channel.send(`${warning} The file does not exist!`);

		invalidateSoundFile(client, args[0]);

		message.channel.send(`${success} Successfully invalidated (removed) the file!`);
	}
});
