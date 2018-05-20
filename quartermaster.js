//Quartermaster

// require the discord.js module
const Discord = require('discord.js');
const config = require('./config.json');
//const token = require('./token.json'); //Hold the bot token

// create a new Discord client
const client = new Discord.Client();

// when the client is ready, run this code
// this event will trigger whenever your bot:
// - finishes logging in
// - reconnects after disconnecting
client.on('ready', () => {
    console.log('Ready!');
});

client.on('message', message => {
    console.log(message.content);

    //Don't let bots message this bot
    if (message.author.bot)
        return;

    let messageArray = message.content.split(' '); //Split the incoming message on spaces
    let command = messageArray[0].toLowerCase(); //Get the command from the message, make it lowercase

    //Respond if the user is pinging the bot
    if (command === `${client.user.id}` || command === '@bot') {
        message.channel.send(`Hello ${message.author}.`);
        return;
    }

    if (command === `${config.prefix}ping`){
		//Send back "Pong" to the channel the message was sent in
		message.channel.send('Pong');
		console.log('Pong, but in the console');
	}
    else if (command === `${config.prefix}server`){
		message.channel.send(`This server's name is: ${message.guild.name} \nTotal members: ${message.guild.memberCount}`);
    }

    return; //Exit the message handler
});

// login to Discord with your app's token
client.login(process.env.TOKEN);