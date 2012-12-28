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
      var jid, j;
      try {
        j = new job.Job(jid, {'jobs': {}});
      }
      catch(err) {
        should.exist(err);
      }
      should.not.exist(j);
      done();
    });
    it('without config', function(done) {
      var jid = '12346';
      var config;
      var j;
      try {
        j = new job.Job(jid, config);
      }
      catch(err) {
        should.exist(err);
      }
      should.not.exist(j);
      done();
    });
    it('config - missing jobs section', function(done) {
      var jid = '12346';
      var config={'name':'test job', 'dependencies':[{'link1':{parent:['A','B'],child:['C']}}]};
      var j;
      try {
        j = new job.Job(jid, config);
      }
      catch(err) {
        should.exist(err);
      }
      should.not.exist(j);
      done();
    });
    it('config - missing task within job', function(done) {
      var jid = '12346';
      var config={'name':'test job', 
                  'jobs': {'A':{name:'hello'} },
                  'dependencies':[{'link1':{parent:['A'],child:['C']}}]};
      var j;
      try {
        j = new job.Job(jid, config);
      }
      catch(err) {
        should.exist(err);
      }
      should.not.exist(j);
      done();
    });
    it('config - missing dependencies', function(done) {
      var jid = '12346';
      var config={'name':'test job',
                  'jobs': {'A':{name:'hello'} } };
      var j;
      try {
        j = new job.Job(jid, config);
      }
      catch(err) {
        should.exist(err);
      }
      should.not.exist(j);
      done();
    });
    it('config - circular dependencies', function(done) {
      var jid = '12346';
      var config={'name':'test job', 
                  'jobs': {'A':{name:'hello'}, 'B':{name:'b'} },
                  'dependencies':[{'link1':{parent:['A'],child:['B']}},
                                  {'link2':{parent:['B'],child:['A']}}
                                 ]};
      var j;
      try {
        j = new job.Job(jid, config);
      }
      catch(err) {
        should.exist(err);
      }
      should.not.exist(j);
      done();
    });

    it('config - missing executable', function(done) {
      var jid = '12346';
      var config={'name':'test job', 
                  'jobs': {'A':{name:'hello'}, 'B':{name:'b'} },
                  'dependencies':[{'link1':{parent:['A'],child:['B']}}
                                 ]};
      var j;
      try {
        j = new job.Job(jid, config);
      }
      catch(err) {
        should.exist(err);
      }
      should.not.exist(j);
      done();
    });

    it('config - both executable/javascript specified', function(done) {
      var jid = '12346';
      var config={'name':'test job', 
                  'jobs': {'A':{name:'hello', executable:'echo x', javascript: {lib:'xyz'}}, 'B':{name:'b'} },
                  'dependencies':[{'link1':{parent:['A'],child:['B']}}
                                 ]};
      var j;
      try {
        j = new job.Job(jid, config);
      }
      catch(err) {
        should.exist(err);
      }
      should.not.exist(j);
      done();
    });

    it('config - invalid javascript path', function(done) {
      var jid = '12346';
      var config={'name':'test job', 
                  'jobs': {'A':{name:'hello', javascript: {lib:'xyz'}}, 'B':{name:'b'} },
                  'dependencies':[{'link1':{parent:['A'],child:['B']}}
                                 ]};
      var j;
      try {
        j = new job.Job(jid, config);
      }
      catch(err) {
        should.exist(err);
      }
      should.not.exist(j);
      done();
    });

    it('config - invalid javascript method', function(done) {
      var jid = '12346';
      var config={'name':'test job', 
                  'jobs': {'A':{name:'hello', javascript: {lib:'../examples/helloworld'}}, 'B':{name:'b'} },
                  'dependencies':[{'link1':{parent:['A'],child:['B']}}
                                 ]};
      var j;
      try {
        j = new job.Job(jid, config);
      }
      catch(err) {
        should.exist(err);
      }
      should.not.exist(j);
      done();
    });

    it('config - different javascript method', function(done) {
      var jid = '12346';
      var config={'name':'test job', 
                  'jobs': {'A':{name:'hello', javascript: {lib:'../examples/helloworld', method:'hello'}}, 'B':{name:'b', executable:'echo x'} },
                  'dependencies':[{'link1':{parent:['A'],child:['B']}}
                                 ]};
      var j;
      try {
        j = new job.Job(jid, config);
      }
      catch(err) {
        should.not.exist(err);
      }
      should.exist(j);
      done();
    });

    it('isTaskReady', function(done) {
      var jid = '12346';
      var config={'name':'test job', 
                  'jobs': {'A':{name:'hello',executable:'xyz'}, 'B':{name:'b',executable:'abc'} },
                  'dependencies':[{'link1':{parent:['A'],child:['B']}}
                                 ]
                 };
      var j;
      try {
        j = new job.Job(jid, config);
        assert.equal(j.isTaskReady('A'), true);
        assert.equal(j.isTaskReady('B'), false);
        assert.equal(j.isTaskReady('Y'), true);
      }
      catch(err) {
        should.not.exist(err);
      }
      should.exist(j);
      done();
    });

    it('isComplete and fetchTasks', function(done) {
      var jid = '12346';
      var config={'name':'test job', 
                  'jobs': {'A':{executable:'echo a'}, 'B':{executable:'echo b'} },
                  'dependencies':[{'link1':{parent:['A'],child:['B']}}
                                 ]
                 };
      var j;
      try {
        j = new job.Job(jid, config);
        assert.equal(j.isComplete(), false);
        var tsk = j.fetch();
        should.exist(tsk);
        assert.equal(j.isComplete(), false);
        should.not.exist(j.fetch());
        j.setTaskResult(tsk[0]);
        tsk = j.fetch();
        should.exist(tsk);
        assert.equal(j.isComplete(), false);
        j.setTaskResult(tsk[0]);
        assert.equal(j.isComplete(), true);
      }
      catch(err) {
        console.log(err);
        should.not.exist(err);
      }
      should.exist(j);
      done();
    });

  });

  // JobList
  // - submit
  // - check _processJob
  describe('JobList', function() {
    it('submit job', function(done) {
      var jid = '12346';
      var config={'name':'test job', 
                  'jobs': {'A':{executable:'echo a'}, 'B':{executable:'echo b'} },
                  'dependencies':[{'link1':{parent:['A'],child:['B']}}
                                 ]
                 };
      var jl = new job.JobList();
      assert.deepEqual(Object.keys(jl.jobs),[]);
      assert.equal(jl.taskQ.q.size(),0);
      jl.submit(jid, config);
      assert.deepEqual(Object.keys(jl.jobs),[jid]);
      assert.equal(jl.taskQ.q.size(),0);
      jl.process();
      assert.deepEqual(Object.keys(jl.jobs),[jid]);
      assert.equal(jl.taskQ.q.size(),0);
      done();
    });
  });
});
