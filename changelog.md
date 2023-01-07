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
Started work on minecraft command, however, it is not going to go public yet  
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
