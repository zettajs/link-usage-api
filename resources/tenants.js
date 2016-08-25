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
    env.response.body = 'Must supply startDate and endDate.';
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
      env.response.body = 'Invalid date.';
      env.response.statusCode = 400;
      return next(env);
    }
  }

  if(aggregation == 'month') {
    custom = true;
  }

  var query1 = 'SELECT SUM(total) FROM hub_http_count WHERE link_stack = \'v1-staging\' AND tenantId=\'default\' AND time >= \'2016-08-01T00:00:00Z\' AND time <= \'2016-08-16T00:00:00Z\' GROUP BY \"targetName\", time(1d) fill(0)';

  var query2 = 'SELECT SUM(total) FROM hub_messages_bytes WHERE link_stack = \'v1-staging\' AND tenantId=\'default\' AND time >= \'2016-08-01T00:00:00Z\' AND time <= \'2016-08-16T00:00:00Z\' GROUP BY \"targetName\", time(1d) fill(0)';

  var query3 = 'SELECT SUM(total) FROM hub_messages_count WHERE link_stack = \'v1-staging\' AND tenantId=\'default\' AND time >= \'2016-08-01T00:00:00Z\' AND time <= \'2016-08-16T00:00:00Z\' GROUP BY \"targetName\", time(1d) fill(0)';

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

    env.format.render('tenant', {env: env, mappings: mappings});
    env.response.statusCode = 200;
    next(env);

  });
};
