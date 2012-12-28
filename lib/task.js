/**
 * Cloudd - copyright(c) 2011-2013 openmason.
 * MIT License.
 */

var ds = require('./ds/buckets');
var worker = require('./worker');
var _ = require('underscore');
var os = require('os');

// Task 
// - fundamental unit of execution
//
// TaskQ
// - list of tasks ready for execution
// 
// Datastructure
// keys:
// - id (task identifier)
// - job (job identifier)
// others: 
// - name of the task
// - exec - command to be executed
// - state - { Init, Ready, Running, Failed, Complete, Canceled }
// - input 
// - output
// - process (worker) details
// - log

// State
var State = {
  INIT    : 0,
  READY   : 1,
  RUNNING : 2,
  FAILED  : 3,
  COMPLETE: 4,
  CANCELED: 5
};

/*
 * Only either 'cmd' or jsfile to be passed. Priority would be given to cmd.
 */
var Task = function(jobid, taskid, config) { 
  if(!jobid || !taskid || !config) {
    throw Error('taskid/jobid missing');
  }
  if(!config.executable && !config.javascript) {
    throw Error("invalid executable/javascript. don't know what to run:"+taskid);
  }
  if(config.executable && config.javascript) {
    throw Error('only one of executable/javascript should be specified:'+taskid);
  }
  this.id = taskid;
  this.job = jobid;
  this.name = config.name || this.id;
  this.state = State.INIT;
  this.input = config.input || '';
  // these both are out params from the worker
  this.output = [];
  this.log=[];
  // information about the worker
  this.process = {};
  this.exec = config.executable;
  if(config.javascript) {
    this.jsfile = config.javascript.lib;
    this.methodName = config.javascript.method || 'task';
    if(!this._isJSModulePresent(this.jsfile, this.methodName)) {
      throw Error('given method:'+ this.methodName + ' not found in jsfile:' + this.jsfile);
    }
  }
};

// returns a clone of self
Task.prototype.clone = function()
{
  var c=_.clone(this);
  c.log=[];
  c.process={};
  c.output=[];
  return c;
};

// check if a method is present in javascript file
Task.prototype._isJSModulePresent=function(jsfile, jsfunction) {
  this.jsfile = require(jsfile);
  return _.include(_.functions(this.jsfile), jsfunction);
}

// run this task
// @todo: take care of logging this to complete/failed
Task.prototype.run = function (done) {
  var self = this;
  self.state = State.RUNNING;
  var context = { id:this.id,
                  job:this.job,
                  input:this.input,
                  output:this.output,
                  log:this.log
                };
  if(self.jsfile) {
    self.process={host:os.hostname, pid:process.pid};
    self.jsfile[self.methodName](context, function(err) {
      self.state = err? State.FAILED: State.COMPLETE;
      done(err);
    });
  } else {
    self.process = new worker.Process(self.exec, function(err) {
      self.state = err? State.FAILED: State.COMPLETE;
      done(err);
    });
  }
};

// append to the log object
Task.prototype.log = function (entry) {
  this.log.push(entry);
};

// ----------------

var TaskQ = function() {
  this.q = new ds.Queue();
  this.runningTasks = {};
};

// @todo: all the states needs to be validated
// on enqueue, emit an event
TaskQ.prototype.add = function(task) {
  task.state = State.READY;
  this.q.enqueue(task);
};

// return q as array
TaskQ.prototype.qAsArray = function () {
  return this.q.list.toArray();
};

// process the next available Task
//  - return the task in done callback
//
// @todo: what if runningTasks already have
//   a rid of same name?
TaskQ.prototype.processOne = function(done) {
  var self = this;
  if(self.q.size()>0) {
    var t=self.q.dequeue();
    // move from taskQ to runningTasks
    var rid = t.job+':'+t.id;
    self.runningTasks[rid] = t;
    t.run(function(err) {
      // remove from running tasks
      delete self.runningTasks[rid];
      done(t); 
    });
  } else {
    done();
  }
};

// module exports
exports.Task = Task;
exports.TaskQ = TaskQ;
exports.State = State;

// - EOF

