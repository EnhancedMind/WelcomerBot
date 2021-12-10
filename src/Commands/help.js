const Command = require('../Structures/Command.js');

const paginationEmbed = require('discordjs-button-pagination');
const { MessageEmbed, MessageButton } = require('discord.js');
const { prefix } = require('../Data/data.js');

module.exports = new Command({
	name: 'help',
    aliases: ['h'],
	description: 'Shows the help menu',
	async run(message, args, client) {
		let everyoneHelp = new MessageEmbed()
            .setColor(0x3399FF)
            .setAuthor(client.user.username, client.user.displayAvatarURL({ size: 1024, dynamic: true }))
            .setDescription('This bot comes from a GitHub project [EnhancedMind/WelcomerBot](https://github.com/EnhancedMind/WelcomerBot).\nThe use is possible for free while keeping the credits.\n Made by EnhancedMind :heart:')
            .setTitle('**Help is here!**')
            .addField('**Prefix**'       , `:wavy_dash:The prefix is:   **${prefix}**`)
            .addField('**Pages**'        , '`1. Help`,  `2. Admin help`,  `3. Owner help`')
            .addField('**Help**'         , `:wavy_dash:${client.commands.get('help').description}`)
            .addField('**Aliases**'      , `:wavy_dash:${client.commands.get('aliases').description}`)
            .addField('**Ping**'         , `:wavy_dash:${client.commands.get('ping').description}`)
            .addField('**Status**'       , `:wavy_dash:${client.commands.get('status').description}`)
            .addField('**Hello**'        , `:wavy_dash:${client.commands.get('hello').description}`)
            .addField('**Say [message]**', `:wavy_dash:${client.commands.get('say').description}`)
            .addField('**Play [song]**'  , `:wavy_dash:${client.commands.get('play').description}`)
            .addField('**Stop**'         , `:wavy_dash:${client.commands.get('stop').description}`)

        let adminHelp = new MessageEmbed()
            .setColor(0x3399FF)
            .setAuthor(client.user.username, client.user.displayAvatarURL({ size: 1024, dynamic: true }))
            .setTitle('**Admin help is here!**')
            .addField('**Pages**', '`1. Help`,  `2. Admin help`,  `3. Owner help`')
            .addField('**Clear <amount> <confirm>**', `:wavy_dash:${client.commands.get('clear').description}`)
            
        let ownerHelp = new MessageEmbed()
            .setColor(0x3399FF)
            .setAuthor(client.user.username, client.user.displayAvatarURL({ size: 1024, dynamic: true }))
            .setTitle('**Owner help is here!**')
            .addField('**Pages**', '`1. Help`,  `2. Admin help`,  `3. Owner help`')
            .addField('**Log [data]**'            , `:wavy_dash:${client.commands.get('log').description}`)
            .addField('**Debug <logFile>**'       , `:wavy_dash:${client.commands.get('debug').description}`)
            .addField('**Setgame [game]**'        , `:wavy_dash:${client.commands.get('setgame').description}`)
            .addField('**Setstatus <status>**'    , `:wavy_dash:${client.commands.get('setstatus').description}`)
            .addField('**Reset**'                 , `:wavy_dash:${client.commands.get('reset').description}`)
            .addField('**Welcome <action> <> <>**', `:wavy_dash:${client.commands.get('welcome').description}`)
            .addField('**Restart**'               , `:wavy_dash:${client.commands.get('restart').description}`)
            .addField('**Shutdown**'              , `:wavy_dash:${client.commands.get('shutdown').description}`)

        let previousButton = new MessageButton()
            .setCustomId('previousbtn')
            .setEmoji('◀️')
            .setLabel('')
            .setStyle('SECONDARY')

        let nextButton = new MessageButton()
            .setCustomId('nextbtn')
            .setEmoji('▶️')
            .setLabel('')
            .setStyle('SECONDARY')

        let pages = [
            everyoneHelp,
            adminHelp,
            ownerHelp,
        ]

		let buttonList = [
            previousButton,
            nextButton,
        ]

        let timeout = '120000';

        paginationEmbed(message, pages, buttonList, timeout);

	}
});
