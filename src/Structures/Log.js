const { appendFile, writeFile } = require('fs');

function initLog() {
    writeFile('./logs/sessionLog.txt', `[${new Date().toLocaleString('cs-CZ', { hour: 'numeric', minute: 'numeric', second: 'numeric' })}] [INFO] Process start\n`, function(err) {
        if(err) {
            consoleLog(`[WARN] ${err}`);
            return console.log(`[WARN] ${err}`);
        }
    });
}

function fileLog(data) {
    appendFile('./logs/sessionLog.txt', `[${new Date().toLocaleString('cs-CZ', { hour: 'numeric', minute: 'numeric', second: 'numeric' })}] ${data}\n`, function(err) {
        if(err) {
            consoleLog(`[WARN] ${err}`);
            return console.log(`[WARN] ${err}`);
        }
    });
}

function consoleLog(data) {
    fileLog(data);
    console.log(`[${new Date().toLocaleString('cs-CZ', { hour: 'numeric', minute: 'numeric', second: 'numeric' })}] ${data}`);
}

module.exports = { initLog, fileLog, consoleLog }
