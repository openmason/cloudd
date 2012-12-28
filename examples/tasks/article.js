var _taskname='[article] ';
var _ = require('underscore');

exports.task = function(task, done) {
  console.log(_taskname + "inside fetching articles for feed:"+task.input);
  // lets say we got these random # of articles
  var n = task.id.lastIndexOf('#');
  var subtaskid = n>0?(task.id.slice(n+1)+'.'):'';
  _.each(_.range(Math.floor(Math.random()*10+1)), function(id) {
    task.output.push({id:subtaskid+id, input:'article #'+id}); 
  });
  console.log(_taskname+ 'Following articles to be fetched:');
  console.log(task.output);
  done();
};

