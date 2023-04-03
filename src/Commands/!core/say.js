const Command = require('../../Structures/Command');

const { emoji: { warning }, response: { missingArguments } } = require('../../../config/config.json');


module.exports = new Command({
	name: 'say',
	aliases: [ ' ' ],
	syntax: 'say [message]',
	description: 'Repeats whatever shit you said, then quietly deletes your message',
	async run(message, args, client) {
		if (!args[0]) return message.channel.send(`${warning} ${missingArguments}`);
		
        await message.delete();
        message.channel.send(args.slice(0).join(' '));
	}
});
