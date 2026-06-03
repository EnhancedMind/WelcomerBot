const Command = require('../../Structures/Command');

const { emoji: { success } } = require('../../../config/config.json');


module.exports = new Command({
    name: 'hello',
    aliases: [ 'hi', 'hey' ],
    category: 'core',
    description: 'Says Hello!',
    async run(message, args, client) {
        await message.channel.send(`${success} Hello!`);
    }
});
