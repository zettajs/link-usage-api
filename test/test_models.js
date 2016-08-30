var assert = require('assert');
var rootFormatSiren = require('../formats/siren/root.siren');
var rootFormatCsv = require('../formats/csv/root.csv');
var data = require('./mocks/mock_root_data').postFormat;
var csvData = require('./mocks/mock_root_data').csvData;

var env = {
  helpers: {
    url: {
      current: function(){

      },
      path: function(){

      }
    }
  }
}

describe('root models', function(){
  it('will properly create a root object.', function(){
    var model = rootFormatSiren({env: env, mappings: data});
    assert.equal(model.class[0], 'root');
    assert.equal(model.properties.httpCount, 3209);
    assert.equal(model.properties.messagesBytes, 59373120);
    assert.equal(model.properties.messagesCount, 3573642);
    assert.equal(model.properties.startDate, "2016-08-01T04:00:00.000Z");
    assert.equal(model.properties.endDate, "2016-08-30T04:00:00.000Z");
    assert.equal(model.properties.aggregation, "day");
    assert.equal(model.entities.length, 1);

    var entity = model.entities[0];
    assert.ok(entity.properties);
    assert.ok(entity.links);
    assert.ok(entity.class);
    assert.ok(entity.rel);
  });

  it('will create a properly formatted embedded entity', function(){
    var model = rootFormatSiren({env: env, mappings: data});

    var entity = model.entities[0];
    assert.ok(entity.properties.tenantId, 'default');
    assert.ok(entity.properties.data.length, 30);
    assert.ok(entity.links.length, 1);
    assert.equal(entity.class[0], 'usage');
    assert.equal(entity.rel[0], 'item');
  });

  it('will create a CSV', function(){
    var model = rootFormatCsv({env: env, mappings: data});
    assert.equal(model, csvData);

  })
});

describe('tenant models', function(){

});
