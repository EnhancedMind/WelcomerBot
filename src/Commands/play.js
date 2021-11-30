const Command = require('../Structures/Command.js');

const { createAudioPlayer, createAudioResource, joinVoiceChannel, AudioPlayerStatus } = require('@discordjs/voice');
const { existsSync } = require('fs');
const music = require('@koenie06/discord.js-music');  //https://www.npmjs.com/package/@koenie06/discord.js-music

module.exports = new Command({
	name: 'play',
    aliases: [ 'p' ],
	description: 'Plays the song from the music folder(if arg ends with .mp3) or from youtube',
	async run(message, args, client) {
		if (!args[0]) return message.channel.send('Invalid argument!');
        if (args[0].endsWith('.mp3')) {
            let song;
            if (existsSync(`./music/${args[0]}`)) song = `./music/${args[0]}`;
            if (existsSync(`./music/users/${args[0]}`)) song = `./music/users/${args[0]}`;
            if (!song) return message.channel.send("Couldn't find that!");
            const channel = message.member.voice.channel;
        	if(!channel) return message.channel.send('Join a voice channel! :wink:');
            message.channel.send(`Looking for ${args[0]} in local files!`);

		    const player = createAudioPlayer();
        	const resource = createAudioResource(song);

		    const connection = joinVoiceChannel({
    		    channelId: channel.id,
    		    guildId: message.guild.id,
    			adapterCreator: message.guild.voiceAdapterCreator,
                selfDeaf: false,
        	});

        	player.play(resource);
		    connection.subscribe(player);

        	player.on( AudioPlayerStatus.Idle, () => {
                setTimeout(function() {
                    connection.destroy();
                }, 200);
	        });
        }
        else {
            music.play({
                interaction: message,
                channel: message.member.voice.channel,
                song: args.slice(0).join(' ')
            });
            message.channel.send(`Searching ${args.slice(0).join(' ')} on youtube!`);
        }
	}
});
