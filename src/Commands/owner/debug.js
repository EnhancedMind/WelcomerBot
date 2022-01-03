const Command = require('../../Structures/Command.js');

const { readdirSync, existsSync } = require('fs');
const { owner } = require('../../Data/data.js');

module.exports = new Command({
	name: 'debug',
	aliases: [ 'getlog' ],
	description: 'Sends selected log as a message attachment',
	async run(message, args, client) {
		if (message.author.id != owner) return message.channel.send('Invalid permission!');
        let files = readdirSync('./logs/');
        if (!args[0]) message.channel.send(`Logs: ${files.join(', ')}`);
        if (existsSync(`./logs/${args[0]}`)) message.channel.send( {files: [`./logs/${args[0]}`]});
        if (!existsSync(`./logs/${args[0]}`) && args[0]) message.channel.send("That file doesn't exist");
	}
});
