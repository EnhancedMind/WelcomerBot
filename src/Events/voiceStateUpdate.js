const Event = require('../Structures/Event.js');

const { createAudioPlayer, createAudioResource, joinVoiceChannel, AudioPlayerStatus } = require('@discordjs/voice');
const { existsSync } = require('fs');

module.exports = new Event('voiceStateUpdate', (client, oldState, newState) => {
    if(oldState.member.user.bot || newState.member.user.bot) return; 

    const { enabledJoin, enabledLeave } = require('../Data/data.js');
    let Continue = false;
    let State = newState;
    let song;
    let delay = 0;
    
    if(newState.channelId && !oldState.channelId) {
        if(!enabledJoin) return;
        song = `./music/users/${newState.id}.mp3`
        if (!existsSync(song)) song = './music/default.mp3';
        Continue = true;
        State = newState;
        delay = 750;
    } 
    if(!newState.channelId && oldState.channelId) {
        if(!enabledLeave) return;
        song = './music/leave.mp3';
        Continue = true;
        State = oldState;
        delay = 150;
    }
    
    if(!Continue) return;

    const player = createAudioPlayer();
    const resource = createAudioResource(song);

    const connection = joinVoiceChannel({
        channelId: State.channelId,
        guildId: State.guild.id,
        adapterCreator: State.guild.voiceAdapterCreator,
        selfDeaf: false,
    });

    setTimeout(() => {
        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => {
            setTimeout(() => {
                connection.destroy();
            }, 150);
        });
    }, delay);
});