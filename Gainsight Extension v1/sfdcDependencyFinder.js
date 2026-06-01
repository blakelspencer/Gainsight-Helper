
let subdomain = null;
export let cachedDependantObjects = [];
let dependantRulesList = [];
let dependantRulesSet = new Set();
let ruleComponentList = [];

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const url = new URL(tabs[0].url);
  const hostname = url.hostname;

  const parts = hostname.split('.');
  subdomain = parts.length > 2 ? parts.slice(0, -2).join('.') : null;

});

export async function getSfdcObjects () {

  console.log('Called getSfdcObjects');

  const endpoint = 'https://' + subdomain + '.gainsightcloud.com/v1.0/analyzer/dataflow/objects';

  const response = await fetch( endpoint , {
    method: "GET",
    headers: {  "accept": "application/json", 
                "content-type": "application/json",
                "x-gs-host": "GAINSIGHT" },
    credentials: "include",
  
  });

  console.log(response.status);
  //console.log(response);

  const data = await response.json();
  const sfdcObjectList = data.filter(item => item.source === "SFDC").map(item => item.apiName);

  //console.log('SFDC Objects: '+sfdcObjectList);
  console.log('Object Count: '+sfdcObjectList.length);
  
  document.getElementById('totalSfdcObjects').innerText = sfdcObjectList.length;
  document.getElementById('totalSfdcObjects2').innerText = sfdcObjectList.length;

  return sfdcObjectList;
}

export async function getSingleSfdcObjectFieldReferneces (objectApiName) {

    console.log('Called getSingleSfdcObjectFieldReferneces');

    const endpoint = 'https://'+ subdomain +'.gainsightcloud.com/v1.0/analyzer/dataflow?refresh=true';

    const payload = {
        "objectId": objectApiName,
        "assetTypes":[
            "RULES",
            "INGEST_JOBS",
            "REPORTS",
            "DASHBOARDS"
        ]}

    const response = await fetch( endpoint , {
        method: "POST",
        headers: {  "accept": "application/json", 
                    "content-type": "application/json",
                    "x-gs-host": "GAINSIGHT" },
        credentials: "include",
        body: JSON.stringify(payload)

    });

    console.log(response.status);

    const data = await response.json();

    const usedFields = data.contextFields.filter(item => item.used);
    console.log('Used Fields on '+objectApiName+' object: '+usedFields.length);

    const dependantRules = data.flows
        .flatMap(flow => flow.process.records)
        .filter(item => item.type === "Horizon")
        .map(item => item.entityId);

    console.log('Dep Rules: '+JSON.stringify(dependantRules));

    if (dependantRules.length !== 0) {

        dependantRules.forEach(val => dependantRulesSet.add(val));
        //dependantRulesList.push(dependantRules);
    }

    if (usedFields.length !== 0) {

        cachedDependantObjects.push({
            "apiName": objectApiName,
            "references": usedFields.length
        });

        return usedFields;
    } else {
        return null;
    }
    
}

export async function getAllSfdcObjectFieldReferences (){

    console.log('Called getAllSfdcObjectFieldReferences');

    chrome.storage.local.remove('cachedDependantObjects');
    //chrome.storage.local.get('cachedDependantObjects', (result) => { console.log('Cached Objects after clear: '+JSON.stringify(result))});

    const allFieldReferences = [];
    const objectList = await getSfdcObjects();
    const batchSize = 100;

    //const objectList = ["Account","Contact","agf__ADM_Case__c"];

    let counter = 0;
    
    for (let i = 0; i < objectList.length; i += batchSize) {
        const batch = objectList.slice(i, i + batchSize);

        console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(objectList.length / batchSize)}`);

        const promises = batch.map(object => getSingleSfdcObjectFieldReferneces(object));
        const results = await Promise.all(promises);

        results.forEach(result => {
            counter++;
            document.getElementById('currentObjectNumber').innerText = counter;
            if (result) allFieldReferences.push(result);
        });
    }

    console.log('Objects with References: '+allFieldReferences.length);
    //console.log('Object References: '+JSON.stringify(allFieldReferences));

    chrome.storage.local.set({ cachedDependantObjects });

    chrome.storage.local.get('cachedDependantObjects', (result) => { console.log('Cached Objects: '+JSON.stringify(result))});
    //const dependantRulesSet = new Set(dependantRulesList);
    console.log('Set length'+Array.from(dependantRulesSet).length);
    console.log('Set Plain: '+Array.from(dependantRulesSet));
    console.log('List of Rules: '+JSON.stringify(dependantRulesSet));

    const csv = convertToCSV(allFieldReferences);

    return csv;
}

function convertToCSV(data) {
  // Flatten the nested arrays into a single array
    const flatData = data.flat();

  // Define CSV headers
    const headers = ["ObjectApiName", "FieldApiName", "FieldLabel", "DataType"];

  // Map each object to a CSV row
    const rows = flatData.map((field) => {
    const objectApiName = field.name ?? "";
    const fieldApiName = field.dbName ?? "";
    const fieldLabel = field.displayName ?? "";
    const dataType = field.dataType ?? "";

    // Escape values that contain commas or quotes
    const escape = (val) =>
      `"${String(val).replace(/"/g, '""')}"`;

    return [
      escape(objectApiName),
      escape(fieldApiName),
      escape(fieldLabel),
      escape(dataType),
    ].join(",");
  });

  // Combine headers and rows
  return [headers.join(","), ...rows].join("\n");
}


export async function getRuleConfig (ruleId) {

    console.log('Called getRuleConfig');

    const endpoint = 'https://'+ subdomain +'.gainsightcloud.com/v1/rulesengine/v2/'+ ruleId;

    const response = await fetch( endpoint , {
        method: "GET",
        headers: {  "accept": "application/json", 
                    "content-type": "application/json",
                    "x-gs-host": "GAINSIGHT" },
        credentials: "include",

    });

    console.log(response.status);

    const data = await response.json();

    const ruleComponentActions = data.data.gsRuleMetaActionDetails
        .flatMap(action => 
            action.actionInfo.mappings.map(mapping => ({
                
                componentType:      "Action",

                //Rule Information
                ruleId:                 action.ruleId,
                ruleName:               data.data.ruleDetails.ruleName,
                ruleDescription:        data.data.ruleDetails.description,
                ruleActive:             data.data.ruleDetails.active,
                ruleType:               data.data.ruleDetails.ruleType,
                ruleLastRunDate:        data.data.ruleDetails.lastRunDate,
                ddConfigId:             data.data.ruleDetails.ddConfigId,

                //Source Field Info
                sourceFieldLabel:       mapping.source.field.label,
                sourceFieldAlias:       mapping.source.field.fieldAlias,
                sourceFieldDataType:    mapping.source.field.dataType,
                sourceFieldIdentifier:  mapping.source.identifier,
                sourceFieldName:        mapping.source.field.fieldName,
                sourceFieldObjectId:    mapping.source.field.objectId,
                
                targetFieldLabel:       mapping.target.field.label,
                targetFieldAlias:       mapping.target.field.fieldAlias,
                targetFieldDataType:    mapping.target.field.dataType,
                targetFieldIdentifier:  mapping.target.identifier,
                targetFieldName:        mapping.target.field.fieldName,
                targetFieldObjectId:    mapping.target.field.objectId,

                originConnectionType:   "",
                originObject:           "",
                originFieldApiName:     mapping.source.field.fieldName
            }))
        );
    
    console.log('Action Components: '+JSON.stringify(ruleComponentActions));
    return ruleComponentActions;
}