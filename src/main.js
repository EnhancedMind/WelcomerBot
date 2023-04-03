const { terminateOnUncaughtException } = require('../config/config.json');

if (!terminateOnUncaughtException) {
    process.on('uncaughtException', (err) => {
        console.error('Uncaught Exception: ', err.stack);
    });
}

const Client = require('./Structures/Client');
new Client().start();
