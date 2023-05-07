const Command = require('../../Structures/Command');

const { MessageEmbed } = require('discord.js');
const { bot: { prefix, ownerID } } = require('../../../config/config.json');
const { version, homepage, developerpage } = require('../../../package.json');


module.exports = new Command({
	name: 'about',
	aliases: [ ' ' ],
	description: 'Shows information about the bot.',
	async run(message, args, client) {
		const embed = new MessageEmbed()
			.setColor(0x3399FF)
			.setAuthor({
				name: `All about ${client.user.username}!`,
				url: homepage,
				iconURL: client.user.displayAvatarURL({ size: 1024, dynamic: true })
			})
			.setDescription(`Hello! I am **${client.user.username}**, an awesomely annoying bot that is [easy to host yourself!](${homepage}) (v${version})
			I am owned by **${(await client.users.fetch(ownerID)).username}** and I am developed by [**EnhancedMind**](${developerpage}).
			I run in **Node.js** using **Discord.js** libraries.
			Type \`${prefix}help\` to see my commands!
			
			Some of my features include:
			\`\`\`🎶 High-quality sound playback.\n🎶 Easy to host yourself.\`\`\``)
			.setFooter({
				text: `Last restart: ${new Date(client.readyAt).toLocaleString()}`
			});

		message.channel.send({ embeds: [ embed ] });
	}
});
