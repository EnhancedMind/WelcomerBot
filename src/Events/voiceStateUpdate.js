const Event = require('../Structures/Event.js');

const { createAudioPlayer, createAudioResource, joinVoiceChannel, AudioPlayerStatus } = require('@discordjs/voice');
const { existsSync, appendFile } = require('fs');
const { getPlayType } = require('../Data/data.js');
const { voiceLogging, advancedLogging } = require('../Data/data.js');
const { consoleLog } = require('../Data/Log.js');

let State;
let song;
let delay;

module.exports = new Event('voiceStateUpdate', (client, oldState, newState) => {
    if(oldState.member.user.bot || newState.member.user.bot) return; 
    if(newState.channelId == newState.guild.afkChannelId) return;

    Continue = false;
    
    if(newState.channelId && !oldState.channelId || oldState.channelId == oldState.guild.afkChannelId) {
        if(!getPlayType('join')) return;
        song = `./music/users/${newState.id}.mp3`;
        if (!existsSync(song)) song = './music/default.mp3';
        State = newState;
        delay = 900;
    } 
    else if(!newState.channelId && oldState.channelId) {
        if(!getPlayType('leave')) return;
        song = `./music/leave${Math.round( Math.random() * (1-0) + 0 )}.mp3`;
        State = oldState;
        delay = 150;
    }
    else return;

    if (voiceLogging == 'true') {
        let info = `MEMBER: ${State.member.user.tag} (${State.member.user.id}); SERVER: ${State.guild.name} (${State.guild.id}); CHANNEL: ${State.channel.name} (${State.channelId}); TIMESTAMP: ${Date()};\n`;

        appendFile('./logs/vocupdt.txt', info, function(err) {
            if(err) {
                return consoleLog(`[WARN] ${err}`);
            }
        });
    }

    const settings = require(__dirname + '/../../config/settings.json');

    if (settings.guild[`${State.guild.id}`]) {
        if (settings.guild[`${State.guild.id}`].enabledJoin == false && State == newState) return;
        if (settings.guild[`${State.guild.id}`].enabledLeave == false && State == oldState) return;
    }
    if (settings.user[`${State.member.id}`]) {
        if (settings.user[`${State.member.id}`].enabledJoin == false && State == newState) return;
        if (settings.user[`${State.member.id}`].enabledLeave == false && State == oldState) return;
    }


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
            consoleLog(err);
        });
        
    }, delay);
});
