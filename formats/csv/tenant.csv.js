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

var stringify = require('./stringify');

module.exports = function(model) {
  var env = model.env;
  var mappings = model.mappings;

  var firstTwoColumns = ['tenant', 'metric'];
  var targets = Object.keys(mappings.targets);
  var dates = [];
  if(targets.length) {
    dates = Object.keys(mappings.targets[targets[0]].values);
  }
  var columns = firstTwoColumns.concat(dates);
  var csvData = [columns];
  targets.forEach(function(targetKey){
    var target = mappings.targets[targetKey];
    csvData = csvData.concat(generateRows(targetKey, target));
  });

  return stringify(csvData);

}

function generateRows(targetKey, target) {
  var messagesCountRow =[targetKey, 'messagesCount'];
  var messagesBytesRow = [targetKey, 'messagesBytes'];
  var httpCountRow = [targetKey, 'httpCount'];
  Object.keys(target.values).forEach(function(valueKey){
    var value = target.values[valueKey];
    messagesCountRow.push(value.messagesCount);
    messagesBytesRow.push(value.messagesBytes);
    httpCountRow.push(value.httpCount);
  });

  return [messagesCountRow, messagesBytesRow, httpCountRow];
}
