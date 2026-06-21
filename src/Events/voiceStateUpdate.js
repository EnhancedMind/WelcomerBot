const Event = require('../Structures/Event.js');

const { player: { playIntoEmptyChannel } } = require('../../config/config.json');
const { getUserSoundFile } = require('../Structures/musicFilesManager.js');


module.exports = new Event('voiceStateUpdate', async (client, oldState, newState) => {
    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;
    if (newState.channelId == newState.guild?.afkChannelId) return;

    if(newState.channelId && (!oldState.channelId || oldState.channelId == oldState.guild?.afkChannelId)) { //joining a channel or returning from afk
        const file = await getUserSoundFile(member.id, 'join', newState.guild.id);
        if (!file) return;
        client.playerManager.play(newState.channel, file, 800);
    }

    else if(!newState.channelId && oldState.channelId && oldState.channelId != oldState.guild?.afkChannelId) { //leaving a channel
        if (oldState.channel.members.size == 0 && !playIntoEmptyChannel) return;
        const file = await getUserSoundFile(member.id, 'leave', oldState.guild.id);
        if (!file) return;

        client.playerManager.play(oldState.channel, file, 150);
    }
});
