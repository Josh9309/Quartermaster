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
    console.log(message.guild);
    //Command handling
    //Alphabetical order
    let embed = new discord.RichEmbed(); //Embeded responses, a common example of these are links
    embed.setColor('#F1C428'); //Set the Quartermaster's embed color
    switch (command) {
        //Return information on this bot's commands
        case `${config.prefix}help`:
            message.channel.send(`These are my commands, ${message.author}.`); //Send the message to the channel

            embed.setAuthor('The Quartermaster\'s Commands', client.user.avatarURL); //Sets the command title and returns the Quartermaster's avatar
            embed.addField('!help', 'Brings up this help scroll');
            embed.addField('!server', 'Lists some information about this server');

            embed.setFooter("\nNow pipe down before I make ye walk the plank."); //The Quartermaster's footer
            message.channel.send(embed); //Send the message to the channel
            break;
        case `${config.prefix}ping`:
            //Send back "Pong" to the channel the message was sent in
            message.channel.send('Pong');
            console.log('Pong, but in the console');
            break;
        case `${config.prefix}server`:
            embed.setTitle(`${message.guild.name}`);
            embed.setThumbnail(message.guild.iconURL); //Sets the embed thumbnail
            embed.addField('Total members:', `${message.guild.memberCount}`);
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