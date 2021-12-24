const Command = require('../../Structures/Command.js');

const { MessageEmbed } = require('discord.js');
const paginator = require('../../Structures/Paginator.js');

module.exports = new Command({
	name: 'aliases',
    aliases: ['alias'],
	description: 'Shows the aliases for the commands',
	async run(message, args, client) {
		let everyoneAliases = new MessageEmbed()
            .setColor(0x3399FF)
            .setAuthor(client.user.username, client.user.displayAvatarURL({ size: 1024, dynamic: true }))
            .setTitle('**Aliases!**')
            .addField('**Pages**', '`1. Aliases`,  `2. Admin Aliases`,  `3. Owner Aliases`')
            .addField('**Help**'   , `:wavy_dash:**\`${client.commands.get('help').aliases.join('`**, **`')}\`**`)
            .addField('**Aliases**', `:wavy_dash:**\`${client.commands.get('aliases').aliases.join('`**, **`')}\`**`)
            .addField('**Ping**'   , `:wavy_dash:**\`${client.commands.get('ping').aliases.join('`**, **`')}\`**`)
            .addField('**Status**' , `:wavy_dash:**\`${client.commands.get('status').aliases.join('`**, **`')}\`**`)
            .addField('**Hello**'  , `:wavy_dash:**\`${client.commands.get('hello').aliases.join('`**, **`')}\`**`)
            .addField('**Say**'    , `:wavy_dash:**\`${client.commands.get('say').aliases.join('`**, **`')}\`**`)
            .addField('**Play**'   , `:wavy_dash:**\`${client.commands.get('play').aliases.join('`**, **`')}\`**`)
            .addField('**Stop**'   , `:wavy_dash:**\`${client.commands.get('stop').aliases.join('`**, **`')}\`**`)

        let adminAliases = new MessageEmbed()
            .setColor(0x3399FF)
            .setAuthor(client.user.username, client.user.displayAvatarURL({ size: 1024, dynamic: true }))
            .setTitle('**Admin aliases!**')
            .addField('**Pages**', '`1. Aliases`,  `2. Admin Aliases`,  `3. Owner Aliases`')
            .addField('**Clear**', `:wavy_dash:**\`${client.commands.get('clear').aliases.join('`**, **`')}\`**`)
            
        let ownerAliases = new MessageEmbed()
            .setColor(0x3399FF)
            .setAuthor(client.user.username, client.user.displayAvatarURL({ size: 1024, dynamic: true }))
            .setTitle('**Owner aliases!**')
            .addField('**Pages**'    , '`1. Aliases`,  `2. Admin Aliases`,  `3. Owner Aliases`')
            .addField('**Log**'      , `:wavy_dash:**\`${client.commands.get('log').aliases.join('`**, **`')}\`**`)
            .addField('**Debug**'    , `:wavy_dash:**\`${client.commands.get('debug').aliases.join('`**, **`')}\`**`)
            .addField('**Setgame**'  , `:wavy_dash:**\`${client.commands.get('setgame').aliases.join('`**, **`')}\`**`)
            .addField('**Setstatus**', `:wavy_dash:**\`${client.commands.get('setstatus').aliases.join('`**, **`')}\`**`)
            .addField('**Reset**'    , `:wavy_dash:**\`${client.commands.get('reset').aliases.join('`**, **`')}\`**`)
            .addField('**Welcome**'  , `:wavy_dash:**\`${client.commands.get('welcome').aliases.join('`**, **`')}\`**`)
            .addField('**Restart**'  , `:wavy_dash:**\`${client.commands.get('restart').aliases.join('`**, **`')}\`**`)
            .addField('**Shutdown**' , `:wavy_dash:**\`${client.commands.get('shutdown').aliases.join('`**, **`')}\`**`)

        let pages = [
            everyoneAliases,
            adminAliases,
            ownerAliases,
        ]

        paginator(message, pages);
	}
});
