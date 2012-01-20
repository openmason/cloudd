# cloudd                                                  
node.js cloud engine                                                 

# Features                                                 
 * allows user to define a workflow (set of tasks together constitute a job)               
    1. Job **HelloWorld** could comprise of two tasks
      * _Hello_ Task
      * _World_ Task, this step to be executed only on successful completion of _Hello_
      * Any time you run **HelloWorld**, both these tasks would be run one after another                    
 * instantiate jobs _cron_ style
 * see examples for couple of real world examples 

**ALPHA product, use at your risk**

## API's
 1. cloudd.submit (identifier, workflow-definition) - submit job once
 1. cloudd.submitAt(cron-config, identifier, workflow-definition) - submit job as specified by cron-config

## Debug logs
To enable full debug logs, add these two lines to your code
> winston=require('winston');
> winston.default.transports.console.level = 'info';
