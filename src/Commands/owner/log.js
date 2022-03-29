const Command = require('../../Structures/Command.js');

const { appendFile } = require('fs');
const { consoleLog } = require('../../Data/Log.js');
const { owner } = require('../../Data/data.js');

module.exports = new Command({
	name: 'log',
	aliases: [ ' ' ],
    syntax: 'log [data]',
	description: 'Manually log into file',
	async run(message, args, client) {
        if (message.author.id != owner) return message.channel.send('Invalid permission!');
		appendFile('./logs/manualLog.txt', `${args.slice(0).join(' ')}\n`, function(err) {
            if(err) {
                message.channel.send(`Something went wrong :confused: ${err}`);
                return consoleLog(`[WARN] ${err}`);
            }
            message.channel.send('Success!');
        });
	}
});
