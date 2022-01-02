const Command = require('../../Structures/Command.js');

const { createAudioPlayer, createAudioResource, joinVoiceChannel, AudioPlayerStatus } = require('@discordjs/voice');
const { existsSync } = require('fs');
const music = require('@koenie06/discord.js-music');  //https://www.npmjs.com/package/@koenie06/discord.js-music
const { advancedLogging } = require('../../Data/data.js');
const { fileLog } = require('../../Data/Log.js');

module.exports = new Command({
	name: 'play',
    aliases: [ 'p' ],
	description: "Plays some music (.mp3 plays bot's local files)",
	async run(message, args, client) {
		if (!args[0]) return message.channel.send('Invalid argument!');
        if (!message.member.voice.channel) return message.channel.send('You need to be in a voice channel to do that!');
        if (message.member.voice.channelId == message.guild.afkChannelId) return message.channel.send("Can't play into an AFK channel!")
        if (args[0].endsWith('.mp3')) {
            let song;
            if (existsSync(`./music/${args[0]}`)) song = `./music/${args[0]}`;
            if (existsSync(`./music/users/${args[0]}`)) song = `./music/users/${args[0]}`;
            if (!song) return message.channel.send("Couldn't find that!");
            let channel = message.member.voice.channel;
        	if(!channel) return message.channel.send('Join a voice channel! :wink:');
            message.channel.send(`Looking for ${args[0]} in local files!`);

		    let player = createAudioPlayer();
        	let resource = createAudioResource(song);

		    let connection = joinVoiceChannel({
    		    channelId: channel.id,
    		    guildId: message.guild.id,
    			adapterCreator: message.guild.voiceAdapterCreator,
                selfDeaf: false,
                debug: advancedLogging,
        	});

        	player.play(resource);
		    connection.subscribe(player);

        	player.on( AudioPlayerStatus.Idle, () => {
                setTimeout(function() {
                    connection.destroy();
                }, 200);
	        });

            player.on('error', (err) => {
                fileLog(err);
                console.log(err);
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
