//Quartermaster

//GLOBALS
/*global gGameEvents*/
/*global gServerEventChannels*/
require('./quartermaster_globals.js');

//Discord API
const discord = require('discord.js');

//Bot prefix
const config = require('./config.json');

//External bot scripts
const Events = require('./event.js');

// create a new Discord client
const client = new discord.Client();


if(process.env.TEST_MODE == true) 
{
    console.log("QuarterMaster Bot is in Test Mode and cannot be used");
    return;
}

// when the client is ready, run this code
// this event will trigger whenever your bot:
// - finishes logging in
// - reconnects after disconnecting
client.on('ready', () => 
{
    console.log('Ready!');
    
    //Find event channel for server
    client.guilds.every(guild => 
    {
        console.log(guild.name);
        gGameEvents.set(guild.id, []); //creates an entry in game events map for each server
        const channel = guild.channels.find('name', 'upcoming-quests');
        console.log(channel.name);
        gServerEventChannels.set(guild.id, channel);
        
        channel.fetchMessages().then(messages =>
        {
            
            const mArray = messages.array();
            
            for(let i = 0; i < mArray.length; i++)
            {
                /*console.log('Print Messages!!!!!');
                console.dir(mArray[i].embeds[0]);
                console.log('message ++');*/
                if(mArray[i].author.id != client.user.id) //If this message is not from Quartermaster and is not a event then skip this message
                {

                }
                else if (mArray[i].embeds[0] != undefined)
                {
                    const eventEmbed = mArray[i].embeds[0];
                    Events.ImportEvent(eventEmbed, guild, client); //Import the game event into the gameEvent array
                }
            }
        });
    });
    
    
});

client.on('message', message => 
{
    //Post the message to the console
    console.log(message.content);

    const messageArray = message.content.split(' '); //Split the incoming message on spaces
    const command = messageArray[0].toLowerCase(); //Get the command from the message, make it lowercase

    //Respond if the user is pinging the bot (servers add an ! when pinging the bot by name, DMs do not)
    //Also make sure this isn't another bot
    if (!message.author.bot && (command === `<@!${client.user.id}>` || command === `<@${client.user.id}>` || command === '@bot')) 
    {
        message.channel.send(`Hello ${message.author}.`);
        return;
    }

    //Don't let bots message this bot
    //Ignore messages that aren't commands
    if (message.author.bot || !command.startsWith(config.prefix))
    {
        return;
    }
    
    //Ignore DMs
    if (message.channel.type === 'dm') 
    {
        message.channel.send(`Sorry matey, ye can't use ${command} in a DM.`); //Tell the user that whatever they typed isn't a command
        return;
    }

    //Command handling
    //Alphabetical order
    //Make sure to separate commands that don't work in DMs
    const embed = new discord.RichEmbed(); //Embeded responses, a common example of these are links
    embed.setColor('#F1C428'); //Set the Quartermaster's embed color
	
    switch (command) 
    {
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
    {
        message.channel.send('Launching event creation!');
        const discordUser = message.author;
        Events.CreateEvent(discordUser, client, message.guild);
        break;
    }

    //Return server info
    case `${config.prefix}server`:
        
        embed.setTitle(`${message.guild.name}`);
        embed.setThumbnail(message.guild.iconURL); //Sets the embed thumbnail
        embed.addField('Server owner:', `${message.guild.owner}`);
        embed.addField('Total members:', `${message.guild.memberCount}`);
        message.channel.send(embed); //Send the message to the channel
        break;
        //Return the requested user's information
    case `${config.prefix}userinfo`:
    {    
        //If there is no requested user
        if (messageArray[1] === undefined) 
        {
            message.channel.send(`Usage: ${command} @{username}`); //Send the message to the channel
            break;
        }

        //The user as they relate to Discord
        //https://discord.js.org/#/docs/main/stable/class/User
        const requestedUser = message.mentions.users.first();

        //The user as they relate to the guild
        //https://discord.js.org/#/docs/main/stable/class/GuildMember
        const requestedGuildMember = message.guild.member(requestedUser);

        //If this is a member
        if (requestedUser && requestedGuildMember) 
        {
            message.channel.send(`This be the warrant out on ${requestedGuildMember.nickname}`); //Send the message to the channel

            embed.setColor(requestedGuildMember.displayHexColor);
            embed.setTitle(`${requestedGuildMember.nickname}`); //Set the user's nickname as the title
            embed.setThumbnail(requestedUser.avatarURL); //Set the user's avatar as the thumbnail
            embed.addField('Username:', `${requestedUser.username}#${requestedUser.discriminator}`, true); //Returns the user's full username with four-digit discriminator
            embed.addField('Highest role:', `${requestedGuildMember.highestRole}`, true); //Returns the user's highest role
            embed.addField('Status:', `${requestedUser.presence.status}`, true); //Returns the user's online status

            //If the user is playing a game
            if (requestedUser.presence.game !== null)
            {
                embed.addField('Currently playing:', `${requestedUser.presence.game.name}`, true); //Returns the user's game
            }

            //If the user is muted or not
            if (requestedGuildMember.mute)
            {
                embed.addField('Muted:', 'Yes');
            }
            else
            {
                embed.addField('Muted:', 'No');
            }

            //If the user is a bot or not
            if (requestedUser.bot)
            {
                embed.setFooter('This user is a bot');
            }

            message.channel.send(embed); //Send the message to the channel
        }
        else 
        {
            message.channel.send('Yar, it appears ye be tryin\' to get info on a role and not a user. Try that again and I\'ll have ye walk the plank!'); //Send the message to the channel
        }
        break;
    }
        
    case `${config.prefix}embed`: //NOT A COMMAND
    {
        const testEmbed = new discord.RichEmbed();
        testEmbed.addField('Name', 'testName');
        message.channel.send(testEmbed).then(newMessage =>
        {
            const newEmbed = new discord.RichEmbed(Events.eventTest);
                
            newMessage.edit(newEmbed).then(m => console.log('changed'));
        });
        break;
    }

    case `${config.prefix}shutdown`:
    {

        client.destroy();
        break;
    }

    default:
        message.channel.send(`${command} isn't a command. Type !help for a list commands.`); //Tell the user that whatever they typed isn't a command
        break;
    }

    return; //Exit the message handler
});

//Handles the reactions
client.on('messageReactionAdd', reactMessage => 
{
    const messageGuild = reactMessage.message.guild;

    //See if the emoji was applied to an event
    gServerEventChannels.get(messageGuild.id).fetchMessage(reactMessage.message.id)
        .catch(error => { console.log(error); return; });
    
    switch(reactMessage.emoji.name) 
    {
    case '✅':
    {
        const checksArray = [];
        // console.dir(reactMessage.users);
        for(let i = 0; i < reactMessage.users.array().length; i++)
        {
            const user = reactMessage.users.array()[i];
            console.log(`User ${i}: ${user.username}`);
                
            const guildUser = messageGuild.member(user);
            console.log(guildUser.nickname);

            if(guildUser.displayName != messageGuild.member(client.user).displayName) 
            {
                checksArray.push(guildUser.displayName);
                console.log('push');
            }
        }
            
        if(checksArray.length == 0)
        {
            console.log('empty');
            checksArray.push('---------');
        }
        console.dir(checksArray);
            
        const reactEvent = gGameEvents.get(messageGuild.id).find(event => event.message.id === reactMessage.message.id);
            
            
        reactEvent.accepted = checksArray;
            
        const newEventEmbed = Events.GenerateEventEmbed(gGameEvents.get(messageGuild.id).find(event => event.message.id === reactMessage.message.id));
            
        reactMessage.message.edit(newEventEmbed);
        break;
    }
            
    case '❌':
    {
        const checksArray = [];
        // console.dir(reactMessage.users);
        for(let i = 0; i < reactMessage.users.array().length; i++)
        {
            const user = reactMessage.users.array()[i];
            //console.log(`User ${i}: ${user.username}`);
                
            const guildUser = messageGuild.member(user);
            //console.log(guildUser.nickname);
                
            if(guildUser.displayName != messageGuild.member(client.user).displayName) 
            {
                checksArray.push(guildUser.displayName);
                //console.log('push');
            }
        }
            
        if(checksArray.length == 0)
        {
            //console.log('empty');
            checksArray.push('---------');
        }
        //console.dir(checksArray);
            
        const reactEvent = gGameEvents.get(messageGuild.id).find(event => event.message.id === reactMessage.message.id);
            
            
        reactEvent.declined = checksArray;
            
        const newEventEmbed = Events.GenerateEventEmbed(reactEvent);
            
        reactMessage.message.edit(newEventEmbed);
        break;
    }

    case '❓':
    {
        const checksArray = [];
        // console.dir(reactMessage.users);
        for(let i = 0; i < reactMessage.users.array().length; i++)
        {
            const user = reactMessage.users.array()[i];
            //console.log(`User ${i}: ${user.username}`);
                
            const guildUser = messageGuild.member(user);
            //console.log(guildUser.nickname);
                
            if(guildUser.displayName != messageGuild.member(client.user).displayName) 
            {
                checksArray.push(guildUser.displayName);
                //console.log('push');
            }
        }
            
        if(checksArray.length == 0)
        {
            //  console.log('empty');
            checksArray.push('---------');
        }
        //console.dir(checksArray);
            
        const reactEvent = gGameEvents.get(messageGuild.id).find(event => event.message.id === reactMessage.message.id);
            
            
        reactEvent.maybe = checksArray;
            
        const newEventEmbed = Events.GenerateEventEmbed(gGameEvents.get(messageGuild.id).find(event => event.message.id === reactMessage.message.id));
            
        reactMessage.message.edit(newEventEmbed);
        break;
    }

    default:
        console.log('Emoji not for event');
        break;
    }
});

client.on('messageReactionRemove', reactMessage => 
{
    const messageGuild = reactMessage.message.guild;

    //See if the emoji was applied to an event
    gServerEventChannels.get(messageGuild.id).fetchMessage(reactMessage.message.id)
        .catch(error => { console.log(error); return; });
    
    switch(reactMessage.emoji.name) 
    {
    case '✅':
    {
        const checksArray = [];
        // console.dir(reactMessage.users);
        for(let i = 0; i < reactMessage.users.array().length; i++)
        {
            const user = reactMessage.users.array()[i];
            console.log(`User ${i}: ${user.username}`);
                
            const guildUser = messageGuild.member(user);
            console.log(guildUser.nickname);
                
            if(guildUser.displayName != messageGuild.member(client.user).displayName) 
            {
                checksArray.push(guildUser.displayName);
                console.log('push');
            }
        }
            
        if(checksArray.length == 0)
        {
            console.log('empty');
            checksArray.push('---------');
        }
        console.dir(checksArray);
            
        const reactEvent = gGameEvents.get(messageGuild.id).find(event => event.message.id === reactMessage.message.id);
            
        if(reactEvent != undefined)
        {
            reactEvent.accepted = checksArray;
        }
        const newEventEmbed = Events.GenerateEventEmbed(gGameEvents.get(messageGuild.id).find(event => event.message.id === reactMessage.message.id));
            
        reactMessage.message.edit(newEventEmbed);
        break;
    }

    case '❌':
    {
        const checksArray = [];
        // console.dir(reactMessage.users);
        for(let i = 0; i < reactMessage.users.array().length; i++)
        {
            const user = reactMessage.users.array()[i];
            //console.log(`User ${i}: ${user.username}`);
                
            const guildUser = messageGuild.member(user);
            //console.log(guildUser.nickname);
                
            if(guildUser.displayName != messageGuild.member(client.user).displayName) 
            {
                checksArray.push(guildUser.displayName);
                //console.log('push');
            }
        }
            
        if(checksArray.length == 0)
        {
            //console.log('empty');
            checksArray.push('---------');
        }
        //console.dir(checksArray);
            
        const reactEvent = gGameEvents.get(messageGuild.id).find(event => event.message.id === reactMessage.message.id);
            
            
        reactEvent.declined = checksArray;
            
        const newEventEmbed = Events.GenerateEventEmbed(reactEvent);
            
        reactMessage.message.edit(newEventEmbed);
        break;
    }

    case '❓':
    {
        const checksArray = [];
        // console.dir(reactMessage.users);
        for(let i = 0; i < reactMessage.users.array().length; i++)
        {
            const user = reactMessage.users.array()[i];
            //console.log(`User ${i}: ${user.username}`);
                
            const guildUser = messageGuild.member(user);
            //console.log(guildUser.nickname);
                
            if(guildUser.displayName != messageGuild.member(client.user).displayName) 
            {
                checksArray.push(guildUser.displayName);
                //console.log('push');
            }
        }
            
        if(checksArray.length == 0)
        {
            //  console.log('empty');
            checksArray.push('---------');
        }
        //console.dir(checksArray);
            
        const reactEvent = gGameEvents.get(messageGuild.id).find(event => event.message.id === reactMessage.message.id);
            
            
        reactEvent.maybe = checksArray;
            
        const newEventEmbed = Events.GenerateEventEmbed(gGameEvents.get(messageGuild.id).find(event => event.message.id === reactMessage.message.id));
            
        reactMessage.message.edit(newEventEmbed);
        break;
    }

    default:
    {
        console.log('Emoji not for event');
        break;
    }
    }
});

//Handles How Quartermaster greets new members to server
client.on('guildMemberAdd', newMember =>
{
    console.log('New Member ' + newMember.displayName + ' has joined!');
    
    //Find Main Text channel for server
    client.guilds.every(guild => 
    {
        console.log(guild.name);
        if(guild.name === 'Knights Of The Blackfeather')
        {
            const channel = guild.channels.find('name', 'the-deck');
            console.log(channel.name);
        
            channel.send(`Ahoy ye Scallywag! Welcome to the crew of the BlackFeather ${newMember.displayName}! Make sure to check out the pinned server info in #notice-board for the rules of the crew! If ye be needing any help simply say '!help'.`);
        }
    });
});

//MAIN
{
    // login to Discord with your app's token
    //client.login(process.env.TOKEN);

    //For Local Use:
    const token = require('./token.json'); //Hold the bot token
    client.login(token.token);
}