const Event = require('../Structures/Event');

const { ActivityType } = require('discord.js');

const { consoleLog } = require('../Data/Log');
const { status: { status, game } } = require('../../config/config.json');


module.exports = new Event('ready', async (client) => {
    consoleLog(`[INFO] ${client.user.username} is online and ready on ${client.guilds.cache.size} servers!`);
    client.user.setStatus(status);
    client.user.setActivity(
        game,
        { type: ActivityType.Playing }
    );
});
