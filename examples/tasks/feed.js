var taskname='[feed]';

// create feed tasks
// return array of task configs [ {id, title, config}, {id, title, config}, ... ]
exports.create = function(taskid) {  
  var feeds = [
    {name:'bbc',   url:'http://newsrss.bbc.co.uk/rss/path...to..xml'}
  ];
  var taskconfigs = [];
  for(var i=0;i<feeds.length;i++) {
    var taskconfig = {id:taskid+':'+feeds[i].name, title: taskid+':'+feeds[i].name, config: feeds[i].url};
    taskconfigs.push(taskconfig);
  }
  return taskconfigs;
};

/**
 * fetch the feed articles, feed is passed as config
 * in the job
 */
exports.task = function(job, done) {
  var feed = job.data.config;
  console.log("%s %s - %s", taskname, job.type, feed); 
  done();
};

