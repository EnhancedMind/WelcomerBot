# Welcomer Bot
A complete code to download for a Welcomer Bot  
-> Bot that plays sound when somebody joins or leaves a voice channel :)  
-> type `*help` in chat to learn more when you set up the bot  
<br><br>

## Adding sounds
To add or change sounds you will need to add them to the `music` folder.  
<br>

In the sounds folder there are 3 folders.  
Inside the `default` folder you can add the default sounds that will be played when a user joins or leaves a voice channel when no custom sound is set for that user.  
- `default.mp3` is the sound that will be played when a user joins a voice channel.  
- `leave0_$leave.mp3` and `leave1_$leave.mp3` are the sounds that will be played when a user leaves a voice channel. One of them will be randomly selected based on 50% chance. You can have as many sounds as you want.  
These are the default sounds I have set up. You can put however many sounds you want in the folder or not any at all. The files don't require any special naming, the system just looks for options like `$join`, `$ch=*` etc.  
<br>

- `users` folder is where you can add custom join sounds for users. To add user a custom sound, simply put a music file named 'USERID_optionalcomment.extention'. You can get the userid in discord after enabling developer mode by right clicking the user and selecting 'copy ID'. The allowed extensions are the same as in the config file. I strongly advise against changing the allowedExtensions in the config if you don't know what you are doing.  
You can also put put file into a folder inside the `users` folder. The folders name must start with the user id, then the file inside doesn't have to start with the user id. You can use this for better organization of the files.  
<br>

- `everyone` folder is where you can add sounds that have a chance of being selected for everyone. They can also be considered 'global'. They have a chance of being selected whether the user has a custom sound set or not. The files don't require any special naming, the system just looks for options like `$join`, `$ch=*` etc.  

The user can also set their own join sound by using the `addsong` command and then removing it with the `removesong` command. The owner can add or remove the sound for anyone. You can get more info on the command by using `addsong help`.  
<br>

The join sound can also have options. To use options, simply add them to the comment seperated with `_`. The available options are:
- `$join` - the sound will be played when the user joins a voice channel. This is the default option when neither $join nor $leave is specified.  
- `$leave` - the sound will be played when the user leaves a voice channel.  
- `$ch=chance` - the chance of the sound being played. The chance is in decimal form, so 50% chance would be 0.5. You can have multiple files with some chances and some without. If the chance is not specified, it will caculated as 1 / sum of all specified chances / number of files without chance specified. If sum of all specified chances is >=1, the files with unspecified chance will never be played and the sum of all specified chances will be handled as if it was 100% and the chances will be modified accordingly in their ratio. If there are only files with specified chance and the sum of all specified chances is <1, it will be handled as if the sum is 100% and the chances will be modified accordingly in their ratio.  
So for example `123456789012345678_$ch=0.5_exampleComment.extension` will have 50% chance of being played, `123456789012345678_$ch=0.25_exampleComment.extension` will have 25% chance of being played and `123456789012345678_exampleComment.extension` will have 25% (the remainder) chance of being played.  
- `$once` - the sound will be played only once. Then the file will be renamed to `originalname_$used*.extension` and will never be played again. * stands for a number index starting at 1, so if there is another yet unused file with the same name, it will not cause name collision.  
So for example `123456789012345678_$once_exampleComment.extension` will be played only once and then renamed to `123456789012345678_$once_exampleComment_$used1.extension`.  
<br>

The options can be combined. For example `123456789012345678_$ch=0.5_$once_exampleComment.extension` will have 50% chance of being played and if it is played it is renamed to `123456789012345678_$ch=0.5_$once_exampleComment_$used1.extension`.  
You can also specify `$join` and `$leave` at the same time. For example `123456789012345678_$join_$leave_exampleComment.extension` will have a chance for being selected for both join and leave sound.  
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
        "ownerID": "put your discord id here"
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
        "allowedExtensions": ["mp3", "wav", "ogg", "flac", "m4a", "aac", "webm", "opus", "aiff", "wma", "ac3"]
    },
    "logs": {
        "resetLogOnStart": true,
        "logToFile": false,
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
<br>

- `status.status`: the status of the bot - online / idle / dnd / invisible  
- `status.game`: the game status the bot will show. can be changed with a command  
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

- `player.maxTime`: the maximum length of a soound that will be accepted by the setsong command  
- `player.playIntoEmptyChannel`: whether to play leave sound into an empty voice channel or not  
- `player.selfDeaf`: whether to deafen the bot or not  
- `player.debug`: whether to show audioplayer debug messages or not  
- `player.allowedExtensions`: the extensions that will be allowed to be played by the bot - **only for advanced users**  
<br>

- `logs.resetLogOnStart`: whether to clear the session log on start or continue at the end of the file  ´
- `logs.logToFile`: whether to log to a file or only to the console  
- `logs.timeFormat`: the time format that will be used for the logs - [en-US](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat)  
<br><br>


## Instalation
To use the project you will need:  
[Node JS v16.11 or newer](https://nodejs.org/en/)  
<br>

Download the project either from main branch or from the [releases page](https://github.com/EnhancedMind/WelcomerBot/releases/latest).  
Extract it somewhere on your computer and follow the configuration steps in the bot section, the others are for more advanced users.  
Open command prompt in the folder where you extracted the project and install the dependencies using the following command:
`npm i`
After that is done, you can start the bot using the following command:
`npm start`
<br>

If you want to use the bot 24/7, you will need to host it somewhere. You can use some online hosting services or for example a Raspberry Pi (model 4 is plenty fast for this).  
You can also use the attached Dockerfile to build a docker image and run it in a container.  

## If you have any questions, feel free to ask.
<br>

### Please do not withdraw the license and keep the credits on this project.
### Made with ❤️ by EnhancedMind  
