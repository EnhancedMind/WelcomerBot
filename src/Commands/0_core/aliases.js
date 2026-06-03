const Command = require('../../Structures/Command');

const { EmbedBuilder } = require('discord.js');
const paginator = require('../../Structures/Paginator');
const { homepage } = require('../../../package.json');


module.exports = new Command({
    name: 'aliases',
    aliases: [ 'alias' ],
    category: 'core',
    description: 'Shows the aliases for the commands',
    async run(message, args, client) {
        let page = 0;
        if (args[0] && !isNaN(args[0])) page = parseInt(args[0]) - 1;

        const categories = {};
        Array.from(client.commands.values()).forEach(cmd => {
            const cat = cmd.category || 'core';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(cmd);
        });

        const categoryOrder = ['core', 'sound', 'admin', 'owner'];

        const categoryNames = Object.keys(categories).sort((a, b) => {
            let indexA = categoryOrder.indexOf(a.toLowerCase());
            let indexB = categoryOrder.indexOf(b.toLowerCase());

            // if a category isnt listed in the hardcoded array, push it to the very end
            if (indexA === -1) indexA = Infinity;
            if (indexB === -1) indexB = Infinity;

            return indexA - indexB;
        });

        const content = '\`Aliases\`, ' + categoryNames.slice(1).map(cat => `\`${cat[0].toUpperCase() + cat.slice(1)} aliases\``).join(', ');

        const pages = [];

        categoryNames.forEach((catName, i) => {
            // chunk the commands into groups of 23, since the embed can have 25 fields, plus we need 1 for pages and 1 of first page for prefix
            const chunks = [];
            for (let i = 0; i < categories[catName].length; i += 23) {
                chunks.push(categories[catName].slice(i, i + 23));
            }

            chunks.forEach((chunk, chunkIndex) => {
                const embed = new EmbedBuilder()
                    .setColor(0x3399FF)
                    .setAuthor({
                        name: client.user.username,
                        url: homepage,
                        iconURL: client.user.displayAvatarURL({ size: 1024, dynamic: true })
                    })
                    .setTitle(`**${catName[0].toUpperCase() + catName.slice(1)} aliases!${chunks.length > 1 ? ` (${chunkIndex + 1}/${chunks.length})` : ''}**`)
                    .addFields( [ { name: '**Pages**', value: content, inline: false } ] )

                if (pages.length == 0) {
                    embed
                        .setTitle('**Aliases!**')
                }

                chunk.forEach(cmd => {
                        embed.addFields( [ { name: `**${cmd.name[0].toUpperCase() + cmd.name.slice(1)}**`, value: `> **\`${cmd.aliases.join('`**, **`')}\`**`, inline: false } ] );
                    });

                pages.push(embed);
            });
        });

        paginator(message, pages, null, page).catch(async (err) => {
            await message.channel.send('The paginator failed.');
        });
    }
});
