const Event = require('../Structures/Event.js');

const { createAudioPlayer, createAudioResource, joinVoiceChannel, AudioPlayerStatus } = require('@discordjs/voice');
const { existsSync } = require('fs');
const { getPlayType } = require('../Data/data.js');
const { advancedLogging } = require('../Data/data.js');
const { fileLog } = require('../Data/Log.js');

let Continue = false;
let State;
let song;
let delay;

module.exports = new Event('voiceStateUpdate', (client, oldState, newState) => {
    if(oldState.member.user.bot || newState.member.user.bot) return; 
    if(oldState.channelId == oldState.guild.afkChannelId || newState.channelId == newState.guild.afkChannelId) return;

    Continue = false;
    
    if(newState.channelId && !oldState.channelId) {
        if(!getPlayType('join')) return;
        song = `./music/users/${newState.id}.mp3`;
        if (!existsSync(song)) song = './music/default.mp3';
        Continue = true;
        State = newState;
        delay = 900;
    } 
    else if(!newState.channelId && oldState.channelId) {
        if(!getPlayType('leave')) return;
        song = `./music/leave${Math.round( Math.random() * (1-0) + 0 )}.mp3`;
        Continue = true;
        State = oldState;
        delay = 150;
    }
    
    if(!Continue) return;

    let player = createAudioPlayer();
    let resource = createAudioResource(song);
    let connection = joinVoiceChannel({
        channelId: State.channelId,
        guildId: State.guild.id,
        adapterCreator: State.guild.voiceAdapterCreator,
        selfDeaf: false,
        debug: advancedLogging,
    });

    setTimeout(() => {
        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => {
            setTimeout(() => {
                connection.destroy();
            }, 150);
        });

        player.on('error', (err) => {
            fileLog(err);
            console.log(err);
        });
        
    }, delay);
});
