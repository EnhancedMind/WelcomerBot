# Version 0.6.2
The everyone sound directory can now have subdirectories with defined chance, join, leave and once settings, change is divided among the files inside the subdirectory, more in README.md  
Added aptional argument 'json' to playable command to get the sound files database as JSON file attachment  
Added docker-compose.yml.example as an example of how to set up the container and its volumes  
Added better description to README.md about what the bot does  
Changed the order of flags --trace-warnings and --trace-deprecation in npm start so they work properly  
Updated discord.js to version 14.24.2  
Updated discord.js/voice to version 0.19.0  
Installed @snazzah/davey version 0.1.7 for voice connection encryption support for @discordjs/voice v0.19.0 on more platforms  

# Version 0.6.1
Fixed the bot selecting only from everyone sound when the user had no custom sound in that mode (join/leave) instead of selecting from default and everyone sounds  

# Version 0.6.0
Changed the music folder hierarchy. The new structure is in README.md  
The bot can now also be mentioned in the command so prefix doesn't have to be used and remembered  
Added 'Adding sound' to README.md  
Updated the installation instructions in README.md  
Updated the code to support discord.js v14  
Updated paginator so buttons are not sent when there is only one page  
Updated the reaction collector so they don't crash when the message is deleted (discord.js v14 changed stuff)  
Fixed response edits and deletions so they don't crash when the message is deleted  
Fixed removing reactions so they don't crash when the message is deleted  
Removed the setsong command as it was replaced  
Added the addsong command which allows you to add sounds to the bot  
Added the removesong command which allows you to remove sounds from the bot  
Remade the settings so that they now actually work reliably and get saved when the bot is restarted 
The setting now support seperately defaultJoin and defaultLeave settings   
Updated the guild and user commands to use the new settings system  
Added alias 'server' to the guild command as it can make more sense for people unfimiliar with discord APIs  
Updated the playable command to use the new sound management system and to also list paths to the files  
Updated the play command to accept paths from the playable command or accept a user tag and select a random sound for the user as if he would join the channel  
Added the sync command which updates the sound database with the files in the music folder  
The prune command was updated to work with discord.js v14  
About command now displays the discord.js version  
The debug and log command were removed  
Updated discord.js to version 14.19.1  
Updated discord.js/voice to version 0.18.0  
Updated discord.js/opus to version 0.10.0  
Updated libsodium-wrappers to version 0.7.15  
Updated ffmpeg-static to version 5.2.0  

# Version 0.5.0
The process is now ran with --trace-warnings --trace-deprecation flags if it is started with npm start  
The commands requiring elevated permissions can now be used by bot owner even without the elevated permissions  
The guild command now displays the current settings when no arguments are passed  
Changed unlink to rmSync in the setsong command  
Added the option to use more files each with its own probability of being played  
Added the option to only play the file once and never again  
The commands used to control the sounds are now in the sound category  
Command category folders now start with number and they are sorted by that number  
The prune commands now say Deleting messages instead of Clearing messages  
There is now new guild setting to disable the default join sound  
The guild command now supports disabling and enabling the default join sound  
The settings file checker converts old settings to new ones so it is hassle free  
The debug command can now send both logs and config files  
The setsong command now creates the temp folder if it doesn't exist  
The stop command now checks for manage channels permission or if the user is the owner of the bot  
Fixed the ```<arg>``` and [arg] syntax in the help menu  

# Version 0.4.0
The bot can now use other than mp3 files for music and the file can have comments in the name, it just needs to start with the id  
Added the setsong command which allows you to set the song you want to play when you join the voice channel as a message attachment  
Added the prune command which deletes only the messages from the bot and the messages used to invoke the bot  
Added the playable command which lists all the playable files  
Updated the play command to support new file formats and comments in the name  
Changed the old clear command to forceprune as it is more descriptive  
Updated the debug command so only the start of the filename is needed in argument  
Changed the required permission for the guild command  
Changed the required permission for the user command from administrator to owner of the bot as the user setting is global and not per guild  
Fixed the user command so you can set the settings for other users  
The user command now displays the current settings when no arguments are passed  
Added poweroff alias to shutdown command  
Polished the text in about command  
The bot now logs when error and warn events are emitted by Discord  
Removed the options for pkg inside the package.json  
Updated dependencies to newer versions  
Added new config option, if the user leaves channel and it is now empty, the leave sound will not play  
Changed owner (owner_id?) to ownerID in the config file  
Changed rstLogOnStart to resetLogOnStart in the config file  
Added new config option to only log to console and ignore sessionLog file  
Added new config option to set other time format  
Added new config option to ignore messages ending with the prefix, which was forced previously  
Polished the grammar  
Updated the README.md for new configuration options  

# Version 0.3.0
This update mainly polishes the code and focuses the bot where it should be  
Removed the .env as config option, now it is config/config.json  
Removed the option to play music from youtube  
Removed the option to log deleted messages  
Removed the random command  
Removed the forcerestart command  
Added the about command  

# Version 0.2.8
Added server and user setting for individual enabling and disabling of bot  
If prefix is * or anything similar the bot no longer says the command does not exist when the * was to make bold or italic text (although this is for first word only)  

# Version 0.2.7
Renamed the reset command to reload as it makes more sense  
Added rld alias for the reload command  
Updated the paginator to support upcoming discordjs v14  
Changed the help and alias command to load dynamicaly from the command files  
Added syntax option to the commands for dynamic help and alias loading  
Renamed the core folder inside the commands folder to !core due to ascii priorities for help and alias command loading  
No longer is stuck in error loop when logs/ dir does not exist  
Added config.json as other way for configuartion and for (maybe) future docker container  
Added the option to log when the bot voicestate update gets triggered and who did it, where and when  

# Version 0.2.6
Added the random command which generates random numbers  
The run.bat no longer exits when the bot throws errors  
Added credits at the start  

# Version 0.2.5
The audio player now log errors  
Fixed the wrong formation in .md files  
Fixed reaction in ping command ( ikd how it got there ;) )  
Cleaned the code a little in src/Commands/owner/setstatus.js  

# Version 0.2.4
Added the option to either continue on the sessionlog or clear it, instead of just clearing it  
Added the option to either log deleted messages or not  
Moved the commands into category folders to make the code cleaner  
Added advanced loggig option, although it does not log much at this time, but this is very likely to change in the future  
The bot now ignores afk channel and does not try to play music there  
The play command now requires you to be in a voice channel  
You now can't use the play command in the AFK channel  
The stop command now checks if you are in the same channel  
If no music is playing and the stop command is used, it now replies that no music is playing instead that the player has stopped  
Changed some code for better performance  
Reworked the pagination for the help and aliases command, no longer requires external library and uses emoji reactions now, which I find cooler  

# Version 0.2.3
Fixed the welcome command  
Fixed the status command  

# Version 0.2.2
Made the help and aliases command dynamically updated with the commands  
Added the debug command for remote log download  
Added the log command for manual logging  
Added the reset command which reset the the status and the game  
The setgame command now sets to default if no arguments are passed  
The setstatus command now sets to default if no arguments are passed  
Added logging of deleted messages  
The bot now plays randomly one of two sounds when somebody leaves  
Reworked the loging mechanisms  

# Version 0.2.1
Minor issues fixed in README, env.example and a bit different message when the bot starts :)  

# Version 0.2.0
The bot was completely reworked  
The alpha branch begins here  
