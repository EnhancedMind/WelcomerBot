const Event = require('../Structures/Event');
const { consoleLog } = require('../Data/Log');

const { bot: { prefix, ignoreMessageEndingWithPrefix }, emoji: { error: emojiError, warning }, response: { notValidCommand } } = require('../../config/config.json');


module.exports = new Event('messageCreate', async (client, message) => {
    if (message.author.bot) return;
    if (message.content.endsWith(prefix) && ignoreMessageEndingWithPrefix) return;


    let args;
    const prefixRegex = new RegExp(`^<@!?${client.user.id}>\\s`);
    const mentionMatch = message.content.match(prefixRegex);
    if (message.content.startsWith(prefix)) args = message.content.substring(prefix.length).trim().split(/ +/);
    else if (mentionMatch) args = message.content.substring(mentionMatch[0].length).trim().split(/ +/);
    else return;

    const cmdInput = args.shift();
    if (!cmdInput) return;
    const cmd = cmdInput.toLowerCase();

    const command = client.commands.get(cmd) || client.commands.find(a => a.aliases && a.aliases.includes(cmd));
    if (!notValidCommand && !command) return;
    if (!command) return message.channel.send(`**${cmd}** is not a valid command!`);
    if (args[0] == '--help' || args[0] == '-h') return message.channel.send(command.help ? command.help : command.description);

    try {
        await command.run(message, args, client);
    }
    catch (err) {
        consoleLog(`[ERR] Failed running command "${command.name}":`, err);
        try {
            const errName = err?.name || 'Error';
            const errMessage = err?.message || 'An unknown structural error occurred.';
            await message.channel.send([
                `${emojiError} **The \`${command.name}\` command encountered an unhandled exception and had to stop, though it may be partially completed.**`,
                `${warning} **Note: Please check current states or files handled by this command before retrying, as some actions may have been partially executed or affected before the failure.**`,
                ``,
                `> **Details:** \`${errName}\`: \`${errMessage}\``,
                `*If you notice broken states or if this keeps happening, please notify the bot administrator.*`
            ].join('\n'));
        }
        catch (sendErr) {
            consoleLog(`[ERR] Could not deliver error message to Discord text channel:`, sendErr);
        }
    }
});
