# Welcomer Bot
A complete code to download for a Welcomer Bot  
-> Bot that plays sound when somebody joins or leaves a voice channel :)  
-> type `*help` in chat to learn more when you set up the bot  
<br>

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

You will need to install some modules using the following command:  
`npm i`  
<br>
  
### Please do not withdraw the license and keep the credits on this project.
### Made with ❤️ by EnhancedMind  
