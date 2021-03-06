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

var url = require('url');
var influxClient = require('../influx_basic_client');

var AGGREGATIONS = ['month', 'day'];
var MAX_SPANS = {
  'month': 12,
  'day': 32
};

var KEY_MAPS = {
  'hub_messages_count': 'messagesCount',
  'hub_messages_bytes': 'messagesBytes',
  'hub_http_count': 'httpCount'
};


var Tenant = module.exports = function(influxHost, influxUsername, influxPassword) {
  var parsed = url.parse(influxHost);
  this.influxOpts = {
    hostname: parsed.hostname,
    port: parsed.port
  };

  if (influxUsername && influxPassword) {
    this.influxOpts.auth = influxUsername + ':' + influxPassword;
  }
};

Tenant.prototype.init = function(config) {
  config
    .path('/tenants')
    .produces('application/json')
    .produces('application/vnd.siren+json')
    .produces('text/csv')
    .get('/{id}', this.list);
};

Tenant.prototype._processDate = function(date) {
  var d = new Date(date);
  if (d instanceof Date && isFinite(d)) {
    return d.toISOString();
  }
  return NaN;
};


Tenant.prototype.list = function(env, next) {
  var tenantId = env.route.params.id;
  var aggregation = env.route.query.aggregation || 'day';
  var startDate = env.route.query.startDate;
  var endDate = env.route.query.endDate;
  var custom = false;

  if (startDate && !endDate || endDate && !startDate) {
    env.response.body = 'Must supply startDate and endDate.\n';
    env.response.statusCode = 400;
    return next(env);
  }

  if (!startDate && !endDate) {
    var now = new Date();
    startDate = this._processDate('' + now.getFullYear() + '/' + (now.getMonth()+1) + '/1');
    endDate = this._processDate('' + now.getFullYear() + '/' + (now.getMonth()+1) + '/' + now.getDate());
  } else {
    startDate = this._processDate(startDate);
    endDate = this._processDate(endDate);
    custom = true;
    if (startDate === NaN || endDate === NaN) {
      env.response.body = 'Invalid date.\n';
      env.response.statusCode = 400;
      return next(env);
    }
  }

  if(aggregation == 'month') {
    custom = true;
  }

  if (AGGREGATIONS.indexOf(aggregation) < 0) {
    env.response.body = 'Aggregation invalid.\n';
    env.response.statusCode = 400;
    return next(env);
  }

  var stack = process.env.ZETTA_STACK;

  if (!stack) {
    env.response.body = 'No stack set.\n';
    env.response.statusCode = 404;
    return next(env);
  }

  var query1 = 'SELECT SUM(total) FROM hub_http_count WHERE link_stack = \''+stack+'\' AND tenantId=\''+tenantId+'\' AND time >= \''+ startDate +'\' AND time <= \''+ endDate +'\' GROUP BY \"targetName\", time(1d) fill(0)';

  var query2 = 'SELECT SUM(total) FROM hub_messages_bytes WHERE link_stack = \''+stack+'\' AND tenantId=\''+tenantId+'\' AND time >= \''+ startDate +'\' AND time <= \''+ endDate +'\' GROUP BY \"targetName\", time(1d) fill(0)';

  var query3 = 'SELECT SUM(total) FROM hub_messages_count WHERE link_stack = \''+stack+'\' AND tenantId=\''+tenantId+'\' AND time >= \''+ startDate +'\' AND time <= \''+ endDate +'\' GROUP BY \"targetName\", time(1d) fill(0)';

  influxClient.query(this.influxOpts, 'linkusage', [query1, query2, query3], function(err, results) {

    var mappings = {};
    mappings.targets = {};
    mappings.totals = {};
    mappings.startDate = startDate;
    mappings.endDate = endDate;
    mappings.custom = custom;
    mappings.aggregation = aggregation;
    mappings.tenantId = env.route.params.id;
    results.forEach(function(queryResult) {
      queryResult.forEach(function(result) {
        if (!mappings.targets[result.tags.targetName]) {
          mappings.targets[result.tags.targetName] = {
            targetId: result.tags.targetName,
            values: {}
          };
        }
        var groupObj = mappings.targets[result.tags.targetName];

        result.values.forEach(function(entry) {
          if (aggregation == 'month') {
            var time = entry.time;
            var parsedTime = new Date(time);
            //Date parsing here is a bit weird. We correct for times being parsed as GMT back to their local timezone.
            parsedTime.setTime(parsedTime.getTime() + parsedTime.getTimezoneOffset() * 60 * 1000)
            var month = parsedTime.getMonth() + 1;
            if (!groupObj.values[month]) {
              groupObj.values[month] = {
                date: time
              };
            }

            if (!groupObj.values[month].hasOwnProperty(KEY_MAPS[result.name])) {
              groupObj.values[month][KEY_MAPS[result.name]] = 0;
            }

            groupObj.values[month][KEY_MAPS[result.name]] += entry.sum;
          } else {
            if (!groupObj.values[entry.time]) {
              groupObj.values[entry.time] = {};
            }

            groupObj.values[entry.time][KEY_MAPS[result.name]] = entry.sum;
          }

          if (!mappings.totals.hasOwnProperty(KEY_MAPS[result.name])) {
            mappings.totals[KEY_MAPS[result.name]] = 0;
          }

          mappings.totals[KEY_MAPS[result.name]] += entry.sum;
        });
      });
    });

    var acceptHeader = env.request.headers['accept'];

    if(acceptHeader == 'text/csv') {
      env.response.setHeader('Content-Type', 'text/csv');
    }

    env.format.render('tenant', {env: env, mappings: mappings});
    env.response.statusCode = 200;
    next(env);

  });
};
