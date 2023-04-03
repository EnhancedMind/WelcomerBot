const Event = require('../Structures/Event');

const { consoleLog } = require('../Data/Log');


module.exports = new Event('error', async (client, info) => {
    consoleLog(`[WARN] Error event emmited!`, info);
});
