const Event = require('../Structures/Event.js');

const { createAudioPlayer, createAudioResource, joinVoiceChannel } = require('@discordjs/voice');
const { readdirSync } = require('fs');
const { consoleLog } = require('../Data/Log.js');
const { player: { playIntoEmptyChannel, selfDeaf, debug, allowedExtensions } } = require('../../config/config.json');


module.exports = new Event('voiceStateUpdate', (client, oldState, newState) => {
    if (oldState.member.user.bot || newState.member.user.bot) return; 
    if (newState.channelId == newState.guild.afkChannelId) return;

    const settings = require('../../config/settings.json');
    
    if(newState.channelId && !oldState.channelId || oldState.channelId == oldState.guild.afkChannelId) {
        if (settings.guild[newState.guild.id] && settings.guild[newState.guild.id].enabledJoin == false) return;
        if (settings.user[newState.member.id] && settings.user[newState.member.id].enabledJoin == false) return;

        const files = readdirSync('./music/users');
        for (const file of files) {
            if (file.startsWith(newState.id) && allowedExtensions.some(ext => file.endsWith(ext))) {
                play(newState, `./music/users/${file}`, 800);
                return;
            }
        }
        play(newState, './music/default.mp3', 800);        
    } 
    else if(!newState.channelId && oldState.channelId) {
        if (settings.guild[oldState.guild.id] && settings.guild[oldState.guild.id].enabledLeave == false) return;
        if (settings.user[oldState.member.id] && settings.user[oldState.member.id].enabledLeave == false) return;
        if (oldState.channel.members.size == 0 && !playIntoEmptyChannel) return;

        const song = `./music/leave${Math.round( Math.random() * (1-0) + 0 )}.mp3`;
        play(oldState, song, 150);
    }
});

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