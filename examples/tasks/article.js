exports.task = function(job, done) {
  console.log('fetch article');
  done();
};

exports.done = function() {
  console.log('completed fetching articles');
};

