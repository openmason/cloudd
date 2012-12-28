var _taskname='[feed] ';
var to = require('to');
var _ = require('underscore');

/**
 * fetch the feed articles, feed is passed as config
 * in the job
 */
exports.task = function(task, done) {
  console.log(_taskname + "inside getting the list of feeds from:"+task.input);
  var feedList = to.load(task.input);
  _.each(feedList.feeds, function(val,key) { 
    task.output.push({id:key, input:val}); 
  });
  console.log(_taskname+ 'Following feeds to be fetched:');
  console.log(feedList.feeds);
  done();
};
