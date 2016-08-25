var stringify = require('./stringify');

module.exports = function(model) {
  var env = model.env;
  var mappings = model.mappings;

  var firstTwoColumns = ['tenant', 'metric'];
  var tenants = Object.keys(mappings.tenants);
  var dates = Object.keys(mappings.tenants[tenants[0]].values);
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
