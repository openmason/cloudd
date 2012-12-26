var assert = require('assert');
var worker = require('../lib/worker');
var should = require('should');

// process tests
describe('process', function() {
  before(function(done) {
    done();
  });

  // constructor
  // - unknown command
  // - stdout
  // - stderr
  // - error code
  // - host
  describe('running worker', function() {
    it('unknown command', function(done) {
      var p = new worker.Process('unknown', function(err) {
        should.exist(err);
        done();
      });
    });
    // @todo: yet to take the stdout,stderr outputs
    it('stdout', function(done) {
      var p = new worker.Process('echo hello', function(err) {
        should.not.exist(err);
        done();
      });
    });

    it('error code', function(done) {
      var p = new worker.Process('cat /t/x/y', function(err) {
        should.exist(err);
        assert.equal(err.code, 1);
        done();
      });
    });

    it('hostname', function(done) {
      var p = new worker.Process('echo hi', function(err) {
        should.not.exist(err);
        done();
      });
      assert.equal(p.host, require('os').hostname());
    });

  });


});
