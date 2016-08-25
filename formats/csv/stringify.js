var StringDecoder, stringify;

StringDecoder = require('string_decoder').StringDecoder;

stringify = require('csv-stringify');

module.exports = function(records, options) {
  var data, decoder, i, len, record, stringifier;
  if (options == null) {
    options = {};
  }
  data = [];
  if (records instanceof Buffer) {
    decoder = new StringDecoder();
    records = decoder.write(records);
  }
  stringifier = new stringify.Stringifier(options);
  stringifier.push = function(record) {
    if (record) {
      return data.push(record.toString());
    }
  };
  for (i = 0, len = records.length; i < len; i++) {
    record = records[i];
    stringifier.write(record);
  }
  stringifier.end();
  return data.join('');
};
