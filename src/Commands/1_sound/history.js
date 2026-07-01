const Command = require('../../Structures/Command');

const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { parseArgs } = require('node:util');

const paginator = require('../../Structures/Paginator.js');
const { bot: { prefix } } = require('../../../config/config.json');
const { homepage } = require('../../../package.json');
const { db } = require('../../Structures/dbManager.js');
const { consoleLog } = require('../../Data/Log.js');

const helpText = `
This command displays the history of the sounds that have been played.
Displayed entries are limited to the server the command is used in.

You can use the following arguments to modify this behaviour:
- \`--json\` - Puts the list into a json file and sends it as an attachent.
- \`--user @user\` or \`-u @user\` - Lists the history for the user. Has priority over --personal arg.
- \`--personal\` or \`-p\` - Lists the history for your user.
- \`--join\` or \`-j\` - Lists the entries with join event type.
- \`--leave\` or \`-l\` - Lists the entries with leave event type.
- \`--command\` or \`-c\` - Lists the entries with command event type.
- \`--automated\` or \`-a\` - Lists the entries with automated trigger type.
- \`--manual\` or \`-m\` - Lists the entries with manual trigger type.
- \`--limit\` or \`-n\` - How many entries to include in the list.
- \`--path\` - Display file paths instead of file names (only works for printing in chat). 
- \`pagenumber\` - Specify the page number to view (only works for printing in chat).

All the arguments are additive and can be used at the same time.
`;

module.exports = new Command({
    name: 'history',
    aliases: [ 'his' ],
    category: 'sound',
    syntax: 'history <flags> pagenumber',
    description: `Displays the history of played sounds. Can be filtered, for more use \`${prefix}history --help\``,
    help: helpText,
    async run(message, args, client) {
        const page = resolvePage(args);

        const [ array, taggedUser, flags ] = await getHistoryEntries(message, args);

        if(array === undefined) return await message.channel.send('There was an error when obtaining data from database.');

        if(array.length == 0) return await message.channel.send('No entries found.');

        if(flags.json) {
            await exportPlayableToJson(message, client, array, taggedUser);
        }
        else {
            printPlayable(message, client, array, taggedUser, flags, page);
        }
    }
});

/**
 * Find the specified page number or set it to 0
 * @param {string[]} args - The command arguments.
 * @returns {number} - The extracted page number
 */
function resolvePage(args) {
    let page = 0;
    for(const arg of args) {
        if(/^\d+$/.test(arg)) {
            page = parseInt(arg);
        }
    }

    if (isNaN(page)) {
        page = 0;
    }

    return page-1;
}

/**
 * Get the history entries, with filters from args
 * @param {Discord.Message<boolean>} message - The message with the command.
 * @param {string[]} args - The command arguments.
 * @returns {[object[], Discord.user, string|boolean[]]} - [array with history entries, the tagged user, array of flag values]
 */
async function getHistoryEntries(message, args) {
    const parsed = parseArgs({
        args: args,
        strict: false, // Essential for dynamic handling
        options: {
            'user': { type: 'string', short: 'u' },
            'personal': { type: 'boolean', short: 'p' },
            // event type
            'join': { type: 'boolean', short: 'j' },
            'leave': { type: 'boolean', short: 'l' },
            'command': { type: 'boolean', short: 'c' },
            // trigger type
            'automated': { type: 'boolean', short: 'a' },
            'manual': { type: 'boolean', short: 'm' },
            // limits
            'limit': { type: 'string', short: 'n' },
            // other
            'json': { type: 'boolean' },
            'path': { type: 'boolean' },
        }
    });

    const flags = parsed.values;

    let userId = null
    if (flags.user) {
        const mentionMatch = flags.user.match((/^<@!?([0-9]{18,19})>/));
        if (mentionMatch) userId = mentionMatch[1];
        else {
            const userIdMatch = flags.user.match((/^([0-9]{18,19})/));
            if (userIdMatch) userId = userIdMatch[1];
        }
    }
    else if (flags.personal) {
        userId = message.author.id;
    }

    const eventTypes = [];
    if (flags.join) eventTypes.push('join');
    if (flags.leave) eventTypes.push('leave');
    if (flags.command) eventTypes.push('command');

    const triggerTypes = [];
    if (flags.automated) triggerTypes.push('automated');
    if (flags.manual) triggerTypes.push('manual');

    const limit = flags.limit ? parseInt(flags.limit, 10) : 8 * 15;

    // baseline: always restrict history to the current guild
    let sql = `SELECT * FROM playback_history WHERE guild_id = ?`;
    const params = [ message.guild.id ];


    if (userId) {
        sql += ` AND user_id = ?`;
        params.push(userId);
    }

    if (eventTypes.length > 0) {
        // creates string like: AND event_type IN (?, ?)
        const placeholders = eventTypes.map(() => '?').join(', ');
        sql += ` AND event_type IN (${placeholders})`;
        params.push(...eventTypes);
    }

    if (triggerTypes.length > 0) {
        const placeholders = triggerTypes.map(() => '?').join(', ');
        sql += ` AND trigger_type IN (${placeholders})`;
        params.push(...triggerTypes);
    }

    // sort newest first, apply limit
    sql += ` ORDER BY played_at DESC LIMIT ?`;
    params.push(limit);


    try {
        const statement = db.prepare(sql);
        const historyRows = statement.all(...params);

        return [ historyRows, userId, flags ];
    }
    catch (err) {
        consoleLog('[INFO] Database Query Failed:', err);
        return [ undefined, undefined, flags ];
    }
}

/**
 * Takes the array and makes it into a json file and attaches it to a message
 * @param {Discord.Message<boolean>} message - The message with the command.
 * @param {Client} client - The client instance.
 * @param {object[]} array - The array to jsonify.
 * @param {Discord.user|undefined} taggedUser - The user specified in the arguments (if any).
 * @returns {null}
 */
async function exportPlayableToJson(message, client, array, taggedUser) {
    const jsonString = JSON.stringify(array, null, 2);
    const buffer = Buffer.from(jsonString, 'utf-8');
    const filePrefix = (taggedUser) ? `${(await client.users.fetch(taggedUser)).globalName}_` : ''; 
    const attachment = new AttachmentBuilder(buffer, { name: `${filePrefix}history.json` });

    await message.channel.send({ content: 'Here is the JSON data:', files: [attachment] });
    return;    
}

/**
 * Takes the array and makes it into a embed and sends it with paginator
 * @param {Discord.Message<boolean> | Discord.Interaction<Discord.CacheType} message - The message with the command.
 * @param {Client} client - The client instance.
 * @param {object[]} array - The array of files to print.
 * @param {Discord.user|undefined} taggedUser - The user tagged in the arguments (if any).
 * @param {string|boolean[]} flags - The args flags values array.
 * @param {Number} page - Page specified to display first.
 * @returns {null}
 */
async function printPlayable(message, client, array, taggedUser, flags, page) {
    let targetsName = "DEBUG";
    const embeds = [];
    let embedHeadline;
    
    if(taggedUser) {
        targetsName = (await client.users.fetch(taggedUser)).globalName;
        embedHeadline = `${targetsName}'s playback history!`;
    }
    else {
        embedHeadline = `Playback history!`;
    }

    let j = -1;
    for (let i = 0; i < array.length; i++) {
        if (i % 15 == 0) {
            j++;
            embeds[j] = new EmbedBuilder()
                .setColor(0x3399FF)
                .setAuthor({
                    name: embedHeadline,
                    url: homepage,
                    iconURL: client.user.displayAvatarURL({ size: 1024, dynamic: true })
                });
        }
        try {
            const triggerTypeText = array[i].trigger_type[0].toUpperCase() + array[i].trigger_type.substring(1);
            const eventTypeText = array[i].event_type[0].toUpperCase() + array[i].event_type.substring(1);
            const userGlobalName = taggedUser ? '' : ` - ${(await client.users.fetch(array[i].user_id)).globalName}`;
            embeds[j].addFields({
                name: `<t:${array[i].played_at}:f> [${triggerTypeText} ${eventTypeText}]${userGlobalName}`,
                value: `> \`${flags.path ? array[i].file_path_snapshot : array[i].file_name_snapshot}\``,
            });
        }
        catch (err) {
            consoleLog(`[ERROR] Error adding history embed field: `, err);
        }
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

    if(taggedUser) {
        embeds[0].setDescription(`**Here is playback history for ${targetsName} in this server:**`);
    }
    else {
        embeds[0].setDescription(`**Here is playback history for this server:**`);
    }

    paginator(message, embeds, null, page).catch(async (err) => {
        await message.channel.send('The paginator failed.');
    });;
}
