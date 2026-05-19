const Command = require('../../Structures/Command');

const { EmbedBuilder, AttachmentBuilder } = require('discord.js');

const paginator = require('../../Structures/Paginator.js');
const { bot: { prefix }, player: { allowedExtensions }, directories: {userMusicDir, everyoneMusicDir, defaultMusicDir} } = require('../../../config/config.json');
const { homepage } = require('../../../package.json');
const { getUserSoundArray } = require('../../Structures/musicFilesManager.js');
const path = require('path');

const compareUser = userMusicDir.split('/').join(path.sep).substring(2);
const compareEveryone = everyoneMusicDir.split('/').join(path.sep).substring(2);
const compareDefault = defaultMusicDir.split('/').join(path.sep).substring(2);

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

		const page = resolvePageFlag(message, args);
		const [array, taggedUser, personalFlag] = resolveUserFlag(message.author.id, args, client);

		if(array === undefined) return; // Flag had an issue

		if(array.length == 0 && taggedUser === undefined) { // User array failed
			const defaultAndEveryone = [];
			for(const [key, value] of client.soundFiles) { // Put everyone and default before user sounds
				if(key == 'default' || key == 'everyone') {
					defaultAndEveryone.push(...value);
				}
				else {
					array.push(...value);
				}
			}

			array.push(...defaultAndEveryone);
		}

		if(jsonFlag) {
			exportPlayableToJson(message, client, array, taggedUser);
		}
		else {
			printPlayable(message, client, array, taggedUser, personalFlag, page);
		}
	}
});

function resolvePageFlag(message, args) {
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

function resolveUserFlag(senderId, args, client) {
	let userFlagIdx = args.indexOf('--user');
	if (userFlagIdx === -1) {
		userFlagIdx = args.indexOf('-u'); // Fallback to shorthand if longhand wasn't used
	}

	let personalFlagIdx = args.indexOf('--personal');
	if (personalFlagIdx === -1) {
		personalFlagIdx = args.indexOf('-p');
	}

	if(userFlagIdx === -1 && personalFlagIdx === -1) return [[],undefined, undefined];
	if(userFlagIdx !== -1 && personalFlagIdx !== -1) {
		message.channel.send({ content: `Both user and personal flags can't be triggered at the same time!`});
		return [undefined, undefined, undefined];
	}

	const flagIdx = (userFlagIdx !== -1) ? userFlagIdx : personalFlagIdx;
	let taggedUser = undefined;

	if (args.length > flagIdx) { // If the user tag has an argument
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

	console.log(`Targeting User ID: ${taggedUser}`);
	const [userArray, _] = getUserSoundArray(client, taggedUser);
	
	// Just user flag was triggered
	if(personalFlagIdx === -1) {
		const validArray = userArray.filter(song => {return song.valid});
		return [validArray, taggedUser, false];
	}
	//personal flag was triggered
	const filteredArray = userArray.filter(song => {return song.path.startsWith(compareUser)});
	return [filteredArray, taggedUser, true];
}

async function exportPlayableToJson(message, client, array, taggedUser) {
	const jsonString = JSON.stringify(array, null, 2);

	const buffer = Buffer.from(jsonString, 'utf-8');

	const filePrefix = (taggedUser) ? `${(await client.users.fetch(taggedUser)).globalName}_` : ''; 
	const attachment = new AttachmentBuilder(buffer, { name: `${filePrefix}soundFiles.json` });

	message.channel.send({ content: 'Here is the JSON data:', files: [attachment] });
	return;	
}

async function printPlayable(message, client, array, taggedUser, personal, page) {
	let userCount = 0;
	let everyoneCount = 0;
	let defaultCount = 0;
	
	for(const song of array) {
		if(song.path.startsWith(compareUser)) userCount++;
		if(song.path.startsWith(compareEveryone)) everyoneCount++;
		if(song.path.startsWith(compareDefault)) defaultCount++;
	}

	let senderName = "DEBUG";
	if(taggedUser) {
		senderName = (await client.users.fetch(taggedUser)).globalName;
	}
	
	const embeds = [];
	let embedHeadline;
	if(personal) {
		embedHeadline = `${senderName}'s personal files!`;
	}
	else if(taggedUser) {
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
