const Command = require('../Structures/Command.js');

const { getVoiceConnection } = require('@discordjs/voice');
const music = require('@koenie06/discord.js-music');  //https://www.npmjs.com/package/@koenie06/discord.js-music

module.exports = new Command({
	name: 'stop',
	aliases: [ 'Fuckoff', 'dc' ],
	description: 'Stops the audio player',
	async run(message, args, client) {
		let connection = getVoiceConnection(message.guild.id);
        if (connection) connection.destroy();

        let isConnected = await music.isConnected({ interaction: message });
        if (isConnected) music.stop({ interaction: message });

        message.channel.send(':stop_button: The player has stopped!');
	}
});
