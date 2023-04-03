const Command = require('../../Structures/Command');

const { MessageEmbed } = require('discord.js');
const { readdirSync } = require('fs');

const { player: { allowedExtensions } } = require('../../../config/config.json');
const { homepage } = require('../../../package.json');

module.exports = new Command({
	name: 'playable',
	aliases: [ 'lp', 'pls' ],
	description: 'Lists all the files that can be played.',
	async run(message, args, client) {
		const genericFiles = readdirSync('./music');
		const userFiles = readdirSync('./music/users');
		let numberGeneric = 0;
		let numberUser = 0;

		const embed = new MessageEmbed()
			.setColor(0x3399FF)
			.setAuthor({
				name: `All playable files!`,
				url: homepage,
				iconURL: client.user.displayAvatarURL({ size: 1024, dynamic: true })
			})


		for (const file of genericFiles) {
			if (allowedExtensions.some(ext => file.endsWith(ext))) {
				embed.addFields({
					name: `${file}`,
					value: ' '
				});
				numberGeneric++;
			}
		}
		for (const file of userFiles) {
			if (allowedExtensions.some(ext => file.endsWith(ext))) {
				embed.addFields({
					name: `${file}`,
					value: ' '
				});
				numberUser++;
			}
		}
		
		embed.setDescription(`**Here are all the files that can be played by the bot:**
			\`\`\`🎶 Generic files: ${numberGeneric}
🎶 User files: ${numberUser}\`\`\``);  // due to stupid discord formatting, this is the way to do this

		message.channel.send({ embeds: [ embed ] });		
	}
});
