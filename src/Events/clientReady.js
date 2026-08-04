const Event = require('../Structures/Event');

const { consoleLog } = require('../Data/Log');


module.exports = new Event('clientReady', async (client) => {
    consoleLog(`[INFO] ${client.user.username} is online and ready on ${client.guilds.cache.size} servers!`);
});
