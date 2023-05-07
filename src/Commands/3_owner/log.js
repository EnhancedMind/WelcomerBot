const Command = require('../../Structures/Command');

const { appendFile } = require('fs');
const { consoleLog } = require('../../Data/Log');
const { bot: { ownerID }, emoji: { success, error }, response: { invalidPermissions } } = require('../../../config/config.json');


module.exports = new Command({
	name: 'log',
	aliases: [ ' ' ],
    syntax: 'log <data>',
	description: 'Manually log into file',
	async run(message, args, client) {
        if (message.author.id != ownerID) return message.channel.send(`${error} ${invalidPermissions}`);
		appendFile('./logs/manualLog.txt', `${args.slice(0).join(' ')}\n`, (err) => {
            if (err) {
                message.channel.send(`${error} Something went wrong :confused: ${err}`);
                return consoleLog(`[WARN]`, err);
            }
            message.channel.send(`${success} Success!`);
        });
	}
});
