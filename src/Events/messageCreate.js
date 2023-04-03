const Event = require('../Structures/Event');

const { bot: { prefix, ignoreMessageEndingWithPrefix }, response: { notValidCommand } } = require('../../config/config.json');


module.exports = new Event('messageCreate', async (client, message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
    if (message.content.endsWith(prefix) && ignoreMessageEndingWithPrefix) return;

    const args = message.content.substring(prefix.length).split(/ +/);
    const cmd = args.shift().toLowerCase();
    const command = client.commands.get(cmd) || client.commands.find(a => a.aliases && a.aliases.includes(cmd));
    if (!notValidCommand && !command) return;
	if (!command) return message.channel.send(`**${cmd}** is not a valid command!`);
	command.run(message, args, client);
});
