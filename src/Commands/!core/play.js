const Command = require('../../Structures/Command.js');

const { createAudioPlayer, createAudioResource, joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const { readdirSync } = require('fs');
const { consoleLog } = require('../../Data/Log.js');
const { emoji: { success, warning, error, loading }, response: { missingArguments, noChannel, wrongChannel, afkChannel }, player: { selfDeaf, debug, allowedExtensions } } = require('../../../config/config.json');


module.exports = new Command({
	name: 'play',
    aliases: [ 'p' ],
    syntax: 'play <file>',
	description: "Plays a song from local storage.",
	async run(message, args, client) {
        if (!args[0]) return message.channel.send(`${warning} ${missingArguments}`);
        if (!message.member.voice.channel) return message.channel.send(`${warning} ${noChannel}`);
        if (message.member.voice.channel.id == message.guild.afkChannelId) return message.channel.send(`${warning} ${afkChannel}`);

        const currentConnection = getVoiceConnection(message.guild.id);
        if (currentConnection && currentConnection.joinConfig.channelId != message.member.voice.channel.id) return message.channel.send(`${warning} ${wrongChannel}`);

        const fileName = args[0].replace(/[<@!>]/g, '');

        const response = await message.channel.send(`${loading} Loading \`[${fileName}...]\``);

        const play = async (song) => {
            const player = createAudioPlayer();
            const resource = createAudioResource(song);
            const connection = joinVoiceChannel({
                channelId: message.member.voice.channel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
                selfDeaf: selfDeaf,
                debug: debug,
            });
                
            player.play(resource);
            connection.subscribe(player);
    
            player.on('idle', async () => {
                await new Promise(resolve => setTimeout(resolve, 150));
                connection.destroy();
            });
    
            player.on('error', (err) => {
                message.channel.send(`**${error}** Player error: **${err.message}**`);
                consoleLog('[WARN] Player error', err);
            });
        }

        const genericFiles = readdirSync('./music');
        for (const file of genericFiles) {
            if (file.startsWith(args[0]) && allowedExtensions.some(ext => file.endsWith(ext))) {
                play(`./music/${file}`);
                response.edit(`${success} Playing **${file}**`);
                return;
            }
        }
        const userFiles = readdirSync('./music/users');
        for (const file of userFiles) {
            if (file.startsWith(args[0]) && allowedExtensions.some(ext => file.endsWith(ext))) {
                play(`./music/users/${file}`);
                response.edit(`${success} Playing **${file}**`);
                return;
            }
        }

        return response.edit(`${error} ${fileName}... doesn't exist.`);
	}
});
