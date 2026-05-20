const Command = require('../../Structures/Command.js');

const { createAudioPlayer, createAudioResource, joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const { existsSync } = require('fs');
const { consoleLog } = require('../../Data/Log.js');
const { getUserSoundFile } = require('../../Structures/musicFilesManager.js');
const { bot: { prefix }, emoji: { success, warning, error, loading }, response: { missingArguments, noChannel, wrongChannel, afkChannel }, player: { selfDeaf, debug, allowedExtensions } } = require('../../../config/config.json');

module.exports = new Command({
	name: 'play',
    aliases: [ 'p' ],
    syntax: 'play <file>',
	description: `Plays a song from local storage. Tag a person to select their sound like if they were to join or place the path from the \`${prefix}playable\` command`,
	async run(message, args, client) {
        const senderVoiceChannel = message.member.voice.channel;

        if (!args[0]) return message.channel.send(`${warning} ${missingArguments}`);
        if (!senderVoiceChannel) return message.channel.send(`${warning} ${noChannel}`);
        if (senderVoiceChannel.id == message.guild.afkChannelId) return message.channel.send(`${warning} ${afkChannel}`);

        const currentConnection = getVoiceConnection(message.guild.id);
        if (currentConnection && currentConnection.joinConfig.channelId != senderVoiceChannel.id) return message.channel.send(`${warning} ${wrongChannel}`);

        const response = await message.channel.send(`${loading} Loading \`[${args[0]}]\``);

        if (existsSync(`./${args[0]}`) && allowedExtensions.some(ext => args[0].endsWith(ext))) {
            client.playerManager.play(client, senderVoiceChannel, { path: `./${args[0]}`});
            if ( (await response.channel.messages.fetch({ limit: 1, cache: false, around: response.id })).has(response.id) ) response.edit(`${success} Playing **\`${args[0]}\`**`);
            return;
        }
        else if (args[0].startsWith('<@') && args[0].endsWith('>')) {
            const userId = args[0].replace(/[<@!>]/g, '');
            const [file, _] = await getUserSoundFile(client, userId, 'join');
            if (!file) {
                if ( (await response.channel.messages.fetch({ limit: 1, cache: false, around: response.id })).has(response.id) ) {
                    response.edit(`${error} \`${args[0]}\` doesn't exist.`);
                }
                return;
            }
            client.playerManager.play(client, senderVoiceChannel, { path: file.path });
            if ( (await response.channel.messages.fetch({ limit: 1, cache: false, around: response.id })).has(response.id) ) {
                response.edit(`${success} Playing sound for **${(await client.users.fetch(userId)).globalName} - \`${file.filename}\`**`);
            }
            return;
        }

        if ( (await response.channel.messages.fetch({ limit: 1, cache: false, around: response.id })).has(response.id) ) {
            response.edit(`${error} \`${args[0]}\` doesn't exist.`);
        }
        return;
	}
});
