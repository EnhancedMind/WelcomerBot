const Event = require('../Structures/Event.js');

const { prefix } = require('../Data/data.js');

module.exports = new Event('messageCreate', async (client, message) => {
    if(message.author.bot) return;
    if(!message.content.startsWith(prefix)) return;

    const args = message.content.substring(prefix.length).split(/ +/);
    const cmd = args.shift().toLowerCase();
    const command = client.commands.get(cmd) || client.commands.find(a => a.aliases && a.aliases.includes(cmd));
	if (!command) return message.channel.send(`**${cmd}** is not a valid command!`);
	command.run(message, args, client);
});