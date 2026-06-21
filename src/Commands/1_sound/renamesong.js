const Command = require('../../Structures/Command.js');

const { 
    bot: { prefix, ownerID, devIDs }, 
    emoji: { success, warning }, 
    response: { missingArguments }
} = require('../../../config/config.json')

const { rename } = require('fs/promises');
const path = require('path');

const { exists } = require('../../utils/fsUtils.js');
const { defaultDirComparison, everyoneDirComparison, userDirComparison, musicDirComparison } = require('../../Structures/musicFilesManager.js');
const { db } = require('../../Structures/dbManager.js');

const helpText = 
`This command allows you rename/move your songs which can also change their behaviour (for more about file behaviour use \`${prefix}addsong --help\`).

Renaming your song is as easy as specifying your original path/name and new path/name in the following format:
\`${prefix}renamesong <original_file_name_or_path> <new_file_name_or_path>\`
Example usage:
\`${prefix}renamesong ${userDirComparison}${path.sep}$yourID${path.sep}oldname.mp3 ${userDirComparison}${path.sep}$yourID${path.sep}newname.mp3\` 
\`${prefix}renamesong oldname.mp3 newname.mp3\`

To find the names or paths of the song file, use the command \`${prefix}playable\` for all or \`${prefix}playable -p\` for your files.

Developers can also rename and move files anywhere in the \`${musicDirComparison}\` directory
This command only renames and moves files, it does NOT create directories.
`;

module.exports = new Command({
    name: 'renamesong',
    aliases: [ 'renamefile', 'mv' ],
    category: 'sound',
    syntax: 'renamesong <origin> <destination>',
    description: `This command allows you rename/move your songs`,
    help: helpText,
    async run(message, args, client) {
        const channel = message.channel;
        const senderId = message.author.id;

        if(args.length < 2) {
            return await channel.send(`${warning} ${missingArguments}`);
        }
        let origin = args[0];
        let destination = args[1];

        if(path.dirname(origin) === '.') {
            const row = db.prepare(/*sql*/`
                SELECT file_path 
                FROM files 
                WHERE target_id = ? AND file_name = ?
                LIMIT 1
            `).get(senderId, origin);

            if(!row) {
                return await channel.send(`${warning} file \`${origin}\` doesn't exist in your library!`);
            }

            origin = row.file_path;
        }
        if(path.dirname(destination) === '.') destination = path.join(path.dirname(origin), destination); // Make destination into a path from base

        if(!origin.startsWith(musicDirComparison)) return await channel.send(`${warning}${warning}${warning} you tried to make changes outside the music database${warning}${warning}${warning}\nAttempted move from: \`${origin}\``);
        if(!destination.startsWith(musicDirComparison)) return await channel.send(`${warning}${warning}${warning} you tried to make changes outside the music database${warning}${warning}${warning}\nAttempted move to: \`${destination}\``);

        if (!(await exists(origin))) return await channel.send(`${warning} file \`${origin}\` doesn't exist!`);
        if (await exists(destination)) return await channel.send(`${warning} file \`${destination}\` already exists!`);

        if (!(await exists(path.dirname(destination)))) return await channel.send(`${warning} directory \`${path.dirname(destination)}\` for destination doesn't exist!`);

        const permissionFail = senderId != ownerID && !devIDs.includes(senderId);
        if (permissionFail) {
            if (origin.startsWith(`${defaultDirComparison}${path.sep}`) || destination.startsWith(`${defaultDirComparison}${path.sep}`)) {
                return await channel.send(`${warning} You do not have the permission to change songs for default! (Developer)`);
            }
            else if (origin.startsWith(`${everyoneDirComparison}${path.sep}`) || destination.startsWith(`${everyoneDirComparison}${path.sep}`)) {
                return await channel.send(`${warning} You do not have the permission to change songs for everyone! (Developer)`);
            }
            else if (!origin.startsWith(`${userDirComparison}${path.sep}${senderId}`)) {
                return await channel.send(`${warning} You do not have the permission to change songs for other users! (Developer)`);
            }
        }

        await rename(origin, destination);

        await channel.send(`Song succesfully renamed \nFrom: \`${origin}\`\nTo: \`${destination}\``);

        await syncSoundFiles();
    }
});
