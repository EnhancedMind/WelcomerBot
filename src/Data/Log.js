const { appendFile, writeFile, existsSync, mkdirSync } = require('fs');
const { logs: { resetLogOnStart, logToFile, timeFormat } } = require('../../config/config.json');


const initLog = () => {
    //return new Promise( async (resolve, reject) => {
        if (!existsSync('./logs')) mkdirSync('./logs');

        if (resetLogOnStart) {
            writeFile('./logs/sessionLog.txt', '', (err) => {
                if (err) {
                    return consoleLog(`[WARN] Write file error: `, err);
                }
            });
        }
        else if (logToFile) {
            for (let i = 0; i < 3; i++) fileLog();
        }
        fileLog('[INFO] Process start');
    //    resolve();
    //});
}

const fileLog = async (message = '', ...data) => {
    if (!logToFile) { //only log to console then return so log file isn't written to
        if (data.length > 0) console.log(`${time()} ${message}: `, ...data);
        else console.log(`${time()} ${message}`);
        return;
    }

    if (message != '') message = `${time()} ${message}`;
    await appendFile('./logs/sessionLog.txt', `${message}${data.length > 0 ? ': ' : ''}\n`, (err) => {
        // despite VSCode says await has no effect on this function, it does cause it to write in correct order
        if (err) {
            return console.log(`[WARN] Append file error: `, err);
        }
    });
    if (data.length > 0) {
        let jsonData = '';
        try {
            data.forEach((element) => {
                jsonData = jsonData.concat( JSON.stringify(element, null, 4) );
                jsonData = jsonData.concat('\n');
            });
        }
        catch(err) {
            jsonData = `Can\'t stringify data: ${err.message}`;
        }
        appendFile('./logs/sessionLog.txt', jsonData, (err) => {
            if (err) {
                return console.log(`[WARN] Append file error: `, err);
            }
        });
        appendFile('./logs/sessionLog.txt', '\n', (err) => {
            if (err) {
                return console.log(`[WARN] Append file error: `, err);
            }
        });
    }
}

const consoleLog = (message, ...data) => {
    fileLog(message, ...data);
    if (!logToFile) return; // only handle console.log in filelog
    if (data.length > 0) console.log(`${time()} ${message}: `, ...data);
    else console.log(`${time()} ${message}`);
}

const time = () => {
    return `[${new Date().toLocaleString(timeFormat, { hour: 'numeric', minute: 'numeric', second: 'numeric' })}]`;
}

module.exports = { initLog, fileLog, consoleLog }
