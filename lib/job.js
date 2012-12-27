/**
 * Cloudd - copyright(c) 2011-2013 openmason.
 * MIT License.
 */
var _ = require('underscore');
var os = require('os');
var winston = require('winston');

var ds = require('./ds/buckets');
var task = require('./task');
var dag = require('./dag');

var _pkgname = '[cloudd] ';

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
  winston.info(_pkgname + 'new job [' + jobid + '] with tasks:'+self.dag.tasks);
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
  winston.debug(_pkgname + 'set result job [' + this.id + '] with:'+JSON.stringify(task));
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
    winston.info(_pkgname + 'promoting task ['+t.id+'] from job [' + this.id + '] to TaskQ');
    self.dag.advance();
  } 
  return t;
};

/*
 * toString - return key attributes for display purposes
 */
Job.prototype.toStringObj = function() {
  return {
    id:this.id, name:this.name, description:this.description, 
    next:this.dag.nextTask(),
    progress:this.dag.progress()
  };
};

// ----------------
var JobList = function() {
  this.jobs = {};
  this.taskQ = new task.TaskQ();
  this.maxTasks = os.cpus().length;
  winston.info(_pkgname + 'max workers['+this.maxTasks+']');
};

/*
 * Submit a new job to the joblist
 */
JobList.prototype.submit = function(jobid, config) {
  var myJob = new Job(jobid, config);
  this.jobs[myJob.id] = myJob;
  this.process();
};

/*
 * Process a single job for taskq promotions
 */
JobList.prototype._processJob = function(job) {
  var t = job.fetch();
  if(t) {
    // add to taskQ
    this.taskQ.add(t);
  } else {
    if(job.isComplete()) {
      winston.info(_pkgname + 'Job ['+job.id+'] complete!');
      delete this.jobs[job.id];
    }
  }
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
      self._processJob(job);
    });
  }
  // 2. process any taskQ items
  while(self.taskQ.q.size()>0 && _.size(self.taskQ.runningTasks)<self.maxTasks) {
    self.taskQ.processOne(function(task) {
      winston.info(_pkgname + 'task completed ['+task.id+'] of Job [' + task.job + ']');
      // now add this to the job result
      if(self.jobs.hasOwnProperty(task.job)) {
        var j = self.jobs[task.job];
        j.setTaskResult(task);
        //self._processJob(j);
        //@todo - not an efficient one, but lets do process on all queues
        self.process();
      }
    });
  }
};

/*
 * return jobs - displayable parts
 */
JobList.prototype.toStringObj = function() {
  return _.map(this.jobs, function(job) { return job.toStringObj(); });
};

// module exports
exports.Job = Job;
exports.JobList = JobList;

// - EOF

