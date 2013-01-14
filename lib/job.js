/**
 * Cloudd - copyright(c) 2011-2013 openmason.
 * MIT License.
 */
var _       = require('underscore');
var os      = require('os');
var winston = require('winston');
var events  = require('events');
var util    = require('util');

var ds      = require('./ds/buckets');
var task    = require('./task');
var dag     = require('./dag');

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
  this.tasksConfig = {};
  var self = this;
  // if there are jobs that are without
  // any dependencies, they can be picked up
  // first
  var nodeps=_.difference(_.keys(config.jobs), self.dag.tasks);
  self.dag.tasks = _.union(nodeps, self.dag.tasks);
  _.each(self.dag.tasks, function(tid) { 
    if(!config.jobs.hasOwnProperty(tid)) {
      throw Error('invalid task configuration:'+tid);
    }
    self.tasksConfig[tid]={
      meta:new task.Task(jobid, tid, config.jobs[tid]),
      instances: 1
    };
  });
  self.outstandingTasks = 0;
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
  _.each(taskdeps, function(dep) { if(self.isDependencyComplete(dep)) pending--; });
  return pending==0;
};

/*
 * Check if the dependency have all its results.
 */
Job.prototype.isDependencyComplete = function(taskid) {
  var self=this;
  if(self.results.hasOwnProperty(taskid)) {
    return _.size(self.results[taskid])==self.tasksConfig[taskid].instances;
  }
  return false;
};

/*
 * Set task result
 */
Job.prototype.setTaskResult = function(task) {
  winston.debug(_pkgname + 'set result job [' + this.id + '] with:'+JSON.stringify(task));
  // for now just set to results, later if alreadypresent then make it a hash
  // - find the last '#' and split on that
  var n = task.id.lastIndexOf('#');
  var taskid = n>0?task.id.slice(0,n):task.id;
  var subtaskid = n>0?task.id.slice(n+1):'__';
  if(!this.results.hasOwnProperty(taskid)) {
    this.results[taskid]={};
  }
  this.results[taskid][subtaskid]=task;
  this.outstandingTasks--;
  //console.log(this.results);
};

/* 
 * check if job is complete or not.
 */
Job.prototype.isComplete = function() {
  var id=this.dag.nextTask();
  if(id) return false;
  // check if all results have come in
  return this.outstandingTasks==0;
};

/*
 * Issue tasks. 
 * - Check if the dependencies have any output
 * - if the output is absent, just issue one task
 * - if the output is present, issue those many # of tasks with that as input
 */
Job.prototype.issueTasks = function(taskid) {
  var self = this;
  var t=[];
  var metaTask=self.tasksConfig[taskid].meta;
  var taskdeps=self.dag.getDependencies(taskid);
  //console.log(taskid+'=====>'+taskdeps);
  _.each(taskdeps, function(dep) { 
    if(self.results.hasOwnProperty(dep)) {
      var depResults = self.results[dep];
      //console.log(depResults);
      _.each(depResults, function(depResult, subtaskid) {
        // @todo - the output might have returned different
        // types, to be handled later.
        _.each(depResult.output, function(depTask) {
          var newTask = metaTask.clone();
          var subid = depTask.id || (Math.floor(Math.random()*10000)+1).toString(36);
          _.extend(newTask, depTask);
          newTask.id = metaTask.id+'#'+subid;
          t.push(newTask);
        });
        if(_.size(depResult.output)==0 && subtaskid!="__") {
          var newTask = metaTask.clone();
          newTask.id += '#' + subtaskid;
          t.push(newTask);
        }
      });
    }
  });
  if(t.length==0) {
    t.push(metaTask);
  }
  self.tasksConfig[taskid].instances=t.length;
  self.outstandingTasks += t.length;
  return t;
};

/*
 * Process the job to see if any task can be
 * promoted to taskQ.
 * [returns] task or undefined 
 */
Job.prototype.fetch = function() {
  var self = this;
  var tlist;
  var id = self.dag.nextTask();
  if(id && self.isTaskReady(id)) {
    tlist=self.issueTasks(id);
    _.each(tlist, function(t) {
      winston.info(_pkgname + 'promoting task ['+t.id+'] from job [' + self.id + '] to TaskQ');
    });
    self.dag.advance();
  } 
  return tlist;
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
  // set the emitter
  events.EventEmitter.call(this);
  this.jobs = {};
  this.taskQ = new task.TaskQ();
  this.maxTasks = os.cpus().length;
  winston.info(_pkgname + 'max workers['+this.maxTasks+']');
};

// bind eventemitter
util.inherits(JobList, events.EventEmitter);

/*
 * Submit a new job to the joblist
 */
JobList.prototype.submit = function(jobid, config) {
  var myJob = new Job(jobid, config);
  this.jobs[myJob.id] = myJob;
  this.emit('job', myJob.id);
};

/*
 * Process a single job for taskq promotions
 */
JobList.prototype._processJob = function(job) {
  var self = this;
  var tlist = job.fetch();
  while(tlist && tlist.length>0) {
    _.each(tlist, function(t) {
      // add to taskQ
      self.taskQ.add(t);
    });
    tlist=job.fetch();
  } 
  if(job.isComplete()) {
    winston.info(_pkgname + 'Job ['+job.id+'] complete!');
    delete this.jobs[job.id];
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

