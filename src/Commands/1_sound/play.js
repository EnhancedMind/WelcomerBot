const Command = require('../../Structures/Command.js');

const { getVoiceConnection } = require('@discordjs/voice');
const { stat } = require('fs/promises');
const path = require('path');
const { parseArgs } = require('node:util');

const { getUserSoundFile, searchSoundFiles } = require('../../Structures/musicFilesManager.js');
const { bot: { prefix }, emoji: { success, warning, error, loading }, response: { missingArguments, noChannel, wrongChannel, afkChannel }, player: { allowedExtensions } } = require('../../../config/config.json');

const helpText =
`This command allows you to play a specific sound from the local library.
You can search for a sound by its exact file path, its exact file name, or by using a search term. If the exact file isn't found, the bot will intelligently try to find the closest match.
 
To play a sound belonging to a specific user, you can simply tag them, or for yourself, use the \`-m\` or \`--me\` flag.
Example: \`${prefix}play @user\` or \`${prefix}play --me\`

You can filter your search using the following flags anywhere in your command:
- \`-j\` or \`--join\` - Strictly searches for sounds marked as "join" sounds.
- \`-l\` or \`--leave\` - Strictly searches for sounds marked as "leave" sounds.
For tagging join has priority, for fuzzy search they are strict, the sound must explicitly have this attribute.

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
	category: 'sound',
    syntax: 'play <file/search> [flags]',
	description: `Plays a song from local storage. Tag a person to select their sound like if they were to join or place the path from the \`${prefix}playable\` command`,
    help: helpText,
	async run(message, args, client) {
        const parsed = parseArgs({
            args: args,
            strict: false,
            options: {
                'join':  { type: 'boolean', short: 'j' },
                'leave': { type: 'boolean', short: 'l' },
                'me':    { type: 'boolean', short: 'm' }
            }
        });

        const joinFlag = parsed.values.join || false;
        const leaveFlag = parsed.values.leave || false;
        let userIdArg = parsed.values.me ? message.author.id : null;
        args = parsed.positionals;

        for (const arg of args) {
            if (userIdArg) break;
            if (arg.startsWith('<@') && arg.endsWith('>')) userIdArg = arg.replace(/[<@!>]/g, '');
        }

        let userGlobalName = null;
        if (userIdArg) userGlobalName = (await client.users.fetch(userIdArg)).globalName || (await client.users.fetch(userIdArg)).username;

        const searchString = args.join(' ');
        const searchStringMessage = userGlobalName ? `Sound for ${userGlobalName}` : `\`[${args.join(' ')}]\``;


        const senderVoiceChannel = message.member.voice.channel;

        if (!args[0] && !userIdArg) return await message.channel.send(`${warning} ${missingArguments}`);
        if (!senderVoiceChannel) return await message.channel.send(`${warning} ${noChannel}`);
        if (senderVoiceChannel.id == message.guild.afkChannelId) return await message.channel.send(`${warning} ${afkChannel}`);

        const currentConnection = getVoiceConnection(message.guild.id);
        if (currentConnection && currentConnection.joinConfig.channelId != senderVoiceChannel.id) return await message.channel.send(`${warning} ${wrongChannel}`);

        const response = await message.channel.send(`${loading} Loading ${searchStringMessage}`);


        if (userIdArg) {
            const searchType = leaveFlag && !joinFlag ? 'leave' : 'join'; // aka default to join
            const file = await getUserSoundFile(client, userIdArg, searchType);
            if (!file) {
                response.edit(`${error} ${searchStringMessage} wasn't found.`).catch(() => {});
                return;
            }
            client.playerManager.play(client, senderVoiceChannel, { path: file.path });
            response.edit(`${success} Playing sound for **${userGlobalName} - \`${file.filename}\`**`).catch(() => {});
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

            response.edit(`${error} ${searchStringMessage} wasn't found.`).catch(() => {});
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
