var assert = require('assert');
var task = require('../lib/task');
var should = require('should');

// 'task' related tests
describe('task', function() {
  before(function(done) {
    done();
  });

  // Task
  // - without taskid (or) jobid
  // - run FAILED
  // - run COMPLETE
  describe('Task object', function() {
    it('without taskid', function(done) {
      var tid;
      try {
        var t = new task.Task('123', tid, 'xyz', 'echo hello');
        should.not.exist(t);
      }
      catch(err) {
        should.exist(err);
      }
      done();
    });
    it('without jobid', function(done) {
      var jid;
      try {
        var t = new task.Task(jid, '123', 'xyz', 'echo hello');
        should.not.exist(t);
      }
      catch(err) {
        should.exist(err);
      }
      done();
    });
    it('run failed', function(done) {
      var t = new task.Task('abc', '123', 'xyz', 'unknown_cmd');
      t.run(function(err) {
        should.exist(err);
        assert.equal(t.state, task.State.FAILED);
        done();
      });
    });
    it('run complete', function(done) {
      var t = new task.Task('abc', '123', 'xyz', 'echo hi');
      t.run(function(err) {
        should.not.exist(err);
        assert.equal(t.state, task.State.COMPLETE);
        done();
      });
    });
  });

  // TaskQ
  // -- add to the queue
  // -- process one when no elements
  // -- pocess one successfully
  describe('TaskQ', function() {
    it('empty check', function(done) {
      var tq = new task.TaskQ();
      assert.equal(tq.q.size(), 0);
      assert.equal(Object.keys(tq.runningTasks).length, 0);
      done();
    });
    it('add one task', function(done) {
      var tq = new task.TaskQ();
      var t = new task.Task('abc', '123', 'xyz', 'echo hi');
      tq.add(t);
      assert.equal(tq.q.size(), 1);
      assert.equal(Object.keys(tq.runningTasks).length, 0);
      assert.equal(t.state, task.State.READY);
      done();
    });
    it('process one when no elements', function(done) {
      var tq = new task.TaskQ();
      tq.processOne(function(task) {
        should.not.exist(task);
        done();
      });
    });
    it('process on successfully', function(done) {
      var tq = new task.TaskQ();
      var t = new task.Task('abc', '123', 'xyz', 'echo hi');
      tq.add(t);
      var t1 = new task.Task('abc', '124', 'xyz', 'echo hi');
      tq.add(t1);
      assert.equal(tq.q.size(), 2);
      assert.equal(Object.keys(tq.runningTasks).length, 0);
      assert.equal(t.state, task.State.READY);
      assert.equal(t1.state, task.State.READY);
      tq.processOne(function(task) {
        should.exist(task);
        assert.equal(tq.q.size(), 1);
        assert.equal(t, task);
        done();
      });
    });

  });

});
