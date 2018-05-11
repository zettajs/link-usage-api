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

var querystring = require('querystring');
var http = require('http');

module.writeSeries = function(influxOpts, db, points, cb) {
  var dataStrings = [];

  function buildLineItem(seriesName, dataPoint) {
    var seriesAndTags = [seriesName];

    Object.keys(dataPoint).forEach(function(key) {
      if(key != 'value' && key != 'time') {
        seriesAndTags.push(key+'='+dataPoint[key]);
      } 
    });

    var dataString = [seriesAndTags.join(','), 'value='+dataPoint.value, dataPoint.time];
    return dataString.join(' ');
  }


  Object.keys(points).forEach(function(seriesKey) {
    var entries = points[seriesKey];
    entries.forEach(function(entry) {
      dataStrings.push(buildLineItem(seriesKey, entry));
    });
  }); 

  var payload = dataStrings.join('\n');


  var path = '/write?' + querystring.stringify({db: db, precision: 'm'});
  var opts = {
    method: 'POST',
    hostname: influxOpts.hostname,
    port: influxOpts.port,
    path: path,
    auth: influxOpts.auth
  }

  var req = http.request(opts, function(res) {
    if(res.statusCode != 204) {
      return cb(new Error('Could not insert analytics'));
    } 

    return cb();
  });

  req.on('error', function(e) {
    cb(e);
  });

  req.end(payload);
}

exports.query = function(influxOpts, db, query, cb) {
  if(!Array.isArray(query)){
    query = [query];
  }

  var qstring = query.join(';');
  
  var qsOpts = {
    db: db,
    q: qstring
  };


  var queryString = querystring.stringify(qsOpts);
  var path = '/query?'+queryString;
  var opts = {
    method: 'GET',
    hostname: influxOpts.hostname,
    port: influxOpts.port,
    path: path,
    auth: influxOpts.auth
  }

  function buildResponseJSON(buf) {
    try{
      buf = JSON.parse(buf.toString());
    } catch(e) {
      cb(e);
    }

    
    if(buf.error || (buf[0] && buf[0].error)) {
      var e = buf.error;
      
      if(buf[0] && buf[0].error) {
        e = buf[0].error;
      }
      console.log(e);

      return cb(new Error(e));
    }

    var totalResults = [];
    if(buf.results && buf.results.length) {
      var queryResults = buf.results;
      queryResults.forEach(function(item, idx) {
        var keys = Object.keys(item);
        var subqueryResults = [];
        if(keys && keys.length) {

          item.series.forEach(function(sub) {
            var columns = sub.columns;
            var mappedResults = sub.values.map(function(item) {
              var obj = {};
              columns.forEach(function(curr, idx) {
                obj[curr] = item[idx]; 
              });
              return obj;
            });
            sub.values = mappedResults;
            delete sub.columns;
            subqueryResults.push(sub);
          });
        }
        totalResults.push(subqueryResults);
      });
    }
    cb(null, totalResults);
  } 

  var req = http.request(opts, function(res) {
    var buf = [];

    res.on('data', function(chunk) {
      buf += chunk;
    });

    res.on('end', function() {
      buildResponseJSON(buf);      
    });
  });

  req.on('error', function(e) {
    cb(e);
  });

  req.end();
}

exports.postQuery = function(influxOpts, db, query, cb) {
  var qstring = query;
  if(Array.isArray(query)){
    qstring = query.join(';');
  } 
  
  var qsOpts = {
    db: db,
    q: qstring
  };


  var queryString = querystring.stringify(qsOpts);
  var path = '/query?'+queryString;
  var opts = {
    method: 'POST',
    hostname: influxOpts.hostname,
    port: influxOpts.port,
    path: path,
    auth: influxOpts.auth
  }

  function buildResponseJSON(buf) {
    try{
      buf = JSON.parse(buf.toString());
    } catch(e) {
      cb(e);
    }

    
    if(buf.error || (buf[0] && buf[0].error)) {
      var e = buf.error;
      
      if(buf[0] && buf[0].error) {
        e = buf[0].error;
      }
      console.log(e);

      return cb(new Error(e));
    }

    var totalResults = [];
    if(buf.results && buf.results.length) {
      var queryResults = buf.results;
      queryResults.forEach(function(item, idx) {
        var keys = Object.keys(item);
        if(keys && keys.length) {
          keys.forEach(function(key) {
          
            var singleQueryResultsSet = item[key][0];
            var columns = singleQueryResultsSet.columns;
            var values = singleQueryResultsSet.values;
             
            if(!values) {
              return cb(null, []);
            }

            var mappedResults = values.map(function(item) {
              var obj = {};
              columns.forEach(function(curr, idx) {
                obj[curr] = item[idx]; 
              });
              return obj;
            }); 

            var resultsObj = {
              series: singleQueryResultsSet.name,
              query: query[idx],
              results: mappedResults
            };

            totalResults.push(resultsObj);
          });
        }
        
      });
    }
    cb(null, totalResults);
  } 

  var req = http.request(opts, function(res) {
    var buf = [];

    res.on('data', function(chunk) {
      buf += chunk;
    });

    res.on('end', function() {
      buildResponseJSON(buf);      
    });
  });

  req.on('error', function(e) {
    cb(e);
  });

  req.end();
}


