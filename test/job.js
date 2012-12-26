var assert = require('assert');
var job = require('../lib/job');
var should = require('should');

// 'job' related tests
describe('job', function() {
  before(function(done) {
    done();
  });

  // Job
  // - without jobid (or) config
  //  - missing jobs section
  //  - missing task section within jobs
  //  - missing dependencies section
  //  - circular dependency
  // - check isTaskReady
  // - isComplete
  // - fetch (check the dag state)
  describe('Job object', function() {
    it('without jobid', function(done) {
      var jid;
      try {
        var j = new job.Job(jid, {'jobs': {}});
        should.not.exist(j);
      }
      catch(err) {
        should.exist(err);
      }
      done();
    });
    it('without config', function(done) {
      var jid = '12346';
      var config;
      try {
        var j = new job.Job(jid, config);
        should.not.exist(t);
      }
      catch(err) {
        should.exist(err);
      }
      // lets omit config 'jobs' section
      done();
    });
  });

});
