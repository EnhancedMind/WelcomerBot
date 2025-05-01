const { readdirSync, existsSync, renameSync, statSync } = require('fs');
const path = require('path');

const Client = require('./Client.js');
const { player: { allowedExtensions } } = require('../../config/config.json');


/**
 * Syncs the sound files from the music directory to the client instance database.
 * @param {Client} client - The client instance.	
 * @returns {Promise<void>} - A promise that resolves when the sound files are synced.
 */
const syncSoundFiles = (client) => {
    return new Promise((resolve, reject) => {
        client.soundFiles.clear();

        const userFilesDir = readdirSync('./music/users');
        for (const file of userFilesDir) {
            if (statSync(path.join('./music/users', file)).isDirectory() && /^[0-9]{18,19}/.test(file)) { // Check if the file is a directory and matches the user ID pattern
                const userFilesDir2 = readdirSync(path.join('./music/users', file));
                const userId = file.match(/^([0-9]{18,19})/)[0]; // Extract the user ID from the directory name
                for (const file2 of userFilesDir2) {
                    if (!allowedExtensions.some(ext => file2.endsWith(ext))) continue; // Check if the file has a valid extension
                    if ( !client.soundFiles.has(userId) ) {
                        client.soundFiles.set(userId, []);
                    }
                    client.soundFiles.get(userId).push(
                        {
                            path: path.join('./music/users', file, file2),
                            filename: file2,
                            chance: file2.includes('$ch=') ? parseFloat(file2.split('ch=')[1]) : undefined,
                            join: file2.includes('$join') || !file2.includes('$leave'), //!includes('$leave') would prob be enough, it also sets true if it does not include either
                            leave: file2.includes('$leave'),
                            once: file2.includes('$once'),
                            valid: !file2.includes('$used')
                        }
                    );
                }
            }

            if (!statSync(path.join('./music/users', file)).isDirectory() && /^[0-9]{18,19}/.test(file)) { // Check if the file is not directory and matches the user ID pattern  
                if (!allowedExtensions.some(ext => file.endsWith(ext))) continue; // Check if the file has a valid extension
                const userId = file.match(/^([0-9]{18,19})/)[0]; // Extract the user ID from the file name
                if ( !client.soundFiles.has(userId) ) {
                    client.soundFiles.set(userId, []);
                }
                client.soundFiles.get(userId).push(
                    {
                        path: path.join('./music/users', file),
                        filename: file,
                        chance: file.includes('$ch=') ? parseFloat(file.split('ch=')[1]) : undefined,
                        join: file.includes('$join') || !file.includes('$leave'),
                        leave: file.includes('$leave'),
                        once: file.includes('$once'),
                        valid: !file.includes('$used')
                    }
                );
            }  
        }

        const everyoneFilesDir = readdirSync('./music/everyone');
        client.soundFiles.set('everyone', []);
        for (const file of everyoneFilesDir) {
            if (!allowedExtensions.some(ext => file.endsWith(ext))) continue; // Check if the file has a valid extension
            client.soundFiles.get('everyone').push(
                {
                    path: path.join('./music/everyone', file),
                    filename: file,
                    chance: file.includes('$ch=') ? parseFloat(file.split('ch=')[1]) : undefined,
                    join: file.includes('$join') || !file.includes('$leave'),
                    leave: file.includes('$leave'),
                    once: file.includes('$once'),
                    valid: !file.includes('$used')
                }
            );
        }

        const defaultFilesDir = readdirSync('./music/default');
        client.soundFiles.set('default', []);
        for (const file of defaultFilesDir) {
            if (!allowedExtensions.some(ext => file.endsWith(ext))) continue; // Check if the file has a valid extension
            client.soundFiles.get('default').push(
                {
                    path: path.join('./music/default', file),
                    filename: file,
                    chance: file.includes('$ch=') ? parseFloat(file.split('ch=')[1]) : undefined,
                    join: file.includes('$join') || !file.includes('$leave'),
                    leave: file.includes('$leave'),
                    once: file.includes('$once'),
                    valid: !file.includes('$used')
                }
            );
        }
        
        resolve();
    });
}

/**
 * Gets a sound file for the user based on the type (join or leave).
 * @param {Client} client - The client instance.
 * @param {string} userId - The ID of the user.
 * @param {string} type - The type of sound file ('join' or 'leave').
 * @returns {Promise<[object, boolean]>} - A promise that resolves to an array containing the sound file object and a boolean indicating if it is a default sound file.
 */
const getSoundFile = (client, userId, type) => {
    return new Promise(async (resolve, reject) => {

        let selectionArray = [];
        let defaultType = false;
        if ( client.soundFiles.has(userId) ) { // if userId has his own sound files
            const userFiles = client.soundFiles.get(userId).filter(item => {
                if (type == 'join') return item.join && item.valid;
                if (type == 'leave') return item.leave && item.valid;
            });
            if (userFiles.length != 0 || true) { // if no custom sound files for join/leave are found, eg. userFiles.length == 0, revert to default and everyone files by leaving the selectionArray.length at 0, the other one will take care of it
                const everyoneFiles = client.soundFiles.get('everyone').filter(item => {
                    if (type == 'join') return item.join && item.valid;
                    if (type == 'leave') return item.leave && item.valid;
                });
                selectionArray = [...userFiles, ...everyoneFiles]; // combine user files and everyone files
            }
        }
        if ( !client.soundFiles.has(userId) || selectionArray.length == 0 ) { // if userId does not have his own sound files
            selectionArray = [...client.soundFiles.get('default'), ...client.soundFiles.get('everyone')].filter(item => {
                if (type == 'join') return item.join && item.valid;
                if (type == 'leave') return item.leave && item.valid;
            });
            defaultType = true;
        }
        if (selectionArray.length == 0) { // if no sound files are found, return null
            resolve( [null, defaultType]);
            return;
        }


        const probabilities = new Array(selectionArray.length).fill(undefined);
        let defaultProbability = 1;
        for (let i = 0; i < selectionArray.length; i++) {
            if (!isNaN(selectionArray[i].chance)) {
                probabilities[i] = selectionArray[i].chance;
                defaultProbability -= selectionArray[i].chance;
            }
        }
        if (defaultProbability < 0) defaultProbability = 0;

        // Find all indexes of undefined in probabilities array and replace them with defaultProbability / indexes.length
        const indexes = [];
        probabilities.forEach((item, index) => {
            if (item === undefined) indexes.push(index);
        });
        for (let i = 0; i < indexes.length; i++) {
            probabilities[indexes[i]] = defaultProbability / indexes.length;
        }

        // Choose a random item from the array based on probabilities
        const randomNumber = Math.random() * probabilities.reduce((acc, probability) => acc + probability, 0);
        // Iterate through the probabilities and keep track of the running sum
        let runningSum = 0; // running sum of probabilities, each iteration adds the current probability to the running sum

        for (let i = 0; i < probabilities.length; i++) {
            // If the random number is less than the running sum + current probability, choose the current item 
            if (randomNumber < (runningSum += probabilities[i])) {
                // Return the chosen item
                if (existsSync(selectionArray[i].path)) {
                    resolve( [selectionArray[i], defaultType] );
                    return;
                }
                await syncSoundFiles(client);
                resolve( await getSoundFile(client, userId, type) );
                return;
            }
        }
    });
}


/**
 * Invalidates a sound file by renaming it to a new name with a suffix indicating it has been used.
 * @param {Client} client - The client instance.
 * @param {string} path - The path of the sound file to invalidate.
 * @returns {void}
 */
const invalidateSoundFile = (client, path) => {
    if (!existsSync(path)) return;
    let i = 1;
    while (existsSync( path.slice(0, path.lastIndexOf('.')) + `_$used${i}` + path.slice(path.lastIndexOf('.')) ) ) i++;
    renameSync(path,   path.slice(0, path.lastIndexOf('.')) + `_$used${i}` + path.slice(path.lastIndexOf('.')) );

    syncSoundFiles(client);
}


module.exports = {
    syncSoundFiles,
    getSoundFile,
    invalidateSoundFile
}
