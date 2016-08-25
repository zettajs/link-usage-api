module.exports = function(model) {
  var env = model.env;
  var mappings = model.mappings;

  var c = 'tenant';
  if(mappings.custom) {
    c = 'custom';
  }

  var root = {
    class: [c],
    properties: {
      tenantId: mappings.tenantId,
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
        href: env.helpers.url.current(),
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

  var targetTotals = [];
  Object.keys(mappings.targets).forEach(function(targetKey) {
    var target = mappings.targets[targetKey];
    targetTotals.push(formatEntity(target, env, mappings.tenantId));
  });

  root.entities = targetTotals;
  return root;

}

function formatEntity(target, env, tenantId) {
  var data = [];

  Object.keys(target.values).forEach(function(key) {
    var values = target.values[key];
    data.push({
      date: values.date,
      httpCount: values.httpCount,
      messagesBytes: values.messagesBytes,
      messagesCount: values.messagesCount,
    })
  });

  var entity = {
    class: ['usage'],
    rel: ['item'],
    properties: {
      hubId: target.targetId,
      tenantId: tenantId,
      data: data
    }
  };

  return entity;
}
