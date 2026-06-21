const Command = require('../../Structures/Command');

const { EmbedBuilder, AttachmentBuilder } = require('discord.js');

const paginator = require('../../Structures/Paginator.js');
const { bot: { prefix }, player: { allowedExtensions }, directories: {userMusicDir, everyoneMusicDir, defaultMusicDir} } = require('../../../config/config.json');
const { homepage } = require('../../../package.json');
const { getUserSoundArray, defaultDirComparison, everyoneDirComparison, userDirComparison } = require('../../Structures/musicFilesManager.js');
const path = require('path');
const { db } = require('../../Structures/dbManager.js');

const helpText = 
`This command allows you to list all the available song that can be played.

You can use the following arguments to modify this behaviour:
- \`--json\` - Puts the list into a json file and sends it as an attachent.
- \`--user @user\` or \`-u @user\` - Lists all the songs that may be played for \`user\`.
- \`--personal @user\` or \`-p @user\` - Lists all the songs in \`user\`'s library.
- \`--join\` or \`-j\` - Lists all the songs marked for use when \`user\`'s joins. (only works for --user or --personal)
- \`--leave\` or \`-l\` - Lists all the songs marked for use when \`user\`'s leaves. (only works for --user or --personal)
- \`--no-path\` or \`-P\` - Hides the file paths and only shows the file names in the output.
- \`pagenumber\` - Specify the page number to view (only works for printing in chat)
`;

module.exports = new Command({
    name: 'playable',
    aliases: [ 'pl', 'pls', 'list' ],
    category: 'sound',
    syntax: 'playable [--json] [--user/--personal [@user]] [--join] [--leave] pagenumber',
    description: `Lists all the files that can be played. Use \`${prefix}playable --json\` to get the output as JSON data.`,
    help: helpText,
    async run(message, args, client) {
        const jsonFlag = args.includes('--json')

        const page = resolvePage(message, args);
        const [ array, taggedUser, personalFlag, noPathFlag ] = await resolveUserFlag(message, args, client);

        if(array === undefined) return; // Flag had an issue

        if(array.length == 0 && taggedUser === undefined) { // User array failed
            const defaultAndEveryone = db.prepare(/*sql*/`
                SELECT * FROM files WHERE target_id IN ('default', 'everyone')
            `).all(); // file_name, file_path
            
            const users = db.prepare(/*sql*/`
                SELECT * FROM files WHERE target_id NOT IN ('default', 'everyone')
            `).all();;

            array.push(...defaultAndEveryone,...users);
        }

        if(jsonFlag) {
            await exportPlayableToJson(message, client, array, taggedUser);
        }
        else {
            printPlayable(message, client, array, taggedUser, personalFlag, page, noPathFlag);
        }
    }
});

/**
 * Find the specified page number or set it to 0
 * @param {Discord.Message<boolean> | Discord.Interaction<Discord.CacheType} message - The message with the command.
 * @param {string[]} args - The command arguments.
 * @returns {void}
 */
function resolvePage(message, args) {
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
 * Find the specified page number or set it to 0
 * @param {Discord.Message<boolean> | Discord.Interaction<Discord.CacheType} message - The message with the command.
 * @param {string[]} args - The command arguments.
 * @param {Client} client - The client instance.
 * @returns {[object[], Discord.user, boolean, boolean]} - [array with user's songs if flagged, the user, if the flag was 'personal', noPathFlag]
 */
async function resolveUserFlag(message, args, client) {
    const senderId = message.author.id;
    let userFlagIdx = args.indexOf('--user');
    if (userFlagIdx === -1) {
        userFlagIdx = args.indexOf('-u'); // Fallback to shorthand if longhand wasn't used
    }

    let personalFlagIdx = args.indexOf('--personal');
    if (personalFlagIdx === -1) {
        personalFlagIdx = args.indexOf('-p');
    }

    const leaveFlag = args.includes('--leave') || args.includes('-l');
    const joinFlag = args.includes('--join') || args.includes('-j');
    const noPathFlag = args.includes('--no-path') || args.includes('-P');
    const eventFlag = leaveFlag || joinFlag;

    if(userFlagIdx === -1 && personalFlagIdx === -1) return [ [], undefined, undefined, noPathFlag ]; // No flags => [] to list everything
    if(userFlagIdx !== -1 && personalFlagIdx !== -1) { // Use of both at the same time is invalid
        await message.channel.send({ content: `Both user and personal flags can't be triggered at the same time!`});
        return [ undefined, undefined, undefined, undefined ];
    }

    const flagIdx = (userFlagIdx !== -1) ? userFlagIdx : personalFlagIdx;
    let taggedUser = undefined;

    if (args.length > flagIdx+1) { // If the user tag has an argument
        const nextVal = (args[flagIdx+1].startsWith('-')) ? `<@${senderId}>` : args[flagIdx+1]; // If no tag, use the sender
        const mentionMatches = nextVal.match(/^<@!?([0-9]{18,19})>/); // Extract the user id

        if (!mentionMatches) {
            await message.channel.send({ content: `Invalid user argument ${nextVal}`});
            return [ undefined, undefined, undefined, undefined ];
        }
        taggedUser = mentionMatches[1];
    }
    else { // If not, just make the sender the argument
        taggedUser = senderId;
    }

    // Just user flag was triggered
    if(userFlagIdx !== -1) {
        const joinArray = (joinFlag || !eventFlag) ? await getUserSoundArray(taggedUser, 'join', message.guildId) : [];
        const leaveArray = (leaveFlag || !eventFlag) ? await getUserSoundArray(taggedUser, 'leave', message.guildId) : [];
        const array = [...joinArray,...leaveArray];
        return [ array, taggedUser, false, noPathFlag ];
    }

    //personal flag was triggered
    const array = (await getUserSoundArray(taggedUser, 'all', message.guildId)).filter(song => {return song.file_path.startsWith(userDirComparison)});
    if(eventFlag) {
        if(joinFlag) return [ array.filter(song => song.is_join), taggedUser, true, noPathFlag ];
        else if(leaveFlag) return [ array.filter(song => song.is_leave), taggedUser, true, noPathFlag ];
    }
    return [ array, taggedUser, true, noPathFlag ];
}

/**
 * Takes the array and makes it into a json file and attaches it to a message
 * @param {Discord.Message<boolean> | Discord.Interaction<Discord.CacheType} message - The message with the command.
 * @param {Client} client - The client instance.
 * @param {object[]} array - The array to jsonify.
 * @param {Discord.user|undefined} taggedUser - The user specified in the arguments (if any).
 * @returns {null}
 */
async function exportPlayableToJson(message, client, array, taggedUser) {
    const jsonString = JSON.stringify(array, null, 2);
    const buffer = Buffer.from(jsonString, 'utf-8');
    const filePrefix = (taggedUser) ? `${(await client.users.fetch(taggedUser)).globalName}_` : ''; 
    const attachment = new AttachmentBuilder(buffer, { name: `${filePrefix}soundFiles.json` });

    await message.channel.send({ content: 'Here is the JSON data:', files: [attachment] });
    return;    
}

/**
 * Takes the array and makes it into a json file and attaches it to a message
 * @param {Discord.Message<boolean> | Discord.Interaction<Discord.CacheType} message - The message with the command.
 * @param {Client} client - The client instance.
 * @param {object[]} array - The array of files to print.
 * @param {Discord.user|undefined} taggedUser - The user tagged in the arguments (if any).
 * @param {boolean} personal - If the display is of personal files.
 * @param {Number} page - Page specified to display first.
 * @param {boolean} noPathFlag - If the display should include file paths.
 * @returns {null}
 */
async function printPlayable(message, client, array, taggedUser, personal, page, noPathFlag) {
    let userCount = 0;
    let everyoneCount = 0;
    let defaultCount = 0;
    
    for(const song of array) {
        if(song.file_path.startsWith(userDirComparison)) userCount++;
        if(song.file_path.startsWith(everyoneDirComparison)) everyoneCount++;
        if(song.file_path.startsWith(defaultDirComparison)) defaultCount++;
    }

    let targetsName = "DEBUG";
    const embeds = [];
    let embedHeadline;
    
    if(personal) {
        targetsName = (await client.users.fetch(taggedUser)).globalName;
        embedHeadline = `${targetsName}'s personal files!`;
    }
    else if(taggedUser) {
        targetsName = (await client.users.fetch(taggedUser)).globalName;
        embedHeadline = `${targetsName}'s active files!`;
    }
    else {
        embedHeadline = `All playable files!`;
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
        embeds[j].addFields({
            name: `\`${array[i].file_name}\``,
            value: noPathFlag ? '' : `> \`${array[i].file_path}\``,
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
        
    if(personal) {
        embeds[0].setDescription(`**Here are all the personal files of ${targetsName}:**\n\`\`\`🎶 Personal files: ${userCount}\`\`\``);
    }
    else if(taggedUser) {
        embeds[0].setDescription(`**Here are all the files that may play for ${targetsName}:**\n\`\`\`🎶 Everyone files: ${everyoneCount}\n🎶 Default files: ${defaultCount}\n🎶 User files: ${userCount}\`\`\``);
    }
    else {
        embeds[0].setDescription(`**Here are all the files that can be played by the bot:**\n\`\`\`🎶 Everyone files: ${everyoneCount}\n🎶 Default files: ${defaultCount}\n🎶 User files: ${userCount}\`\`\``);
    }

    paginator(message, embeds, null, page).catch(async (err) => {
        await message.channel.send('The paginator failed.');
    });;
}
