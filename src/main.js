const { terminateOnUncaughtException } = require('../config/config.json');
const { fileLog } = require('./Data/Log');

if (!terminateOnUncaughtException) {
    process.on('uncaughtException', (err) => {
        console.log('Uncaught Exception: ', err);
        fileLog('Uncaught Exception: ', err);
    });
}

const Client = require('./Structures/Client');
new Client().start();
