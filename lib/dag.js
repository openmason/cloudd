/**
 * Cloudd - copyright(c) 2011-2013 openmason.
 * MIT License.
 */

var _ = require('underscore');
var graph = require('./ds/graph');

// DAG
// - routines related to DAG go here

var DAG = function(links) {
  this.dependencies = _buildDependencies(links);
  this.tasks = graph.tsort(this.dependencies).reverse();  
  this.index = 0;
};

exports.buildDependencies = _buildDependencies;
exports.DAG = DAG;

/*
 * Returns next available task
 * - undefined means, there are no more tasks
 */
DAG.prototype.nextTask = function() {
  var t;
  if(this.index<this.tasks.length) {
    t=this.tasks[this.index];
  };
  return t;
};

/*
 * progress % in numbers - this is approx value
 */
DAG.prototype.progress = function() {
  return this.index<0?0:this.index>this.tasks.length?100:this.index / this.tasks.length;
};

/*
 * Set the index to next
 */
DAG.prototype.advance = function () {
  this.index++;
};

/*
 * Returns list of dependencies for a given task
 */
DAG.prototype.getDependencies = function(taskid) {
  var self = this;
  return _.map(_.filter(self.dependencies, function(dep) { return taskid==dep[0]; }),
               function(entry) { return entry[1]; });
};

/*
 * links would be 
 * [ { link1: { parent: [..], child: [..] } },
 *   { link2: { parent: [..], child: [..] } } ]
 * 
 */
function _buildDependencies(links) {
  var deplist = [];
  // link would be 
  // link1: { parent:[], child:[] }
  _.each(links, function(link) {
    // get the value object that contains parent, child
    var l=_.values(link)[0];
    _.each(l.parent, function(p) {
      _.each(l.child, function(c) {
        deplist.push([c,p]);
      });
    });
  });
  return deplist;
};

