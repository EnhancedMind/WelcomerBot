const Command = require('../../Structures/Command');

const { EmbedBuilder } = require('discord.js');

const paginator = require('../../Structures/Paginator.js');
const { homepage } = require('../../../package.json');

module.exports = new Command({
	name: 'playable',
	aliases: [ 'pl', 'pls' ],
	description: 'Lists all the files that can be played.',
	async run(message, args, client) {
		const genericFiles = [];
		const userFiles = [];

		client.soundFiles.forEach((value, key) => {
			value.forEach((file) => {
				if (key != 'default' && key != 'everyone') {
					userFiles.push({
						name: file.filename,
						path: file.path
					});
				}
				else {
					genericFiles.push({
						name: file.filename,
						path: file.path
					});
				}
			});
		});

		const files = [ ...genericFiles, ...userFiles ];
		const embeds = [];

		let j = -1;
		for (let i = 0; i < files.length; i++) {
			if (i % 15 == 0) {
				j++;
				embeds[j] = new EmbedBuilder()
					.setColor(0x3399FF)
					.setAuthor({
						name: `All playable files!`,
						url: homepage,
						iconURL: client.user.displayAvatarURL({ size: 1024, dynamic: true })
					});
			}
			embeds[j].addFields({
				name: `\`${files[i].name}\``,
				value: `\`${files[i].path}\``,
			});
		}

		embeds[0].setDescription(`**Here are all the files that can be played by the bot:**\n\`\`\`🎶 Generic files: ${genericFiles.length}\n🎶 User files: ${userFiles.length}\`\`\``);

		let page = 0;
		if (args[0] && !isNaN(args[0])) page = args[0] - 1;

		paginator(message, embeds, null, page);	
	}
});
