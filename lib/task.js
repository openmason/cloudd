/**
 * Cloudd - copyright(c) 2011-2013 openmason.
 * MIT License.
 */

var ds = require('./ds/buckets');
var worker = require('./worker');

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

var Task = function(jobid, taskid, name, cmd) {
  if(!jobid || !taskid) {
    throw Error('taskid/jobid missing');
  }
  this.id = taskid;
  this.job = jobid;
  this.exec = cmd || '';
  this.name = name || this.id;
  this.state = State.INIT;
  this.input = '';
  this.output = '';
  this.process = {};
  this.log=[];
};

// run this task
Task.prototype.run = function (done) {
  var self = this;
  self.state = State.RUNNING;
  self.process = new worker.Process(self.exec, function(err) {
    if(err) {
      self.state = State.FAILED;
    } else {
      self.state = State.COMPLETE;
    }
    //console.log(currentTasks);
    // @todo: take care of logging this to complete/failed
    done(err);
  });
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

