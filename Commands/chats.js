import { command } from '../command_process.js';
import {getUnreadChat, printMessage, getChatsbyPartialName} from '../Utils.js';

export function chatsCommand(){
    const key = ['chats','cht','chts'];
    const description = '<Search name?> List|search all chats';
    const runnable = true;
    const func = Cchats;
    return new command(key,func,description,"",false,"",runnable);
}
//TODO: add more function to edit or to aquuire more information about the chat

async function Cchats(client,argv){
    if(argv[0] === true){
        let chats = await client.getChats();
        chats.forEach((chat,i) => {
            console.log("%d: %s",i,chat.name);
        });
        return [[],argv];
    }else if(argv[0] === "-u" || argv[0] === "--unread"){
        let chats = await getUnreadChat(client);
        if(chats.length === 0){
            console.log('No unread chats');
            return [[],argv];
        }
        chats.forEach((chat,i) => {
            console.log("%d: %s(%d)",i,chat.name,chat.unreadCount);
        });        
        return [[],argv];
    }else if(argv[0]){
        let chats = await getChatsbyPartialName(argv[0].join(' '),client);
        if(chats.length === 0 || chats == undefined){
            console.log('Chat not found');
            return [[],argv];
        }else if(chats.length ===1 ){
            //print chat info
            console.log('Chat found');
            console.log('Name: %s',chats[0].name);
            console.log('isArchived: %s',chats[0].archived);
            console.log('isGroup: %s',chats[0].isGroup);
            console.log('isReadOnly: %s',chats[0].isReadOnly);
            console.log('isMuted: %s',chats[0].isMuted);
            if(chats[0].ismuted){
                console.log('Muted until: %s',new Date(chats[0].muteExpiration*1000).toLocaleString());
            }
            console.log('Unread: %d',chats[0].unreadCount);
            console.log('Last Messages:');
            await printMessage(chats[0].lastMessage,client);
        }else{
            chats.forEach((chat,i) => {
                console.log("%d: %s",i,chat.name);
            });
        }
        return [[],argv];
    }else{
        return [[
            new command([],Cchats,"Search Name","",true,"chats <Search name?> List|search all chats",true,false,true),
            new command(['-u','--unread'],Cchats,"List All unread Messages","",true,"chats -u|--unread",true)
        ],argv];
    }
}

