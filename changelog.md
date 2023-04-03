# Version 0.4.0
The bot can now use other than mp3 files for music and the file can have comments in the name, it just needs to start with the id  
Added the setsong command  
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
