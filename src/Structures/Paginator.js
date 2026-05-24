const { ReactionCollector, Message, EmbedBuilder } = require("discord.js");

// based on npm package saanuregh/discord.js-pagination which is outdated
/**
 * 
 * @param {Message} msg (Discord.js message)
 * @param {EmbedBuilder} pages (array of Discord.js EmbedBuilders)
 * @param {String} messageContent (content of the message)
 * @param {Number} page (current page)
 * @param {Array} emojiList (defaults to [ '◀️', '▶️', '⏹️' ] )
 * @param {number} timeout (default to 90 seconds)
 */
const paginator = async (msg, pages, messageContent = null, page = 0, emojiList = [ '◀️', '▶️', '⏹️' ], timeout = 90000) => {
    if (!msg || !msg.channel) throw new Error("Channel is inaccessible.");
    if (!pages) throw new Error("Pages are not given.");
    if (emojiList[0].style === "LINK" || emojiList[1].style === "LINK" || emojiList[2].style === "LINK")
        throw new Error("Link buttons are not supported'");
    if (emojiList.length !== 3) throw new Error("Need three buttons.");

    page = Math.round(page);
    if (page > pages.length - 1) page = pages.length - 1;
    if (page < 0) page = 0;

    const curPage = await msg.channel.send({ content: messageContent, embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })] });
    if (pages.length == 1) return;

    const react = async () => {
        for (const emoji of emojiList) {
            curPage.react(emoji).catch(() => {});
            await new Promise(resolve => setTimeout(resolve, 750));
        } 
    }
    const allReactionsSubmittedPromise = react();

    const filter = (reaction, user) => emojiList.includes(reaction.emoji.name) && user.bot == false;

    const collector = new ReactionCollector( curPage, { filter, time: timeout } );


    collector.on('collect', async (reaction, user) => {
        if (reaction.count < 2) return;

        reaction.users.remove(user).catch(() => {});

        if (user != msg.author) return;

        switch (reaction.emoji.name) {
			case emojiList[0]:
				page = page > 0 ? --page : pages.length - 1;
				break;

			case emojiList[1]:
				page = page + 1 < pages.length ? ++page : 0;
				break;

            case emojiList[2]:
                collector.stop();
                break;
		}
        collector.resetTimer();
        curPage.edit({ content: messageContent, embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })] }).catch(() => {});
    });

    collector.on('end', async (_, reason) => {
        if (reason.endsWith('Delete')) return;
		await allReactionsSubmittedPromise;
        curPage.reactions.removeAll().catch(() => {});
    });
}

module.exports = paginator;
