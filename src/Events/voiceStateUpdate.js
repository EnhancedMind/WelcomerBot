const Event = require('../Structures/Event.js');

const { createAudioPlayer, createAudioResource, joinVoiceChannel } = require('@discordjs/voice');
const { consoleLog } = require('../Data/Log.js');
const { player: { playIntoEmptyChannel, selfDeaf, debug } } = require('../../config/config.json');
const { getSoundFile, invalidateSoundFile } = require('../Structures/musicFilesManager.js');
const { allowPlay } = require('../Structures/settingsManager.js');


module.exports = new Event('voiceStateUpdate', async (client, oldState, newState) => {
    if (oldState.member.user.bot || newState.member.user.bot) return;
    if (newState.channelId == newState.guild.afkChannelId) return;


    if(newState.channelId && !oldState.channelId || oldState.channelId == oldState.guild.afkChannelId) {  //joining a channel or returning from afk
        const [file, defaultType] = await getSoundFile(client, newState.member.id, 'join');
        if (!file) return;

        if (!allowPlay(client, newState.guild.id, newState.member.id, defaultType ? 'defaultJoin' : 'join')) return;

        play(client, newState, file, 800);
    }

    else if(!newState.channelId && oldState.channelId) { //leaving a channel
        if (oldState.channel.members.size == 0 && !playIntoEmptyChannel) return;

        const [file, defaultType] = await getSoundFile(client, oldState.member.id, 'leave');
        if (!file) return;

        if (!allowPlay(client, oldState.guild.id, oldState.member.id, defaultType ? 'defaultLeave' : 'leave')) return;

        play(client, oldState, file, 150);
    }
});

const play = (client, state, file, delay) => {
    return new Promise(async (resolve) => {
        const player = createAudioPlayer();
        const resource = createAudioResource(file.path);
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
            if (file.once) invalidateSoundFile(client, file.path);
            resolve();
        });
        player.on('error', (err) => {
            consoleLog(err);
        });
    });        
}
