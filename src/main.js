const { consoleLog } = require('./Data/Log');

const ENV = process.env.NODE_ENV || 'development';
consoleLog(`[INFO] Process starting... | Env: ${ENV} | PID: ${process.pid}`);

const client = require('./Structures/clientInstance');
const { setupShutdownListeners } = require('./utils/shutdown');

setupShutdownListeners();

client.start();
