/**
 * Cloudd - copyright(c) 2011-2013 openmason.
 * MIT License.
 */

var ds = require('./ds/buckets');
var task = require('./task');
var dag = require('./dag');
var _ = require('underscore');

// Job
// - Collection of 'Task's with dependencies
//
// JobList
// - list of Jobs with their definitions
// 
// Datastructure
// keys:
// - job (job identifier)
// others: 
// - name
// - description 
// - dag     - DAG which captures the dependencies & ordered tasks
// - q       - tasks that are ready in the order they should be run
// - results - result of tasks
// - index   - current task index
//

// @todo - check in config for minimum attributes
var Job = function(jobid, config) {
  if(!jobid || !config || !config.jobs || !config.dependencies) {
    throw Error('invalid job config');
  }
  this.id = jobid;
  this.name = config.name || jobid;
  this.description = config.description || '';
  this.dag = new dag.DAG(config.dependencies);
  this.results = {};
  this.q = new ds.Queue();
  var self = this;
  _.each(self.dag.tasks, function(tid) { 
    if(!config.jobs.hasOwnProperty(tid)) {
      throw Error('invalid task configuration:'+tid);
    }
    var jname = config.jobs[tid].name || '';
    var jcmd = config.jobs[tid].executable || '';
    self.q.add(new task.Task(jobid, tid, jname, jcmd)); 
  });
};

/*
 * Check if next task is ready to run
 */
Job.prototype.isTaskReady = function (taskid) {
  var self = this;
  // 1. first list out all the dependencies
  // 2. check if the dependency is present in the result
  var taskdeps=self.dag.getDependencies(taskid);
  var pending=taskdeps.length;
  _.each(taskdeps, function(dep) { if(self.results.hasOwnProperty(dep)) pending--; });
  return pending==0;
};

/*
 * Set task result
 */
Job.prototype.setTaskResult = function(task) {
  // for now just set to results, later if alreadypresent then make it an array
  this.results[task.id]=task;
  //console.log(this.results);
};

/* 
 * check if job is complete or not.
 */
Job.prototype.isComplete = function() {
  var id=this.dag.nextTask();
  if(id) return false;
  return true;
};

/*
 * Process the job to see if any task can be
 * promoted to taskQ.
 * [returns] task or undefined 
 */
Job.prototype.fetch = function() {
  var self = this;
  var t;
  var id = self.dag.nextTask();
  if(id && self.isTaskReady(id)) {
    t=self.q.dequeue();
    self.dag.advance();
  } 
  return t;
};


// ----------------
var JobList = function() {
  this.jobs = {};
  this.taskQ = new task.TaskQ();
};

/*
 * Submit a new job to the joblist
 */
JobList.prototype.submit = function(jobid, config) {
  var myJob = new Job(jobid, config);
  this.jobs[myJob.id] = myJob;
};

/*
 * Process the next Job
 * - Look for any taskq promotions
 * - process any items from the taskQ
 */
JobList.prototype.process = function() {
  var self = this;
  // 1. process all job's
  if(_.size(self.jobs)>0) {
    _.each(self.jobs, function(job) {
      var t = job.fetch();
      if(t) {
        // add to taskQ
        self.taskQ.add(t);
      } else {
        if(job.isComplete()) {
          console.log('Job ' + job.id + ' complete');
          delete self.jobs[job.id];
        }
      }
    });
  }
  // 2. process any taskQ items
  while(self.taskQ.q.size()>0) {
    self.taskQ.processOne(function(task) {
      // now add this to the job result
      if(self.jobs.hasOwnProperty(task.job)) {
        self.jobs[task.job].setTaskResult(task);
      }
    });
  }
};


// module exports
exports.Job = Job;
exports.JobList = JobList;

// - EOF

