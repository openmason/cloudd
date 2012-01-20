var cloudd = require('../index');

// hello 'task' definition
var hello = {
  task: function(job, done) {
    job.log('hello task log :' + job.title);
    console.log('hello');
    done();
  }
};

// world 'task' definition
var world = {
  task: function(job, done) {
    job.log('world task log :' + job.title);
    console.log('world');
    done();
  },
  done:function(job) {
    console.log('[world] -- task successfuly completed : #' + job.id);
  }
};

// workflow definition
// both the tasks are fired simultaneously, as they both
// are from root
//    root --> 'hello'
//         L-> 'world'
//
// to make it serial:
//   root -> 'hello' -> 'world'
// change the config for world to parent:'hello'
//
var flow = [
  {id:'hello', task: hello, parent:'root'},
  {id:'world', task: world, parent:'root'}
];


// enable the following to see the info messages on console
//winston=require('winston');
//winston.default.transports.console.level = 'info';

// for submission of job once, use this API
//cloudd.submit('test-one',flow);

// for submission of job based on cron-format use this API
// in this case, hw called every minute
cloudd.submitAt('0 * * * * *', 'hw', flow);

// this would start the UI for task management
cloudd.startapp(3000);

