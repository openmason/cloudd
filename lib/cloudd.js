/**
 * Cloudd - copyright(c) 2011 truepattern.
 */
var _       = require('underscore');
var kue     = require('kue');
var cronJob = require('cron').CronJob;
var util    = require('util');
var winston = require('winston');

// module variables
var jobs = kue.createQueue();
var pkgname = '[cloudd]';
winston.default.transports.console.level = 'error';
winston.default.transports.console.colorize = true;
winston.default.transports.console.timestamp = true;

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
      winston.info(pkgname + ' cron job [' + name + '] as ['+datedName+']');
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
  winston.info(pkgname + " job added: '" + name + "'");
  // submit everything with parent set to 'root' (undefined)
  var parent;
  issueJobsNextLevel(name, parent, flow);
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
function issueJobsNextLevel(jobname, parent, flow) {
  var parentname='root';
  if(parent) {
    parentname=parent.type;
  }
  var q = _.filter(flow, function(t) { return t.parent==parentname; });
  while(q.length > 0) {
    var curr = q.shift();
    issueJob(jobname, flow, curr, parent);
  }
}

/**
 * plug in the create/done/failed/progress/task methods
 */
function issueJob(name, flow, tconfig, parentTask) {
  winston.debug('  loading task ... ' + JSON.stringify(tconfig));
  var parentName = name;
  if(parentTask) {
    // position the name from parent task name
    parentName=parentTask.data.id;
  }  
  var taskModule = tconfig.task;
  if(typeof(taskModule)=='string') {
    taskModule = require(tconfig.task);
  }
  var fns=_.functions(taskModule);
  var taskFn = _.include(fns, 'task');
  if(taskFn) {
    var createFn   = _.include(fns, 'create');
    var doneFn     = _.include(fns, 'done');
    var failedFn   = _.include(fns, 'failed');
    var progressFn = _.include(fns, 'progress');

    var taskid = parentName+':'+tconfig.id;
    var taskconfigs = [{id:taskid, title:taskid, config:tconfig}];
                         
    if(createFn) {
      var taskconfigs = taskModule.create(taskid);
      winston.debug(pkgname + '  new tasks: ' + JSON.stringify(taskconfigs));
    }
    // now create the task configs
    for(var i=0;i<taskconfigs.length;i++) {
      var taskcfg = taskconfigs[i];
      // create the job
      var job = jobs.create(tconfig.id, {
          id     : taskcfg.id,
          title  : taskcfg.title, 
          config : taskcfg.config,
          jobname: name, 
          flow   : flow, 
          _done  : taskModule.done
        });

      job.on('complete', taskComplete).
        on('failed', failedFn?taskModule.failed:taskFailed).
        on('progress', progressFn?taskModule.progress:taskProgress);
      job.save();

      winston.info(pkgname + " new task : '" + job.data.id + "'");
    }
    // load only once the task callback
    jobs.process(tconfig.id, 1, taskModule.task);
  }
}

// ------ default handlers for job

function taskComplete() {
  winston.info(pkgname + " task done #"+this.id + ' [' + this.data.id + ']');
  // now instantiate the next set of tasks
  issueJobsNextLevel(this.data.jobname, this, this.data.flow);
  if(this.data._done) {
    this.data._done(this);
  }
}
function taskFailed() {
  winston.error(pkgname + " task **FAILED** #"+this.id + '[' + this.data.id + ']');
}
function taskProgress(job, progress) {
  winston.debug(pkgname + " task progress #"+this.id  + '[' + this.data.id + ']' + " progress :" + progress);
}

