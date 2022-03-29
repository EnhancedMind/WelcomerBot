const Command = require('../../Structures/Command.js');

const { spawn } = require("child_process");

const { consoleLog } = require('../../Data/Log.js');
const { owner } = require('../../Data/data.js');

module.exports = new Command({
	name: 'hardrestart',
	aliases: [ 'hrst' ],
	description: "Forces the whole process to restarts, if responsive",
	async run(message, args, client) {
		if (message.author.id != owner) return message.channel.send('Invalid permission!');
		if (process.platform == 'win32') {
			consoleLog('[INFO] Hard restarting...');
			message.channel.send('Hard restarting...')
				.then(() => {
					const ls = spawn('.\\src\\Commands\\owner\\hardrestart.bat', {
						stdio: 'ignore',
						detached: true
					});

					ls.stdout.on("data", data => {
						if (String(data) == 'process continue\r\n') process.exit(0);
						else {
							consoleLog(`stdout: ${data}`);
							message.channel.send(`stdout: ${data}`);
						}
					});
					ls.stderr.on("data", data => { 
						consoleLog(`stderr: ${data}`);
						message.channel.send(`stderr: ${data}`);
					});
	
					ls.on('error', (error) => {
						consoleLog(`error: ${error.message}`);
						message.channel.send(`error: ${error.message}`);
					});
				});
		}
		else message.channel.send('Sorry, this is currnetly only supported on windows! 🥴')
	}
});
