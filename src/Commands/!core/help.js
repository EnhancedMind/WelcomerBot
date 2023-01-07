const Command = require('../../Structures/Command');

const { MessageEmbed } = require('discord.js');
const { readdirSync } = require('fs');
const paginator = require('../../Structures/Paginator');
const { bot: { prefix } } = require('../../../config/config.json');
const { homepage } = require('../../../package.json');

module.exports = new Command({
	name: 'help',
    aliases: [ 'h' ],
	description: 'Shows the help menu',
	async run(message, args, client) {
		let page = 0;
        // if args[0] is a number, set page to args[0]
		if (args[0] && !isNaN(args[0])) page = args[0] - 1;

        let content = '';
        readdirSync('./src/Commands')
            .forEach(dirs => {
                content = content.concat(`\`${dirs[0].toUpperCase() + dirs.slice(1)} help\`, `);
            });
        content = `\`Help\`, ${content.substring(14, content.length - 2)}`;

        let pages = [];
        let i = 0;
        readdirSync('./src/Commands')
            .forEach(dirs => {
                pages[i] = new MessageEmbed()
                    .setColor(0x3399FF)
                    .setAuthor({
                        name: client.user.username,
                        url: homepage,
                        iconURL: client.user.displayAvatarURL({ size: 1024, dynamic: true })
                    })
                    .setTitle(`**${dirs[0].toUpperCase() + dirs.slice(1)} help is here!**`)
                    .addField('**Pages**', content)

                if (i == 0) {
                    pages[0]
                        .setTitle('**Help is here!**')
                        .setDescription(`This bot comes from a GitHub project [${homepage.substring(19, homepage.length - 7)}](${homepage}).\nThe use is possible for free while keeping the credits.\n Made by EnhancedMind :heart:`)
                        .addField('**Prefix**' , `:wavy_dash:The prefix is:   **${prefix}**`)
                }

                readdirSync(`./src/Commands/${dirs}`)
                    .filter(file => file.endsWith('.js'))
                    .forEach(file => {
                        const data = client.commands.get(file.substring(0, file.lastIndexOf('.')));
                        if (data.syntax) pages[i].addField(`**${data.syntax[0].toUpperCase() + data.syntax.slice(1)}**`, `:wavy_dash:${data.description}`);
                        else pages[i].addField(`**${data.name[0].toUpperCase() + data.name.slice(1)}**`, `:wavy_dash:${data.description}`);
                    });
                i++
            });

        paginator(message, pages, null, page);
	}
});
