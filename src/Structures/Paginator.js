const { ReactionCollector, Message, MessageEmbed } = require("discord.js");


    /**
     * 
     * @param {Message} msg (Discord.js message)
     * @param {MessageEmbed} pages (array of Discord.js MessageEmbeds)
     * @param {String} messageContent (content of the message)
     * @param {Number} page (current page)
     * @param {Array} emojiList (defaults to [ '◀️', '▶️', '⏹️' ] )
     * @param {number} timeout (default to 90 seconds)
     */
const paginator = async (msg, pages, messageContent = null, page = 0, emojiList = [ '◀️', '▶️', '⏹️' ], timeout = 90000) => {
    if (!msg && !msg.channel) throw new Error("Channel is inaccessible.");
    if (!pages) throw new Error("Pages are not given.");
    if (emojiList[0].style === "LINK" || emojiList[1].style === "LINK" || emojiList[2].style === "LINK")
        throw new Error("Link buttons are not supported'");
    if (emojiList.length !== 3) throw new Error("Need three buttons.");
  
    if (page > pages.length - 1) page = pages.length - 1;

    const curPage = await msg.channel.send({ content: messageContent, embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })] });

    let allEmoji = false;
    const react = async () => { 
        for (const emoji of emojiList) {
            curPage.react(emoji); 
            await new Promise(resolve => setTimeout(resolve, 750));
        } 
        allEmoji = true;
    }
    react();

    const filter = (reaction, user) => emojiList.includes(reaction.emoji.name) && user.bot == false;

    const collector = new ReactionCollector( curPage, { filter, time: timeout } );


    collector.on('collect', (reaction, user) => {
        if (reaction.count < 2) return;

        reaction.users.remove(user);

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
        curPage.edit({ content: messageContent, embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })] });
        collector.resetTimer();
    });

    collector.on('end', async () => {
        //wait for allEMoji to be true
		while (!allEmoji) await new Promise(resolve => setTimeout(resolve, 100));
        if (curPage.deletable) curPage.reactions.removeAll();
    });
}

module.exports = paginator;
