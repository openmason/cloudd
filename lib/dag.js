/**
 * Cloudd - copyright(c) 2011-2013 openmason.
 * MIT License.
 */

var _ = require('underscore');

// DAG
// - routines related to DAG go here

exports.DAG = function(links) {
  this.dependencies = this._buildDependencies(links);
};

exports.getDependencies = _buildDependencies;

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

