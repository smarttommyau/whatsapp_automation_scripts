import { processInput } from './Utils.js';

export class command{
    constructor(key=[],func,description="",prompt=">",isarg=false,parent="",runnable=false,readline=false,mutli=false,tsm=false){
        this.key = key;//can be multiple values
        this.func = func; 
        this.description = description;
        this.prompt = prompt;
        this.isarg = isarg;
        this.parent = parent;
        this.runnable = runnable;
        this.readline = readline; 
        this.multi = mutli;
        this.istsm = tsm;
    }
}



//-1 Run(always exists)
//-2 Readline(exists on request)
//-3 TaskManager(exists on request)
//-4 arg inputstack[0](exists on request)

// There should only be one command that accept wildcard arguments
export async function processCommand(inputstack,client, readline,tsm,listOfCommands,prompt=">",argv=[]){
    if(inputstack.length&&inputstack.at(-1) === '///'){
        return;
    }
    if(inputstack.length === 0&&listOfCommands.some(command => command.isarg&&!command.key.length)){
        // console.log('None:');
        // console.log(inputstack);
        const question1 = () =>{    
            return new Promise((resolve,reject) => {
                readline.question(prompt, async (input) => {
                    await processCommand(processInput(input),client,readline,tsm,listOfCommands,prompt,argv);
                    resolve();
                    return;
                });
        });
        };
        await question1();
        return;
    }
    // console.log(inputstack);
    let command;
    command = listOfCommands.find(command => command.key.includes(inputstack[0]));  
    if(!command){
        command = listOfCommands.find(command => command.isarg&&!command.key.length);
    }
    if(!command || inputstack[0] === '--help' || inputstack[0] === '-h'){
        console.log('Help Menu:');
        if(listOfCommands.length === 1 && listOfCommands[0].isarg){
            console.log(listOfCommands[0].parent);
        }else{
            listOfCommands.forEach(command => {
                console.log('%s - %s',command.key.length?command.key[0]:"<args>",command.description);
            });
        }
        return;
    }
    if(command && command.isarg){
        if(command.multi){
            argv.push(inputstack);
            inputstack = [];
        }else{
            argv.push(inputstack[0]);
        }
    }
    if((inputstack.length === 1||command.multi) && command.runnable){
        if(command.istsm){
            argv.push(tsm);
        }
        if(command.readline){
            argv.push(readline);
        }
        argv.push(true);//tell the func to run
        await command.func(client,argv);
            if(command.readline){
                argv.pop();
            }
            if(command.istsm){
                argv.pop();
            }
            argv.pop();
            return;
    }else{
        if(command.istsm){
            argv.push(tsm);
        }
        if(command.readline){
            argv.push(readline);
        }
        argv.push(false);//tell it that there is still more to come 
        [listOfCommands,argv] = await command.func(client,argv);
        if(command.readline){
            argv.pop();
        }
        if(command.istsm){
            argv.pop();
        }
        argv.pop();
        if(listOfCommands.length > 0){
            await processCommand(inputstack.slice(1),client,readline,tsm,listOfCommands,
                (listOfCommands.find(command => command.isarg&&!command.key.length)||listOfCommands[0]).prompt
                ,argv
            );
        }else if(inputstack.length > 1){
            console.log('Invalid arguments')
        }
        return;
    }
}
