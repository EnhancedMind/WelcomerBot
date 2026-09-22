const Command = require('../../Structures/Command');

const { EmbedBuilder } = require('discord.js');
const { parseArgs } = require('node:util');

const Paginator = require('../../Structures/Paginator.js');
const { homepage } = require('../../../package.json');
const { getUserSoundArray, findProbabilities  } = require('../../Structures/musicFilesManager.js');
const { extractUserId, extractPageNumber } = require('../../utils/discordUtils.js');

const helpText = 
`This command allows you to show the users songs along with the probability of each song playing.

You can use the following arguments to modify this behaviour:
- \`--user @user\` or \`-u @user\` - Lists the songs that may be played for \`user\`.
- \`--join\` or \`-j\` - Lists the songs marked for use when \`user\`'s joins.
- \`--leave\` or \`-l\` - Lists the songs marked for use when \`user\`'s leaves.
- \`pagenumber\` - Specify the page number to view (only works for printing in chat)
`;

module.exports = new Command({
    name: 'probability',
    aliases: [ 'prob', 'pr' ],
    category: 'sound',
    syntax: 'probability [--user [@user]] [--join] [--leave]',
    description: `Lists the probability of each song playing for the sender or specified user for either joining or leaving.`,
    help: helpText,
    async run(message, args, client) {
        const [taggedUser, joinFlag, leaveFlag, page] = await resolveFlags(message, args);
        if (taggedUser === undefined) return; // Nonexistent user tagged
        const [array, probabilities, sums, joinCount] = getSoundsWithProbabilities(taggedUser, joinFlag, leaveFlag, message.guildId);
        await printProbability(message, client, array, probabilities, sums, joinCount, taggedUser, page);
    }
});

/**
 * Finds the potential tagged user and join/leave flags in the arguments and returns them.
 * @param {Discord.Message<boolean> | Discord.Interaction<Discord.CacheType} message - The message with the command.
 * @param {string[]} args - The command arguments.
 * @returns {[ [Object[], Object[]], Discord.user, [ [float[],float], [float[],float] ] ]} - [array with user's songs if flagged, the user, the probabilities for each song]
 */
async function resolveFlags(message, args) {
    const senderId = message.author.id;

    const parsed = parseArgs({
        args: args,
        strict: false,
        options: {
            'user': { type: 'string', short: 'u' },
            'join': { type: 'boolean', short: 'j' },
            'leave': { type: 'boolean', short: 'l' },
        }
    });

    const flags = parsed.values;

    const [ page ] = extractPageNumber(parsed.positionals);

    let taggedUser = senderId;

    if (flags.user) {
        taggedUser = extractUserId(flags.user)[0];

        if (!taggedUser) {
            await message.channel.send({ content: `Invalid user argument ${flags.user}`});
            return [undefined, undefined, undefined, page];
        }
    }

    return [taggedUser, flags.join, flags.leave, page];
}


/**
 * Finds the potential tagged user and join/leave flags in the arguments and returns them.
 * @param {string} taggedUser - The user tagged in the arguments (or the sender).
 * @param {boolean} joinFlag - Whether the join flag was triggered.
 * @param {boolean} leaveFlag - Whether the leave flag was triggered.
 * @param {string} guildId - The server (guild id) to get the songs for.
 * @returns {[ Object[], Object[], [float, float], int ] ]} - [array with user's songs, array with corresponding probabilities, sums for join and leave, selfexplanatory]
 */
function getSoundsWithProbabilities(taggedUser, joinFlag, leaveFlag, guildId) {
    const eventFlag = joinFlag || leaveFlag;

    const [joinArray, joinProbabilities, joinSum] = (joinFlag || !eventFlag) ? _getSoundsWithProbabilities(taggedUser, 'join', guildId) : [[],[]];
    const [leaveArray, leaveProbabilities, leaveSum] = (leaveFlag || !eventFlag) ? _getSoundsWithProbabilities(taggedUser, 'leave', guildId) : [[],[]];

    const array = [...joinArray,...leaveArray];
    const probabilities = [...joinProbabilities,...leaveProbabilities];
    const sums = [joinSum, leaveSum];
    return [array, probabilities, sums, joinArray.length];
}

/**
 * Finds the potential tagged user and join/leave flags in the arguments and returns them.
 * @param {string} taggedUser - The user tagged in the arguments (or the sender).
 * @param {string} type - The type of sounds to retrieve ('join' or 'leave').
 * @param {string} guildId - The server (guild id) to get the songs for.
 * @returns {[ Object[], Object[], float ] ]} - [array with user's songs if flagged, the user, the probabilities for each song]
 */
function _getSoundsWithProbabilities(taggedUser, type, guildId) {
    const array = getUserSoundArray(taggedUser, type, guildId);
    const [probabilities,sum] = findProbabilities(array);
    const realProbabilities = probabilities.map(prob => prob/sum);

    const filteredArray = [];
    const filteredProbabilities = [];
    
    for(let i = 0; i < array.length; i++) {
        if(realProbabilities[i] > 0) {
            filteredArray.push(array[i]);
            filteredProbabilities.push(realProbabilities[i]);
        }
    }
    return [filteredArray, filteredProbabilities, sum];
}

/**
 * Takes the array and makes it into a json file and attaches it to a message
 * @param {Discord.Message<boolean> | Discord.Interaction<Discord.CacheType} message - The message with the command.
 * @param {Client} client - The client instance.
 * @param {object[]} array - The array of files to print.
 * @param {object[]} probabilities - The array of corresponding probabilities.
 * @param {int[]} [sums] - [sumOfJoinProbabilities, sumOfLeaveProbabilities].
 * @param {int} joinCount - The amount of join files in the array (used for formatting reasons).
 * @param {Discord.user|undefined} taggedUser - The user tagged in the arguments (or the sender).
 * @returns {null}
 */
async function printProbability(message, client, array, probabilities, [joinSum, leaveSum], joinCount, taggedUser, page) {
    const embeds = [];
    const targetName = (await client.users.fetch(taggedUser)).globalName;

    let j = -1;
    for (let i = 0; i < array.length; i++) {
        if (i % 15 == 0) {
            j++;
            embeds[j] = new EmbedBuilder()
                .setColor(0x3399FF)
                .setAuthor({
                    name: `${targetName}'s songs!`,
                    url: homepage,
                    iconURL: client.user.displayAvatarURL({ size: 1024, dynamic: true })
                });
        }
        //const sum = (i < joinCount) ? joinSum : leaveSum; // this var was left here unused, probably by gavkoCZ
        const origin = array[i].chance_origin ? array[i].chance_origin.replaceAll('_', '\\_') : 'Defined by the remainder';
        embeds[j].addFields({
            name: `\`${array[i].file_name}\``,
            value: `${(i < joinCount) ? 'Join' : 'Leave'} probability: **${ (probabilities[i]*100).toFixed(2) }%** - (Reason: ${origin})`,
        });
    }

    if(embeds.length === 0) {
        embeds[0] = new EmbedBuilder()
        .setColor(0x3399FF)
        .setAuthor({
            name: `${targetName}'s songs!`,
            url: homepage,
            iconURL: client.user.displayAvatarURL({ size: 1024, dynamic: true })
        });
    }
        
    embeds[0].setDescription(`**Here are the probabilities for ${targetName}:**`);

    Paginator.create({
        message,
        pages: embeds,
        page
    });
}
