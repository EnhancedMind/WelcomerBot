const Event = require('../Structures/Event.js');

const { status, game } = require('../Data/data.js');

module.exports = new Event('ready', async (client) => {
    console.log(`${client.user.username} is online!`);
    client.user.setStatus(status);
    client.user.setActivity(game, { type: 'PLAYING'});
});
