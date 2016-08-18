#!/bin/bash


26 #SELECT SUM(sum) FROM hub_http_count WHE#INFLUXDB=http://metrics.iot.apigee.net:8086
#INFLUXDB=http://link-metrics-01:8086
INFLUXDB=http://localhost:8086

DB=telegraf

START_DATE="2016-08-14T00:00:00Z"
END_DATE="2016-08-16T00:00:00Z"

QUERY_BASE="WHERE link_stack = 'v1-staging' AND time >= '$START_DATE' AND time <= '$END_DATE' GROUP BY \"tenantId\", \"targetName\", time(1m) fill(0)"

MESSAGE_SIZE_QUERY="SELECT sum(value) FROM linkusage_hub_messages_bytes ${QUERY_BASE}"
MESSAGE_COUNT_QUERY="SELECT sum(value) FROM linkusage_hub_messages_count ${QUERY_BASE}"
HUB_HTTP_REQ_QUERY="SELECT sum(value) FROM linkusage_hub_http_count ${QUERY_BASE}"

echo $HUB_HTTP_REQ_QUERY

#curl -v -GET -f $INFLUXDB/query -u admin:2ee54aed802910f2f4e74dfbc143dbbd  --data-urlencode "db=$DB" --data-urlencode "q=$MESSAGE_SIZE_QUERY;$MESSAGE_COUNT_QUERY;$HUB_HTTP_REQ_QUERY"

#curl -v -GET -f $INFLUXDB/query --data-urlencode "db=$DB" --data-urlencode "q=$MESSAGE_SIZE_QUERY;$MESSAGE_COUNT_QUERY;$HUB_HTTP_REQ_QUERY"

#SELECT sum FROM hub_http_count WHERE link_stack = 'v1-staging' AND tenantId = 'default' GROUP BY "targetName"

#SELECT sum(value) as total into linkusage."default"."hub_http_count" FROM linkusage_hub_http_count WHERE time >= '2016-08-14T00:00:00Z' AND time <= '2016-08-17T00:00:00Z' GROUP BY "link_stack", "tenantId", "targetName", time(1d) fill(0)


#CREATE CONTINUOUS QUERY "cq.linkusage.hub_http_count.sum" ON telegraf BEGIN SELECT sum(value) AS total INTO linkusage."default"."hub_http_count" FROM linkusage_hub_http_count GROUP BY "link_stack", "tenantId", "targetName", time(1d) fill(0) END
#CREATE CONTINUOUS QUERY "cq.linkusage.hub_messages_bytes.sum" ON telegraf BEGIN SELECT sum(value) AS total INTO linkusage."default"."hub_messages_bytes" FROM linkusage_hub_messages_bytes GROUP BY "link_stack", "tenantId", "targetName", time(1d) fill(0) END
#CREATE CONTINUOUS QUERY "cq.linkusage.hub_messages_count.sum" ON telegraf BEGIN SELECT sum(value) AS total INTO linkusage."default"."hub_messages_count" FROM linkusage_hub_messages_count GROUP BY "link_stack", "tenantId", "targetName", time(1d) fill(0) END


#SELECT total FROM hub_http_count WHERE link_stack = 'v1-staging' AND tenantId = 'default' AND time >= '2016-08-14T00:00:00Z' AND time <= '2016-08-16T00:00:00Z' GROUP BY "targetName"

#SELECT SUM(total) FROM hub_http_count WHERE link_stack = 'v1-staging' AND time >= '2016-08-14T00:00:00Z' AND time <= '2016-08-16T00:00:00Z' GROUP BY "tenantId", time(1d) fill(0)

# SELECT total FROM hub_http_count WHERE link_stack = 'v1-staging' GROUP BY "tenantId", "targetName"





http://localhost:8086/query?q=CREATE+CONTINUOUS+QUERY+%22cq.linkusage.hub_http_count.sum%22+ON+telegraf+BEGIN+SELECT+sum(value)+AS+total+INTO+linkusage.%22default%22.%22hub_http_count%22+FROM+linkusage_hub_http_count+GROUP+BY+%22link_stack%22%2C+%22tenantId%22%2C+%22targetName%22%2C+time(1d)+fill(0)+END&db=telegraf

http://localhost:8086/query?q=CREATE+CONTINUOUS+QUERY+%22cq.linkusage.hub_messages_bytes.sum%22+ON+telegraf+BEGIN+SELECT+sum(value)+AS+total+INTO+linkusage.%22default%22.%22hub_messages_bytes%22+FROM+linkusage_hub_messages_bytes+GROUP+BY+%22link_stack%22%2C+%22tenantId%22%2C+%22targetName%22%2C+time(1d)+fill(0)+END&db=telegraf

http://localhost:8086/query?q=CREATE+CONTINUOUS+QUERY+%22cq.linkusage.hub_messages_count.sum%22+ON+telegraf+BEGIN+SELECT+sum(value)+AS+total+INTO+linkusage.%22default%22.%22hub_messages_count%22+FROM+linkusage_hub_messages_count+GROUP+BY+%22link_stack%22%2C+%22tenantId%22%2C+%22targetName%22%2C+time(1d)+fill(0)+END&db=telegraf

