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

var Siren = function() {
  this.name = 'csv';
  this.mediaTypes = ['text/csv'];
  this.extension = '.csv.js';
  this.subdirectory = '/csv';
};

Siren.prototype.format = function(filename, locals, cb) {
  var template = require(filename);
  cb(null, template(locals));
};

module.exports = new Siren();
