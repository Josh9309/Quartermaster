//Quartermaster

//Discord API
const discord = require('discord.js');

//Bot prefix
const config = require('./config.json');

//External bot scripts
const events = require('./event.js');
const games = require('./games.js');

// create a new Discord client
const client = new discord.Client();

if(process.env.TEST_MODE == true) {
	console.log("QuarterMaster Bot is in Test Mode and cannot be used");
	return;
}

// when the client is ready, run this code
// this event will trigger whenever your bot:
// - finishes logging in
// - reconnects after disconnecting
client.on('ready', () => {
    console.log('Ready!');
    
    client.guilds.every(guild => {
        console.log(guild.name);
        GameEvents.set(guild.id, []); //creates an entry in game events map for each server
        var channel = guild.channels.find('name', 'upcoming-quests');
        console.log(channel.name);
        eventChannels.set(guild.id, channel);
    });
});

client.on('message', message => {
    //Post the message to the console
    console.log(message.content);

    let messageArray = message.content.split(' '); //Split the incoming message on spaces
    let command = messageArray[0].toLowerCase(); //Get the command from the message, make it lowercase

    //Respond if the user is pinging the bot (servers add an ! when pinging the bot by name, DMs do not)
    //Also make sure this isn't another bot
    if (!message.author.bot && (command === `<@!${client.user.id}>` || command === `<@${client.user.id}>` || command === '@bot')) {
        message.channel.send(`Hello ${message.author}.`);
        return;
    }

    //Don't let bots message this bot
    //Ignore messages that aren't commands
    if (message.author.bot || !command.startsWith(config.prefix))
        return;

    //Command handling
    //Alphabetical order
    //Make sure to separate commands that don't work in DMs
    let embed = new discord.RichEmbed(); //Embeded responses, a common example of these are links
    embed.setColor('#F1C428'); //Set the Quartermaster's embed color
	
    switch (command) {
        ///
        ///These commands work in both servers and DMs
        ///
        //Return information on this bot's commands
        case `${config.prefix}help`:
            message.channel.send(`These are my commands, ${message.author}`); //Send the message to the channel

            embed.setAuthor('The Quartermaster\'s Commands', client.user.avatarURL); //Sets the command title and returns the Quartermaster's avatar
            embed.addField(`${config.prefix}event`, 'Launches event creation');
            embed.addField(`${config.prefix}games`, 'Database containing games a user has');
            embed.addField(`${config.prefix}help`, 'Brings up this help scroll');
            embed.addField(`${config.prefix}server`, 'Lists some information about this server');
            embed.addField(`${config.prefix}userinfo @{username}`, 'Returns some information on the requested user');

            embed.setFooter('\nNow pipe down before I make ye walk the plank.'); //The Quartermaster's footer
            message.channel.send(embed); //Send the message to the channel
            break;
        //Ping the bot to make sure it's online
        case `${config.prefix}ping`:
            //Send back "Pong" to the channel the message was sent in
            message.channel.send('Pong');
            console.log('Pong, but in the console');
            break;

        ///
        ///These commands only work in a server
        ///
        //Launch event creation
        case `${config.prefix}event`:
            //Ignore DMs
            if (message.channel.type === 'dm') {
                message.channel.send(`Sorry matey, ye can't use ${command} in a DM.`); //Tell the user that whatever they typed isn't a command
                break;
            }

            message.channel.send('Launching event creation!');
            var discordUser = message.author;
            events.CreateEvent(discordUser, client, message.guild);
            break;
        //Launch game library
        case `${config.prefix}games`:
            //Ignore DMs
            if (message.channel.type === 'dm') {
                message.channel.send(`Sorry matey, ye can't use ${command} in a DM.`); //Tell the user that whatever they typed isn't a command
                break;
            }

            message.channel.send('Pls no');
            break;
        //Return server info
        case `${config.prefix}server`:
            //Ignore DMs
            if (message.channel.type === 'dm') {
                message.channel.send(`Sorry matey, ye can't use ${command} in a DM.`); //Tell the user that whatever they typed isn't a command
                break;
            }

            embed.setTitle(`${message.guild.name}`);
            embed.setThumbnail(message.guild.iconURL); //Sets the embed thumbnail
            embed.addField('Server owner:', `${message.guild.owner}`);
            embed.addField('Total members:', `${message.guild.memberCount}`);
            message.channel.send(embed); //Send the message to the channel
            break;
        //Return the requested user's information
        case `${config.prefix}userinfo`:
            //Ignore DMs
            if (message.channel.type === 'dm') {
                message.channel.send(`Sorry matey, ye can't use ${command} in a DM.`); //Tell the user that whatever they typed isn't a command
                break;
            }

            //If there is no requested user
            if (messageArray[1] === undefined) {
                message.channel.send(`Usage: ${command} @{username}`); //Send the message to the channel
                break;
            }

            //The user as they relate to Discord
            //https://discord.js.org/#/docs/main/stable/class/User
            let requestedUser = message.mentions.users.first();

            //The user as they relate to the guild
            //https://discord.js.org/#/docs/main/stable/class/GuildMember
            let requestedGuildMember = message.guild.member(requestedUser);

            //If this is a member
            if (requestedUser && requestedGuildMember) {
                message.channel.send(`This be the warrant out on ${requestedGuildMember.nickname}`); //Send the message to the channel

                embed.setColor(requestedGuildMember.displayHexColor);
                embed.setTitle(`${requestedGuildMember.nickname}`); //Set the user's nickname as the title
                embed.setThumbnail(requestedUser.avatarURL); //Set the user's avatar as the thumbnail
                embed.addField('Username:', `${requestedUser.username}#${requestedUser.discriminator}`, true); //Returns the user's full username with four-digit discriminator
                embed.addField('Highest role:', `${requestedGuildMember.highestRole}`, true); //Returns the user's highest role
                embed.addField('Status:', `${requestedUser.presence.status}`, true); //Returns the user's online status

                //If the user is playing a game
                if (requestedUser.presence.game !== null)
                    embed.addField('Currently playing:', `${requestedUser.presence.game.name}`, true); //Returns the user's game

                //If the user is muted or not
                if (requestedGuildMember.mute)
                    embed.addField('Muted:', 'Yes');
                else
                    embed.addField('Muted:', 'No');

                //If the user is a bot or not
                if (requestedUser.bot)
                    embed.setFooter('This user is a bot');

                message.channel.send(embed); //Send the message to the channel
            }
            else {
                message.channel.send('Yar, it appears ye be tryin\' to get info on a role and not a user. Try that again and I\'ll have ye walk the plank!'); //Send the message to the channel
            }
            break;
			
        ///
        ///Not a command
        ///
        default:
            message.channel.send(`${command} isn't a command. Type !help for a list commands.`); //Tell the user that whatever they typed isn't a command
            break;
    }

    return; //Exit the message handler
});

//Handles the reactions
client.on('messageReactionAdd', reactMessage => {
    var messageGuild = reactMessage.message.guild;

    //See if the emoji was applied to an event
    eventChannels.get(messageGuild.id).fetchMessage(reactMessage.message.id)
        .catch(error => { console.log(error); return; });
    
    switch(reactMessage.emoji.name) {
        case '✅':
            var checksArray  = [];
            reactMessage.users.every(user => {
                var name = messageGuild.members.find('user', user).nickname;
                if(name != messageGuild.members.find('user', client.user).nickname) {
                    checksArray.push(name);
                }
            });
            console.dir(checksArray);
            reactMessage.message.embeds[0].fields.find(field => field.name === 'Accepted Crew:').value = checksArray;
            
            console.dir(reactMessage.message.embeds[0].fields.find(field => field.name === 'Accepted Crew:'));
            
            GameEvents.get(messageGuild.id).find(event => event.message === reactMessage.message).accepted = checksArray;
            
            //console.dir(GameEvents.get(messageGuild.id).find(event => event.message === reactMessage.message));
            break;
            
        case '❌':
            var checksArray  = [];
            reactMessage.users.every(user => {
                var name = messageGuild.members.find('user', user).nickname;
                if(name != messageGuild.members.find('user', client.user).nickname) {
                    checksArray.push(name);
                }
            });
            
            reactMessage.message.embeds[0].fields.find(field => field.name === 'Declined Crew:').value = checksArray;
            
            GameEvents.get(messageGuild.id).find(event => event.message === reactMessage.message).declined = checksArray;
            
            //console.dir(GameEvents.get(messageGuild.id).find(event => event.message === reactMessage.message));
            break;
            
        case '❓':
            var checksArray  = [];
            reactMessage.users.every(user => {
                var name = messageGuild.members.find('user', user).nickname;
                if(name != messageGuild.members.find('user', client.user).nickname) {
                    checksArray.push(name);
                }
            });
            
            reactMessage.message.embeds[0].fields.find(field => field.name === 'Maybe Crew:').value = checksArray;
            
            GameEvents.get(messageGuild.id).find(event => event.message === reactMessage.message).maybe = checksArray;
            
            //console.dir(GameEvents.get(messageGuild.id).find(event => event.message === reactMessage.message));
            break;
            
        default:
            console.log('Emoji not for event');
            break;
    };
});

// login to Discord with your app's token
client.login(process.env.TOKEN);

//For Local Use:
//const token = require('./token.json'); //Hold the bot token
//client.login(token.token);