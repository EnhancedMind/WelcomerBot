const Event = require('../Structures/Event');

const { consoleLog } = require('../Data/Log');


module.exports = new Event('warn', async (client, info) => {
    consoleLog(`[INFO] Warn event emmited!`, info);
});
