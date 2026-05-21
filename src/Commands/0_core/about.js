const Command = require('../../Structures/Command');

const { EmbedBuilder, version: djsversion, time } = require('discord.js');
const { bot: { prefix, ownerID }, logs: { timeFormat } } = require('../../../config/config.json');
const { version, homepage, developerpage } = require('../../../package.json');


module.exports = new Command({
	name: 'about',
	aliases: [ ' ' ],
	description: 'Shows information about the bot.',
	async run(message, args, client) {
		const versionStringParts = [];
		if (version) versionStringParts.push(`v${version}`);
  		if (process.env.BUILD_NUMBER) versionStringParts.push(`Build: ${process.env.BUILD_NUMBER}`);
  		if (process.env.COMMIT_SHA) versionStringParts.push(`Commit: ${process.env.COMMIT_SHA}`);

  		const versionString = versionStringParts.length > 0 ? `(${versionStringParts.join(', ')})` : '';

		const embed = new EmbedBuilder()
			.setColor(0x3399FF)
			.setAuthor({
				name: `All about ${client.user.username}!`,
				url: homepage,
				iconURL: client.user.displayAvatarURL({ size: 1024, dynamic: true })
			})
			.setDescription(`Hello! I am **${client.user.username}**, an awesomely annoying bot that is [easy to host yourself!](${homepage}) ${versionString}
			I am owned by **${(await client.users.fetch(ownerID)).username}** and I am developed by [**EnhancedMind**](${developerpage}).
			I run in **Node.js** using **Discord.js v${djsversion}** libraries.
			Type \`${prefix}help\` to see my commands!
			
			Some of my features include:
			\`\`\`🎶 High-quality sound playback.\n🎶 Easy to host yourself.\`\`\``)
			.setFooter({
				text: `Last restart: ${new Date(client.readyAt).toLocaleString(timeFormat)}`
			});

		message.channel.send({ embeds: [ embed ] });
	}
});
