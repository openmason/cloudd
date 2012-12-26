var assert=require('assert');
var dag = require('../lib/dag');
var should = require('should');

// DAG tests
describe('DAG', function() {
  before(function(done) {
    done();
  });

  // buildDependencies 
  // - empty
  // - father -> child -> grandchild
  // - diamond -> A -> B, C -> D
  // - funnel -> A, B, C -> D -> E
  // - Hourglass -> A,B,C -> D -> E, F, G
  // - cycle -> A -> B -> C -> A
  describe('buildDependencies', function() {
    it('empty', function(done) {
      assert.deepEqual(dag.buildDependencies(),[]);
      done();
    });
    it('empty-2', function(done) {
      var links=[{link1:{parent:[],child:[]}}];
      assert.deepEqual(dag.buildDependencies(links),[]);
      done();
    });
    it('father -> child -> grandchild', function(done) {
      var links=[{link1:{parent:['father'],child:['child']}},
                 {link2:{parent:['child'],child:['grandchild']}}
                ];
      var result = [["child","father"],["grandchild","child"]];
      assert.deepEqual(dag.buildDependencies(links),result);
      done();
    });
    it('diamond -> A -> (B, C) -> D', function(done) {
      var links=[{link1:{parent:['A'],child:['B','C']}},
                 {link2:{parent:['B','C'],child:['D']}}
                ];
      var result = [["B","A"],["C","A"],["D","B"],["D","C"]];
      assert.deepEqual(dag.buildDependencies(links),result);
      done();
    });
    it('funnel -> (A, B, C) -> D -> E', function(done) {
      var links=[{link1:{parent:['A','B','C'],child:['D']}},
                 {link2:{parent:['D'],child:['E']}}
                ];
      var result = [["D","A"],["D","B"],["D","C"],["E","D"]];
      assert.deepEqual(dag.buildDependencies(links),result);
      done();
    });
    it('Hourglass -> (A,B,C) -> D -> (E, F, G)', function(done) {
      var links=[{link1:{parent:['D'],child:['E','F','G']}},
                 {link2:{parent:['A','B','C'],child:['D']}}
                ];
      var result = [["E","D"],["F","D"],["G","D"],["D","A"],["D","B"],["D","C"]];
      assert.deepEqual(dag.buildDependencies(links),result);
      done();
    });
    it('cycle -> A -> B -> C -> A', function(done) {
      var links=[{link1:{parent:['A'],child:['B']}},
                 {link2:{parent:['C'],child:['A']}},
                 {link2:{parent:['B'],child:['C']}}
                ];
      var result = [["B","A"],["A","C"],["C","B"]];
      assert.deepEqual(dag.buildDependencies(links),result);
      done();
    });
  });

  // nextTask
  //  -- check on init
  //  -- check on length
  //  -- check on empty
  describe('nextTask/advance/getDependencies', function() {
    it('empty check', function(done) {
      var d = new dag.DAG();
      should.not.exist(d.nextTask());
      done();
    });
    it('checks', function(done) {
      var links=[{link1:{parent:['A'],child:['B']}},
                 {link2:{parent:['B'],child:['C']}}
                ];
      var d = new dag.DAG(links);
      assert.equal(d.nextTask(), 'A');
      assert.equal(d.index, 0);
      assert.deepEqual(d.getDependencies('A'),[]);
      d.advance();
      assert.equal(d.nextTask(), 'B');
      assert.equal(d.index, 1);
      assert.deepEqual(d.getDependencies('B'),['A']);
      d.advance();
      assert.equal(d.nextTask(), 'C');
      assert.equal(d.index, 2);
      assert.deepEqual(d.getDependencies('C'),['B']);
      d.advance();
      should.not.exist(d.nextTask());
      assert.equal(d.index, 3);
      assert.deepEqual(d.getDependencies(),[]);
      done();
    });
    it('multiple dependencies', function(done) {
      var links=[{link1:{parent:['D'],child:['E','F','G']}},
                 {link2:{parent:['A','B','C'],child:['D']}}
                ];
      var d = new dag.DAG(links);
      assert.deepEqual(d.getDependencies("D"),['A','B','C']);
      done();
    });
  });

});
