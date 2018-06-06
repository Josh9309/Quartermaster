//Discord API
const Discord = require('discord.js');

eventChannels = new Map(); //Map holds corresonding event channels based on server id [serverID, Channel];

var DateTime = Object.seal({
	month: 00,
	day: 00,
	year:0000,
	hour: 00,
	minute: 00,
    period: "AM"
});

var event = Object.seal({
	title: "placeholder",
	description: "Description goes here",
    game: "GAME!!!!",
	time: DateTime,
	accepted: ["--------"],
	maybe: ["---------"],
	declined:["-------"],
    creator:{},
    server:{}, //Holds a Guild Object representing the server
    message: {} //holds event mesaage sent to eventChannel
});

GameEvents = new Map(); //Map holds the events that are active in a server [ServerId, EventArray];

exports.CreateEvent = function (eventCreator, client, server) {
    var newEvent = event;
    newEvent.creator = eventCreator;
    newEvent.server = server;
    newEvent.accepted = [server.members.find('user', eventCreator).nickname];
    
	eventCreator.send('Here are ye event creation instructions!');
    eventCreator.sendMessage('What be the name of ye event?').then(message => {
        const filter = m => m.author === eventCreator;
          message.channel.awaitMessages(filter, {max:1, time:60000, errors: ['time']})
            .then(collected => {
                newEvent.title = collected.first().content;
                eventCreator.sendMessage(`Ye title be: ${newEvent.title}`);
                SetEventDescription(eventCreator, newEvent);
            })
            .catch(error => {
              console.dir(error);
              if(error.name = 'time') {
                eventCreator.send('Time ran out, restart event creation to try again!');
              }
            });
    });
    
};

function SetEventDescription(eventCreator, newEvent) {
    eventCreator.send('Excellent matey! Now what be ye description for the event?').then(message => {
        const filter = m => m.author === eventCreator;
        message.channel.awaitMessages(filter, { max: 1, time: 60000, errors: ['time'] }).then(collected => {
            newEvent.description = collected.first().content;
            eventCreator.send(`Ye description be: ${newEvent.description}`);
            SetEventGame(eventCreator, newEvent);
        })
        .catch(error => {
              console.dir(error);
              if(error.name = 'time') {
                  eventCreator.send('Time ran out, restart event creation to try again!');
              }
        });
    });
};

function SetEventGame(eventCreator, newEvent) {
    eventCreator.send('Ay, and what be ye game for this endeavor?').then(message => {
        const filter = m => m.author === eventCreator;
        message.channel.awaitMessages(filter, { max: 1, time: 60000, errors: ['time'] }).then(collected => {
            newEvent.game = collected.first().content;
            eventCreator.send(`Da game be: ${newEvent.game}`);
            SetEventDateTime(eventCreator, newEvent);
        })
        .catch(error => {
              console.dir(error);
              if(error.name = 'time') {
                  eventCreator.send('Time ran out, restart event creation to try again!');
              }
        });
    });
};

function SetEventDateTime(eventCreator, newEvent) {
    eventCreator.send('Now when might we be starting? (Provide date and time in this format. \nmonth-day-year-hour-minute-AM(0)/PM(1) \n ex: 02-25-2019-05-25-1)').then(message => {
        const filter = m => m.author === eventCreator;
        message.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] }).then(collected => {
            newEvent.time = CreateDateTime(collected.first().content);
            eventCreator.send(`Ay, we be setting sail: ${newEvent.time.month}/${newEvent.time.day}/${newEvent.time.year} ${newEvent.time.hour}:${newEvent.time.minute}${newEvent.time.period}`);
            PostEvent(newEvent);
        })
        .catch(error => {
            console.dir(error);
            if(error === 'time') {
                eventCreator.send('Time ran out, restart event creation to try again!');
            }
            if(error === 'Bad Format') {
                eventCreator.send('Oy what ye thinking scrub, fix yer formatting!');
                SetEventDateTime(eventCreator, newEvent);
            }
            if(error === 'Out Of Bounds') {
                eventCreator.send('One of yer values is invalid, fix it \'er walk the plank!');
                SetEventDateTime(eventCreator, newEvent);
            }
            if(error === 'Expired Date') {
                eventCreator.send('We can\'t go into the past lad, enter a date in the future!');
                SetEventDateTime(eventCreator, newEvent);
            }
        });
    });
};

function DisplayEvent(gameEvent, channel, storeMessage) {
    let eventMessage = new Discord.RichEmbed();
    
    eventMessage.setTitle("Wanted Event!");
    eventMessage.setColor('#F1C428');
    eventMessage.setAuthor(gameEvent.creator.username, gameEvent.creator.avatarURL);
    
    //Event Title
    eventMessage.addField('Title', gameEvent.title);
    eventMessage.addField('Description', gameEvent.description);
    eventMessage.addField('Game', gameEvent.game);
    eventMessage.addField('Date & Time', `${gameEvent.time.month}/${gameEvent.time.day}/${gameEvent.time.year} ${gameEvent.time.hour}:${gameEvent.time.minute}${gameEvent.time.period}`);
    
    eventMessage.addField("Accepted Crew:", gameEvent.accepted, true);
    eventMessage.addField("Maybe Crew:", gameEvent.maybe, true);
    eventMessage.addField("Declined Crew:", gameEvent.declined, true);

    if(storeMessage == true) {
        channel.send(eventMessage).then(message => {
            gameEvent.message = message;
            
            GameEvents.get(gameEvent.server.id).push(gameEvent);
        
            channel.fetchMessage(gameEvent.message.id).then(message=> message.react('✅'));
            channel.fetchMessage(gameEvent.message.id).then(message=> message.react('❓'));
            channel.fetchMessage(gameEvent.message.id).then(message=> message.react('❌'));
        });
    }
    else {
        channel.send(eventMessage);
    }
};

function PostEvent(newEvent) {
    DisplayEvent(newEvent, newEvent.creator, false); //Show Event to creator
    
    newEvent.creator.send('If dis message be correct, respond with a yes. If not, holler a no.').then(message => {
        const filter = m => true;
        message.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] }).then(collected => {
            console.log(collected.first().content);
            if(collected.first().content === 'yes') {
                newEvent.creator.send('Gotcha, I be letting the crew know then!');
                var eventChannel = eventChannels.get(newEvent.server.id);
                //channels.find('name', 'upcoming-quests');
                
                DisplayEvent(newEvent, eventChannel, true);       
            }
            else if(collected.first().content === 'no') {
                newEvent.creator.send('Alrighty, lets try again!');
            }
            else {
                throw 'Bad Format';
            }
        })
        .catch(error => {
            console.dir(error);
            if(error === 'time') {
                eventCreator.send('Time ran out, restart event creation to try again!');
            }
            if(error === 'Bad Format') {
                newEvent.creator.send('Oy, we be needing a yes or a no answer!');
                PostEvent(newEvent);
            }
        });
    })
};

//Parses String into a DateTime Object
// month-day-year-hour-minute-AM(0)/PM(1)
//Format should be 00-00-0000-01-00-1
function CreateDateTime(dateTimeStr) {
    //console.dir(dateTimeStr);
    var splitDTStr = dateTimeStr.split('-');
    var dt = DateTime;
    
    if(splitDTStr.length != 6) {
        console.log(splitDTStr.length);
        throw 'Bad Format';
    }
    
    //Put string ints directly into dateTime Object
    dt.month = parseInt(splitDTStr[0]);
    dt.day = parseInt(splitDTStr[1]);
    dt.year = parseInt(splitDTStr[2]);
    dt.hour = parseInt(splitDTStr[3]);
    dt.minute = parseInt(splitDTStr[4]);
    
    console.dir(dt);

    //Month 
    if(dt.month < 1 || dt.month > 12) {
        throw 'Out Of Bounds';
    }
    //Day
    if(1 > dt.day || dt.day > 31) {
        throw 'Out Of Bounds';
    }
    //Year
    if(dt.year < new Date().getYear()) {
        throw 'Expired Date';
    }
    //Hour
    if(dt.hour <= 0 || dt.hour >= 13 ) {
        throw 'Out Of Bounds';
    }
    //Minute
    if(dt.minute < 0 || dt.minute > 59) {
        throw 'Out Of Bounds';
    }
    //AM/PM
    switch(parseInt(splitDTStr[5])) {
        case 0:
            dt.period = "AM";
            break;
            
        case 1: 
            dt.period = "PM";
            break;
            
        default:
            throw 'Out Of Bounds';
            break;
    };
    
    return dt;
}