//GLOBALS
/*global gGameEvents*/
/*global gServerEventChannels*/
require('./quartermaster_globals.js');

//Discord API
const Discord = require('discord.js');

/*
Time Zone Codes:
0 = Eastern Standard Time (EST)
1 = Central Standard Time (CST)
2 = Mountain Standard Time (MST)
3 = Pacific Standard Time (PST)
4 = Alaska Standard Time (AKST)
5 = Hawaii - Aleutian Standard Time (HST)
*/
const timeZoneCodes = 
[
    'Eastern Standard Time (EST)',
    'Central Standard Time (CST)',
    'Mountain Standard Time (MST)',
    'Pacific Standard Time (PST)',
    'Alaska Standard Time (AKST)',
    'Hawaii - Aleutian Standard Time (HST)',
];

const DateTime = Object.seal({
    month: 6,
    day: 9,
    year:2018,
    hour: 1,
    minute: 45,
    period: "PM",
    timeZone: 0,   
});

const event = Object.seal({
    title: "placeholder",
    description: "Description goes here",
    game: "GAME!!!!",
    time: DateTime,
    accepted: ["--------"],
    maybe: ["---------"],
    declined:["-------"],
    creator:{},
    server:{}, //Holds a Guild Object representing the server
    message: {}, //holds event mesaage sent to eventChannel
});


exports.CreateEvent = function(eventCreator, client, server) 
{
    const newEvent = Object.create(event);
    newEvent.creator = eventCreator;
    newEvent.server = server;
    newEvent.accepted = [server.members.find('user', eventCreator).nickname];
    
    eventCreator.send('Here are ye event creation instructions!');
    eventCreator.sendMessage('What be the name of ye event?')
        .then(message => 
        {
            const filter = m => m.author === eventCreator;
            const messageCollector = message.channel.createMessageCollector(filter, { time: 60000, errors: ['time'] });
        
            messageCollector.on('collect', messageCollected => 
            {
                newEvent.title = messageCollected.content;
                eventCreator.sendMessage(`Ye title be: ${newEvent.title}`);
                SetEventDescription(eventCreator, newEvent);
                messageCollector.stop("Success");
            });
            
            messageCollector.on('end', (collected, reason) =>
            {
                if(reason != "Success")
                {
                    newEvent.creator.send('Time ran out, restart event creation to try again!');
                }
            });
        });
    
};

//Imports event from and event embed message
exports.ImportEvent = async function(eventEmbed, server, client)
{
    console.log("Event Importing!");
    if(eventEmbed == null || server == null || client == null || client.user == undefined) { return; }   
    
    const gameEvent = Object.create(event); //Create a new event object
    
    //Import Title
    gameEvent.title = eventEmbed.fields[0].value;
    gameEvent.description = eventEmbed.fields[1].value; //Import Description
    gameEvent.game = eventEmbed.fields[2].value; //game description
    
    //Import and Parse Date and Time
    //ex: 6/9/2018 2:0PM
    const gameDT = Object.create(DateTime);
    const dtString = eventEmbed.fields[3].value; //date & time string
    const dtArray = dtString.split(''); //convert the date time string to an array
    
    let startPos = 0;
    let endPos = 0;
    while(dtArray[endPos] != '/')
    {
        endPos++;
        //console.log(dtArray[endPos]);
    }
    gameDT.month = parseInt(dtString.substring(startPos, endPos));
    console.dir(dtArray);
    startPos = startPos + 2;
    endPos = endPos + 1; //move the start pos to skip over the '/'
    while(dtArray[endPos] != '/') {endPos++;}
    let temp = dtString.substring(startPos, endPos);
    gameDT.day = parseInt(dtString.substring(startPos, endPos));

    startPos = startPos + 2;
    endPos = endPos + 1; //move the start pos to skip over the '/'
    while(dtArray[endPos] != ' ') {endPos++;}
    temp = dtString.substring(startPos, endPos);
    gameDT.year = parseInt(dtString.substring(startPos, endPos));
    
    startPos = endPos;
    endPos = endPos + 1; //move the start pos to skip over the ' '
    while(dtArray[endPos] != ':') {endPos++;}
    //console.log(`startPos:${startPos} , endPos:${endPos}`);
    temp = dtString.substring(startPos, endPos);
    gameDT.hour = parseInt(dtString.substring(startPos, endPos));
    
    startPos = endPos + 1;
    endPos = endPos + 1; //move the start pos to skip over the ':'
    //console.log(`startPos:${startPos} , endPos:${endPos}`);
    while(dtArray[endPos] != 'A' && dtArray[endPos] != 'P') {endPos++;}
    //console.log(`startPos:${startPos} , endPos:${endPos}`);
    temp = dtString.substring(startPos, endPos);
    //console.log(`temp string ${temp}`);
    gameDT.minute = parseInt(dtString.substring(startPos, endPos));
    
    startPos = endPos;
    endPos = endPos + 2; 
    gameDT.period = dtString.substring(startPos, endPos);
	
    let timeZoneCode = 0;
    switch(eventEmbed.fields[4].value)
    {
    case 'Eastern Standard Time (EST)':
        timeZoneCode = 0;
        break;
    case 'Central Standard Time (CST)':
        timeZoneCode = 1;
        break;
    case 'Mountain Standard Time (MST)':
        timeZoneCode = 2;
        break;
    case 'Pacific Standard Time (PST)':
        timeZoneCode = 3;
        break;
    case 'Alaska Standard Time (AKST)':
        timeZoneCode = 4;
        break;
    case 'Hawaii - Aleutian Standard Time (HST)':
        timeZoneCode = 5;
        break;
    }
	
    gameDT.timeZone = timeZoneCode;
    gameEvent.time = gameDT;
    
    //Import accepted, Maybe, and Declined crew based on current reactions
    
    const reactorsAccepted = []; //holds array of user display names who reacted with the accepted emoji 
    console.log('Reactions:');
    const eventReactions = eventEmbed.message.reactions;
    const acceptedReacts = eventReactions.find(reaction => reaction.emoji.name === '✅');

    if(acceptedReacts === undefined)
    {
        console.log('A React!!!!!!!!!!!!!!!!!!!!!!1');
        eventEmbed.message.react('✅');
    }
    let reactUsers = await acceptedReacts.fetchUsers();
    reactUsers = reactUsers.array();
    console.dir(reactUsers);
    for(let i = 0; i < reactUsers.length; i++)
    {
        if(reactUsers[i] == undefined) { continue; }

        const memberReactor = await server.fetchMember(reactUsers[i]);
        if(memberReactor != undefined && reactUsers[i].id != client.user.id)
        {
            reactorsAccepted.push(memberReactor.displayName);
        }
    }
    
    if(reactorsAccepted.length == 0)
    {
        reactorsAccepted.push('--------');
    }
    gameEvent.accepted = reactorsAccepted;
    
    //MAYBE Crew Import
    const reactorsMaybe = []; //holds array of user display names who reacted with the Maybe emoji
    const maybeReacts = eventReactions.find(reaction => reaction.emoji.name === '❓');
    if(maybeReacts === undefined)
    {
        eventEmbed.message.react('❓');
    }
    reactUsers = await maybeReacts.fetchUsers();
    reactUsers = reactUsers.array();
    for(let i = 0; i < reactUsers.length; i++)
    {
        if(reactUsers[i] == undefined) { continue; }

        const memberReactor = await server.fetchMember(reactUsers[i]);
        if(memberReactor != undefined && reactUsers[i].id != client.user.id)
        {
            reactorsMaybe.push(memberReactor.displayName);
        }
    }
    
    if(reactorsMaybe.length == 0)
    {
        reactorsMaybe.push('--------');
    }
    gameEvent.maybe = reactorsMaybe;
    
    //Import Declined Crew
    const reactorsDeclined = []; //holds array of user display names who reacted with the Decline emoji
    const declineReacts = eventReactions.find(reaction => reaction.emoji.name === '❌');
    if(declineReacts === undefined)
    {
        eventEmbed.message.react('❌');
    }
    reactUsers = await declineReacts.fetchUsers();
    reactUsers = reactUsers.array();
    for(let reactUserIndex = 0; reactUserIndex < reactUsers.length; reactUserIndex++)
    {
        if(reactUsers[reactUserIndex] == undefined) { continue; }

        const memberReactor = await server.fetchMember(reactUsers[reactUserIndex]);
        if(memberReactor != undefined && reactUsers[reactUserIndex].id != client.user.id)
        {
            reactorsDeclined.push(memberReactor.displayName);
        }
    }
    
    if(reactorsDeclined.length == 0)
    {
        reactorsDeclined.push('--------');
    }
    gameEvent.declined = reactorsDeclined;
    
    //Import creator
    const members = server.members.array();
    for(let memberIndex = 0; memberIndex < members.length; memberIndex++)
    {
        if(members[memberIndex].user.username == eventEmbed.author.name)
        {
            gameEvent.creator = members[memberIndex].user;
        }
    }
    
    
    //Import Server & Message
    gameEvent.server = server;
    gameEvent.message = eventEmbed.message;
    gGameEvents.get(gameEvent.server.id).push(gameEvent);
    // console.log('after Push');
    //console.dir(gGameEvents.get(gameEvent.server.id));
    console.log('event import finish');
    
    //var eventEmbed = GenerateEventEmbed(allEvents[i]);
    //server.owner.send(eventEmbed);
};

function SetEventDescription(eventCreator, newEvent) 
{
    eventCreator.send('Excellent matey! Now what be ye description for the event?').then(message => 
    {
        const filter = m => m.author === eventCreator;
        const messageCollector = message.channel.createMessageCollector(filter, { time: 60000, errors: ['time'] });
        
        messageCollector.on('collect', messageCollected => 
        {
            newEvent.description = messageCollected.content;
            eventCreator.send(`Ye description be: ${newEvent.description}`);
            SetEventGame(eventCreator, newEvent);
            messageCollector.stop("Success");
        });

        messageCollector.on('end', (collected, reason) =>
        {
            console.log(reason);
            if(reason != "Success")
            {
                newEvent.creator.send('Time ran out, restart event creation to try again!');
            }
        });
    });
}

function SetEventGame(eventCreator, newEvent) 
{
    eventCreator.send('Ay, and what be ye game for this endeavor?').then(message => 
    {
        const filter = m => m.author === eventCreator;
        const messageCollector = message.channel.createMessageCollector(filter, { time: 60000, errors: ['time'] });
        
        messageCollector.on('collect', messageCollected => 
        {
            newEvent.game = messageCollected.content;
            eventCreator.send(`Da game be: ${newEvent.game}`);
            SetEventDateTime(eventCreator, newEvent);
            messageCollector.stop("Success");
        }); 
        
        messageCollector.on('end', (collected, reason) =>
        {
            if(reason != "Success")
            {
                newEvent.creator.send('Time ran out, restart event creation to try again!');
            }
        });
    });
}

function SetEventDateTime(eventCreator, newEvent) 
{
    eventCreator.send('Now when might we be starting? (Provide date and time in this format. \nmonth-day-year-hour-minute-AM(0)/PM(1) \n ex: 02-25-2019-05-25-1)').then(message => 
    {
        const filter = m => m.author === eventCreator;
        const messageCollector = message.channel.createMessageCollector(filter, { time: 60000, errors: ['time'] });
        
        messageCollector.on('collect', messageCollected => 
        {
            try
            {
                newEvent.time = CreateDateTime(messageCollected.content);
                eventCreator.send(`Ay, we be setting sail: ${newEvent.time.month}/${newEvent.time.day}/${newEvent.time.year} ${newEvent.time.hour}:${newEvent.time.minute}${newEvent.time.period}`);
                SetTimeZone(eventCreator, newEvent);
                messageCollector.stop("Success");
            }
            catch(error) 
            {
                console.dir(error);
                if(error === 'Bad Format') 
                {
                    eventCreator.send('Oy what ye thinking scrub, fix yer formatting!');
                }
                if(error === 'Out Of Bounds') 
                {
                    eventCreator.send('One of yer values is invalid, fix it \'er walk the plank!');
                }
                if(error === 'Expired Date') 
                {
                    eventCreator.send('We can\'t go into the past lad, enter a date in the future!');
                }
            } 
        });

        messageCollector.on('end', (collected, reason) =>
        {
            if(reason != "Success")
            {
                newEvent.creator.send('Time ran out, restart event creation to try again!');
            }
        });
            
    });
}

function SetTimeZone(eventCreator, newEvent)
{
    eventCreator.send(`What time zone would this here event be happening in? (Responded with time zone code using chart below: ex: '0' for est) \n
	Time Zone Codes:
	\n 0 = Eastern Standard Time (EST)
	\n 1 = Central Standard Time (CST)
	\n 2 = Mountain Standard Time (MST)
	\n 3 = Pacific Standard Time (PST)
	\n 4 = Alaska Standard Time (AKST)
	\n 5 = Hawaii - Aleutian Standard Time (HST)`).then(message => 
    {
        const filter = m => m.author === eventCreator;
        const messageCollector = message.channel.createMessageCollector(filter, { time: 60000, errors: ['time'] });
        
        messageCollector.on('collect', messageCollected =>
        {
            try
            {
                const timeCode = parseInt(messageCollected.content);
                
                if(timeCode > 5 || timeCode < 0)
                {
                    throw "Invalid Input";
                }
            
                newEvent.time.timeZone = timeCode;
            
                const timeZoneString = timeZoneCodes[timeCode];
                messageCollector.stop("Success");

                eventCreator.send(`Ay the time zone be for the event will be ${timeZoneString} `)
                    .then(functionArg => 
                    {
                        PostEvent(newEvent);
                    });
                
            }
            catch(error)
            {
                console.dir(error);
                if(error === 'Invalid Input')
                {
                    eventCreator.send('Time zone code is not between 0-5. Please enter a valid time zone code.');
                }
            }
            
        });

        messageCollector.on('end', (collected, reason) =>
        {
            if(reason != "Success")
            {
                newEvent.creator.send('Time ran out, restart event creation to try again!');
            }
        });
    });
}

function DisplayEvent(gameEvent, channel, storeMessage) 
{
    const eventMessage = new Discord.RichEmbed();
    
    eventMessage.setTitle("Wanted Event!");
    eventMessage.setColor('#F1C428');
    eventMessage.setAuthor(gameEvent.creator.username, gameEvent.creator.avatarURL);
    
    //Event Title
    eventMessage.addField('Title', gameEvent.title);
    eventMessage.addField('Description', gameEvent.description);
    eventMessage.addField('Game', gameEvent.game);
    eventMessage.addField('Date & Time', `${gameEvent.time.month}/${gameEvent.time.day}/${gameEvent.time.year} ${gameEvent.time.hour}:${gameEvent.time.minute}${gameEvent.time.period}`);
    eventMessage.addField("Time Zone:", timeZoneCodes[gameEvent.time.timeZone]);
	
    eventMessage.addField("Accepted Crew:", gameEvent.accepted, true);
    eventMessage.addField("Maybe Crew:", gameEvent.maybe, true);
    eventMessage.addField("Declined Crew:", gameEvent.declined, true);

    if(storeMessage == true) 
    {
        channel.send(eventMessage).then(messageEvent => 
        {
            gameEvent.message = messageEvent;
            
            gGameEvents.get(gameEvent.server.id).push(gameEvent);
        
            channel.fetchMessage(gameEvent.message.id).then(message=> message.react('✅'));
            channel.fetchMessage(gameEvent.message.id).then(message=> message.react('❓'));
            channel.fetchMessage(gameEvent.message.id).then(message=> message.react('❌'));
        });
    }
    else 
    {
        channel.send(eventMessage);
    }
}

function PostEvent(newEvent) 
{
    DisplayEvent(newEvent, newEvent.creator, false); //Show Event to creator
    
    newEvent.creator.send('If dis message be correct, respond with a yes. If not, holler a no.').then(message => 
    {
        const filter = m => 
        {
            const isEventUser = m.author.username == newEvent.creator.username;
            return isEventUser;
        };

        const messageCollector = message.channel.createMessageCollector(filter, { time: 60000, errors: ['time'] });
        messageCollector.on('collect', messageCollected => 
        {
            console.log('collected!');
            console.log(messageCollected.content);
            if(messageCollected.content === 'yes') 
            {
                newEvent.creator.send('Gotcha, I be letting the crew know then!');
                const eventChannel = gServerEventChannels.get(newEvent.server.id);
                //channels.find('name', 'upcoming-quests');

                DisplayEvent(newEvent, eventChannel, true);
                messageCollector.stop("Success");
            }
            else if(messageCollected.content === 'no') 
            {
                newEvent.creator.send('Alrighty, lets try again!');
                messageCollector.stop("Fail");
            }
            else 
            {
                console.log('Bad Format');
            }
        });

        messageCollector.on('end', (collected, reason) =>
        {
            if(reason != "Success" && reason != "Fail")
            {
                newEvent.creator.send('Time ran out, restart event creation to try again!');
            }
        });
    });
}

//Parses String into a DateTime Object
// month-day-year-hour-minute-AM(0)/PM(1)
//Format should be 00-00-0000-01-00-1
function CreateDateTime(dateTimeStr) 
{
    //console.dir(dateTimeStr);
    const splitDTStr = dateTimeStr.split('-');
    const dt = DateTime;
    
    if(splitDTStr.length != 6) 
    {
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
    if(dt.month < 1 || dt.month > 12) 
    {
        throw 'Out Of Bounds';
    }
    //Day
    if(dt.day < 1 || dt.day > 31) 
    {
        throw 'Out Of Bounds';
    }
    //Year
    if(dt.year < new Date().getYear()) 
    {
        throw 'Expired Date';
    }
    //Hour
    if(dt.hour <= 0 || dt.hour >= 13) 
    {
        throw 'Out Of Bounds';
    }
    //Minute
    if(dt.minute < 0 || dt.minute > 59) 
    {
        throw 'Out Of Bounds';
    }
    //AM/PM
    switch(parseInt(splitDTStr[5])) 
    {
    case 0:
        dt.period = "AM";
        break;
            
    case 1: 
        dt.period = "PM";
        break;
            
    default:
        throw 'Out Of Bounds';
        // eslint-disable-next-line no-unreachable
        break;
    }
    
    return dt;
}

exports.GenerateEventEmbed = function(gameEvent)
{
    console.dir('EVENT BEGINS!!');
    //console.dir(gameEvent);
    const eventEmbed = new Discord.RichEmbed();
    
    eventEmbed.setTitle("Wanted Event!");
    eventEmbed.setColor('#F1C428');
    eventEmbed.setAuthor(gameEvent.creator.username, gameEvent.creator.avatarURL);
    
    //Event Title
    eventEmbed.addField('Title', gameEvent.title);
    eventEmbed.addField('Description', gameEvent.description);
    eventEmbed.addField('Game', gameEvent.game);
    let hourStr;
    if(gameEvent.time.hour < 10)
    {
        hourStr = `0${gameEvent.time.hour}`;
    }
    else{hourStr = gameEvent.time.hour;}
    let minuteStr;
    if(gameEvent.time.minute < 10)
    {
        minuteStr = `0${gameEvent.time.minute}`;
    }
    else{minuteStr = gameEvent.time.minute;}
    eventEmbed.addField('Date & Time', `${gameEvent.time.month}/${gameEvent.time.day}/${gameEvent.time.year} ${hourStr}:${minuteStr}${gameEvent.time.period}`);
    eventEmbed.addField("Time Zone", timeZoneCodes[gameEvent.time.timeZone]);
    
    eventEmbed.addField("Accepted Crew:", gameEvent.accepted, true);
    eventEmbed.addField("Maybe Crew:", gameEvent.maybe, true);
    eventEmbed.addField("Declined Crew:", gameEvent.declined, true);
    
    return eventEmbed;
};