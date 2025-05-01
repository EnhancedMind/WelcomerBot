const Command = require('../../Structures/Command');

const { EmbedBuilder } = require('discord.js');
const { readdirSync } = require('fs');
const paginator = require('../../Structures/Paginator');
const { bot: { prefix } } = require('../../../config/config.json');
const { homepage } = require('../../../package.json');


module.exports = new Command({
	name: 'help',
    aliases: [ 'h' ],
	description: 'Shows the help menu',
	async run(message, args, client) {
        const cmdDir = readdirSync('./src/Commands');

		let page = 0;
        // if args[0] is a number, set page to args[0]
		if (args[0] && !isNaN(args[0])) page = args[0] - 1;

        let content = '';
        cmdDir.forEach(dirs => {
            content = content.concat(`\`${dirs[2].toUpperCase() + dirs.slice(3)} help\`, `);
        });
        content = `\`Help\`, ${content.substring(13, content.length - 2)}`;

        let pages = [];
        let i = 0;
        cmdDir.forEach(dirs => {
            pages[i] = new EmbedBuilder()
                .setColor(0x3399FF)
                .setAuthor({
                    name: client.user.username,
                    url: homepage,
                    iconURL: client.user.displayAvatarURL({ size: 1024, dynamic: true })
                })
                .setTitle(`**${dirs[2].toUpperCase() + dirs.slice(3)} help is here!**`)
                .addFields( [ { name: '**Pages**', value: content, inline: false } ] )

            if (i == 0) {
                pages[0]
                    .setTitle('**Help is here!**')
                    .setDescription(`This bot comes from a GitHub project [${homepage.substring(19, homepage.length - 7)}](${homepage}).\nThe use is possible for free while keeping the credits.\n Made by EnhancedMind :heart:`)
                    .addFields( [ { name: '**Prefix**', value: `:wavy_dash:The prefix is:   **${prefix}**`, inline: false } ] )
            }

            readdirSync(`./src/Commands/${dirs}`)
                .filter(file => file.endsWith('.js'))
                .forEach(file => {
                    const data = client.commands.get(file.substring(0, file.lastIndexOf('.')));
                    if (data.syntax) pages[i].addFields( [ { name: `**${data.syntax[0].toUpperCase() + data.syntax.slice(1)}**`, value: `:wavy_dash:${data.description}`, inline: false } ] );
                    else pages[i].addFields( [ { name: `**${data.name[0].toUpperCase() + data.name.slice(1)}**`, value: `:wavy_dash:${data.description}`, inline: false } ] );
                });
            i++
        });

        paginator(message, pages, null, page);
	}
});
