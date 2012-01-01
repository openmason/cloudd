/**
 * Cloudd - copyright(c) 2011 truepattern.
 */
var _ = require('underscore');
var kue = require('kue');

var jobs = kue.createQueue();
var pkgname = '[cloudd]';

// -------- todo -------------
// for now no graph is built, later we'll check for DAG
// preconditions to trigger next job etc.,
// http://www.graphdracula.net/, node-graph

/**
 * function to submit a job. 
 * name :  name of the job
 * flow : [ tasks ]
 * task : { id:task-id, task:task object, parent:parent-task-id }
 * task object: functions for 'task' - required, 'done', 'failed'
 */
exports.submit = function (name, flow) {
  var root = _.filter(flow, function(t) { return t.parent=='root'; });
  var q = _.clone(root);
  console.log(pkgname + " job added: '" + name + "'");
  while(q.length > 0) {
    var curr = q.shift();
    //console.log('firing job:' + curr.id);
    doJob(name,curr);
    var nextLevel = _.filter(flow, function(t) { return t.parent==curr.id; });
    q=q.concat(nextLevel);
  }
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

/**
 * plug in the create/done/failed/progress/task methods
 */
function doJob(name,jconfig) {
  //console.log('  loading task ... ' + jconfig.task);
  var taskModule = jconfig.task;
  if(taskModule instanceof String) {
    var m = './' + jconfig.task ;
    taskModule = require(m);
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
      var job    = jobs.create(jconfig.id, {title:taskid, config:jconfig});
      job.on('complete', doneFn?taskModule.done:taskComplete).
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
}
function taskFailed() {
  console.log(pkgname + " task **FAILED** #"+this.id + '[' + this.data.title + ']');
}
function taskProgress(job, progress) {
  console.log(pkgname + " task progress #"+this.id  + '[' + this.data.title + ']' + " progress :" + progress);
}

