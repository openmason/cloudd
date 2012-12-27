// hello 'task' definition
exports.hello = function(task, done) {
  task.log.push('hello task log :' + task.id + '-' + task.job);
  console.log('hello');
  done();
};

// world 'task' definition
exports.world = function(task, done) {
  var now=new Date();
  task.log.push('world logged at:'+now);
  console.log('world');
  done();
};
