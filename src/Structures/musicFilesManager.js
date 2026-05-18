const { readdirSync, existsSync, renameSync, statSync } = require('fs');
const path = require('path');

const Client = require('./Client.js');
const { player: { allowedExtensions } } = require('../../config/config.json');

const usersDir = './music/users';
const everyoneDir = './music/everyone';
const defaultDir = './music/default';

/**
 * Syncs the sound files from the music directory to the client instance database.
 * @param {Client} client - The client instance.	
 * @returns {Promise<void>} - A promise that resolves when the sound files are synced.
 */
const syncSoundFiles = (client) => {
    return new Promise((resolve, reject) => {
        client.soundFiles.clear();

        const userDirReader = readdirSync(usersDir);
        for (const dirOrFile of userDirReader) {
            if(!/^[0-9]{18,19}/.test(dirOrFile)) continue; //Check if dirOrFile matches the user ID pattern
            const userId = dirOrFile.match(/^([0-9]{18,19})/)[0]; // Extract the user ID from the directory name

            if (statSync(path.join(usersDir, dirOrFile)).isDirectory()) { // Check if the dirOrfile is a directory
                const userFileReader = readdirSync(path.join(usersDir, dirOrFile));

                for (const file of userFileReader) {
                    const filePath = path.join(usersDir, dirOrFile, file);
                    addUserSoundToList(client, userId, filePath, file);
                }
            }
            else { // Clearly dirOrfile is not a directory
                const filePath = path.join(usersDir, dirOrFile);
                addUserSoundToList(client, userId, filePath, dirOrFile);
            }
        }

        const everyoneDirReader = readdirSync(everyoneDir);
        client.soundFiles.set('everyone', []);
        for (const dirOrFile of everyoneDirReader) {
            if(statSync(path.join(everyoneDir, dirOrFile)).isDirectory()) {  // Check if the dirOrfile is a directory
                const everyoneFileReader = readdirSync(path.join(everyoneDir, dirOrFile));
                if (!everyoneFileReader.length) continue; // skip empty folders
                const fileChance = dirOrFile.includes('$ch=') ? (parseFloat(dirOrFile.split('ch=')[1]/everyoneFileReader.length)) : undefined;  // chance set for the folder divided by number of files inside
                //TODO: unclear what to do with a folder
                
                //TODO: unclear what to do with a folder
                for (const file of everyoneFileReader) {
                    const targetList = client.soundFiles.get('everyone');
                    const filePath = path.join(everyoneDir, dirOrFile, file);
                    addSoundToList(targetList, filePath, file);
                }
            }
            else {
                const fileChance = dirOrFile.includes('$ch=') ? (parseFloat(dirOrFile.split('ch=')[1])) : undefined;  // chance set for the folder divided by number of files inside
                const targetList = client.soundFiles.get('everyone');
                const filePath = path.join(everyoneDir, dirOrFile);
                addSoundToList(targetList, filePath, dirOrFile, fileChance);
            }
        }

        const defaultFileReader = readdirSync(defaultDir);
        client.soundFiles.set('default', []);
        for (const file of defaultFileReader) {
            const targetList = client.soundFiles.get('default');
            const filePath = path.join(defaultDir, file);
            addSoundToList(targetList, filePath, file);
        }

        resolve();
    });
}

/**
 * Adds user sound to the client instance database
 * @param {Client} client - The client instance.
 * @param {string} userId - The ID of the user.
 * @param {string} filePath - Path from base to file
 * @param {string} fileName - If the above is a dir, here is the file
 * @returns {void}
 */
function addUserSoundToList(client, userId, filePath, fileName) {
    if (!allowedExtensions.some(ext => fileName.endsWith(ext))) return; // Check if the file has a valid extension
    if ( !client.soundFiles.has(userId) ) {
        client.soundFiles.set(userId, []);
    }

    const targetList = client.soundFiles.get(userId);
    addSoundToList(targetList, filePath, fileName);
}

/**
 * Adds sound to the client instance database
 * @param targetList - List to which the item
 * @param {string} filePath - Path from base to file
 * @param {string} fileName - If the above is a dir, here is the file
 * @returns {void}
 * @param {number|null} [chanceOverride] - Optional manual float override for the playback chance.
 */
function addSoundToList(targetList, filePath, fileName, chanceOverride = undefined) {
    if (!allowedExtensions.some(ext => fileName.endsWith(ext))) return; // Check if the file has a valid extension

    var finalChance;
    if (chanceOverride !== undefined) {
        finalChance = chanceOverride; // Can be a float (e.g., 0.25) or explicitly null
    } else {
        finalChance = fileName.includes('$ch=') ? parseFloat(fileName.split('ch=')[1]) : undefined;
    }

    const soundFileData = {
        path: filePath,
        filename: fileName,
        chance: finalChance,
        join: fileName.includes('$join') || !fileName.includes('$leave'),
        leave: fileName.includes('$leave'),
        once: fileName.includes('$once'),
        valid: !fileName.includes('$used')
    };

    targetList.push(soundFileData);
};

/**
 * Gets a list of all sounds played for the user.
 * @param {Client} client - The client instance.
 * @param {string} userId - The ID of the user.
 * @returns {[object[], boolean]} - A promise that resolves to an array containing the sound file object array and a boolean indicating if it is a default sound file.
 */
function getUserSoundArray(client, userId) {
    let array = [];  // array of sound files to choose from
    let defaultType = false;  // whether the user has his own sound files or if just default/everyone ones are used, returned as second value to voiceStateUpdate to check with settings
    
    if ( client.soundFiles.has(userId) ) { // if userId has his own sound files
        const userFiles = client.soundFiles.get(userId);
        
        if (userFiles.length !== 0) { // if no custom sound files for join/leave are found, eg. userFiles.length == 0, revert to default and everyone files by leaving the selectionArray.length at 0, the other one will take care of it
            const everyoneFiles = client.soundFiles.get('everyone');
            array = [...userFiles, ...everyoneFiles]; // combine user files and everyone files
        }
    }
    
    if (array.length === 0 ) { // if userId does not have his own sound files
        array = [...client.soundFiles.get('default'), ...client.soundFiles.get('everyone')];
        defaultType = true;

        if (array.length === 0) { // if no sound files :D
            return [null, defaultType];
        }
    }

    return [array, defaultType];
}

/**
 * Gets a sound file for the user based on the type (join or leave).
 * @param {Client} client - The client instance.
 * @param {string} userId - The ID of the user.
 * @param {string} type - The type of sound file ('join' or 'leave').
 * @returns {Promise<[object, boolean]>} - A promise that resolves to an array containing the sound file object and a boolean indicating if it is a default sound file.
 */
const getUserSoundFile = (client, userId, type) => {
    return new Promise(async (resolve, reject) => {
        let [userSoundArray, defaultType] = getUserSoundArray(client, userId)

        if(userSoundArray.length === 0) {
            resolve([null, defaultType]);
            return;
        }

        const selectionArray = userSoundArray.filter(item => {
            if (type == 'join') return item.join && item.valid;
            if (type == 'leave') return item.leave && item.valid;
        })

        const probabilities = new Array(selectionArray.length).fill(undefined);
        let undefProbability = 1;
        let undefCount = 0;
        for (let i = 0; i < selectionArray.length; i++) {
            const chance = selectionArray[i].chance; 
            if (isNaN(chance)) {
                undefCount++;
                continue;
            }
            probabilities[i] = chance;
            undefProbability -= Math.abs(chance); // Negative chance would force play the user's first sound
        }

        const probabilitySum = (undefProbability < 0) ? 1 - undefProbability : 1;
        if (undefProbability < 0) undefProbability = 0;

        for (let i = 0; i < probabilities.length; i++) {
            if(isNaN(selectionArray[i].chance)) {
                probabilities[i] = undefProbability / undefCount;
            }
        }

        
        // Choose a random item from the array based on probabilities,
        // this number is between 0 and the sum of all probabilities so scaled accordingly
        const randomNumber = Math.random() * probabilitySum;

        // Iterate through the probabilities and keep track of the running sum
        let runningSum = 0; // running sum of probabilities, each iteration adds the current probability to the running sum

        for (let i = 0; i < probabilities.length; i++) {
            // If the random number is less than the running sum + current probability, choose the current item 
            if (randomNumber < (runningSum += probabilities[i])) { //check and add to running sum at the same time
                // Return the chosen item
                if (existsSync(selectionArray[i].path)) {
                    resolve( [selectionArray[i], defaultType] );
                    return;
                }
                await syncSoundFiles(client); // if the file does not exist, for example it was deleted manually, resync the sound files and try again
                resolve( await getUserSoundFile(client, userId, type) );
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
    getUserSoundFile,
    getUserSoundArray,
    invalidateSoundFile
}
