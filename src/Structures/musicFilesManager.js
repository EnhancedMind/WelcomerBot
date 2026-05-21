const { readdirSync, existsSync, renameSync, statSync } = require('fs');
const path = require('path');

const Client = require('./Client.js');
const { bot: {prefix}, player: { allowedExtensions }, directories: {userMusicDir, everyoneMusicDir, defaultMusicDir, topMusicDir} } = require('../../config/config.json');
const { getSetting } = require('../Structures/settingsManager.js');
const { dir } = require('console');

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
            const dirOrFilePath = path.join(userMusicDir, dirOrFile);

            if (statSync(dirOrFilePath).isDirectory()) { // Check if the dirOrfile is a directory
                syncDir(client, userId, dirOrFilePath);
            }
            else { // Here just for legacy reasons, now each user should have their own directory
                if(!allowedExtensions.some(ext => dirOrFile.endsWith(ext))) continue; // Check if the file has a valid extension
                if ( !client.soundFiles.has(userId) ) {
                    client.soundFiles.set(userId, []);
                }
                const targetList = client.soundFiles.get(userId);
                addSoundToList(targetList, dirOrFilePath, dirOrFile);
            }
        }

        syncDir(client, 'everyone', everyoneDirComparison);
        syncDir(client, 'default', defaultDirComparison);
        resolve();
    });
}

/**
 * Prefix DFS through the directory, making an array tree of the directory with valid sound files as leaves and directories as inner nodes
 * @param {string} dirPath - The path to the directory to be traversed
 * @returns {Object[]} - An array representing the directory tree, with nodes in the form of ['dir', name, subtree] or ['sound', name]
 */
function syncDir(client, targetListId, dirPath) {
    const dirTree = dirSoundTree(dirPath);
    if(dirTree.length === 0) return; // Directory does not contain any valid sound files.

    if ( !client.soundFiles.has(targetListId) ) {
        client.soundFiles.set(targetListId, []);
    }
    const targetList = client.soundFiles.get(targetListId);
    syncDirTree(targetList, dirPath, dirTree);
}

/**
 * Makes an array tree of the directory with valid sound files as leaves and directories as inner nodes, prunes empty directories
 * @param {string} dirPath - The path to the directory to be traversed
 * @returns {Object[]} - An array representing the directory tree, with nodes in the form of ['dir', name, subtree] or ['sound', name]
 */
function dirSoundTree(dirPath) {
    const reader = readdirSync(dirPath);
    let dirTree = []

    // Recursive prefix DFS through the directory 
    for(const dirOrFile of reader) {
        const dirOrFile = path.join(dirPath, dirOrFile);
        if(statSync(dirOrFile).isDirectory()) {
            const subDirTree = dirSoundTree(dirOrFile);
            if(subDirTree.length !== 0) dirTree.push(['dir', dirOrFile , subDirTree]);
        }
        else {
            if(allowedExtensions.some(ext => dirOrFile.endsWith(ext))) dirTree.push(['sound', dirOrFile]);
        }
    }

    return dirTree;
}

/**
 * Syncs the directory tree
 * @param {Object[]} targetList - List to which the item will be added
 * @param {string} dirPath - Path from base to this directory
 * @param {Object[]} dirTree - The subtree of dirSoundTree for this directory
 * @param {number|null} [chance] - The default chance for the directory above if no explicit chance is set
 * @param {boolean} joinType - Whether the directory above is marked for joining
 * @param {boolean} leaveType - Whether the directory above is marked for leaving
 * @param {boolean} onceType - Whether the directory above is marked to be used once
 * @returns {void}
 */
function syncDirTree(targetList, dirPath, dirTree, chance = undefined, joinType = false, leaveType = false, onceType = false) {
    const defaultChance = (chance) ? chance / dirTree.length : undefined;
    for(const node of dirTree) {
        if(node[0] == 'dir') {
            const [_, subName, subTree] = node;
            const subChance = subName.includes('$ch=') ? parseFloat(subName.split('ch=')[1]) : defaultChance; // Override chance or take the dir's
            const subJoin = subName.includes('$join') ? true : joinType;
            const subLeave = subName.includes('$leave') ? true : leaveType;
            const subOnce = subName.includes('$once') ? true : onceType;
            syncDirTree(targetList, path.join(dirPath, subName), subTree, subChance, subJoin, subLeave, subOnce);
        }
        else if(node[0] == 'sound') {
            const [_, fileName] = node;
            addSoundToList(targetList, path.join(dirPath, fileName), fileName, defaultChance, joinType, leaveType, onceType);
        }
        else {
            console.log(`Misbehaved node ${node} in ${dirPath}`);
        }
    }
}

/**
 * Adds sound to the client instance database
 * @param {Object[]} targetList - List to which the item will be added
 * @param {string} filePath - Path from base to file
 * @param {string} fileName - The name of the file
 * @param {number|null} [chance] - The default chance for the sound if no explicit chance is set
 * @param {boolean} joinType - Whether this sound is marked for joining
 * @param {boolean} leaveType - Whether this sound is marked for leaving
 * @param {boolean} onceType - Whether this sound is marked to be used once
 * @returns {void}
 */
function addSoundToList(targetList, filePath, fileName, defaultChance = undefined, joinType = false, leaveType = false, onceType = false) { // temporary fix here
    const finalChance = fileName.includes('$ch=') ? parseFloat(fileName.split('ch=')[1]) : defaultChance;
    const soundFileData = {
        path: filePath,
        filename: fileName,
        chance: finalChance,
        join: fileName.includes('$join') || joinType, // temporary fix here
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
 * @param {string} guildId - The id of the guild.
 * @returns {Object[]} - The sound file object array.
 */
async function getUserSoundArray(client, userId, type, guildId) {
    const guildSettings = await getSetting(client, 'guild', guildId);
    const userSettings = await getSetting(client, 'user', userId);
    const setting = { // check explicitly if either if false, otherwise default to true
        enabledJoin: !(guildSettings?.enabledJoin === false || userSettings?.enabledJoin === false),
        enabledDefaultJoin: !(guildSettings?.enabledDefaultJoin === false || userSettings?.enabledDefaultJoin === false),
        enabledLeave: !(guildSettings?.enabledLeave === false || userSettings?.enabledLeave === false),
        enabledDefaultLeave: !(guildSettings?.enabledDefaultLeave === false || userSettings?.enabledDefaultLeave === false),
    }

    if (type === 'join' && setting.enabledJoin === false) {
        return [];
    }
    if (type === 'leave' && setting.enabledLeave === false) {
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
        if (type === 'join' && setting.enabledDefaultJoin === false) {
            return [];
        }
        if (type === 'leave' && setting.enabledDefaultLeave === false) {
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
        const selectionArray = await getUserSoundArray(client, userId, type, guildId);

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
                resolve( await getUserSoundFile(client, userId, type, guildId) );
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
    findProbabilities,
    invalidateSoundFile,
    defaultDirComparison,
    everyoneDirComparison,
    userDirComparison,
    musicDirComparison
}
