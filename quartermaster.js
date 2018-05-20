//Quartermaster

// require the discord.js module
const Discord = require('discord.js');
const config = require('./config.json');
const token = require('./token.json'); //Hold the bot token

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

    //Respond if the user is pinging Meme-chan
    if (command === `<@${bot.user.id}>`) {
        message.channel.send(`Hello ${message.author}.`);
        return;
    }

    command.toLowerCase(); //Set the command to be lowercased

	if(message.content.startsWith(`${config.prefix}ping`)){
		//Send back "Pong" to the channel the message was sent in
		message.channel.send('Pong');
		console.log('pong');
	}
	else if(message.content === `${config.prefix}server`){
		message.channel.send(`This server's name is: ${message.guild.name} \nTotal members: ${message.guild.memberCount}`);
	}
});

// login to Discord with your app's token
client.login(process.env.BOT_TOKEN);