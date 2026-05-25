const { bot: { ownerID, devIDs }, emoji: { success, error }, response: { invalidPermissions }, player: { allowedExtensions }, directories: { topMusicDir }, filebrowser: { enabled: fbEnabled, externalDomain }  } = require('../../../config/config.json');

const { consoleLog } = require('../../Data/Log');

if (!fbEnabled) return consoleLog('[INFO] Filebrowser is disabled');

const path = require('path');

const Command = require('../../Structures/Command');
const { getUserPath } = require('../../Structures/musicFilesManager');
const { ensureUserExists } = require('../../Structures/Web/filebrowserApi');
const { generateLoginToken } = require('../../Structures/Web/tokenStore');


module.exports = new Command({
	name: 'webmanage',
	aliases: [ 'wm' ],
	description: 'TBD',
	async run(message, args, client) {
		const senderId = message.author.id;

		const adminFlag = args.includes('--admin') || args.includes('-a');
		const devFlag = args.includes('--dev') || args.includes('-d');

		if (adminFlag && senderId != ownerID) return await message.channel.send(`${error} ${invalidPermissions} (Bot owner)`);
		if (devFlag && senderId != ownerID && !devIDs.includes(senderId)) return await message.channel.send(`${error} ${invalidPermissions} (Bot developer)`);

		const userDirPath = adminFlag || devFlag ? '.' : path.relative(topMusicDir, await getUserPath(client, senderId));

		const fbUser = adminFlag ? 'admin' : devFlag ? 'developer' : senderId;

		if (!userDirPath) return await message.channel.send(`${error} Your user directory could not be determined. Please notify the bot administrator.`);

		const response = await message.channel.send(`Preparing your file access layer...`);

		try {
			if (!adminFlag) await ensureUserExists(fbUser, userDirPath);

			const secureToken = generateLoginToken(fbUser);
			const loginLink = `${externalDomain}/proxylogin?token=${secureToken}`

			await message.author.send(`Here is your secure, single-use access link (valid for 10 minutes):\n${loginLink}`);
            
            await response.edit(`A secure login link was sent to your DMs!`).catch(() => {});
		}
		catch (error) {
			consoleLog(`[ERR] Failed to generate filebrowser access:`, error);
            await message.channel.send(`There was an internal error preparing your file access layer.`);
		}
	}
});
