const Command = require('../../Structures/Command');

const { EmbedBuilder } = require('discord.js');
const { readdirSync } = require('fs');
const paginator = require('../../Structures/Paginator');
const { homepage } = require('../../../package.json');


module.exports = new Command({
	name: 'aliases',
    aliases: [ 'alias' ],
	description: 'Shows the aliases for the commands',
	async run(message, args, client) {
        const cmdDir = readdirSync('./src/Commands');

        let page = 0;
        // if args[0] is a number, set page to args[0]
		if (args[0] && !isNaN(args[0])) page = args[0] - 1;

        let content = '';
        cmdDir.forEach(dirs => {
            content = content.concat(`\`${dirs[2].toUpperCase() + dirs.slice(3)} aliases\`, `);
        });
        content = `\`Aliases\`, ${content.substring(16, content.length - 2)}`;

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
                .setTitle(`**${dirs[2].toUpperCase() + dirs.slice(3)} aliases!**`)
                .addFields( [ { name: '**Pages**', value: content, inline: false } ] )

            if (i == 0) {
                pages[0]
                    .setTitle('**Aliases!**')
            }

            readdirSync(`./src/Commands/${dirs}`)
                .filter(file => file.endsWith('.js'))
                .forEach(file => {
                    const data = client.commands.get(file.substring(0, file.lastIndexOf('.')))
                    pages[i].addFields( [ { name: `**${data.name[0].toUpperCase() + data.name.slice(1)}**`, value: `:wavy_dash:**\`${data.aliases.join('`**, **`')}\`**`, inline: false } ] );
                });
            i++
        });

        paginator(message, pages, null, page);
	}
});
