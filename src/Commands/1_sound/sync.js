const Command = require('../../Structures/Command.js');

const { emoji: { success, loading } } = require('../../../config/config.json');
const { syncSoundFiles } = require('../../Structures/musicFilesManager.js');


module.exports = new Command({
	name: 'sync',
	aliases: [ 'refresh' ],
	description: 'Updates the sound database.',
	async run(message, args, client) {
		const response = await message.channel.send(`${loading} Syncing sound files...`);
		await syncSoundFiles(client);

		response.edit(`${success} Sound database updated!`).catch(() => {});
	}
});
