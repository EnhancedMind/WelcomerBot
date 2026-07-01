const { readdir, mkdir, rename, stat, readFile } = require('fs/promises');
const fs = require('fs')
const path = require('path');
const Fuse = require('fuse.js');
const { spawn } = require('child_process');
const xxhash = require('xxhash-wasm');

const Client = require('./Client.js');
const { exists } = require('../utils/fsUtils.js');
const { player: { allowedExtensions, bitrate: configBitrate, debug, loudnessNormalization }, directories: {userMusicDir, everyoneMusicDir, defaultMusicDir, topMusicDir, reencodedMusicDir} } = require('../../config/config.json');
const { getSetting } = require('../Structures/settingsManager.js');
const { db } = require('./dbManager.js');
const { consoleLog } = require('../Data/Log.js');


const userDirComparison = userMusicDir.split('/').join(path.sep).substring(2);
const everyoneDirComparison = everyoneMusicDir.split('/').join(path.sep).substring(2);
const defaultDirComparison = defaultMusicDir.split('/').join(path.sep).substring(2);
const musicDirComparison = topMusicDir.split('/').join(path.sep).substring(2);
const reencodedDirComparison = reencodedMusicDir.split('/').join(path.sep).substring(2);

const reencodedDirAbs = path.resolve(reencodedMusicDir);
if (!fs.existsSync(reencodedDirAbs)) {
    fs.mkdirSync(reencodedDirAbs, { recursive: true });
}

/**
 * Syncs the sound files from the music directory to the database.
 * @returns {Promise<void>} - A promise that resolves when the sound files are synced.
 */
async function syncSoundFiles() {
    // create a temporary Map to hold the disk state
    const diskFiles = new Map();

    const userDirReader = await readdir(userMusicDir);
    for (const dirOrFile of userDirReader) {
        if(!/^[0-9]{18,19}/.test(dirOrFile)) continue; //Check if dirOrFile matches the user ID pattern
        const userId = dirOrFile.match(/^([0-9]{18,19})/)[0]; // Extract the user ID from the directory name
        const dirOrFilePath = path.join(userMusicDir, dirOrFile);

        if ((await stat(dirOrFilePath)).isDirectory()) { // Check if the dirOrfile is a directory
            await syncDir(diskFiles, userId, dirOrFilePath);
        }
        else { // Here just for legacy reasons, now each user should have their own directory
            if(!allowedExtensions.some(ext => dirOrFile.endsWith(ext))) continue; // Check if the file has a valid extension
            if ( !diskFiles.has(userId) ) {
                diskFiles.set(userId, []);
            }
            const targetList = diskFiles.get(userId);
            addSoundToList(targetList, dirOrFilePath, dirOrFile);
        }
    }

    await syncDir(diskFiles, 'everyone', everyoneDirComparison);
    await syncDir(diskFiles, 'default', defaultDirComparison);


    // hash all files
    const { create64 } = await xxhash();

    for (const soundList of diskFiles.values()) {
        for (const sound of soundList) {
            sound.hash = create64()
                .update((await stat(sound.path)).size.toString())
                .update(await readFile(sound.path))
                .digest()
                .toString(16).padStart(16, '0')
        }
    }

    // db sync
    // fetch active files currently in the database to cross-reference
    const activeDbFiles = db.prepare(/*sql*/`SELECT id, file_path, source_hash FROM files WHERE deleted_at IS NULL`).all();
    const dbMap = new Map(activeDbFiles.map(f => [f.file_path, { id: f.id, hash: f.source_hash }]));

    const insertStmt = db.prepare(/*sql*/`
        INSERT INTO files (source_hash, file_path, file_name, target_id, chance, chance_origin, is_join, is_leave, play_once, is_valid)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const updateStmt = db.prepare(/*sql*/`
        UPDATE files 
        SET chance = ?, chance_origin = ?, is_join = ?, is_leave = ?, play_once = ?, is_valid = ?, target_id = ?
        WHERE id = ?
    `);

    const softDeleteStmt = db.prepare(/*sql*/`
        UPDATE files SET deleted_at = ? WHERE id = ?
    `);

    db.transaction(() => {
        const nowUnixTimestamp = Math.floor(Date.now() / 1000);

        // compare what we found on disk against what is in the database
        for (const [targetId, soundList] of diskFiles.entries()) {
            for (const sound of soundList) {
                const dbFile = dbMap.get(sound.path);
                if (dbFile && sound.hash == dbFile.hash) {
                    // File exists on disk AND in DB. Update attributes in case folder tags/chances changed.
                    updateStmt.run(
                        sound.chance, sound.chanceOrigin,
                        sound.join ? 1 : 0, sound.leave ? 1 : 0, sound.once ? 1 : 0, sound.valid ? 1 : 0,
                        targetId, dbFile.id
                    );
                    dbMap.delete(sound.path);
                }
                else {
                    // file is on disk but not in DB
                    insertStmt.run(
                        sound.hash, sound.path, sound.filename, targetId, 
                        sound.chance, sound.chanceOrigin, 
                        sound.join ? 1 : 0, sound.leave ? 1 : 0, sound.once ? 1 : 0, sound.valid ? 1 : 0
                    );
                }
            }
        }

        // Any keys left in dbMap were NOT found on the disk. Soft-delete them.
        for (const [missingPath, missingProperties] of dbMap.entries()) {
            softDeleteStmt.run(nowUnixTimestamp, missingProperties.id);
        }
    })();

    reencodeFiles();
}

/**
 * Prefix DFS through the directory, making an array tree of the directory with valid sound files as leaves and directories as inner nodes
 * @param {Map} targetMap - The Map (diskFiles) containing all target lists
 * @param {string} targetListId - The target id (userId, 'everyone', or 'default')
 * @param {string} dirPath - The path to the directory to be traversed
 * @returns {Promise<void>}
 */
async function syncDir(targetMap, targetListId, dirPath) {
    const dirTree = await dirSoundTree(dirPath);
    if(dirTree.length === 0) return; // Directory does not contain any valid sound files.

    if ( !targetMap.has(targetListId) ) {
        targetMap.set(targetListId, []);
    }
    const targetList = targetMap.get(targetListId);
    await syncDirTree(targetList, dirPath, dirTree);
}

/**
 * Makes an array tree of the directory with valid sound files as leaves and directories as inner nodes, prunes empty directories
 * @param {string} dirPath - The path to the directory to be traversed
 * @returns {Promise<Object[]>} - An array representing the directory tree, with nodes in the form of ['dir', name, subtree] or ['sound', name]
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
 * @param {string|null} [chanceOrigin] - The directory name where the current chance override originated
 * @param {boolean} joinType - Whether the directory above is marked for joining
 * @param {boolean} leaveType - Whether the directory above is marked for leaving
 * @param {boolean} onceType - Whether the directory above is marked to be used once
 * @returns {Promise<void>}
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
 * Adds sound to the list payload
 * @param {Object[]} targetList - List to which the item will be added
 * @param {string} filePath - Path from base to file
 * @param {string} fileName - The name of the file
 * @param {number|null} [defaultChance] - The default chance for the sound if no explicit chance is set
 * @param {string|null} [chanceOrigin] - The directory name where the current chance override originated
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
 * Queries the database for files suitable for reencoding into cache and reencodes them, inserts to reencoded table
 * @returns {Promise<null>}
 */
async function reencodeFiles() {
    const existingReencodedFiles = db.prepare(/*sql*/`SELECT source_hash, file_path FROM files_reencoded`).all();
    const deleteCacheStmt = db.prepare(/*sql*/`DELETE FROM files_reencoded WHERE source_hash = ?`);

    const nonexistingFilesHash = [];

    for (const cacheFile of existingReencodedFiles) {
        if (!(await exists(cacheFile.file_path))) {
            nonexistingFilesHash.push(cacheFile.source_hash)
            consoleLog(`[INFO] Cache cleanup: Re-encoded file missing from disk. Removed registry entry for hash: ${cacheFile.source_hash}`);
        }
    }

    if (nonexistingFilesHash.length) db.transaction(() => {
        for (const hash of nonexistingFilesHash) {
            deleteCacheStmt.run(hash);
        }
    })();

    const filesToReencode = db.prepare(/*sql*/`
        SELECT f.id, f.file_path, f.source_hash 
        FROM files f
        LEFT JOIN files_reencoded fr ON f.source_hash = fr.source_hash
        WHERE f.deleted_at IS NULL 
        AND f.is_valid = 1
        AND (f.is_join = 1 OR f.is_leave = 1)
        AND f.play_once = 0
        AND (
            fr.source_hash IS NULL              -- Condition 1: Not re-encoded yet
            OR fr.loudnorm != @targetLoudnorm   -- Condition 2: Re-encoded, but wrong loudnorm state
        )
    `).all({ 
        targetLoudnorm: loudnessNormalization ? 1 : 0
    })

    const queuedHashes = new Set();
    const reencodeQueue = [];

    for (const file of filesToReencode) {
        const hash = file.source_hash;

        if (!queuedHashes.has(hash)) {
            queuedHashes.add(hash); 
            reencodeQueue.push({
                path: file.file_path,
                hash: hash
            });
        }
    }

    if (reencodeQueue.length == 0) return;

    for (const file of reencodeQueue) {
        try {
            await reencodeSingleFile(file.path, file.hash);
        }
        catch (error) {
            consoleLog(`[ERR] Failed to re-encode file at ${file.path}:`, error);
        }
    }
}

/**
 * Encodes an audio file into an Opus/Ogg format for the bot's cache.
 * Optionally applies a 2-pass loudness normalization if configured globally.
 * @param {string} filepath - The original path to the audio file.
 * @param {string} hash - The unique hash representing the file's content.
 * @returns {Promise<string>} A promise that resolves with the output path upon completion.
 */
function reencodeSingleFile(filepath, hash) {
    return new Promise(async (resolve, reject) => {
        try {
            consoleLog(`[INFO] Encoding file into cache: ${filepath}`);

            const inputPath = path.resolve(filepath);
            const outputPath = path.join(reencodedMusicDir, `${hash}.opus`);
            const outputPathAbs = path.join(reencodedDirAbs, `${hash}.opus`);

            const targetBitrate = configBitrate == 'auto' ? '96k' : configBitrate;

            let loudnormFilter = '';
            if (loudnessNormalization) {
                const fileDuration = await getFileDuration(inputPath);

                if (fileDuration > 3) {
                    const metrics = await getLoudnessData(inputPath);
                    loudnormFilter = `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${metrics.input_i}:measured_TP=${metrics.input_tp}:measured_LRA=${metrics.input_lra}:measured_thresh=${metrics.input_thresh}:offset=${metrics.target_offset}:linear=true,`;
                }
                else loudnormFilter = `dynaudnorm=f=120:g=15,`;
            }

            const pass2Args = [
                //'-loglevel', '8', '-hide_banner',
                '-i', inputPath,
                '-af', `highpass=f=20,lowpass=f=18000,aresample=async=1,${loudnormFilter}volume=-10dB`,
                '-c:a', 'libopus',
                '-b:a', targetBitrate,
                '-vbr', 'on',
                '-compression_level', '9',
                '-ar', '48000',
                '-ac', '2',
                '-f', 'ogg', 
                '-y',
                outputPathAbs
            ];
            if (!debug) pass2Args.unshift('-loglevel', '8', '-hide_banner');

            const pass2Process = spawn('ffmpeg', pass2Args, {
                windowsHide: true,
                stdio: [ 
                    // Standard: stdin, stdout, stderr
                    'ignore', 'inherit', 'inherit', 
                ]
            });

            pass2Process.on('error', (err) => reject(err));

            pass2Process.on('close', (pass2Code) => {
                if (pass2Code !== 0) {
                    return reject(new Error(`FFmpeg Pass 2 failed with exit code ${pass2Code}`));
                }

                try {
                    // Update your files_reencoded registry inside the database right away
                    db.prepare(/*sql*/`
                        INSERT INTO files_reencoded (source_hash, file_path, loudnorm)
                        VALUES (?, ?, ?)
                        ON CONFLICT(source_hash) DO UPDATE SET 
                            file_path = excluded.file_path,
                            loudnorm = excluded.loudnorm
                    `).run(hash, outputPath, loudnessNormalization ? 1 : 0);

                    resolve(outputPath);
                }
                catch (dbError) {
                    reject(new Error(`Audio re-encoded successfully, but failed to log to DB: ${dbError.message}`));
                }
            });
        }
        catch (error) {
            reject(error);
        }
    });
}


/**
 * Analyzes an audio file to extract loudness metrics using FFmpeg's loudnorm filter.
 * @param {string} inputPath - The absolute path to the input audio file.
 * @returns {Promise<Object>} A promise that resolves with the parsed metrics object from FFmpeg.
 */
function getLoudnessData(inputPath) {
    return new Promise((resolve, reject) => {
        const pass1Args = [
            '-i', inputPath,
            '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json',
            '-f', 'null', '-'
        ];

        const pass1Process = spawn('ffmpeg', pass1Args, {
            windowsHide: true
        });

        let stderrData = '';
        pass1Process.stderr.on('data', (data) => {
            stderrData += data.toString();
        });

        pass1Process.on('error', (err) => reject(err));

        pass1Process.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error(`FFmpeg Pass 1 failed with exit code ${code}`));
            }

            const jsonMatch = stderrData.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                return reject(new Error('Failed to parse loudness metrics from FFmpeg Pass 1 output.'));
            }

            try {
                const metrics = JSON.parse(jsonMatch[0]);
                resolve(metrics);
            } catch (err) {
                reject(new Error('Failed to cleanly parse Pass 1 JSON object.'));
            }
        });
    });
}

/**
 * Gets a list of all sounds played for the user.
 * @param {string} userId - The ID of the user.
 * @param {string} type - The type of sound file ('join', 'leave' or 'all').
 * @param {string} guildId - The id of the guild.
 * @param {boolean} [onlyValid=true] - Wheter to include only valid sounds or all sounds. Defaults to true.
 * @returns {Object[]} - The sound file object array.
 */
async function getUserSoundArray(userId, type, guildId, onlyValid = true) {
    const guildSettings = await getSetting('guild', guildId);
    const userSettings = await getSetting('user', userId);
    const setting = { // check explicitly if either if false, otherwise default to true
        enabledJoin: !(guildSettings?.enabledJoin === false || userSettings?.enabledJoin === false),
        enabledDefaultJoin: !(guildSettings?.enabledDefaultJoin === false || userSettings?.enabledDefaultJoin === false),
        enabledLeave: !(guildSettings?.enabledLeave === false || userSettings?.enabledLeave === false),
        enabledDefaultLeave: !(guildSettings?.enabledDefaultLeave === false || userSettings?.enabledDefaultLeave === false),
    }

    if (type === 'join' && setting.enabledJoin === false) return [];
    if (type === 'leave' && setting.enabledLeave === false) return [];


    let defaultEnabled = 1;
    if (type === 'join' && setting.enabledDefaultJoin === false) defaultEnabled = 0;
    if (type === 'leave' && setting.enabledDefaultLeave === false) defaultEnabled = 0;

    const query = /*sql*/`
        -- Step 1: Check if the user has valid personal sounds and store it as a temporary boolean
        WITH HasUserFiles AS (
            SELECT 1 FROM files 
            WHERE target_id = @userId 
            AND deleted_at IS NULL 
            AND (@onlyValid = 0 OR is_valid = 1)
            AND (
                (@type = 'join' AND is_join = 1) OR 
                (@type = 'leave' AND is_leave = 1) OR 
                (@type = 'all')
            )
            LIMIT 1
        )
        -- Step 2: Fetch the actual sounds
        SELECT * FROM files
        WHERE deleted_at IS NULL 
        AND (@onlyValid = 0 OR is_valid = 1)
        AND (
            (@type = 'join' AND is_join = 1) OR
            (@type = 'leave' AND is_leave = 1) OR
            (@type = 'all')
        )
        AND (
            -- Layer 1: The User's sounds
            target_id = @userId 
            
            -- Layer 2: The 'Default' sounds fallback
            OR (
                target_id = 'default' 
                AND @defaultEnabled = 1 
                AND NOT EXISTS (SELECT 1 FROM HasUserFiles)
            )
            
            -- Layer 3: The 'Everyone' sounds
            OR (
                target_id = 'everyone'
                AND (
                    @defaultEnabled = 1 
                    OR EXISTS (SELECT 1 FROM HasUserFiles)
                )
            )
        )
    `;

    const array = db.prepare(query).all({
        userId: userId,
        type: type,
        defaultEnabled: defaultEnabled,
        onlyValid: onlyValid ? 1 : 0
    });

    return array;
}

/**
 * Gets a sound file for the user based on the type (join or leave).
 * @param {string} userId - The ID of the user.
 * @param {string} type - The type of sound file ('join', 'leave' or 'all').
 * @param {string} guildId - The ID of the guild.
 * @returns {Promise<Object>} - A promise that resolves to a sound file object.
 */
async function getUserSoundFile(userId, type, guildId) {
    const selectionArray = await getUserSoundArray(userId, type, guildId);

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
            if (await exists(selectionArray[i].file_path)) {
                return selectionArray[i];
            }
            await syncSoundFiles(); // if the file does not exist, for example it was deleted manually, resync the sound files and try again
            return await getUserSoundFile(userId, type, guildId);
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
        if (chance == null) {
            undefCount++;
            continue;
        }
        probabilities[i] = Math.abs(chance);
        undefProbability -= Math.abs(chance); // Negative chance would force play the user's first sound
    }

    const probabilitySum = (undefProbability >= 0 && undefCount > 0) ? 1 : 1 - undefProbability; // If we have a remainder and a song/s left to define, we will define it to 1
    if (undefProbability < 0) undefProbability = 0;

    for (let i = 0; i < probabilities.length; i++) {
        if(songArray[i].chance == null) {
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
    const rows = db.prepare(/*sql*/`
        SELECT file_path 
        FROM files 
        WHERE target_id = ?
    `).all(targetId);

    if (rows.length > 0) {
        const baseLen = userDirComparison.split(path.sep).filter(Boolean).length;
        
        for (const row of rows) {
            const segments = row.file_path.split(path.sep).filter(Boolean);
            if (segments.length >= baseLen + 2) {
                const targetDir = segments[baseLen];
                
                if (targetDir.startsWith(targetId)) {
                    let finalPath = path.join(...segments.slice(0, baseLen + 1)) + path.sep;
                    if (row.file_path.startsWith('/') && !finalPath.startsWith('/')) {
                        finalPath = '/' + finalPath;
                    }
                    return finalPath; // Directory found via DB!
                }
            }
        }
    }

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
 * @param {string} options.searchString - The query string to search for.
 * @param {string|number|null} [options.firstPriorityUserId=null] - The ID of the prioritized user, if any.
 * @param {boolean} [options.joinFlag=false] - Whether this search should search only for join sounds. Additive with leaveFlag.
 * @param {boolean} [options.leaveFlag=false] - Whether this search should search only for leave sounds. Additive with joinFlag.
 * @param {number} [options.threshold=0.35] - Fuzzy search threshold. 0.0 is perfect match, 1.0 is loose. Defaults to 0.35, gives reasonable results.
 * @returns {{ results: Array<[Object]>, reason: string }} An object containing the Fuse.js search results and the status reason.
 */
function searchSoundFiles({searchString, firstPriorityUserId = null, joinFlag = false, leaveFlag = false, threshold = 0.35}) {
    // exact match
    const exactQuery = /*sql*/`
        SELECT * FROM files
        WHERE deleted_at IS NULL 
          AND (
              file_path = @query 
              OR file_name = @query 
              OR file_name LIKE @queryWithExtension 
          )
        LIMIT 1
    `;

    const exactMatch = db.prepare(exactQuery).get({
        query: searchString,
        queryWithExtension: `${searchString}.%` // Matches 'searchString.mp3', 'searchString.ogg', etc.
    });

    if (exactMatch) {
        const result = {
            results: [{
                item: exactMatch,
                refIndex: 0,
                score: 0
            }],
            reason: 'Exact Match'
        };
        return result;
    }


    // fuzzy search
    const poolQuery = /*sql*/`
        SELECT *,
          CASE 
              WHEN target_id = @priorityId THEN 1
              WHEN target_id = 'everyone' THEN 3
              WHEN target_id = 'default' THEN 4
              ELSE 2
          END as priorityIndex
        FROM files
        WHERE deleted_at IS NULL 
          -- The boolean flags: If JS flag is false (0), the condition passes. If true (1), it enforces the column constraint.
          AND (@joinFlag = 0 OR is_join = 1)
          AND (@leaveFlag = 0 OR is_leave = 1)
    `;

    const searchablePool = db.prepare(poolQuery).all({
        priorityId: firstPriorityUserId || '',
        joinFlag: joinFlag ? 1 : 0,
        leaveFlag: leaveFlag ? 1 : 0
    });

    // fuzzy search fallback (Fuse.js)
    if (searchablePool.length == 0) {
        const result = {
            results: [],
            reason: 'Not Found'
        }
        return result;
    }

    const fuse = new Fuse(searchablePool, {
        keys: ['file_name'],
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
 * Invalidates a sound file by renaming it to a new name with a suffix indicating it has been used, and updating database.
 * @param {string} filePath - The path of the sound file to invalidate.
 * @returns {Promise<{ newPath: string, newFilename: string }|null>} The new path details, or null if the provided filePath doesn't exist
 */
async function invalidateSoundFile(filePath) {
    if (!(await exists(filePath))) return null;

    const ext = path.extname(filePath); // .mp3
    const dir = path.dirname(filePath);  // music/users/123
    const baseWithoutExt = path.basename(filePath, ext); // filename without ext

    let i = 1;
    let newPath;
    let newFilename;

    do {
        newFilename = `${baseWithoutExt}_$used${i}${ext}`;
        newPath = path.join(dir, newFilename);
        i++;
    } while (await exists(newPath));

    await rename(filePath, newPath);

    db.prepare(/*sql*/`
        UPDATE files 
        SET file_path = ?, file_name = ?, is_valid = 0 
        WHERE file_path = ?
    `).run(newPath, newFilename, filePath);

    return { newPath, newFilename };
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
    musicDirComparison,
    reencodedDirComparison
}
