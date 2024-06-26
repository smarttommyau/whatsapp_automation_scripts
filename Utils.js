import terminalImage from 'terminal-image';
import { Buffer } from 'node:buffer';
import sharp from 'sharp';
import fs from 'node:fs';
import whtswebjspkg from 'whatsapp-web.js';
const { MessageTypes } = whtswebjspkg;
import mimepkg from 'mime-types';
const mime = mimepkg;
export function processInput(input){
    //split by space but ignore spaces between quotes, and remove the quoting quotes
    if(!input){
        return [];
    }
    let args = input.match(/(?:[^\s"]+|"[^"]*")+/g);
    args = args.map(arg => arg.replaceAll('"',''));
    return args;
    
}


export async function getChatsbyName(name,client,caseSensitive = false){
    const chats = await client.getChats();
    if(!caseSensitive){
        name = name.toLowerCase();
        let chat = chats.find(chat => chat.name.toLowerCase() == name);
        return chat;
    }
    let chat = chats.find(chat => chat.name == name);
    return chat;
}

export async function getChatsbyNames(names,client,caseSensitive = false){
    const chats = await client.getChats();
    if(!caseSensitive){
        names = names.map(name => name.toLowerCase());
        let chat = chats.filter(chat => names.includes(chat.name.toLowerCase()));
        return chat;
    }
    let chat = chats.filter(chat => names.includes(chat.name));
    return chat;
}

export async function getChatsbyPartialName(name,client,caseSensitive = false){
    const chats = await client.getChats();
    if(!caseSensitive){
        name = name.toLowerCase();
        return chats.filter(chat => chat.name.toLowerCase().includes(name));
    }
    return chats.filter(chat => chat.name.includes(name));
}

export async function getChatsbyPartialNames(names,client,caseSensitive = false){
    const chats = await client.getChats();
    let ArrayofChat = [];
    if(!caseSensitive){
        names = names.map(name => name.toLowerCase());
        names.forEach(name => {
            ArrayofChat.push(chats.filter(chat => chat.name.toLowerCase().includes(name)));
        });
        return ArrayofChat;
    }
    names.forEach(name => {
        ArrayofChat.push(chats.filter(chat => chat.name.includes(name)));
    });
    return ArrayofChat;    
}

export async function getUnreadChat(client){
    let chats = await client.getChats();
    return chats.filter(chat => chat.unreadCount > 0);
}


export async function getUnreadMessages(chats){
    let unreadMessages = [];
    for(const chat of chats){
        if(chat.unreadCount === 0){
            continue;
        }
        unreadMessages = [...unreadMessages, ...await chat.fetchMessages({limit: chat.unreadCount})];
    }
    return unreadMessages;

}

export async function printMessage(message,client=undefined){
    // console.log("-".repeat(process.stdout.columns - 2))
    let from ="From:";
    if(client){
        if(message.fromMe){
            from += "Me";
        }else{
            const contact = await client.getContactById(message.from);
            from += contact.name||contact.pushname;
        }
    }
    if(message.author){
        if(client){
        from += "||"
        }
        from += message.author;
    }
    let buffer = ""
    buffer += from + '\n';
    buffer += "Date:" + new Date(message.timestamp*1000).toLocaleString() + '\n';
    buffer += await printMessageBody(message);
    buffer += "-".repeat(process.stdout.columns - 2) + '\n';
    return buffer;
}

async function printMessageBody(message){
    let buffer = ""
    if(message.hasMedia){
        buffer += '>Media message<' + '\n';
        const media = await message.downloadMedia();
        let image;
        if(media.mimetype.includes('gif')){
            image = await terminalImage.gifbuffer(Buffer.from(media.data,'base64'),{height: '30%'})
        }else if(media.mimetype.includes('/png') || media.mimetype.includes('jpg')){
            image = await terminalImage.buffer(Buffer.from(media.data,'base64'),{height: '30%'})
        }else{
            image = await terminalImage.buffer(await sharp(Buffer.from(media.data,'base64')).png().toBuffer(),{height: '30%'});
        }
        buffer += image.trim()+ '\n';
    }
    buffer += message.body+'\n';
    return buffer;
}

export function printLocation(location){
    return `${location.address}: ${location.description}\n${location.latitude},${location.longitude}`;
}


export async function getNumberbyName(name,client){
    const contacts = await client.getContacts();
    let contact = contacts.find(contact => contact.name == name||contact.pushname == name);
    if(!contact||contact.length === 0){
        return undefined;
    }
    return contact.number;
}


export function formatFrom(contact){
    return (contact.name || contact.pushname) +"@"+contact.number;
}

export function logpath(msg,chat,contact){
    let path = ""
    if(!msg.broadcast){
        path = process.cwd() + "/logs/" + chat.name + "/";
    }else{
        path = process.cwd() + "/logs/broadcasts/" +contact.name + "/";
    }
    if(msg.isStatus){
        path += "status/";
    }
    return path;
}

export async function generateMessageJson(msg,contact,chat,path){
    let jsonout = {};
    const isMedia = msg.hasMedia; 
    jsonout['id'] = msg.id.id;
    const from = formatFrom(contact);
    jsonout['From'] = msg.fromMe? "Me":from;
    jsonout['Time'] = new Date(msg.timestamp*1000).toLocaleString();
    if(msg.hasQuotedMsg){
        const quotedMsg = await msg.getQuotedMessage();
        let quotedjson ={};
        quotedjson['id'] = quotedMsg.id.id;
        if(quotedMsg.hasMedia){
            quotedjson['media'] = true;
        }else{
            quotedjson['media'] = false;
        }
        quotedjson['body'] = quotedMsg.body.substring(0,10);
        jsonout['Quoted'] = quotedjson;
    }
    if(isMedia){
        const mediaKey = msg.mediaKey.replaceAll('/','_').replaceAll('=','').replaceAll('+','_');
        //check if media is already downloaded
        let media;
        let filename = fs.readdirSync(path).find((file)=>file.includes(mediaKey));
        if(!filename){
            media = await msg.downloadMedia();
        }
        //save media
        if(media){
            filename = "";
            if(msg.type == MessageTypes.STICKER){
                filename += "sticker_";
            }
            if(media.filename){
                filename += (mediaKey||msg.id.id) + "_" + media.filename;
            }else{
                filename += (mediaKey||msg.id.id) + "." + mime.extension(media.mimetype);
            }
            if(!fs.existsSync(path + filename)){ //skip file write if already exists
                fs.writeFileSync(path + filename,Buffer.from(media.data,'base64'));
            }
        }
        jsonout['Media'] = {
            'filename':filename
        }
    }
    jsonout['Body'] = msg.body;
    if(msg.location){
        jsonout['Location'] = msg.location;
    }
    if(msg.vCards.length){
        jsonout['vCards'] = msg.vCards;
    }
    if(msg.fowardingScore >0){
        jsonout['Forwarding Score'] = msg.forwardingScore;
    }
    return jsonout;
}