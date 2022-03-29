const Command = require('../../Structures/Command.js');

const { MessageEmbed } = require('discord.js');
const { readdirSync } = require('fs');
const paginator = require('../../Structures/Paginator.js');

module.exports = new Command({
	name: 'aliases',
    aliases: ['alias'],
	description: 'Shows the aliases for the commands',
	async run(message, args, client) {
        const author = {
            name: client.user.username,
            url: 'https://github.com/EnhancedMind/WelcomerBot',
            iconURL: client.user.displayAvatarURL({ size: 1024, dynamic: true })
        }

        let content = '';
        readdirSync('./src/Commands')
            .forEach(dirs => {
                content = content.concat(`\`${dirs[0].toUpperCase() + dirs.slice(1)} aliases\`, `);
            });
        content = `\`Aliases\`, ${content.substring(17, content.length - 2)}`;

        let page = [];
        let i = 0;
        readdirSync('./src/Commands')
            .forEach(dirs => {
                page[i] = new MessageEmbed()
                    .setColor(0x3399FF)
                    .setAuthor(author)
                    .setTitle(`**${dirs[0].toUpperCase() + dirs.slice(1)} aliases!**`)
                    .addField('**Pages**', content)

                if (i == 0) {
                    page[0]
                        .setTitle('**Aliases!**')
                        //.setDescription('This bot comes from a GitHub project [EnhancedMind/WelcomerBot](https://github.com/EnhancedMind/WelcomerBot).\nThe use is possible for free while keeping the credits.\n Made by EnhancedMind :heart:')
                }

                readdirSync(`./src/Commands/${dirs}`)
                    .filter(file => file.endsWith('.js'))
                    .forEach(file => {
                        const data = client.commands.get(file.substring(0, file.lastIndexOf('.')))
                        page[i].addField(`**${data.name[0].toUpperCase() + data.name.slice(1)}**`, `:wavy_dash:**\`${data.aliases.join('`**, **`')}\`**`);
                    });
                i++
            });

        paginator(message, page);
	}
});
