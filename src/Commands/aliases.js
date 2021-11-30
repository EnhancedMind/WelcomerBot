const Command = require('../Structures/Command.js');

const paginationEmbed = require('discordjs-button-pagination');
const { MessageEmbed, MessageButton } = require('discord.js');

module.exports = new Command({
	name: 'aliases',
    aliases: ['alias'],
	description: 'Shows the aliases for the commands',
	async run(message, args, client) {
		const everyoneAliases = new MessageEmbed()
            .setColor(0x3399FF)
            .setAuthor(client.user.username, client.user.displayAvatarURL({ size: 1024, dynamic: true }))
            .setTitle('**Aliases!**')
            .addField('**Pages**', '`1. Aliases`,  `2. Admin Aliases`,  `3. Owner Aliases`')
            .addField('**Help**', ':wavy_dash:**`h`**')
            .addField('**Aliases**', ':wavy_dash:**`Alias`**')
            .addField('**Ping**', ":wavy_dash:**` `**")
            .addField('**Status**', ":wavy_dash:**` `**")
            .addField('**Hello**', ":wavy_dash:**`Hi`**,  **`Hey`**")
            .addField('**Say**', ':wavy_dash:**` `**')
            .addField('**Play**', ":wavy_dash:**`p`**")
            .addField('**Stop**', ':wavy_dash:**`Fuckoff`**,  **`dc`**')

        const adminAliases = new MessageEmbed()
            .setColor(0x3399FF)
            .setAuthor(client.user.username, client.user.displayAvatarURL({ size: 1024, dynamic: true }))
            .setTitle('**Admin aliases!**')
            .addField('**Pages**', '`1. Aliases`,  `2. Admin Aliases`,  `3. Owner Aliases`')
            .addField('**Clear**', ':wavy_dash:**`Purge`**')
            
        const ownerAliases = new MessageEmbed()
            .setColor(0x3399FF)
            .setAuthor(client.user.username, client.user.displayAvatarURL({ size: 1024, dynamic: true }))
            .setTitle('**Owner aliases!**')
            .addField('**Pages**', '`1. Aliases`,  `2. Admin Aliases`,  `3. Owner Aliases`')
            .addField('**Setgame**', ':wavy_dash:**` `**')
            .addField('**Setstatus**', ':wavy_dash:**` `**')
            .addField('**Welcome**', ':wavy_dash:**`Wlcm`**')
            .addField('**Restart**', ":wavy_dash:**`Reboot`**")
            .addField('**Shutdown**', ':wavy_dash:**`GoSleep`**')

        const previousButton = new MessageButton()
            .setCustomId('previousbtn')
            .setEmoji('◀️')
            .setLabel('')
            .setStyle('SECONDARY')

        const nextButton = new MessageButton()
            .setCustomId('nextbtn')
            .setEmoji('▶️')
            .setLabel('')
            .setStyle('SECONDARY')

        const pages = [
            everyoneAliases,
            adminAliases,
            ownerAliases,
        ]

		const buttonList = [
            previousButton,
            nextButton,
        ]

        const timeout = '120000';

        paginationEmbed(message, pages, buttonList, timeout);
	}
});
