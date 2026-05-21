const Event = require('../Structures/Event.js');

const { createAudioPlayer, createAudioResource, joinVoiceChannel } = require('@discordjs/voice');
const { consoleLog } = require('../Data/Log.js');
const { player: { playIntoEmptyChannel, selfDeaf, debug } } = require('../../config/config.json');
const { getUserSoundFile, invalidateSoundFile } = require('../Structures/musicFilesManager.js');
const { getSetting } = require('../Structures/settingsManager.js');


module.exports = new Event('voiceStateUpdate', async (client, oldState, newState) => {
    if (oldState.member.user.bot || newState.member.user.bot) return;
    if (newState.channelId == newState.guild.afkChannelId) return;

    const guildSettings = await getSetting(client, 'guild', oldState.guild.id);
    const userSettings = await getSetting(client, 'user', oldState.member.id);

    if(newState.channelId && !oldState.channelId || oldState.channelId == oldState.guild.afkChannelId) { //joining a channel or returning from afk
        const file = await getUserSoundFile(client, newState.member.id, 'join', oldState.guild.id);
        if (!file) return;
        client.playerManager.play(client, newState.channel, file, 800);
    }

    else if(!newState.channelId && oldState.channelId) { //leaving a channel
        if (oldState.channel.members.size == 0 && !playIntoEmptyChannel) return;
        const file = await getUserSoundFile(client, oldState.member.id, 'leave', oldState.guild.id);
        if (!file) return;

        client.playerManager.play(client, oldState.channel, file, 150);
    }
});
