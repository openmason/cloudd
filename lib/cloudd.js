/**
 * Cloudd - copyright(c) 2011 truepattern.
 */
var _       = require('underscore');
var kue     = require('kue');
var cronJob = require('cron').CronJob;
var util    = require('util');

// module variables
var jobs = kue.createQueue();
var pkgname = '[cloudd]';

// -------- todo -------------
// for now no graph is built, later we'll check for DAG
// preconditions to trigger next job etc.,
// http://www.graphdracula.net/, node-graph

// cloudd-format - create new package for formatting job names
//   -- use date format, use host name, etc.,


/**
 * function to submit a given job every 'cron config' .
 * NOTE, the name of the job would be appended with timestamp
 * for uniqueness
 */
exports.submitAt = function(croncfg, name, flow) {
  // do a cron job to create jobs
  // @todo: need to validate the croncfg
  cronJob(croncfg, function() {
      var datedName = dateString() + ':' + name; //  + '//' + new Date().toUTCString();
      console.log(pkgname + ' cron job [' + name + '] as ['+datedName+']');
      exports.submit(datedName, flow);
    });
};

/**
 * function to submit a job. 
 * name :  name of the job
 * flow : [ tasks ]
 * task : { id:task-id, task:task object, parent:parent-task-id }
 * task object: functions for 'task' - required, 'done', 'failed'
 */
exports.submit = function (name, flow) {
  console.log(pkgname + " job added: '" + name + "'");
  // submit everything with parent set to 'root'
  doJobsForParent(name, 'root', flow);
};

/**
 * express app exposed out of kue
 */
exports.startapp = function(port) {
  kue.app.listen(port);
  console.log(pkgname + " app started on " + port);
};


//jobs.types(function(err, types) { console.log(types); });
// states 'complete', 'failed', 'inactive', 'active', 'delayed'
// jobs.state(function(err, state { console.log(state); });

// ---------- internal functions

function dateString() {
  var now=new Date();
  return util.format("%d-%d-%d:%d-%d-%d", 
                     now.getFullYear(),now.getMonth()+1,now.getDate(), 
                     now.getHours(), now.getMinutes(), now.getSeconds());
}

/**
 * Post jobs that are at a given level.
 *  - iterate thru all the job configs in flow
 *  - find the ones with given name as parent
 *  - add all jobs for those job configs
 */
function doJobsForParent(jobname, parent, flow) {
  var q = _.filter(flow, function(t) { return t.parent==parent; });
  while(q.length > 0) {
    var curr = q.shift();
    doJob(jobname, flow, curr);
  }
}

/**
 * plug in the create/done/failed/progress/task methods
 */
function doJob(name, flow, jconfig) {
  //console.log('  loading task ... ' + jconfig.task);
  var taskModule = jconfig.task;
  if(typeof(taskModule)=='string') {
    taskModule = require(jconfig.task);
  }
  var fns=_.functions(taskModule);
  //console.log('    ... ' +fns);
  var taskFn = _.include(fns, 'task');
  if(taskFn) {
    var createFn   = _.include(fns, 'create');
    var doneFn     = _.include(fns, 'done');
    var failedFn   = _.include(fns, 'failed');
    var progressFn = _.include(fns, 'progress');

    if(createFn) {
      //console.log('    ... calling create ... ');
    } else {
      // create the job
      var taskid = name+':'+jconfig.id;
      var job    = jobs.create(jconfig.id, {title:taskid, job:name, flow:flow, done:taskModule.done, config:jconfig});
      job.on('complete', taskComplete).
        on('failed', failedFn?taskModule.failed:taskFailed).
          on('progress', progressFn?taskModule.progress:taskProgress);
      job.save();
      console.log(pkgname + " new task : '" + job.data.title + "'");
    }
    jobs.process(jconfig.id, 1, taskModule.task);
  }
}

// ------ default handlers for job

function taskComplete() {
  console.log(pkgname + " task done #"+this.id + '[' + this.data.title + ']');
  // now instantiate the next set of tasks
  doJobsForParent(this.data.job, this.data.config.id, this.data.flow);
  if(this.data.done) {
    this.data.done();
  }
}
function taskFailed() {
  console.log(pkgname + " task **FAILED** #"+this.id + '[' + this.data.title + ']');
}
function taskProgress(job, progress) {
  console.log(pkgname + " task progress #"+this.id  + '[' + this.data.title + ']' + " progress :" + progress);
}

