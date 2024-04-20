const prompt = require('prompt-sync')();
const util = require('./Utils');
//const task_manager = require('./task_manager');

class command{
    constructor(key=[],func,description="",prompt=">",isarg=false,parent="",runnable=false,readline=false){
        this.key = key;//can be multiple values
        this.description = description;
        this.prompt = prompt;
        this.func = func;
        this.runnable = runnable;
        this.isarg = isarg;
        this.parent = parent;
        this.readline = readline; 
    }
}



async function processCommand(inputstack,client, readline,listOfCommands,isarg=false,prompt=">",argv=[]){
    if(inputstack.length === 0){
        readline.question(prompt, async (input) => {
            await processCommand(input.trim().split(' '),client,listOfCommands,isarg,prompt,argv);
        });
    }
    let command = listOfCommands.find(command => command.key.includes(inputstack[0]));  
    if(!command || inputstack[0] === 'help' || inputstack[0] === 'h'){
        console.log('Help Menu:');
        if(listOfCommands.length === 1 && isarg){
            console.log(listOfCommands[0].parent);
        }
        listOfCommands.forEach(command => {
            console.log('%s - %s',command.key[0],command.description);
        });
        return;
    }
    
    if(inputstack.length === 1 && command.runnable){
        if(command.readline){
            argv.push(readline);
        }
        argv.push(true);//tell the func to run
        await command.func(client,argv);
        if(command.readline){
            argv.pop();
        }
        argv.pop();
        return;
    }else{
        if(isarg){
            argv.push(inputstack[0]);
        }
        if(command.readline){
            argv.push(readline);
        }
        argv.push(false);//tell it that there is still more to come 
        [listOfCommands,argv] = await command.func(client,argv);
        if(listOfCommands.length > 0){
            await processCommand(inputstack.slice(1),client,readline,listOfCommands,command.isarg,command.prompt,argv);
        }
        if(command.readline){
            argv.pop();
        }
        argv.pop();
        return;
    }
}


// async function processCommand(client) {
//     var myTaskManager = new task_manager.task_manager();
//             let commands = input.trim().split(' ');
//             switch(commands[0]){
//                 case 'schedule':
//                 case 'sch':
//                     await scheduleCommand.scheduleCommand(client,myTaskManager,commands.slice(1));
//                     break;
//                 case 'tasks':
//                 case 'ts':
//                     if(commands.length == 1){
//                         console.log('list - list all tasks');
//                         console.log('pause <id> - pause a task');
//                         console.log('resume <id> - resume a task');
//                         console.log('remove <id> - remove a task');
//                         break;
//                     }
//                     switch(commands[1]){
//                         case 'list':
//                         case 'ls':
//                             myTaskManager.listTasks();
//                             break;
//                         case 'pause':
//                         case 'p':
//                             if(commands.length == 2){
//                                 console.log('Usage: pause <id>');
//                                 break;
//                             }
//                             myTaskManager.pauseTask(parseInt(commands[2]));
//                             break;
//                         case 'resume':
//                         case 'r':
//                             if(commands.length == 2){
//                                 console.log('Usage: resume <id>');
//                                 break;
//                             }
//                             myTaskManager.resumeTask(parseInt(commands[2]));
//                             break;
//                         case 'remove':
//                         case 'rm':
//                             if(commands.length == 2){
//                                 console.log('Usage: remove <id>');
//                                 break;
//                             }
//                             myTaskManager.removeTask(parseInt(commands[2]));
//                             break;
//                         default:
//                             console.log('Unknown command');
//                             break;
//                     }
//                     break;
//                 case 'time':
//                 case 'tm':
//                     console.log(new Date().toLocaleString());
//                     break;
//                 case 'exit':
//                 case 'ex':
//                     client.destroy();
//                     process.exit(0);
//                     break;
//                 default:
//                     console.log('Unknown command. Type help to get list of commands');
//                     break;
//             }
// }

exports.processCommand = processCommand;
exports.command = command;