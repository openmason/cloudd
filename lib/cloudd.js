/**
 * Cloudd - copyright(c) 2011-2013 openmason.
 * MIT License.
 */
var _       = require('underscore');
var to      = require('to');
var cronJob = require('cron').CronJob;
var util    = require('util');
var winston = require('winston');
var job     = require('./job');
var handy   = require('handy');

// module variables
var _jobsList;
var _pkgname = '[cloudd] ';
winston.default.transports.console.level = 'error';
winston.default.transports.console.colorize = true;
winston.default.transports.console.timestamp = true;

// -------- todo -------------

// cloudd-format - create new package for formatting job names
//   -- use date format, use host name, etc.,


/**
 * function to submit a given job every 'cron config' .
 * NOTE, the name of the job would be appended with timestamp
 * for uniqueness.
 * @todo: This should be converted to cluster wide
 *        cron-job
 */
exports.submitAt = function(croncfg, name, config) {
  // do a cron job to create jobs
  // @todo: need to validate the croncfg
  cronJob(croncfg, function() {
    var datedName = _dateString() + ':' + name;
    winston.info(_pkgname + 'cron job [' + name + '] as ['+datedName+']');
    exports.submit(datedName, config);
  });
};

/**
 * function to submit a job. 
 * jobid, config
 */
exports.submit = function (jobid, config) {
  if(_jobsList) {
    winston.info(_pkgname + "job added: '" + jobid + "'");
    _jobsList.submit(jobid, config);
  } else {
    throw Error("This API to be called from the server side.");
  }
};

// ---------- management functions
var zmq = require('zmq');
var socket = zmq.socket('rep');
socket.identity = 'cloudd' + process.pid;

/* Start the server */
exports.start = function(port) {
  var cmdport = port || 'tcp://127.0.0.1:12345';
  _jobsList = new job.JobList();

  socket.bind(cmdport, function(err) {
    if (err) throw err;
    winston.info(_pkgname+'bound to management port!'+cmdport);
    //_server();
    socket.on('message', function(data) {
      winston.info(_pkgname+'received cmd> ' + data.toString());
      var tokens = data.toString().split(' ');
      switch(tokens[0]) {
       case 'ps': socket.send(JSON.stringify(_jobsList.taskQ.runningTasks));break;
       case 'jobs': socket.send(JSON.stringify(_jobsList.toStringObj()));break;
       case 'tasks': socket.send(JSON.stringify(_jobsList.taskQ.qAsArray()));break;
       case 'submit': 
        var res = {result:'submitted'};
        try {
          exports.submit(tokens[1], to.load(tokens[2]));
        } catch(err) {
          res.result=err;
        }
        socket.send(JSON.stringify(res));
        break;
      default: socket.send('{"result":"command ['+data.toString()+'] not found"}');break;
      };
    });
  });
};

/* returns current version
 */
exports.version = handy.getVersion();


// ---------- internal functions

function _dateString() {
  var now=new Date();
  return util.format("%d-%d-%d:%d-%d-%d", 
                     now.getFullYear(),now.getMonth()+1,now.getDate(), 
                     now.getHours(), now.getMinutes(), now.getSeconds());
}


// ------ default handlers for job

function taskComplete() {
  winston.info(_pkgname + "task done #"+this.id + ' [' + this.data.id + ']');
  // now instantiate the next set of tasks
  //issueJobsNextLevel(this.data.jobname, this, this.data.flow);
  if(this.data._done) {
    this.data._done(this);
  }
}
function taskFailed() {
  winston.error(_pkgname + "task **FAILED** #"+this.id + '[' + this.data.id + ']');
}
function taskProgress(job, progress) {
  winston.debug(_pkgname + "task progress #"+this.id  + '[' + this.data.id + ']' + " progress :" + progress);
}

// -- EOF
