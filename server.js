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

var titan = require('titan');
var siren = require('argo-formatter-siren');
var csv = require('./formats/csv_formatter.js');
var RootResource = require('./resources/root');
var TenantsResource = require('./resources/tenants');

var influxHost = process.env.INFLUXDB_HOST || 'http://localhost:8086';
var influxUsername = process.env.INFLUXDB_USERNAME;
var influxPassword = process.env.INFLUXDB_PASSWORD;
var port = process.env.PORT || 4000;

titan()
  .allow('*')
  .compress()
  .logger()
  .format({ engines: [siren, csv], override: { 'application/json': siren } })
  .add(RootResource, influxHost, influxUsername, influxPassword)
  .add(TenantsResource, influxHost, influxUsername, influxPassword)
  .listen(port);
