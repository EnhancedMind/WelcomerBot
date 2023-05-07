const Command = require('../../Structures/Command.js');

const { Permissions } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const { bot: { ownerID }, emoji: { success, warning }, response: { wrongChannel, noMusic } } = require('../../../config/config.json');


module.exports = new Command({
	name: 'stop',
	aliases: [ 'dc', 'disconnect', 'fuckoff' ],
	description: 'Stops and disconnects the audio player.',
	async run(message, args, client) {
		const connection = getVoiceConnection(message.guild.id);
		if (!connection) return message.channel.send(`${warning} ${noMusic}`);

		if (( !message.member.voice.channel || connection.joinConfig.channelId != message.member.voice.channel.id ) && !message.member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS) && message.author.id != ownerID) return message.channel.send(`${warning} ${wrongChannel}`);

		connection.destroy();
		message.channel.send(`'${success} The player has stopped.`);
	}
});
