const Command = require('../../Structures/Command.js');

const { MessageEmbed } = require('discord.js');
const { readdirSync } = require('fs');
const paginator = require('../../Structures/Paginator.js');
const { prefix } = require('../../Data/data.js');

module.exports = new Command({
	name: 'help',
    aliases: ['h'],
	description: 'Shows the help menu',
	async run(message, args, client) {
        const author = {
            name: client.user.username,
            url: 'https://github.com/EnhancedMind/WelcomerBot',
            iconURL: client.user.displayAvatarURL({ size: 1024, dynamic: true })
        }

        let content = '';
        readdirSync('./src/Commands')
            .forEach(dirs => {
                content = content.concat(`\`${dirs[0].toUpperCase() + dirs.slice(1)} help\`, `);
            });
        content = `\`Help\`, ${content.substring(14, content.length - 2)}`;

        let page = [];
        let i = 0;
        readdirSync('./src/Commands')
            .forEach(dirs => {
                page[i] = new MessageEmbed()
                    .setColor(0x3399FF)
                    .setAuthor(author)
                    .setTitle(`**${dirs[0].toUpperCase() + dirs.slice(1)} help is here!**`)
                    .addField('**Pages**', content)

                if (i == 0) {
                    page[0]
                        .setTitle('**Help is here!**')
                        .setDescription('This bot comes from a GitHub project [EnhancedMind/WelcomerBot](https://github.com/EnhancedMind/WelcomerBot).\nThe use is possible for free while keeping the credits.\n Made by EnhancedMind :heart:')
                        .addField('**Prefix**' , `:wavy_dash:The prefix is:   **${prefix}**`)
                }

                readdirSync(`./src/Commands/${dirs}`)
                    .filter(file => file.endsWith('.js'))
                    .forEach(file => {
                        const data = client.commands.get(file.substring(0, file.lastIndexOf('.')))
                        if (data.syntax) page[i].addField(`**${data.syntax[0].toUpperCase() + data.syntax.slice(1)}**`, `:wavy_dash:${data.description}`);
                        else page[i].addField(`**${data.name[0].toUpperCase() + data.name.slice(1)}**`, `:wavy_dash:${data.description}`);
                    });
                i++
            });

        paginator(message, page);
	}
});
