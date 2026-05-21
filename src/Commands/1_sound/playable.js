const Command = require('../../Structures/Command');

const { EmbedBuilder, AttachmentBuilder } = require('discord.js');

const paginator = require('../../Structures/Paginator.js');
const { bot: { prefix }, player: { allowedExtensions }, directories: {userMusicDir, everyoneMusicDir, defaultMusicDir} } = require('../../../config/config.json');
const { homepage } = require('../../../package.json');
const { getUserSoundArray, defaultDirComparison, everyoneDirComparison, userDirComparison } = require('../../Structures/musicFilesManager.js');
const path = require('path');

const helpText = 
`This command allows you to list all the available song that can be played.

You can use the following arguments to modify this behaviour:
- \`--json\` - Puts the list into a json file and sends it as an attachent.
- \`--user @user\` or \`-u @user\` - Lists all the songs that may be played for \`user\`.
- \`--personal @user\` or \`-p @user\` - Lists all the songs in \`user\`'s library.
`;

module.exports = new Command({
	name: 'playable',
	aliases: [ 'pl', 'pls' ],
	description: `Lists all the files that can be played. Use \`${prefix}playable --json\` to get the output as JSON data.`,
	help: helpText,
	async run(message, args, client) {
		const jsonFlag = args.includes('--json')

		const page = resolvePage(message, args);
		const [array, taggedUser, personalFlag] = resolveUserFlag(message.author.id, args, client);

		if(array === undefined) return; // Flag had an issue

		if(array.length == 0 && taggedUser === undefined) { // User array failed
			const defaultAndEveryone = [];
			const users = [];

			// Put everyone and default before user sounds
			for(const [key, value] of client.soundFiles) { 
				if(key == 'default' || key == 'everyone') {
					defaultAndEveryone.push(...value);
				}
				else {
					users.push(...value);
				}
			}
			array.push(...defaultAndEveryone,...users);
		}

		if(jsonFlag) {
			exportPlayableToJson(message, client, array, taggedUser);
		}
		else {
			printPlayable(message, client, array, taggedUser, personalFlag, page);
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
		console.log(`User ${message.author.globalName} entered an invalid page argument`)
		page = 0;
	}

	return page-1;
}

/**
 * Find the specified page number or set it to 0
 * @param {Discord.Message<boolean> | Discord.Interaction<Discord.CacheType} message - The message with the command.
 * @param {string[]} args - The command arguments.
 * @returns {[object[], Discord.user, boolean]} - [array with user's songs if flagged, the user, if the flag was 'personal']
 */
function resolveUserFlag(senderId, args, client) {
	let userFlagIdx = args.indexOf('--user');
	if (userFlagIdx === -1) {
		userFlagIdx = args.indexOf('-u'); // Fallback to shorthand if longhand wasn't used
	}

	let personalFlagIdx = args.indexOf('--personal');
	if (personalFlagIdx === -1) {
		personalFlagIdx = args.indexOf('-p');
	}

	if(userFlagIdx === -1 && personalFlagIdx === -1) return [[],undefined, undefined]; // No flags => [] to list everything
	if(userFlagIdx !== -1 && personalFlagIdx !== -1) { // Use of both at the same time is invalid
		message.channel.send({ content: `Both user and personal flags can't be triggered at the same time!`});
		return [undefined, undefined, undefined];
	}

	const flagIdx = (userFlagIdx !== -1) ? userFlagIdx : personalFlagIdx;
	let taggedUser = undefined;

	if (args.length > flagIdx+1) { // If the user tag has an argument
		const nextVal = (args[flagIdx+1].startsWith('-')) ? `<@${senderId}>` : args[flagIdx+1]; // If no tag, use the sender
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

	// Just user flag was triggered
	if(userFlagIdx !== -1) {
		const array = [...getUserSoundArray(client, taggedUser,'join'),...getUserSoundArray(client, taggedUser,'leave')];
		return [array, taggedUser, false];
	}
	//personal flag was triggered
	const array = getUserSoundArray(client, taggedUser,'all').filter(song => {return song.path.startsWith(userDirComparison)});
	return [array, taggedUser, true];
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

	message.channel.send({ content: 'Here is the JSON data:', files: [attachment] });
	return;	
}

/**
 * Takes the array and makes it into a json file and attaches it to a message
 * @param {Discord.Message<boolean> | Discord.Interaction<Discord.CacheType} message - The message with the command.
 * @param {Client} client - The client instance.
 * @param {object[]} array - The array of files to print.
 * @param {Discord.user|undefined} taggedUser - The user tagged in the arguments (if any).
 * @param {boolean} personal - If the display is of personal files.
 * @param {boolean} page - Page specified to display first.
 * @returns {null}
 */
async function printPlayable(message, client, array, taggedUser, personal, page) {
	let userCount = 0;
	let everyoneCount = 0;
	let defaultCount = 0;
	
	for(const song of array) {
		if(song.path.startsWith(userDirComparison)) userCount++;
		if(song.path.startsWith(everyoneDirComparison)) everyoneCount++;
		if(song.path.startsWith(defaultDirComparison)) defaultCount++;
	}

	let senderName = "DEBUG";
	const embeds = [];
	let embedHeadline;
	
	if(personal) {
		senderName = (await client.users.fetch(taggedUser)).globalName;
		embedHeadline = `${senderName}'s personal files!`;
	}
	else if(taggedUser) {
		senderName = (await client.users.fetch(taggedUser)).globalName;
		embedHeadline = `${senderName}'s active files!`;
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
			name: `\`${array[i].filename}\``,
			value: `\`${array[i].path}\``,
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
		embeds[0].setDescription(`**Here are all the personal files of ${senderName}:**\n\`\`\`🎶 Personal files: ${userCount}\`\`\``);
	}
	else if(taggedUser) {
		embeds[0].setDescription(`**Here are all the files that may play for ${senderName}:**\n\`\`\`🎶 Everyone files: ${everyoneCount}\n🎶 Default files: ${defaultCount}\n🎶 User files: ${userCount}\`\`\``);
	}
	else {
		embeds[0].setDescription(`**Here are all the files that can be played by the bot:**\n\`\`\`🎶 Everyone files: ${everyoneCount}\n🎶 Default files: ${defaultCount}\n🎶 User files: ${userCount}\`\`\``);
	}

	paginator(message, embeds, null, page);
}
