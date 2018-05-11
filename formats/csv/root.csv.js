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
  var tenants = Object.keys(mappings.tenants);
  var dates = []
  if(tenants.length) {
    dates =  Object.keys(mappings.tenants[tenants[0]].values);
  }

  var columns = firstTwoColumns.concat(dates);
  var csvData = [columns];
  tenants.forEach(function(tenantKey){
    var tenant = mappings.tenants[tenantKey];
    csvData = csvData.concat(generateRows(tenantKey, tenant));
  });

  return stringify(csvData);

}

function generateRows(tenantKey, tenant) {
  var messagesCountRow =[tenantKey, 'messagesCount'];
  var messagesBytesRow = [tenantKey, 'messagesBytes'];
  var httpCountRow = [tenantKey, 'httpCount'];
  Object.keys(tenant.values).forEach(function(valueKey){
    var value = tenant.values[valueKey];
    messagesCountRow.push(value.messagesCount);
    messagesBytesRow.push(value.messagesBytes);
    httpCountRow.push(value.httpCount);
  });

  return [messagesCountRow, messagesBytesRow, httpCountRow];
}
