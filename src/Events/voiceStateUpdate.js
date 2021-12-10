const Event = require('../Structures/Event.js');

const { createAudioPlayer, createAudioResource, joinVoiceChannel, AudioPlayerStatus } = require('@discordjs/voice');
const { existsSync } = require('fs');

module.exports = new Event('voiceStateUpdate', (client, oldState, newState) => {
    if(oldState.member.user.bot || newState.member.user.bot) return; 

    let { enabledJoin, enabledLeave } = require('../Data/data.js');
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
        delay = 900;
    } 
    if(!newState.channelId && oldState.channelId) {
        if(!enabledLeave) return;
        let random = Math.floor( Math.random() * (2-0) + 0 );
        song = `./music/leave${random}.mp3`;
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