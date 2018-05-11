// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
