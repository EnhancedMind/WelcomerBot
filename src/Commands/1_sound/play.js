const Command = require('../../Structures/Command.js');

const { getVoiceConnection } = require('@discordjs/voice');
const { stat } = require('fs').promises;
const path = require('path');

const { getUserSoundFile, searchSoundFiles } = require('../../Structures/musicFilesManager.js');
const { bot: { prefix }, emoji: { success, warning, error, loading }, response: { missingArguments, noChannel, wrongChannel, afkChannel }, player: { allowedExtensions } } = require('../../../config/config.json');

const helpText =
`This command allows you to play a specific sound from the local library.
You can search for a sound by its exact file path, its exact file name, or by using a search term. If the exact file isn't found, the bot will intelligently try to find the closest match.
 
To play a sound belonging to a specific user, you can simply tag them.
Example: \`${prefix}play @user\`

You can filter your search using the following flags anywhere in your command:
- \`-j\` or \`--join\` - Strictly searches for sounds marked as "join" sounds.
- \`-l\` or \`--leave\` - Strictly searches for sounds marked as "leave" sounds.
For tagging join has priority, for fuzzy search they are additive, and useless if you use both :D.

**Search Priority & Behavior:**
If multiple files have the same name or similar search results, the bot prioritizes files in this order:
1. Your personal files
2. Other users' files
3. Everyone files
4. Default files

Examples:
\`${prefix}play epic_airhorn.mp3\` - Plays the exact file if it exists.
\`${prefix}play horn -j\` - Finds the best fuzzy match for "horn" that is also a join sound.
`;


module.exports = new Command({
	name: 'play',
    aliases: [ 'p' ],
    syntax: 'play <file/search> [flags]',
	description: `Plays a song from local storage. Tag a person to select their sound like if they were to join or place the path from the \`${prefix}playable\` command`,
    help: helpText,
	async run(message, args, client) {
        let joinFlag = false;
        let leaveFlag = false;
        const cleanedArgs = [];

        for (const arg of args) {
            if (arg == '-j' || arg == '--join') joinFlag = true;
            else if (arg == '-l' || arg == '--leave') leaveFlag = true;
            else cleanedArgs.push(arg);
        }

        args = cleanedArgs; // overwrite args with args without join and leave flags
        const searchString = args.join(' ');


        const senderVoiceChannel = message.member.voice.channel;

        if (!args[0]) return message.channel.send(`${warning} ${missingArguments}`);
        if (!senderVoiceChannel) return message.channel.send(`${warning} ${noChannel}`);
        if (senderVoiceChannel.id == message.guild.afkChannelId) return message.channel.send(`${warning} ${afkChannel}`);

        const currentConnection = getVoiceConnection(message.guild.id);
        if (currentConnection && currentConnection.joinConfig.channelId != senderVoiceChannel.id) return message.channel.send(`${warning} ${wrongChannel}`);

        const response = await message.channel.send(`${loading} Loading \`[${searchString}]\``);


        if (args[0].startsWith('<@') && args[0].endsWith('>')) {
            const userId = args[0].replace(/[<@!>]/g, '');
            const searchType = leaveFlag && !joinFlag ? 'leave' : 'join'; // aka default to join
            const file = await getUserSoundFile(client, userId, searchType);
            if (!file) {
                response.edit(`${error} \`${args[0]}\` doesn't exist.`).catch(() => {});
                return;
            }
            client.playerManager.play(client, senderVoiceChannel, { path: file.path });
            response.edit(`${success} Playing sound for **${(await client.users.fetch(userId)).globalName} - \`${file.filename}\`**`).catch(() => {});
            return;
        }


        const searchResult = searchSoundFiles({client, searchString, firstPriorityUserId: message.author.id, joinFlag, leaveFlag});
        const results = searchResult.results;

        if ( results.length == 0 || results[0].score > 0.5) {
            // check for files not in soundFiles Collection.
            const projectRoot = path.resolve('./');
            const targetPath = path.resolve(projectRoot, args[0]);
            const isSafePath = targetPath.startsWith(projectRoot);
            if (isSafePath && allowedExtensions.some(ext => args[0].endsWith(ext))) {
                try {
                    const fileStat = await stat(targetPath);
                    if (fileStat.isFile()) {
                        client.playerManager.play(client, senderVoiceChannel, { path: `./${args[0]}`});
                        response.edit(`${success} Playing **\`${args[0]}\`**`).catch(() => {});
                        return;
                    }
                }
                catch {}
            }

            response.edit(`${error} \`${searchString}\` wasn't found.`).catch(() => {});
            return;
        }

        // tie-breaker Logic
        const bestScore = results[0].score;
        const tiedResults = results.filter(r => r.score <= bestScore + 0.01); // find all results with a score extremely close to the best score
        tiedResults.sort((a, b) => a.item.priorityIndex - b.item.priorityIndex); // sort ties by priorityIndex from lowest to highest

        const finalWinner = tiedResults[0].item;

        client.playerManager.play(client, senderVoiceChannel, { path: finalWinner.path });
        response.edit(`${success} Playing **\`${finalWinner.filename}\`** (${searchResult.reason})`).catch(() => {});
    }
});
