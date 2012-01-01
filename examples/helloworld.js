var cloudd = require('../index');

// hello 'task' definition
var hello = {
  task: function(job, done) {
    job.log('hello task log :' + job.title);
    console.log('hello');
    done();
  }
};

// world 'task' definition
var world = {
  task: function(job, done) {
    job.log('world task log :' + job.title);
    console.log('world');
    done();
  },
  done:function() {
    console.log('world -- task successfuly completed : #' + this.id);
  }
};

// workflow definition
var flow = [
  {id:'hello', task: hello, parent:'root'},
  {id:'world', task: world, parent:'root'}
];

cloudd.submit('test-one',flow);
cloudd.startapp(3000);

