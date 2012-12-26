/**
 * Cloudd - copyright(c) 2011-2013 openmason.
 * MIT License.
 */

var os   = require('os');
var exec = require('child_process').exec;

// worker process
// - wrapper over exec
// - convert stdout/stderr to appropriate logs files

exports.Process = function(cmd, done) {
  this.host = os.hostname();
  this.pid = _run(cmd, done);
};

/*
 * Run a system command 'cmd'
 */
function _run(cmd, done) {
  var child = exec(cmd, function (error, stdout, stderr) {
    if(stdout) console.log('O: ' + stdout);
    if(stderr) console.log('E: ' + stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
      console.log('error code: ' + error.code);
      done(error);
    } else {
      done();
    }
    return;
  });
  return child.pid;
};
