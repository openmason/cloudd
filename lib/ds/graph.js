// - Topological sort from https://gist.github.com/1232505
//
/*
Copyright 2012 Shin Suzuki<shinout310@gmail.com>
 
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
 
       http://www.apache.org/licenses/LICENSE-2.0
 
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

exports.tsort = function (edges) {
  var nodes   = {}, // hash: stringified id of the node => { id: id, afters: lisf of ids }
      sorted  = [], // sorted list of IDs ( returned value )
      visited = {}; // hash: id of already visited node => true
 
  var Node = function(id) {
    this.id = id;
    this.afters = [];
  };
 
  // 1. build data structures
  edges.forEach(function(v) {
    var from = v[0], to = v[1];
    if (!nodes[from]) nodes[from] = new Node(from);
    if (!nodes[to]) nodes[to]     = new Node(to);
    nodes[from].afters.push(to);
  });
 
  // 2. topological sort
  Object.keys(nodes).forEach(function visit(idstr, ancestors) {
    var node = nodes[idstr],
        id   = node.id;
 
    // if already exists, do nothing
    if (visited[idstr]) return;
 
    if (!Array.isArray(ancestors)) ancestors = [];
 
    ancestors.push(id);
 
    visited[idstr] = true;
 
    node.afters.forEach(function(afterID) {
      if (ancestors.indexOf(afterID) >= 0)  // if already in ancestors, a closed chain exists.
        throw new Error('closed chain : ' +  afterID + ' is in ' + id);
 
      visit(afterID.toString(), ancestors.map(function(v) { return v })); // recursive call
    });
 
    sorted.unshift(id);
  });
 
  return sorted;
};

// -- EOF
