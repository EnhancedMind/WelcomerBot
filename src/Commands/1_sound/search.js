const Command = require('../../Structures/Command');

const { EmbedBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const { parseArgs } = require('node:util');

const ButtonPrompt = require('../../Structures/ButtonPrompt.js');
const { searchSoundFiles } = require('../../Structures/musicFilesManager.js');
const PlayerManager = require('../../Structures/playerManager.js');
const { bot: { prefix }, emoji: { success, warning, error, searching }, response: { missingArguments, noChannel, wrongChannel, afkChannel } } = require('../../../config/config.json');


const emojiListSource = [ '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '❌' ];

const helpText =
`This command allows you to search for a specific sound from the local library using a search query, and returns up to 5 best results to choose from.
You can search for a sound by its exact file path, its exact file name, or by using a search term. If the exact file isn't found, the bot will intelligently try to find the closest match.

You can filter your search using the following flags anywhere in your command:
- \`-j\` or \`--join\` - Strictly searches for sounds marked as "join" sounds.
- \`-l\` or \`--leave\` - Strictly searches for sounds marked as "leave" sounds.
The flags are strict, the sound must explicitly have this attribute.

- \`-p\` or \`--path\` - Displays the file path of the search result along the file name.

**Search Priority & Behavior:**
If multiple files have the same name or similar search results, the bot prioritizes files in this order:
1. Your personal files
2. Other users' files
3. Everyone files
4. Default files

Examples:
\`${prefix}search epic_airhorn.mp3\` - Returns the exact file if it exists.
\`${prefix}search horn -j\` - Finds the best fuzzy matches for "horn" that are also join sounds.
`;


module.exports = new Command({
    name: 'search',
    aliases: [ 'sc' ],
    category: 'sound',
    syntax: 'search <query> [flags]',
    description: 'Searches sound files for a provided query.',
    help: helpText,
    async run(message, args, client) {
        const parsed = parseArgs({
            args: args,
            strict: false,
            options: {
                'join':  { type: 'boolean', short: 'j' },
                'leave': { type: 'boolean', short: 'l' },
                'path':  { type: 'boolean', short: 'p' }
            }
        });

        const joinFlag = parsed.values.join || false;
        const leaveFlag = parsed.values.leave || false;
        const pathFlag = parsed.values.path || false;

        args = parsed.positionals;
        const searchString = args.join(' ');

        const senderVoiceChannel = message.member.voice.channel;

        if (!args[0]) return await message.channel.send(`${warning} ${missingArguments}`);
        if (!senderVoiceChannel) return await message.channel.send(`${warning} ${noChannel}`);
        if (senderVoiceChannel.id == message.guild.afkChannelId) return await message.channel.send(`${warning} ${afkChannel}`);

        const currentConnection = await getVoiceConnection(message.guild.id);
        if (currentConnection && currentConnection.joinConfig.channelId != senderVoiceChannel.id) return await message.channel.send(`${warning} ${wrongChannel}`);

        const response = await message.channel.send(`${searching} Searching for \`[${searchString}]\``);

        const searchResult = searchSoundFiles({searchString, firstPriorityUserId: message.author.id, joinFlag, leaveFlag});
        const results = searchResult.results.slice(0, 5);

        if ( results.length == 0) {
            response.edit(`${error} \`${searchString}\` wasn't found.`).catch(() => {});
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(0x3399FF)
            .setTitle('Search Results');
        const buttons = [];

        for (const [index, item] of results.entries()) {
            embed.addFields({
                name: `${emojiListSource[index]} \`${item.item.file_name}\``,
                value: pathFlag ? `> \`${item.item.file_path}\`` : ''
            });

            buttons.push({
                id: `sound_select_${index}`,
                label: '',
                emoji: emojiListSource[index],
                style: 'primary'
            });
        }

        buttons.push({ id: 'cancel', label: 'Cancel', emoji: emojiListSource[emojiListSource.length - 1], style: 'danger' });

        const prompt = await ButtonPrompt.create({
            message,
            existingMessage: response,
            content: {
                content: `${success} Search results for \`${searchString}\`:`,
                embeds: [embed]
            },
            buttons,
            deferUpdate: false,
            resetTimer: false,
            timeout: 35000
        });

        if (!prompt) return;

        prompt.on('click', async (interaction, customId) => {
            if (customId === 'cancel') {
                await interaction.update({ content: `${success} Cancelled search.`, embeds: [], components: [] });
                prompt.destroy(false);
                return;
            }

            const index = parseInt(customId.replace('sound_select_', ''), 10);
            const selectedSound = results[index]?.item;

            if (selectedSound) {
                PlayerManager.play({
                    voiceChannel: senderVoiceChannel,
                    file: {
                        file_path: selectedSound.file_path,
                        source_hash: selectedSound.source_hash
                    },
                    triggerType: 'manual',
                    eventType: 'command',
                    userId: message.author.id
                });

                await interaction.update({ 
                    content: `${success} Playing **\`${selectedSound.file_name}\`** (${searchResult.reason})`, 
                    embeds: [], 
                    components: [] 
                });
            }

            prompt.destroy(false);
        });
    }
});
