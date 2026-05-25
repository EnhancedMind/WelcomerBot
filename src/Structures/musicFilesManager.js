const { readdir, rename, stat } = require('fs/promises');
const path = require('path');
const Fuse = require('fuse.js');
const { spawn } = require('child_process');

const Client = require('./Client.js');
const { exists } = require('../utils/fsUtils.js');
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
async function syncSoundFiles (client) {
    client.soundFiles.clear();

    const userDirReader = await readdir(userMusicDir);
    for (const dirOrFile of userDirReader) {
        if(!/^[0-9]{18,19}/.test(dirOrFile)) continue; //Check if dirOrFile matches the user ID pattern
        const userId = dirOrFile.match(/^([0-9]{18,19})/)[0]; // Extract the user ID from the directory name
        const dirOrFilePath = path.join(userMusicDir, dirOrFile);

        if ((await stat(dirOrFilePath)).isDirectory()) { // Check if the dirOrfile is a directory
            await syncDir(client, userId, dirOrFilePath);
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

    await syncDir(client, 'everyone', everyoneDirComparison);
    await syncDir(client, 'default', defaultDirComparison);
}

/**
 * Prefix DFS through the directory, making an array tree of the directory with valid sound files as leaves and directories as inner nodes
 * @param {string} dirPath - The path to the directory to be traversed
 * @returns {Object[]} - An array representing the directory tree, with nodes in the form of ['dir', name, subtree] or ['sound', name]
 */
async function syncDir(client, targetListId, dirPath) {
    const dirTree = await dirSoundTree(dirPath);
    if(dirTree.length === 0) return; // Directory does not contain any valid sound files.

    if ( !client.soundFiles.has(targetListId) ) {
        client.soundFiles.set(targetListId, []);
    }
    const targetList = client.soundFiles.get(targetListId);
    await syncDirTree(targetList, dirPath, dirTree);
}

/**
 * Makes an array tree of the directory with valid sound files as leaves and directories as inner nodes, prunes empty directories
 * @param {string} dirPath - The path to the directory to be traversed
 * @returns {Object[]} - An array representing the directory tree, with nodes in the form of ['dir', name, subtree] or ['sound', name]
 */
async function dirSoundTree(dirPath) {
    const reader = await readdir(dirPath);
    let dirTree = []

    // Recursive prefix DFS through the directory 
    for(const dirOrFile of reader) {
        const dirOrFilePath = path.join(dirPath, dirOrFile);
        if((await stat(dirOrFilePath)).isDirectory()) {
            const subDirTree = await dirSoundTree(dirOrFilePath);
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
async function syncDirTree(targetList, dirPath, dirTree, chance = undefined, chanceOrigin = undefined, joinType = false, leaveType = false, onceType = false) {
    const defaultChance = (chance) ? chance / dirTree.length : undefined;
    for(const node of dirTree) {
        if(node[0] == 'dir') {
            const [_, subName, subTree] = node;
            const subChance = subName.includes('$ch=') ? parseFloat(subName.split('ch=')[1]) : defaultChance; // Override chance or take the dir's
            const newChanceOrigin = (subChance != defaultChance) ? subName : chanceOrigin; // If we have an overridden chance, the origin becomes the subdirectory, otherwise we keep the inherited origin
            const subJoin = subName.includes('$join') ? true : joinType;
            const subLeave = subName.includes('$leave') ? true : leaveType;
            const subOnce = subName.includes('$once') ? true : onceType;
            await syncDirTree(targetList, path.join(dirPath, subName), subTree, subChance, newChanceOrigin, subJoin, subLeave, subOnce);
        }
        else if(node[0] == 'sound') {
            const [_, fileName] = node;
            addSoundToList(targetList, path.join(dirPath, fileName), fileName, defaultChance, chanceOrigin, joinType, leaveType, onceType);
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
function addSoundToList(targetList, filePath, fileName, defaultChance = undefined, chanceOrigin = undefined, joinType = false, leaveType = false, onceType = false) {
    const finalChance = fileName.includes('$ch=') ? parseFloat(fileName.split('$ch=')[1]) : defaultChance;
    const finalChanceOrigin = finalChance != defaultChance ? fileName : chanceOrigin;
    const soundFileData = {
        path: filePath,
        filename: fileName,
        chance: finalChance,
        chanceOrigin: finalChanceOrigin,
        join: fileName.includes('$join') || joinType || !(fileName.includes('$leave') || leaveType),
        leave: fileName.includes('$leave') || leaveType,
        once: fileName.includes('$once') || onceType,
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
 * @param {string} userId - The ID of the guild.
 * @returns {Promise<Object>} - A promise that resolves to a sound file object.
 */
async function getUserSoundFile (client, userId, type, guildId) {
    const selectionArray = await getUserSoundArray(client, userId, type, guildId);

    if(selectionArray.length === 0) return null;

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
            if (await exists(selectionArray[i].path)) {
                return selectionArray[i];
            }
            await syncSoundFiles(client); // if the file does not exist, for example it was deleted manually, resync the sound files and try again
            return await getUserSoundFile(client, userId, type, guildId);
        }
    }
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
 * Get the users directory for usersounds, or creates it if non-existent
 * @param {Client} client - The client instance.
 * @param {string} targetId - The id of the user
 * @returns {string} The relative path to the user directory
 */
async function getUserPath(client, targetId) {
    const userDirReader = await readdir(userMusicDir);

    // Attempting to find users directory
    let fileOrDir = undefined;
    for(fileOrDir of userDirReader) {
        if(!fileOrDir.startsWith(targetId)) { // Check if fileOrDir matches the user ID pattern
            fileOrDir = undefined;
            continue;
        } 
        if((await stat(path.join(userMusicDir, fileOrDir))).isDirectory()) break; // User's directory found
        fileOrDir = undefined;
    }

    const dirTag = (fileOrDir === undefined) ? (await client.users.fetch(targetId)).globalName : ''; // awesome oneliner to avoid API call if user alreay has a dir, im so proud of myself - EnhancedMind
    const userDirName = (fileOrDir !== undefined) ? fileOrDir : `${targetId}_${dirTag}`;
    const userDirPath = path.join(userMusicDir, userDirName);

    if(fileOrDir === undefined) {
        await mkdir(userDirPath, { recursive: true });
    }

    return userDirPath;
}

/**
 * Returns the duration of a file with ffprobe, or rejects with an error.
 * @param {string} inputPath - The path of the file.
 * @returns {Promise<number>} The duration in seconds.
 */
async function getFileDuration(inputPath) {
    return new Promise((resolve, reject) => {
        const ffprobeProcess = spawn(`ffprobe`, [
            '-i', path.resolve(inputPath), //input file
            '-show_entries', 'format=duration', //only show duration
            '-v', 'quiet', //prevent output spam
            '-of', 'csv=p=0' //output only the duration in seconds 
            ]
        );

        let output = '';

        ffprobeProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        ffprobeProcess.on('close', (code) => {
            if (code == 0) {
                const duration = parseFloat(output);
                if (isNaN(duration)) reject(new Error('Failed to parse duration from ffprobe output'));
                else resolve(duration);
            }
            else {
                reject(new Error(`ffprobe exited with code ${code}`));
            }
        });

        ffprobeProcess.on('error', (err) => reject(err));
    });
}

/**
 * Searches for sound files using prioritly exact match for path or filename, secondarily using fuzzy search.
 * @param {Object} options - The search options.
 * @param {Client} options.client - The client instance.
 * @param {string} options.searchString - The query string to search for.
 * @param {string|number|null} [options.firstPriorityUserId=null] - The ID of the prioritized user, if any.
 * @param {boolean} [options.joinFlag=false] - Whether this search should search only for join sounds. Additive with leaveFlag.
 * @param {boolean} [options.leaveFlag=false] - Whether this search should search only for leave sounds. Additive with joinFlag.
 * @param {number} [options.threshold=0.35] - Fuzzy search threshold. 0.0 is perfect match, 1.0 is loose. Defaults to 0.35, gives reasonable results.
 * @returns {{ results: Array<[Object]>, reason: string }} An object containing the Fuse.js search results and the status reason.
 */
function searchSoundFiles({client, searchString, firstPriorityUserId = null, joinFlag = false, leaveFlag = false, threshold = 0.35}) {
    const soundMap = client.soundFiles;
    
    const allKeys = Array.from(soundMap.keys());
    const priorityOrder = [];

    if (soundMap.has(firstPriorityUserId)) priorityOrder.push({ key: firstPriorityUserId, priorityIndex: 1 });
    allKeys.forEach(k => {
        if (k !== firstPriorityUserId && k !== 'everyone' && k !== 'default') {
            priorityOrder.push({ key: k, priorityIndex: 2 });
        }
    });
    if (soundMap.has('everyone')) priorityOrder.push({ key: 'everyone', priorityIndex: 3 });
    if (soundMap.has('default')) priorityOrder.push({ key: 'default', priorityIndex: 4 });

    const searchablePool = [];

    // single-pass loop for exact match and pool generation at the same time
    for (const { key, priorityIndex } of priorityOrder) {
        const filesToSearch = soundMap.get(key);
        if (!filesToSearch) continue;

        for (const file of filesToSearch) {
            // remove extension for quality-of-life filename matching
            const filenameNoExt = file.filename.substring(0, file.filename.lastIndexOf('.')) || file.filename;

            // exact path or exact file name match
            if (file.path == searchString || file.filename == searchString || filenameNoExt == searchString) {
                const result = {
                    results: [{
                        item: file,
                        refIndex: 0,
                        score: 0
                    }],
                    reason: 'Exact Match'
                }
                return result;
            }

            // setup for fuzzy search: if no exact match, filter by flags and add to fuzzy pool
            if (joinFlag && !file.join) continue;
            if (leaveFlag && !file.leave) continue;

            searchablePool.push({ ...file, priorityIndex });
        }
    }

    // fuzzy search fallback (Fuse.js)
    if (searchablePool.length == 0) {
        const result = {
            results: [],
            reason: 'Not Found'
        }
        return result;
    }

    const fuse = new Fuse(searchablePool, {
        keys: ['filename'],
        useTokenSearch: true,
        tokenize: /[\p{L}\p{M}\p{N}]+/gu,  // default for Fuse.js, but also seperate by underscores, (default:   /[\p{L}\p{M}\p{N}_]+/gu   )
        threshold: threshold,       // max score the lib will return (0.0 is perfect, 1.0 is loose), no actually idk, but it seems to affect it, 0.35 feels reasonable, gives reasonable results
        includeScore: true
    });

    const fuzzyResults = fuse.search(searchString);

    const result = {
        results: fuzzyResults,
        reason: 'Fuzzy Search'
    }
    return result;
}

/**
 * Invalidates a sound file by renaming it to a new name with a suffix indicating it has been used.
 * @param {Client} client - The client instance.
 * @param {string} path - The path of the sound file to invalidate.
 * @returns {void}
 */
async function invalidateSoundFile (client, path) {
    if (!(await exists(path))) return;
    let i = 1;
    while (await exists( path.slice(0, path.lastIndexOf('.')) + `_$used${i}` + path.slice(path.lastIndexOf('.')) ) ) i++;
    await rename(path,   path.slice(0, path.lastIndexOf('.')) + `_$used${i}` + path.slice(path.lastIndexOf('.')) );
    await syncSoundFiles(client);
}

module.exports = {
    syncSoundFiles,
    getUserSoundFile,
    getUserSoundArray,
    findProbabilities,
    getUserPath,
    getFileDuration,
    searchSoundFiles,
    invalidateSoundFile,
    defaultDirComparison,
    everyoneDirComparison,
    userDirComparison,
    musicDirComparison
}
