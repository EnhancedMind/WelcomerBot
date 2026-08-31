const EventEmitter = require('events');

const client = require('../Structures/clientInstance');
const Paginator = require('../Structures/Paginator');
const ButtonPrompt = require('../Structures/ButtonPrompt');
const PlayerManager = require('../Structures/playerManager');
const { db } = require('../Structures/dbManager');
const { closeProxyServer } = require('../Structures/Web/server');
const { consoleLog } = require('../Data/Log');


let shuttingDown = false;

const commandEmitter = new EventEmitter();
const activeCommands = new Set();

/**
 * Shuts down the process
 * @param {string} signal the signal that triggered this
 * @returns {Promise<void>}
 */
async function gracefulShutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;

    let somethingFailed = false;

    consoleLog(`[SHUTDOWN] Gracefully shutting down on signal: ${signal}`);


    // set 7s timeout for cleanup, if it takes longer than that, just destroy the client, close db and exit
    let timerId;
    const timeoutPromise = new Promise(resolve => {
        timerId = setTimeout(() => {
            consoleLog('[WARN] [SHUTDOWN] Dynamic cleanup timed out after 7s. Skipping remaining actions.');
            somethingFailed = true;
            resolve();
        }, 7000);
    });

    const cleanupPromise = (async () => {
        if (activeCommands.size > 0) {
            consoleLog(`[SHUTDOWN] Waiting for ${activeCommands.size} active command(s) to finish executing...`);
            await waitForCommandsToFinish();
            consoleLog('[SHUTDOWN] All active commands finished.');
        }

        try {
            await closeProxyServer();
            consoleLog('[SHUTDOWN] Filebrowser proxy server stopped.');
        }
        catch (error) {
            consoleLog('[ERROR] [SHUTDOWN] during proxy server closing:\n', error);
            somethingFailed = true;
        }

        const cleanupPromises = [
            ...Paginator.destroyAll(),
            ...ButtonPrompt.destroyAll()
        ];

        PlayerManager.activeConnections.each(connection => {
            PlayerManager.disconnect(connection?.connection?.joinConfig.guildId);
        });

        const results = await Promise.allSettled(cleanupPromises);
        const failed = results.filter(r => r.status === 'rejected');
        consoleLog('[SHUTDOWN] All Paginators and ButtonPrompts destroyed.'.concat( failed.length > 0 ? ` ${failed.length} failed to destroy cleanly.` : '' ));
    })();

    // race the timeout and cleanup promises, wait for whichever finishes first, then continue
    await Promise.race([ timeoutPromise, cleanupPromise ]);
    clearTimeout(timerId);

    try {
        if (client) {
            client.destroy();
            consoleLog('[SHUTDOWN] Discord client destroyed.');
        }
    }
    catch (error) {
        consoleLog('[ERROR] [SHUTDOWN] during client destroy:\n', error);
        somethingFailed = true;
    }

    try {
        if (db && db.open) {
            // finish write ahead writes (WAL)
            db.pragma('wal_checkpoint(TRUNCATE)'); 
            db.close();
            consoleLog('[SHUTDOWN] SQLite database connection closed succesfully.');
        }
    }
    catch (error) {
        consoleLog('[ERROR] [SHUTDOWN] during database closing:\n', error);
        somethingFailed = true;
    }

    consoleLog('[SHUTDOWN] Graceful shutdown complete. Exiting process.');

    process.exit(somethingFailed ? 1 : 0);
}

/**
 * Registers process signal and uncaught error handlers.
 */
function setupShutdownListeners() {
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGHUP', () => gracefulShutdown('SIGHUP'));

    process.on('uncaughtException', (error) => {
        consoleLog('[ERROR] [FATAL] Uncaught Exception thrown:\n', error);
        gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (error) => {
        consoleLog('[ERROR] [FATAL] Unhandled Promise Rejection:\n', error);
        gracefulShutdown('unhandledRejection');
    });
}

/**
 * Adds a command execution to the active commands set
 * @param {string} messageId the ID of the message that triggered the command
 */
function registerCommandExecution(messageId) {
    activeCommands.add(messageId);
}

/**
 * Removes a command execution from the active commands set
 * @param {string} messageId the ID of the message that triggered the command
 */
function unregisterCommandExecution(messageId) {
    activeCommands.delete(messageId);

    if (activeCommands.size === 0 && shuttingDown) {
        consoleLog('[SHUTDOWN] All active commands finished executing. Proceeding with shutdown.');
        commandEmitter.emit('allCommandsFinished');
    }
}

/**
 * Waits for all active commands to finish executing
 * @returns {Promise}
 */
function waitForCommandsToFinish() {
    return new Promise(resolve => {
        if (activeCommands.size === 0) return resolve();

        commandEmitter.once('allCommandsFinished', () => {
            resolve();
        });
    });
}


/**
 * Returns boolean whether the process is shutting down
 * @returns {boolean}
 */
function isShuttingDown() {
    return shuttingDown;
}

module.exports = {
    gracefulShutdown,
    setupShutdownListeners,
    isShuttingDown,
    registerCommandExecution,
    unregisterCommandExecution
}
