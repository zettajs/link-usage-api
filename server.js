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
