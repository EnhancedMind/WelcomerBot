# Welcomer Bot
A complete code to download for a Welcomer Bot
### Configuration
Copy the `env.example` and rename it to `.env`
```env
DISCORD_TOKEN = 
PREFIX = *
OWNER_ID = 

GAME = work in progress
STATUS = online
```
Basic configuration
- `DISCORD_TOKEN` the token of your discord bot you can get from [Discord Developers](https://discord.com/developers/applications)
- `PREFIX` the prefix which will be used for your bot's commands
- `OWNER_ID` your discord user id you can get by right clicking user on discord after enabling developer mode

- `GAME` the game status the bot will show. can be changed with a command
- `STATUS` the status of the bot - online / idle / dnd / invisible

### Instalation
To use the project you will need:
[Node JS v16.11 or newer](https://nodejs.org/en/)
You will need to install some modules using the following command
`npm install discord.js @discordjs/voice @discordjs/opus ffmpeg-static libsodium-wrappers opusscript discordjs-button-pagination @koenie06/discord.js-music dotenv`

Please do not withdraw the license and keep the credits on this project.
