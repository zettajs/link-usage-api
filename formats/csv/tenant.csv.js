var stringify = require('./stringify');

module.exports = function(model) {
  var env = model.env;
  var mappings = model.mappings;

  var firstTwoColumns = ['tenant', 'metric'];
  var targets = Object.keys(mappings.targets);
  var dates = Object.keys(mappings.targets[targets[0]].values);
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
