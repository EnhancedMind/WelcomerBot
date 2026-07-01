const Command = require('../../Structures/Command.js');

const { parseArgs } = require('node:util');

const { bot: { ownerID, devIDs },emoji: { success, loading } } = require('../../../config/config.json');
const { syncSoundFiles } = require('../../Structures/musicFilesManager.js');


const helpText = `
This command updates the sound database by syncing the sound files from the music directory to the database.
You can use the following arguments to modify this behaviour:

- \`--force-reencode\` or \`-f\` - Forces re-encoding of all sound files, even if they are already in the reencoded table. This option is restricted to the bot owner and developers.
`;

module.exports = new Command({
    name: 'sync',
    aliases: [ 'refresh' ],
    category: 'sound',
    syntax: 'sync <flags>',
    description: 'Updates the sound database.',
    help: helpText,
    async run(message, args, client) {
        const senderId = message.author.id;
        const parsed = parseArgs({
            args: args,
            strict: false,
            options: {
                'force-reencode': { type: 'boolean', short: 'f' }
            }
        });

        const permissionFail = senderId != ownerID && !devIDs.includes(senderId);
        if (permissionFail && parsed.values['force-reencode']) return await message.channel.send('You do not have permission to force re-encode the sound files.');

        const response = await message.channel.send(`${loading} Syncing sound files...`);
        await syncSoundFiles({ forceReencode: parsed.values['force-reencode'] });

        response.edit(`${success} Sound database updated!`).catch(() => {});
    }
});
