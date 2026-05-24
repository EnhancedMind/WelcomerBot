const Command = require('../../Structures/Command');

const { EmbedBuilder, AttachmentBuilder } = require('discord.js');

const paginator = require('../../Structures/Paginator.js');
const { bot: { prefix }, player: { allowedExtensions }, directories: {userMusicDir, everyoneMusicDir, defaultMusicDir} } = require('../../../config/config.json');
const { homepage } = require('../../../package.json');
const { getUserSoundArray, findProbabilities, defaultDirComparison, everyoneDirComparison, userDirComparison } = require('../../Structures/musicFilesManager.js');
const path = require('path');

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
    syntax: 'probability [--user [@user]] [--join] [--leave]',
    description: `Lists the probability of each song playing for the sender or specified user for either joining or leaving.`,
    help: helpText,
    async run(message, args, client) {
        const [taggedUser, joinFlag, leaveFlag] = resolveFlags(message, args, client);
        if(taggedUser === undefined) return; // Nonexistent user tagged
        const [array, probabilities, sums, joinCount] = await getSoundsWithProbabilities(client, taggedUser, joinFlag, leaveFlag, message.guildId);
        printProbability(message, client, array, probabilities, sums, joinCount, taggedUser);
    }
});

/**
 * Finds the potential tagged user and join/leave flags in the arguments and returns them.
 * @param {Discord.Message<boolean> | Discord.Interaction<Discord.CacheType} message - The message with the command.
 * @param {string[]} args - The command arguments.
 * @param {Client} client - The client instance.
 * @returns {[ [Object[], Object[]], Discord.user, [ [float[],float], [float[],float] ] ]} - [array with user's songs if flagged, the user, the probabilities for each song]
 */
function resolveFlags(message, args, client) {
    const senderId = message.author.id;
    let userFlagIdx = args.indexOf('--user');
    if (userFlagIdx === -1) {
        userFlagIdx = args.indexOf('-u'); // Fallback to shorthand if longhand wasn't used
    }

    const joinFlag = args.includes('--join') || args.includes('-j');
    const leaveFlag = args.includes('--leave') || args.includes('-l');

    let taggedUser = undefined;

    if (args.length > userFlagIdx+1) { // If the user tag has an argument
        const nextVal = (args[userFlagIdx+1].startsWith('-')) ? `<@${senderId}>` : args[userFlagIdx+1]; // If no tag, use the sender
        const mentionMatches = nextVal.match(/^<@([0-9]{18,19})>/); // Extract the user id

        if (!mentionMatches) {
            message.channel.send({ content: `Invalid user argument ${nextVal}`});
            return [undefined, undefined, undefined];
        }
        taggedUser = mentionMatches[1];
    }
    else { // If not, just make the sender the argument
        taggedUser = senderId;
    }

    return [taggedUser, joinFlag, leaveFlag];
}


/**
 * Finds the potential tagged user and join/leave flags in the arguments and returns them.
 * @param {Client} client - The client instance.
 * @param {string} taggedUser - The user tagged in the arguments (or the sender).
 * @param {boolean} joinFlag - Whether the join flag was triggered.
 * @param {boolean} leaveFlag - Whether the leave flag was triggered.
 * @param {string} guildId - The server (guild id) to get the songs for.
 * @returns {[ Object[], Object[], [float, float], int ] ]} - [array with user's songs, array with corresponding probabilities, sums for join and leave, selfexplanatory]
 */
async function getSoundsWithProbabilities(client, taggedUser, joinFlag, leaveFlag, guildId) {
    const eventFlag = joinFlag || leaveFlag;

    const [joinArray, joinProbabilities, joinSum] = (joinFlag || !eventFlag) ? await _getSoundsWithProbabilities(client, taggedUser, 'join', guildId) : [[],[]];
    const [leaveArray, leaveProbabilities, leaveSum] = (leaveFlag || !eventFlag) ? await _getSoundsWithProbabilities(client, taggedUser, 'leave', guildId) : [[],[]];

    const array = [...joinArray,...leaveArray];
    const probabilities = [...joinProbabilities,...leaveProbabilities];
    const sums = [joinSum, leaveSum];
    return [array, probabilities, sums, joinArray.length];
}

/**
 * Finds the potential tagged user and join/leave flags in the arguments and returns them.
 * @param {Client} client - The client instance.
 * @param {string} taggedUser - The user tagged in the arguments (or the sender).
 * @param {string} type - The type of sounds to retrieve ('join' or 'leave').
 * @param {string} guildId - The server (guild id) to get the songs for.
 * @returns {[ Object[], Object[], float ] ]} - [array with user's songs if flagged, the user, the probabilities for each song]
 */
async function _getSoundsWithProbabilities(client, taggedUser, type, guildId) {
    const array = await getUserSoundArray(client, taggedUser, type, guildId);
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
async function printProbability(message, client, array, probabilities, [joinSum, leaveSum], joinCount, taggedUser) {
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
        const sum = (i < joinCount) ? joinSum : leaveSum;
        const origin = array[i].chanceOrigin ? array[i].chanceOrigin : 'Defined by the remainder';
        embeds[j].addFields({
            name: `\`${array[i].filename}\``,
            value: `${(i < joinCount) ? 'Join' : 'Leave'} probability: ${ (probabilities[i]*100).toFixed(2) }% - (Reason: ${origin})`,
        });
    }

    if(embeds.length === 0) {
        embeds[0] = new EmbedBuilder()
        .setColor(0x3399FF)
        .setAuthor({
            name: embedHeadline,
            url: homepage,
            iconURL: client.user.displayAvatarURL({ size: 1024, dynamic: true })
        });
    }
        
    embeds[0].setDescription(`**Here are the probabilities for ${targetName}:**`);

    paginator(message, embeds, null, 0);
}
