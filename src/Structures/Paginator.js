const { ReactionCollector, Message, MessageEmbed } = require("discord.js");

    /**
     * 
     * @param {Message} msg (Discord.js message)
     * @param {MessageEmbed} pages (array of Discord.js MessageEmbeds)
     * @param {Array} emojiList (defaults to [ '◀️', '▶️', '⏹️' ] )
     * @param {number} timeout (default to 90 seconds)
     */
const paginator = async (msg, pages, emojiList = [ '◀️', '▶️', '⏹️' ], timeout = 90000) => {
    if (!msg && !msg.channel) throw new Error("Channel is inaccessible.");
    if (!pages) throw new Error("Pages are not given.");
    if (emojiList[0].style === "LINK" || emojiList[1].style === "LINK" || emojiList[2].style === "LINK")
        throw new Error("Link buttons are not supported'");
    if (emojiList.length !== 3) throw new Error("Need three buttons.");
  
    let page = 0;

    const curPage = await msg.channel.send({ embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })] });

    for (const emoji of emojiList) curPage.react(emoji);

    const filter = () => [ emojiList[0] || emojiList[1] || emojiList[2] ];

    const collector = new ReactionCollector( curPage, { filter, time: timeout } );


    collector.on('collect', async (reaction) => {
        if(reaction.count < 2) return;

        reaction.users.remove(msg.author);

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

			default:
				break;
		}
        curPage.edit({ embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })] });
        collector.resetTimer();
    });

    collector.on('end', async () => {
        if (curPage.deletable) {
			curPage.reactions.removeAll();
		}
    });
}

module.exports = paginator;
