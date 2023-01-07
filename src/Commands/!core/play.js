const Command = require('../../Structures/Command.js');

const { createAudioPlayer, createAudioResource, joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const { existsSync } = require('fs');
const { consoleLog } = require('../../Data/Log.js');
const { emoji: { success, warning, error, loading }, response: { missingArguments, noChannel, wrongChannel, afkChannel }, player: { selfDeaf, debug } } = require('../../../config/config.json');


module.exports = new Command({
	name: 'play',
    aliases: [ 'p' ],
    syntax: 'play <file name>',
	description: "Plays a song.",
	async run(message, args, client) {
        if (!message.member.voice.channel) return message.channel.send(`${warning} ${noChannel}`);
        if (message.member.voice.channel.id == message.guild.afkChannelId) return message.channel.send(`${warning} ${afkChannel}`);

        const currentConnection = getVoiceConnection(message.guild.id);
        if (currentConnection && currentConnection.joinConfig.channelId != message.member.voice.channel.id) return message.channel.send(`${warning} ${wrongChannel}`);

		if (!args[0]) return message.channel.send(`${warning} ${missingArguments}`);

        const fileName = args[0].replace(/[<@!>]/g, '');

        let response = await message.channel.send(`${loading} Loading \`[${fileName}.mp3]\``);

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

        if (existsSync(`./music/${fileName}.mp3`)) play(`./music/${fileName}.mp3`);
        else if (existsSync(`./music/users/${fileName}.mp3`)) play(`./music/users/${fileName}.mp3`);
        else return response.edit(`${error} ${fileName}.mp3 doesn't exist.`);
        response.edit(`${success} Playing **${fileName}.mp3**`);
	}
});
