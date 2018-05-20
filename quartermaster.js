//Quartermaster

// require the discord.js module
const discord = require('discord.js');
const config = require('./config.json');
//const token = require('./token.json'); //Hold the bot token

// create a new Discord client
const client = new discord.Client();

// when the client is ready, run this code
// this event will trigger whenever your bot:
// - finishes logging in
// - reconnects after disconnecting
client.on('ready', () => {
    console.log('Ready!');
});

client.on('message', message => {
    //Post the message to the console
    console.log(message.content);

    //Don't let bots message this bot
    if (message.author.bot)
        return;

    let messageArray = message.content.split(' '); //Split the incoming message on spaces
    let command = messageArray[0].toLowerCase(); //Get the command from the message, make it lowercase

    //Respond if the user is pinging the bot
    if (command === `<@!${client.user.id}>` || command === '@bot') {
        message.channel.send(`Hello ${message.author}.`);
        return;
    }

    //Command handling
    //Alphabetical order
    let embed = new discord.RichEmbed(); //Embeded responses, a common example of these are links
    embed.setColor('#F1C428'); //Set the Quartermaster's embed color
    switch (command) {
        //Return information on this bot's commands
        case `${config.prefix}help`:
            message.channel.send(`These are my commands, ${message.author}`); //Send the message to the channel

            embed.setAuthor('The Quartermaster\'s Commands', client.user.avatarURL); //Sets the command title and returns the Quartermaster's avatar
            embed.addField('!help', 'Brings up this help scroll');
            embed.addField('!server', 'Lists some information about this server');
            embed.addField('!userinfo {username}', 'Returns some information on the requested user');

            embed.setFooter("\nNow pipe down before I make ye walk the plank."); //The Quartermaster's footer
            message.channel.send(embed); //Send the message to the channel
            break;
        //Ping the bot to make sure it's online
        case `${config.prefix}ping`:
            //Send back "Pong" to the channel the message was sent in
            message.channel.send('Pong');
            console.log('Pong, but in the console');
            break;
        //Return server info
        case `${config.prefix}server`:
            embed.setTitle(`${message.guild.name}`);
            embed.setThumbnail(message.guild.iconURL); //Sets the embed thumbnail
            embed.addField('Server owner:', `${message.guild.owner}`);
            embed.addBlankField(false); //Space
            embed.addField('Total members:', `${message.guild.memberCount}`);
            message.channel.send(embed); //Send the message to the channel
            break;
        //Return the requested user's information
        case `${config.prefix}userinfo`:
            //If there is no requested user
            if (messageArray[1] === undefined) {
                message.channel.send('Usage: !userinfo {username}'); //Send the message to the channel
                break;
            }

            //The user as they relate to Discord
            //https://discord.js.org/#/docs/main/stable/class/User
            let requestedUser = message.mentions.users.first();

            //The user as they relate to the guild
            //https://discord.js.org/#/docs/main/stable/class/GuildMember
            let requestedGuildMember = message.guild.member(requestedUser);

            message.channel.send(`This be the warrant out on ${message.author}`); //Send the message to the channel

            embed.setColor(requestedGuildMember.displayHexColor);
            embed.setTitle(`${requestedGuildMember.nickname}`); //Set the user's nickname as the title
            embed.setThumbnail(requestedUser.avatarURL); //Set the user's avatar as the thumbnail
            embed.addField('Username:', `${requestedUser.username}#${requestedUser.discriminator}`, true); //Returns the user's full username with four-digit discriminator
            embed.addField('Highest role:', `${requestedGuildMember.highestRole}`, true); //Returns the user's highest role
            embed.addField('Status:', `${requestedUser.presence.status}`, true); //Returns the user's online status

            //If the user is playing a game
            if (requestedUser.presence.game !== null)
                embed.addField('Currently Playing:', `${requestedUser.presence.game.name}`, true); //Returns the user's game

            embed.addField('Muted:', `${requestedGuildMember.mute}`); //If the user is muted or not

            message.channel.send(embed); //Send the message to the channel
            break;

        //Not a command
        default:
            message.channel.send(`${command} isn't a command. Type !help for a list commands.`); //Tell the user that whatever they typed isn't a command
            break;
    }

    return; //Exit the message handler
});

// login to Discord with your app's token
client.login(process.env.TOKEN);