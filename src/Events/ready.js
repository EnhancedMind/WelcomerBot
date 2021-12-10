const Event = require('../Structures/Event.js');

const { status, game } = require('../Data/data.js');
const { consoleLog } = require('../Structures/Log.js');

module.exports = new Event('ready', async (client) => {
    consoleLog(`[INFO] ${client.user.username} is online and ready on ${client.guilds.cache.size} servers!`);
    client.user.setStatus(status);
    client.user.setActivity(game, { type: 'PLAYING' });
});
