var assert = require('assert');
var stringify = require('../formats/csv/stringify');


describe('sync stringify function', function(){
  it('will return a csv string', function(){
    var data = [['a', 'b']];
    var str = stringify(data);
    assert.equal(str, 'a,b\n');
  });

  it('will return a multiline csv string', function(){
    var data = [['a', 'b'],['c', 'd']];
    var str = stringify(data);
    assert.equal(str, 'a,b\nc,d\n');
  });
});
