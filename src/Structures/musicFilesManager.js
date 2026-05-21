const { readdirSync, existsSync, renameSync, statSync } = require('fs');
const path = require('path');

const Client = require('./Client.js');
const { bot: {prefix}, player: { allowedExtensions }, directories: {userMusicDir, everyoneMusicDir, defaultMusicDir, topMusicDir} } = require('../../config/config.json');
const { getSetting } = require('../Structures/settingsManager.js');

const userDirComparison = userMusicDir.split('/').join(path.sep).substring(2);
const everyoneDirComparison = everyoneMusicDir.split('/').join(path.sep).substring(2);
const defaultDirComparison = defaultMusicDir.split('/').join(path.sep).substring(2);
const musicDirComparison = topMusicDir.split('/').join(path.sep).substring(2);

/**
 * Syncs the sound files from the music directory to the client instance database.
 * @param {Client} client - The client instance.	
 * @returns {Promise<void>} - A promise that resolves when the sound files are synced.
 */
const syncSoundFiles = (client) => {
    return new Promise((resolve, reject) => {
        client.soundFiles.clear();

        const userDirReader = readdirSync(userMusicDir);
        for (const dirOrFile of userDirReader) {
            if(!/^[0-9]{18,19}/.test(dirOrFile)) continue; //Check if dirOrFile matches the user ID pattern
            const userId = dirOrFile.match(/^([0-9]{18,19})/)[0]; // Extract the user ID from the directory name

            if (statSync(path.join(userMusicDir, dirOrFile)).isDirectory()) { // Check if the dirOrfile is a directory
                const userFileReader = readdirSync(path.join(userMusicDir, dirOrFile));

                for (const file of userFileReader) {
                    const filePath = path.join(userMusicDir, dirOrFile, file);
                    addUserSoundToList(client, userId, filePath, file);
                }
            }
            else { // Clearly dirOrfile is not a directory
                const filePath = path.join(userMusicDir, dirOrFile);
                addUserSoundToList(client, userId, filePath, dirOrFile);
            }
        }

        const everyoneDirReader = readdirSync(everyoneMusicDir);
        client.soundFiles.set('everyone', []);
        for (const dirOrFile of everyoneDirReader) {
            if(statSync(path.join(everyoneMusicDir, dirOrFile)).isDirectory()) {  // Check if the dirOrfile is a directory
                const everyoneFileReader = readdirSync(path.join(everyoneMusicDir, dirOrFile)).filter(file => allowedExtensions.some(ext => file.endsWith(ext))); // filter files by allowed extensions, to prevent folder chances from being skewed by non-sound or system files
                if (!everyoneFileReader.length) continue; // skip empty folders
                const fileChance = dirOrFile.includes('$ch=') ? (parseFloat(dirOrFile.split('ch=')[1])/everyoneFileReader.length) : undefined;  // chance set for the folder divided by number of files inside
                for (const file of everyoneFileReader) {
                    const targetList = client.soundFiles.get('everyone');
                    const filePath = path.join(everyoneMusicDir, dirOrFile, file);
                    addSoundToList(targetList, filePath, file, fileChance, true, dirOrFile.includes('$join'), dirOrFile.includes('$leave'), dirOrFile.includes('$once')); // temporary fix here
                }
            }
            else {
                const targetList = client.soundFiles.get('everyone');
                const filePath = path.join(everyoneMusicDir, dirOrFile);
                addSoundToList(targetList, filePath, dirOrFile);
            }
        }

        const defaultFileReader = readdirSync(defaultMusicDir);
        client.soundFiles.set('default', []);
        for (const file of defaultFileReader) {
            const targetList = client.soundFiles.get('default');
            const filePath = path.join(defaultMusicDir, file);
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
 * @param {string} fileName - Name of the file
 * @returns {void}
 */
function addUserSoundToList(client, userId, filePath, fileName) {
    if (!allowedExtensions.some(ext => fileName.endsWith(ext))) return; // Check if the file has a valid extension

    if ( !client.soundFiles.has(userId) ) {
        client.soundFiles.set(userId, []);
    }

    const targetList = client.soundFiles.get(userId);
    addSoundToList(targetList, filePath, fileName, undefined, false);
}

/**
 * Adds sound to the client instance database
 * @param targetList - List to which the item
 * @param {string} filePath - Path from base to file
 * @param {string} fileName - If the above is a dir, here is the file
 * @param {number|null} [chanceOverride] - Optional manual float override for the playback chance.
 * @param {boolean} checkExtension - Whether to check extension
 * @returns {void}
 */
function addSoundToList(targetList, filePath, fileName, chanceOverride = undefined, checkExtension = true, joinType = false, leaveType = false, onceType = false) { // temporary fix here
    if (!allowedExtensions.some(ext => fileName.endsWith(ext))) return; // Check if the file has a valid extension

    const finalChance = fileName.includes('$ch=') ? parseFloat(fileName.split('ch=')[1]) : chanceOverride;
    const soundFileData = {
        path: filePath,
        filename: fileName,
        chance: finalChance,
        join: fileName.includes('$join') || !fileName.includes('$leave') || joinType, // temporary fix here
        leave: fileName.includes('$leave') || leaveType, // temporary fix here
        once: fileName.includes('$once') || onceType, // temporary fix here
        valid: !fileName.includes('$used')
    };

    targetList.push(soundFileData);
};

/**
 * Gets a list of all sounds played for the user.
 * @param {Client} client - The client instance.
 * @param {string} userId - The ID of the user.
 * @param {string} type - The type of sound file ('join', 'leave' or 'all').
 * @param {int} guildId - The id of the guild.
 * @returns {Object[]} - The sound file object array.
 */
function getUserSoundArray(client, userId, type, guildId) {
    const guildSettings = await getSetting(client, 'guild', guildId);
    const userSettings = await getSetting(client, 'user', userId);
    const setting = { // check explicitly if either if false, otherwise default to true
        enabledJoin: !(guildSettings?.enabledJoin === false || userSettings?.enabledJoin === false),
        enabledDefaultJoin: !(guildSettings?.enabledDefaultJoin === false || userSettings?.enabledDefaultJoin === false),
        enabledLeave: !(guildSettings?.enabledLeave === false || userSettings?.enabledLeave === false),
        enabledDefaultLeave: !(guildSettings?.enabledDefaultLeave === false || userSettings?.enabledDefaultLeave === false),
    }

    if (type === 'join' && settings.enabledJoin === false) {
        return [];
    }
    if (type === 'leave' && settings.enabledLeave === false) {
        return [];
    }

    let array = [];  // array of sound files to choose from

    const filterByType = (item) => {
        if (type === 'join') return item.join && item.valid;
        if (type === 'leave') return item.leave && item.valid;
        if (type === 'all') return true;
        return false;
    };
    
    if ( client.soundFiles.has(userId) ) { // if userId has his own sound files
        array = client.soundFiles.get(userId).filter(filterByType);
    }

    if (array.length === 0) { // if userId does not have his own sound files
        if (type === 'join' && settings.enabledDefaultJoin === false) {
            return [];
        }
        if (type === 'leave' && settings.enabledDefaultLeave === false) {
            return [];
        }
        array = client.soundFiles.get('default').filter(filterByType);
    }

    const everyoneArray = client.soundFiles.get('everyone').filter(filterByType);
    array = [...array,...everyoneArray];
    return array;
}

/**
 * Gets a sound file for the user based on the type (join or leave).
 * @param {Client} client - The client instance.
 * @param {string} userId - The ID of the user.
 * @param {string} type - The type of sound file ('join', 'leave' or 'all').
 * @returns {Promise<Object>} - A promise that resolves to a sound file object.
 */
const getUserSoundFile = (client, userId, type, guildId) => {
    return new Promise(async (resolve, reject) => {
        const selectionArray = getUserSoundArray(client, userId, type, guildId);

        if(selectionArray.length === 0) {
            resolve(null);
            return;
        }

        const [probabilities, probabilitySum] = findProbabilities(selectionArray);

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
                    resolve(selectionArray[i]);
                    return;
                }
                await syncSoundFiles(client); // if the file does not exist, for example it was deleted manually, resync the sound files and try again
                resolve( await getUserSoundFile(client, userId, type, settings) );
                return;
            }
        }
    });
}

/**
 * Gets a sound file for the user based on the type (join or leave).
 * @param {object[]} songs - The songs to be weighted
 * @returns {[float[], float]} - Return an array of probabilities corresponding to each song and the sum of all probabilities
 */
function findProbabilities(songArray) {
    const probabilities = new Array(songArray.length).fill(undefined);
    let undefProbability = 1;
    let undefCount = 0;
    for (let i = 0; i < songArray.length; i++) {
        const chance = songArray[i].chance; 
        if (isNaN(chance)) {
            undefCount++;
            continue;
        }
        probabilities[i] = Math.abs(chance);
        undefProbability -= Math.abs(chance); // Negative chance would force play the user's first sound
    }

    const probabilitySum = (undefProbability >= 0 && undefCount > 0) ? 1 : 1 - undefProbability; // If we have a remainder and a song/s left to define, we will define it to 1
    if (undefProbability < 0) undefProbability = 0;

    for (let i = 0; i < probabilities.length; i++) {
        if(isNaN(songArray[i].chance)) {
            probabilities[i] = undefCount > 0 ? undefProbability / undefCount : 0;
        }
    }

    return [probabilities, probabilitySum];
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
    invalidateSoundFile,
    defaultDirComparison,
    everyoneDirComparison,
    userDirComparison,
    musicDirComparison
}
