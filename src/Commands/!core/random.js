const Command = require('../../Structures/Command.js');

module.exports = new Command({
	name: 'random',
	aliases: [ 'rn' ],
    syntax: 'random <min> <max> or <max>',
	description: 'Generates random number in range',
	async run(message, args, client) {
        if (!args[0]) return message.channel.send('Invalid arguments!');
        if (isNaN(args[0]) || args[1] && isNaN(args[1])) return message.channel.send('Not a number!');

		const msg = await message.channel.send('Yours magical number is...');
        let number;

        if (args[1]) {
            if (args[0] < args[1]) number = Math.round( Math.random() * ( args[1] - args[0] ) + args[0] );
            else if (args[0] > args[1]) number = Math.round( Math.random() * ( args[0] - args[1] ) + args[1] );
            else number = args[0];
        } 
        else number = Math.round( Math.random() * ( args[0] - 1 ) + 1 );

        console.log(number);

        //msg.edit(`Yours magical number is **${number}**`);

        //number = Math.round( Math.random() * (1-0) + 0 );
        setTimeout(() => {
            msg.edit(`Yours magical number is **${number}**`);
            setTimeout(() => {
                message.channel.send('Ba dum tsss');
            }, 2000);
        }, 1500);
	}
});
