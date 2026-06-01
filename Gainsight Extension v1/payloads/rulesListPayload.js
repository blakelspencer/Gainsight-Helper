export const rulesListPayload = {
  "pageNumber": 1,
  "limit": 200,
  "searchConfiguration": {},
  "fields": [
    {
      "fieldName": "ruleId",
      "dbName": "ruleId",
      "label": "Rule Id",
      "meta": {
        "valueType": "STRING",
        "hidden": true,
        "sortable": true
      },
      "dataType": "STRING"
    },
    {
      "fieldName": "ruleName",
      "dbName": "ruleName",
      "label": "Rule Name",
      "meta": {
        "valueType": "STRING",
        "hidden": false,
        "sortable": true
      },
      "dataType": "STRING"
    },
    {
      "fieldName": "status",
      "dbName": "status",
      "label": "Status",
      "meta": {
        "valueType": "BOOLEAN",
        "hidden": false,
        "sortable": true
      },
      "dataType": "BOOLEAN"
    },
    {
      "fieldName": "createdByName",
      "dbName": "createdByName",
      "label": "Created By",
      "meta": {
        "valueType": "STRING",
        "hidden": true,
        "sortable": true
      },
      "dataType": "STRING"
    },
    {
      "fieldName": "createdDate",
      "dbName": "createdDate",
      "label": "Created On",
      "meta": {
        "valueType": "DATETIME",
        "hidden": false,
        "sortable": true
      },
      "dataType": "DATETIME"
    },
    {
      "fieldName": "modifiedDate",
      "dbName": "modifiedDate",
      "label": "Last Modified Date",
      "meta": {
        "valueType": "DATETIME",
        "hidden": false,
        "sortable": true
      },
      "dataType": "DATETIME"
    },
    {
      "fieldName": "modifiedByName",
      "dbName": "modifiedByName",
      "label": "Modified By",
      "meta": {
        "valueType": "STRING",
        "hidden": true,
        "sortable": true
      },
      "dataType": "STRING"
    },
    {
      "fieldName": "lastRunResult",
      "dbName": "lastRunResult",
      "label": "Last Run Status",
      "meta": {
        "valueType": "STRING",
        "hidden": false,
        "sortable": true
      },
      "dataType": "STRING"
    },
    {
      "fieldName": "folderId",
      "dbName": "folderId",
      "label": "Folder",
      "meta": {
        "valueType": "INTEGER",
        "hidden": true,
        "sortable": false
      },
      "dataType": "INTEGER"
    },
    {
      "fieldName": "nextScheduledRun",
      "dbName": "nextScheduledRun",
      "label": "Next Scheduled Run",
      "meta": {
        "valueType": "DATETIME",
        "hidden": false,
        "sortable": true
      },
      "dataType": "DATETIME"
    },
    {
      "fieldName": "ruleChains.label",
      "dbName": "ruleChains",
      "label": "Used In",
      "meta": {
        "valueType": "Array",
        "hidden": false,
        "sortable": false
      },
      "dataType": "Array"
    },
    /*{
      "fieldName": "ddMigrated",
      "dbName": "ddMigrated",
      "label": "Rule Migrated",
      "meta": {
        "valueType": "BOOLEAN",
        "hidden": false,
        "sortable": false
      },
      "dataType": "BOOLEAN"
    },*/
    {
      "fieldName": "templateCode",
      "label": "Template Code",
      "dbName": "templateCode",
      "meta": {
        "valueType": "STRING",
        "hidden": true,
        "sortable": true
      },
      "dataType": "STRING"
    }
  ]
}