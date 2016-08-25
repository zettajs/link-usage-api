module.exports = function(model) {
  var env = model.env;
  var mappings = model.mappings;

  var c = 'root';
  if(mappings.custom) {
    c = 'custom';
  }
  
  var root = {
    class: [c],
    properties: {
      httpCount: mappings.totals.httpCount,
      messagesBytes: mappings.totals.messagesBytes,
      messagesCount: mappings.totals.messagesCount,
      startDate: mappings.startDate,
      endDate: mappings.endDate,
      aggregation: mappings.aggregation
    },
    entities: [],
    actions: [
      {
        name: 'query',
        href: env.helpers.url.path('/'),
        method: 'GET',
        type: 'application/x-www-form-urlencoded',
        fields: [
          {
            name: 'startDate',
            type: 'date'
          },
          {
            name: 'endDate',
            type: 'date'
          },
          {
            name: 'aggregation',
            type: 'radio',
            value: [
              {
                value: 'month'
              },
              {
                value: 'day'
              }
            ]
          }
        ]
      }
    ],
    links: [
      {
        rel: ['self'],
        href: env.helpers.url.current()
      },
      {
        rel: ['alternate'],
        type: 'text/csv',
        href: env.helpers.url.current()
      }
    ]
  };

  var tenantTotals = [];
  Object.keys(mappings.tenants).forEach(function(tenantKey) {
    var tenant = mappings.tenants[tenantKey];
    tenantTotals.push(formatEntity(tenant, env));
  });

  root.entities = tenantTotals;
  return root;

}

function formatEntity(tenant, env) {
  var data = [];

  Object.keys(tenant.values).forEach(function(key) {
    var values = tenant.values[key];
    data.push({
      date: values.date,
      httpCount: values.httpCount,
      messagesBytes: values.messagesBytes,
      messagesCount: values.messagesCount,
    });
  });

  var entity = {
    class: ['usage'],
    rel: ['item'],
    properties: {
      tenantId: tenant.tenantId,
      data: data
    },
    links: [
      {
        rel: ['self'],
        href: env.helpers.url.path('/tenants/' + tenant.tenantId)
      }
    ]
  };

  return entity;
}
