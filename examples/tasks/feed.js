var taskname='[feed]';

/**
 * fetch the feed articles, feed is passed as config
 * in the job
 */
exports.task = function(task, done) {
  //var feed = job.data.config;
  //console.log("%s %s - %s", taskname, task.id, feed); 
  console.log("inside fetching feeds");
  done();
};

