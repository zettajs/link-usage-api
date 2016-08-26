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


var Root = module.exports = function(influxHost, influxUsername, influxPassword) {
  var parsed = url.parse(influxHost);
  this.influxOpts = {
    hostname: parsed.hostname,
    port: parsed.port
  };

  if (influxUsername && influxPassword) {
    this.influxOpts.auth = influxUsername + ':' + influxPassword;
  }
};

Root.prototype.init = function(config) {
  config
    .path('/')
    .produces('application/json')
    .produces('application/vnd.siren+json')
    .produces('text/csv')
    .get('/', this.root);
};

Root.prototype._processDate = function(date) {
  var d = new Date(date);
  if (d instanceof Date && isFinite(d)) {
    return d.toISOString();
  }
  return NaN;
};

Root.prototype.root = function(env, next) {
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
    custom = true;
    startDate = this._processDate(startDate);
    endDate = this._processDate(endDate);
    if (startDate === NaN || endDate === NaN) {
      env.response.body = 'Invalid date.\n';
      env.response.statusCode = 400;
      return next(env);
    }
  }

  // check date spans...

  if (aggregation == 'month') {
    custom = true;
  }

  if (AGGREGATIONS.indexOf(aggregation) < 0) {
    env.response.body = 'Aggregation invalid.\n';
    env.response.statusCode = 400;
    return next(env);
  }


  var stack = process.env.ZETTA_STACK;
  var query1 = 'SELECT SUM(total) FROM hub_http_count WHERE link_stack = \''+stack+'\' AND time >= \''+startDate+'\' AND time <= \''+endDate+'\' GROUP BY \"tenantId\", time(1d) fill(0)';

  var query2 = 'SELECT SUM(total) FROM hub_messages_bytes WHERE link_stack = \''+stack+'\' AND time >= \''+startDate+'\' AND time <= \''+endDate+'\' GROUP BY \"tenantId\", time(1d) fill(0)';

  var query3 = 'SELECT SUM(total) FROM hub_messages_count WHERE link_stack = \''+stack+'\' AND time >= \''+startDate+'\' AND time <= \''+endDate+'\' GROUP BY \"tenantId\", time(1d) fill(0)';

  influxClient.query(this.influxOpts, 'linkusage', [query1, query2, query3], function(err, results) {
    var mappings = {};
    mappings.tenants = {};
    mappings.custom = custom;
    mappings.totals = {};
    mappings.startDate = startDate;
    mappings.endDate = endDate;
    mappings.aggregation = aggregation;
    results.forEach(function(queryResult) {
      queryResult.forEach(function(result) {
        if (!mappings.tenants[result.tags.tenantId]) {
          mappings.tenants[result.tags.tenantId] = {
            tenantId: result.tags.tenantId,
            values: {}
          };
        }
        var groupObj = mappings.tenants[result.tags.tenantId];

        result.values.forEach(function(entry) {


          if(aggregation == 'month') {
            //it's a monthly aggregation
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
            //it's a daily aggregation
            if (!groupObj.values[entry.time]) {
              groupObj.values[entry.time] = {
                date: entry.time
              };
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
    env.format.render('root', {env: env, mappings: mappings});
    env.response.statusCode = 200;
    return next(env);
  });
};
