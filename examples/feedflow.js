var cloudd = require('../index');

// workflow definition:
// tasks are defined in individual files - methods could be task/done/failed/progress
// configuration the task graph looks:
//  root -> 'fetch feeds' -> 'fetch articles' -> 'save articles'
var flow = [
  {id:'fetch feeds',     task: require('./tasks/feed'), parent:'root'},
  {id:'fetch articles',  task: require('./tasks/article'), parent:'fetch feeds'},
  {id:'save articles',   task: require('./tasks/upload'), parent:'fetch articles'}
];

// submit job at given cron config
// lets try submitting one every minute
cloudd.submitAt('0 * * * * *', 'feeder', flow);
cloudd.startapp(3000);

