const Event = require('../Structures/Event.js');

const { prefix, advancedLogging } = require('../Data/data.js');

module.exports = new Event('messageCreate', async (client, message) => {
    if(advancedLogging) console.log(message);

    if(message.author.bot) return;
    if(!message.content.startsWith(prefix)) return;

    let args = message.content.substring(prefix.length).split(/ +/);
    let cmd = args.shift().toLowerCase();
    let command = client.commands.get(cmd) || client.commands.find(a => a.aliases && a.aliases.includes(cmd));
	if(!command) return message.channel.send(`**${cmd}** is not a valid command!`);
	command.run(message, args, client);
});
