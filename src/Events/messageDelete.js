const Event = require('../Structures/Event.js');

const { appendFile } = require('fs');
const { consoleLog } = require('../Structures/Log.js');

module.exports = new Event('messageDelete', async (client, message) => {
    let attachment;
    if(message.attachments.first()) attachment = message.attachments.first().url;
    let msg = `AUTHOR: ${message.author.tag} (${message.author.id});  CONTENT: '${message.content}';  ATTACHMENT: ${attachment};  CHANNEL: ${message.channel.name} (${message.channel.id});  GUILD: ${message.guild.name} (${message.guild.id});  TIMESTAMP: ${message.createdAt};  DELETEDTIMESTAMP: ${Date()};\n`;
    
    appendFile('./logs/deletedMessages.txt', msg, function(err) {
        if(err) {
            return consoleLog(`[WARN] ${err}`);
        }
    });
});
