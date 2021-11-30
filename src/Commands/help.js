const Command = require('../Structures/Command.js');

const paginationEmbed = require('discordjs-button-pagination');
const { MessageEmbed, MessageButton } = require('discord.js');
const { prefix } = require('../Data/data.js');

module.exports = new Command({
	name: 'help',
    aliases: ['h'],
	description: 'Shows the help menu',
	async run(message, args, client) {
		const everyoneHelp = new MessageEmbed()
            .setColor(0x3399FF)
            .setAuthor(client.user.username, client.user.displayAvatarURL({ size: 1024, dynamic: true }))
            .setDescription('This bot comes from a GitHub project [EnhancedMind/WelcomerBot](https://github.com/EnhancedMind/WelcomerBot).\nThe use is possible for free while keeping the credits.\n Made by EnhancedMind :heart:')
            .setTitle('**Help is here!**')
            .addField('**Prefix**', `:wavy_dash:The prefix is:   **${prefix}**`)
            .addField('**Pages**', '`1. Help`,  `2. Admin help`,  `3. Owner help`')
            .addField('**Help**', ':wavy_dash:Shows this')
            .addField('**Aliases**', ':wavy_dash:Shows the aliases for the commands')
            .addField('**Ping**', ":wavy_dash:Shows the bot's ping")
            .addField('**Status**', ":wavy_dash:Shows if the bot's play at join or leave functions are enabled")
            .addField('**Hello**', ":wavy_dash:Says Hello!")
            .addField('**Say [message]**', ':wavy_dash:Repeats whatever shit you said, then quietly deletes your message')
            .addField('**Play [song]**', ":wavy_dash:Plays some music (.mp3 plays bot's local files)")
            .addField('**Stop**', ':wavy_dash:Stops the audio player')

        const adminHelp = new MessageEmbed()
            .setColor(0x3399FF)
            .setAuthor(client.user.username, client.user.displayAvatarURL({ size: 1024, dynamic: true }))
            .setTitle('**Admin help is here!**')
            .addField('**Pages**', '`1. Help`,  `2. Admin help`,  `3. Owner help`')
            .addField('**Clear <amount> <confirm>**', ':wavy_dash:Deletes the amount of messages **!ALL MESSAGES!**')
            
        const ownerHelp = new MessageEmbed()
            .setColor(0x3399FF)
            .setAuthor(client.user.username, client.user.displayAvatarURL({ size: 1024, dynamic: true }))
            .setTitle('**Owner help is here!**')
            .addField('**Pages**', '`1. Help`,  `2. Admin help`,  `3. Owner help`')
            .addField('**Setgame [game]**', ':wavy_dash:Sets the game the bot is playing')
            .addField('**Setstatus <status>**', ':wavy_dash:Sets the status the bot displays')
            .addField('**Wlcm <action> <> <>**', ':wavy_dash:Enables or disable the play at join or leave function')
            .addField('**Restart**', ":wavy_dash:Restarts the bot's client")
            .addField('**Shutdown**', ':wavy_dash:Safely shuts down the bot')

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
            everyoneHelp,
            adminHelp,
            ownerHelp,
        ]

		const buttonList = [
            previousButton,
            nextButton,
        ]

        const timeout = '120000';

        paginationEmbed(message, pages, buttonList, timeout);
	}
});
