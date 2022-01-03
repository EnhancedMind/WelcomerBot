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
