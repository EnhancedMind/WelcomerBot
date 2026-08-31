const client = require('./Structures/clientInstance');
const { setupShutdownListeners } = require('./utils/shutdown');

setupShutdownListeners();

client.start();
