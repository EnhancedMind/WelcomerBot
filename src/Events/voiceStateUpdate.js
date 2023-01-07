const Event = require('../Structures/Event.js');

const { createAudioPlayer, createAudioResource, joinVoiceChannel } = require('@discordjs/voice');
const { existsSync } = require('fs');
const { consoleLog } = require('../Data/Log.js');
const { player: { selfDeaf, debug } } = require('../../config/config.json');


module.exports = new Event('voiceStateUpdate', (client, oldState, newState) => {
    if (oldState.member.user.bot || newState.member.user.bot) return; 
    if (newState.channelId == newState.guild.afkChannelId) return;

    const settings = require('../../config/settings.json');
    
    if(newState.channelId && !oldState.channelId || oldState.channelId == oldState.guild.afkChannelId) {
        if (settings.guild[newState.guild.id] && settings.guild[newState.guild.id].enabledJoin == false) return;
        if (settings.user[newState.member.id] && settings.user[newState.member.id].enabledJoin == false) return;

        const song = `./music/users/${newState.id}.mp3`;
        if (!existsSync(song)) song = './music/default.mp3';

        play(newState, song, 800);
    } 
    else if(!newState.channelId && oldState.channelId) {
        if (settings.guild[oldState.guild.id] && settings.guild[oldState.guild.id].enabledLeave == false) return;
        if (settings.user[oldState.member.id] && settings.user[oldState.member.id].enabledLeave == false) return;

        const song = `./music/leave${Math.round( Math.random() * (1-0) + 0 )}.mp3`;
        play(oldState, song, 150);
    }

    const play = async (state, song, delay) => {
        const player = createAudioPlayer();
        const resource = createAudioResource(song);
        const connection = joinVoiceChannel({
            channelId: state.channelId,
            guildId: state.guild.id,
            adapterCreator: state.guild.voiceAdapterCreator,
            selfDeaf: selfDeaf,
            debug: debug,
        });

        await new Promise(resolve => setTimeout(resolve, delay));
            
        player.play(resource);
        connection.subscribe(player);

        player.on('idle', async () => {
            await new Promise(resolve => setTimeout(resolve, 150));
            connection.destroy();
        });

        player.on('error', (err) => {
            consoleLog(err);
        });
    }
});
