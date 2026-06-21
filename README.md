# Welcomer Bot
A complete code to download for a Welcomer Bot  
-> Bot that plays sound when somebody joins or leaves a voice channel :)  
-> type `*help` in chat to learn more when you set up the bot  
<br>

## Description and Features
- Play sounds when users join or leave voice channels  
- Custom join and leave sounds per user  
- Global join and leave sounds for everyone  
- Default join and leave sounds when no custom sound is set  
- Chance-based sound selection for varied playback  
- Option to play sounds only once  
- Configurable bot settings per user and guild  
- Command-based sound management for users, file system-based management for the owner  
- Supports multiple audio formats (mp3, wav, ogg, flac, m4a, aac, webm, opus, aiff, wma, ac3)  

This Discord bot plays sounds when users join or leave voice channels. For example, when you join a voice channel, the bot detects it, joins as well, plays a sound, then leaves. The same happens when you leave the channel.  

You can assign **custom sounds per user**, **global sounds for everyone**, and **default sounds** for users without custom settings. Each sound can have a configurable chance to play and can be set to play only once. This means you can have multiple sounds per user with different probabilities, and combine “play once” and chance settings for more variety.  

This allows you to personalize your server and easily recognize who joined or left by their unique sound, if configured.  

The behavior can be customized per user and per guild (server). You can enable or disable join/leave sounds separately for each user or guild, and this can be applied either to **all sounds** or only to the **default sounds**. For example, you can disable default sounds entirely so the bot only plays sounds for users with custom sounds set. These settings are managed through the `user` and `guild` commands.  

Similar functionality was recently added to Discord Nitro, but it only works for yourself (not other users) and requires a paid subscription. This bot is **free, open source**, and anyone can host it. Plus, it offers features Nitro doesn’t, like chance-based sound selection and play-once options.  
<br><br>

## Adding sounds
To add or change sounds you will need to add them to the `music` folder, or the user sounds can be managed with `addsong`,`renamesong` and `removesong` commands.  
<br>

In the sounds folder there are 3 folders.  
Inside the `default` folder you can add the default sounds that will be played when a user joins or leaves a voice channel when no custom sound is set for that user.  
- `default.mp3` is the sound that will be played when a user joins a voice channel.  
- `leave0_$leave.mp3` and `leave1_$leave.mp3` are the sounds that will be played when a user leaves a voice channel. One of them will be randomly selected based on 50% chance. You can have as many sounds as you want.  
These are the default sounds I have set up. You can put however many sounds you want in the folder or not any at all. The files don't require any strict naming, the system just looks for options like `$join`, `$ch=*` etc., more explained below.  
<br>

- `users` folder is where you can add custom join sounds for users. To add user a custom sound, simply put a music file named 'USERID_optionalcomment.extention'. You can get the userid in discord after enabling developer mode by right clicking the user and selecting 'copy ID'. The allowed extensions are the same as in the config file. I strongly advise against changing the allowedExtensions in the config if you don't know what you are doing.  
You can also put a file into a folder inside the `users` folder, eg a subfolder. The folders name must start with the user id, then the file inside doesn't have to start with the user id. You can use this for better organization of the files.  
<br>

- `everyone` folder is where you can add sounds that have a chance of being selected for everyone. They can also be considered 'global'. They have a chance of being selected whether the user has a custom sound set or not. The files don't require any special naming, the system just looks for options like `$join`, `$ch=*` etc.  

You can also put files into a subfolder inside `everyone`,`default` or even `users/123456789012345678_exampleuser`. The folders name is not strict, but looks for options `$ch=*`, `$join`, `$leave` and `$once` in the folder name and applies them to files inside the folder. The chance set in the folder is divided among the files inside the folder. The `$once` will be used for files inside induvidually, not the whole folder. You can also specify options for each file inside the folder, where `$join`, `$leave` and `$once` will be ORed with the folder options and `$ch=*` will hard override the chance for that file, and will not affect the chance divided among the other files inside the folder. You can use this for better organization of the files.  

The user can also set their own join sound by using the `addsong` command, rename them and move them within his subfolder using the `renamesong` command and then remove them with the `removesong` command. The owner and developers can add, rename, move and remove the sound for anywhere inside the music folder. You can get more info on the command by typing the command and adding ` --help` (with space).  
<br>

The join sound can also have options. To use options, simply add them to the comment seperated with `_`. The available options are:  
- `$join` - the sound will be played when the user joins a voice channel. This is the default option when neither $join nor $leave is specified.  
- `$leave` - the sound will be played when the user leaves a voice channel.  
- `$ch=chance` - the chance of the sound being played. The chance is in decimal form, so 50% chance would be 0.5. You can have multiple files with some chances and some without. If the chance is not specified, it will caculated as 1 / sum of all specified chances / number of files without chance specified. If sum of all specified chances is >=1, the files with unspecified chance will never be played and the sum of all specified chances will be handled as if it was 100% and the chances will be modified accordingly in their ratio. If there are only files with specified chance and the sum of all specified chances is <1, it will be handled as if the sum is 100% and the chances will be modified accordingly in their ratio.  
So for example `exampleNameStart_$ch=0.5_exampleNameEnd.extension` will have 50% chance of being played, `exampleNameStart_$ch=0.25_exampleNameEnd.extension` will have 25% chance of being played and `exampleName.extension` will have 25% (the remainder) chance of being played.  
- `$once` - the sound will be played only once. Then the file will be renamed to `originalname_$used*.extension` and will never be played again. * stands for a number index starting at 1, so if there is another yet unused file with the same name, it will not cause name collision.  
So for example `$once_exampleComment.extension` will be played only once and then renamed to `$once_exampleComment_$used1.extension`.  
<br>

The options can be combined. For example `$ch=0.5_$once_exampleComment.extension` will have 50% chance of being played and if it is played it is renamed to `$ch=0.5_$once_exampleComment_$used1.extension`.  
You can also specify `$join` and `$leave` at the same time. For example `$join_$leave_exampleComment.extension` will have a chance for being selected for both join and leave sound.  
<br><br>

## Filebrowser management

Also, with the new web management, users can use the `webmanage` command to get a expiring unique link to a filebrowser instance pointed to the music folder, where each user will be restricted only to their personal files, unless they are an admin or a developer who used a coresponding flag.  

You must enable this in config along with its settings, this is disabled by default.  

The filebrowser instance must be set up externally, and point to the same music folder as welcomer bot. The bot comunicates with filebrowser via its api to dynamically set users with restrcited access only to their personal files.  
The recommended config setup for filebrowser is:  
```bash
filebrowser config import config/filebrowser/config/exported_config.json -d config/filebrowser/database/filebrowser.db
filebrowser -d config/filebrowser/database/filebrowser.db users add admin adminpassword --perm.admin=true
```

Alternatively, if you don't want to use the provided filebrowser config, you can use  
```bash
filebrowser config set -d filebrowserdbfile.db --root .\\music --auth.method=proxy --auth.header=X-Welcomer-User --branding.name "Welcomer bot file manager" --branding.disableExternal --branding.disableUsedPercentage --tokenExpirationTime 10m
```
<br>

For setup in docker see the provided docker-compose.yml file.  
In docker seup, make sure to set the filebrowser root to `/srv`  
The docker-compose.yml will automatically initiate the filebrowser database with the exported_config.json file. If the database already exists, it will not be re-initiated.  
<br><br>

## Configuration
Copy the `config.json.example` in the config folder and rename it to `config.json`  
```json
{
    "terminateOnUncaughtException": true,
    "bot": {
        "token": "put your bot token here",
        "prefix": "*",
        "ignoreMessageEndingWithPrefix": false,
        "ownerID": "put your discord id here",
        "devIDs": ["put ids of people to manage all sounds here, in an array"]
    },
    "status": {
        "status": "online",
        "game": "made by EnhancedMind ❤️"
    },
    "emoji": {
        "success": ":notes:",
        "info": ":bulb:",
        "warning": ":warning:",
        "error": ":no_entry_sign:",
        "loading": ":watch:",
        "searching": ":mag_right:"
    },
    "response": {
        "notValidCommand": false,
        "missingArguments": "Missing arguments. Please use `{prefix}help` for more information.",
        "invalidPermissions": "You do not have the permission to use this command.",
        "invalidNumber": "Please provide a valid number.",
        "noChannel": "You must be in a voice channel.",
        "wrongChannel": "You must be in the same voice channel as I am.",
        "afkChannel": "You can't be in a AFK voice channel.",
        "noMusic": "No music is playing on this server."
    },
    "player": {
        "maxTime": 15,
        "playIntoEmptyChannel": false,
        "selfDeaf": false,
        "debug": false,
        "loudnessNormalization": true,
        "bitrate": "auto",
        "allowedExtensions": ["mp3", "wav", "ogg", "flac", "m4a", "aac", "webm", "opus", "aiff", "wma", "ac3"]
    },
    "directories": {
        "userMusicDir": "./music/users",
        "everyoneMusicDir": "./music/everyone",
        "defaultMusicDir": "./music/default",
        "tempMusicDir": "./music/temp",
        "topMusicDir": "./music",
        "reencodedMusicDir": "./music/reencoded"
    },
    "filebrowser": {
        "enabled": false,
        "port": 3000,
        "filebrowserUrl": "http://ip:port",
        "filebrowserApiUrl": "http://ip:port/api",
        "cookieName": "fbWelcomerSession",
        "sessionLifetimeMinutes": 5,
        "maxUploadSizeBytes": 20971520,
        "externalDomain": "https://example.com",
    },
    "logs": {
        "timeFormat": "en-US"
    }
}
```
<br>

- `terminateOnUncaughtException`: whether to terminate the process on uncaught exception or not - **only for advanced users**  
<br>

- `bot.token`: the token of your discord bot you can get from [Discord Developers page](https://discord.com/developers/applications)  
- `bot.prefix`: the prefix which will be used for your bot's commands  
- `bot.ignoreMessageEndingWithPrefix`: whether to ignore messages (commands) ending with the prefix or not (useful for * and prefixes like this that are used for markdown)  
- `bot.ownerID`: your discord user id you can get by right clicking user on discord after enabling developer mode  
- `bot.devIDs`: the discord user ids of people that can manage all sounds, not just their own. You can put multiple ids in the array.  
<br>

- `status.status`: the status of the bot - `online` / `idle` / `dnd` / `invisible`. Can be changed with a command.  
- `status.game`: the game status the bot will show. Can be changed with a command.  
<br>

- `emoji.success`: the emoji that will be used for success messages  
- `emoji.info`: the emoji that will be used for info messages  
- `emoji.warning`: the emoji that will be used for warning messages  
- `emoji.error`: the emoji that will be used for error messages  
- `emoji.loading`: the emoji that will be used for loading messages  
- `emoji.searching`: the emoji that will be used for searching messages  
<br>

- `response.notValidCommand`: whether to send a message when the user uses a command that doesn't exist  
- `response.missingArguments`: the message that will be sent when the command is missing arguments  
- `response.invalidPermissions`: the message that will be sent when the user does not have the permission to use the command  
- `response.invalidNumber`: the message that will be sent when the user provides an invalid number  
- `response.noChannel`: the message that will be sent when the bot is not in a voice channel, but the command requires it  
- `response.wrongChannel`: the message that will be sent when the user is not in the same voice channel as the bot, but the command requires it  
- `response.afkChannel`: the message that will be sent when the user is in a AFK voice channel, but the user tries to play music  
- `response.noMusic`: the message that will be sent when the user tries to use a command that requires music to be playing, but there is no music playing  
<br>

- `player.maxTime`: the maximum length of a sound that will be accepted by the addsong command  
- `player.playIntoEmptyChannel`: whether to play leave sound into an empty voice channel or not  
- `player.selfDeaf`: whether to deafen the bot or not  
- `player.debug`: whether to show audioplayer debug messages or not  
- `player.loudnessNormalization`: whether to use loudness normalization or not. If enabled, the bot will try to normalize the loudness of the sounds to -16 LUFS with a true peak of -1.5 dB and a LRA of 11. This can help to make the sounds have a more consistent volume, but it can also cause some distortion and increase the CPU usage.  
- `player.bitrate`: the bitrate that will be used for the ffmpeg process. It can be a string ffmpeg can parse or 'auto'. If set to 'auto', the bot will try to set the bitrate based on the voice channel's bitrate  
- `player.allowedExtensions`: the extensions that will be allowed to be played by the bot - **only for advanced users**  
<br>

- `directories.userMusicDir`: directory used for user music  
- `directories.everyoneMusicDir`: directory used for music played for everyone  
- `directories.defaultMusicDir`: directory used for users without custom music  
- `directories.tempMusicDir`: directory used for temporary music files  
- `directories.topMusicDir`: the base directory for the above, limiting the scope of what song commands can change  
- `directories.reencodedMusicDir`: the directory used to store reencoded music files  
<br>

- `filebrowser.enabled`: whether the filebrowser reverse proxy and handlers are enabled, this includes webmanage command being enabled or not  
- `filebrowser.port`: the port on which the reverse proxy will be exposed  
- `filebrowser.filebrowserUrl`: the url of the filebrowser instance, like "http://127.0.0.1:3000"  
- `filebrowser.filebrowserApiUrl`: the url where the filebrowser api will be accessible, like "http://127.0.0.1:3000/api"  
- `filebrowser.cookieName`: the name of the cookie provided by the user, reccomended not to change  
- `filebrowser.sessionLifetimeMinutes`: the lifetime of the session after which user will be disconnected for inactivity  
- `filebrowser.maxUploadSizeBytes`: the maximum allowed upload size in bytes. This is used to prevent users from uploading files that are too large. Default is 20 MB  
- `filebrowser.externalDomain`: the external domain provided in the user message, like "https://example.com"  
<br>

- `logs.timeFormat`: the time format that will be used for the logs - [en-US](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat)  
<br><br>


## Instalation
To use the project you will need:  
[Node JS v20.12.0 or newer (current lts recommended)](https://nodejs.org/en/), but I recommend using the latest LTS version.  
You will also need ffmpeg and ffprobe installed on your system and added to the PATH. You can download them from [ffmpeg official website](https://ffmpeg.org/download.html). They are already included in the docker image.  
<br>

Download the project either from main branch or from the [releases page](https://github.com/EnhancedMind/WelcomerBot/releases/latest).  
Extract it somewhere on your computer and follow the configuration steps in the bot section, the others are for more advanced users.  
Open command prompt in the folder where you extracted the project and install the dependencies using the following command:  
`npm i`  
After that is done, you can start the bot using the following command:  
`npm start`  
<br>

If you want to use the bot 24/7, you will need to host it somewhere. You can use some online hosting services or for example a Raspberry Pi (model 4 is plenty fast for this).  
<br>

### You can also use the attached Dockerfile to build a docker image or the provided image and run it in a container.  
You can use the provided `docker-compose.yml.example` file as an example of how to set up the container and its volumes.  


## If you have any questions, feel free to ask.
<br>

### Please do not withdraw the license and keep the credits on this project.
### Made with ❤️ by EnhancedMind  
