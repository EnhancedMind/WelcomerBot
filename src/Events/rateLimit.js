const Event = require('../Structures/Event');

const { consoleLog } = require('../Data/Log');


module.exports = new Event('rateLimit', async (client, info) => {
    consoleLog(`[WARN] Rate limit event emmited!`, info);
});
