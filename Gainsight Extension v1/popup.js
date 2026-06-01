// popup.js
import { rulesListPayload } from './payloads/rulesListPayload.js';
import {
  getSfdcObjects , 
  getSingleSfdcObjectFieldReferneces , 
  getAllSfdcObjectFieldReferences , 
  cachedDependantObjects,
  getRuleConfig
} 
from './sfdcDependencyFinder.js';

let subdomain = null;
let companyGSID = null;
let C360EditURL = null;
let dropdownList = [];
let allRows= [];

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const url = new URL(tabs[0].url);
  const hostname = url.hostname;

  const parts = hostname.split('.');
  subdomain = parts.length > 2 ? parts.slice(0, -2).join('.') : null;

  companyGSID = url.searchParams.get('cid');
  console.log('GSID: '+companyGSID);

  //document.getElementById('subdomainValue').innerText = subdomain ?? 'No subdomain';
});

document.addEventListener('DOMContentLoaded', () => {

  //document.getElementById('testSfdcObjectListBtn').addEventListener('click', getSfdcObjects);
  //document.getElementById('testSingleSfdcObject').addEventListener('click', () => getSingleSfdcObjectFieldReferneces('Contact'));
  //document.getElementById('allSfdcReferencesBtn').addEventListener('click', getAllSfdcObjectFieldReferences);
  document.getElementById('allSfdcReferencesDownloadBtn').addEventListener('click', getSfdcFieldReferencesDownload);
  //document.getElementById('testGetRuleConfigBtn').addEventListener('click', () => getRuleConfig('8f1673d9-5651-4a77-ab92-7d145d586a0b'));
  //document.getElementById('testRenderConfigBtn').addEventListener('click', testRenderRuleConfig);
  document.getElementById('getAllDropdownsBtn').addEventListener('click', getAllDropdownValues);
  //document.getElementById('getSfdcPicklistValuesBtn').addEventListener('click', getSfdcPicklistValues);
  //document.getElementById('getSfdcConnectionIdBtn').addEventListener('click', getSfdcConnectionId);
});

function jsonToCsv(data, includeFields) {
  // Handle if response is wrapped in an object, e.g. { results: [...] }
  const array = Array.isArray(data) ? data : Object.values(data)[0];

  const headers = Object.keys(array[0]).filter(h => includeFields.includes(h));
  const rows = array.map(obj =>
    headers.map(header => {
      const val = obj[header] ?? '';
      // Wrap in quotes if value contains a comma, quote, or newline
      return typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))
        ? `"${val.replace(/"/g, '""')}"`
        : val;
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

async function getRulesList(includeFields) {

    console.log('Called getRulesList');
    const endpoint = 'https://' + subdomain + '.gainsightcloud.com/v2/rulesengine/list';

    //const payload = {"pageNumber":1,"limit":100,"searchConfiguration":{},"fields":[{"fieldName":"ruleId","dbName":"ruleId","label":"Rule Id","meta":{"valueType":"STRING","hidden":true,"sortable":true},"dataType":"STRING"},{"fieldName":"ruleName","dbName":"ruleName","label":"Rule Name","meta":{"valueType":"STRING","hidden":false,"sortable":true},"dataType":"STRING"},{"fieldName":"status","dbName":"status","label":"Status","meta":{"valueType":"BOOLEAN","hidden":false,"sortable":true},"dataType":"BOOLEAN"},{"fieldName":"createdByName","dbName":"createdByName","label":"Created By","meta":{"valueType":"STRING","hidden":true,"sortable":true},"dataType":"STRING"},{"fieldName":"createdDate","dbName":"createdDate","label":"Created On","meta":{"valueType":"DATETIME","hidden":false,"sortable":true},"dataType":"DATETIME"},{"fieldName":"modifiedDate","dbName":"modifiedDate","label":"Last Modified Date","meta":{"valueType":"DATETIME","hidden":false,"sortable":true},"dataType":"DATETIME"},{"fieldName":"modifiedByName","dbName":"modifiedByName","label":"Modified By","meta":{"valueType":"STRING","hidden":true,"sortable":true},"dataType":"STRING"},{"fieldName":"lastRunResult","dbName":"lastRunResult","label":"Last Run Status","meta":{"valueType":"STRING","hidden":false,"sortable":true},"dataType":"STRING"},{"fieldName":"folderId","dbName":"folderId","label":"Folder","meta":{"valueType":"INTEGER","hidden":true,"sortable":false},"dataType":"INTEGER"},{"fieldName":"nextScheduledRun","dbName":"nextScheduledRun","label":"Next Scheduled Run","meta":{"valueType":"DATETIME","hidden":false,"sortable":true},"dataType":"DATETIME"},{"fieldName":"ruleChains.label","dbName":"ruleChains","label":"Used In","meta":{"valueType":"Array","hidden":false,"sortable":false},"dataType":"Array"},{"fieldName":"ddMigrated","dbName":"ddMigrated","label":"Rule Migrated","meta":{"valueType":"BOOLEAN","hidden":false,"sortable":false},"dataType":"BOOLEAN"},{"fieldName":"templateCode","label":"Template Code","dbName":"templateCode","meta":{"valueType":"STRING","hidden":true,"sortable":true},"dataType":"STRING"}]}

    const response = await fetch( endpoint , {
    method: "POST",
    headers: {  "accept": "application/json", 
                "content-type": "application/json",
                "x-gs-host": "GAINSIGHT" },
    credentials: "include",
    body: JSON.stringify(rulesListPayload)
    });

    console.log(response.status);
    console.log(response);

    const data = await response.json();
    const rules = data.data.data;

    const csv = jsonToCsv(rules, includeFields);
    //console.log(csv);

    downloadCsv(csv, 'rules-export.csv');
}

function downloadCsv(csv, filename = 'export.csv') {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}


// Toggle tile selection
document.querySelectorAll('.tile').forEach(tile => {
  tile.addEventListener('click', () => {
    tile.classList.toggle('selected');
  });
});

// Get selected values as an array
function getSelectedValues() {
  return [...document.querySelectorAll('.tile.selected')]
    .map(tile => tile.dataset.value);
}

// Use it when exporting
document.getElementById('downloadRulesEngineBtn').addEventListener('click', () => {
  const selectedFields = getSelectedValues();
  // e.g. ['ruleName', 'status', 'lastRunResult']
  
  // Save to storage
  chrome.storage.local.set({ selectedFields });

  getRulesList(selectedFields);
});

// Show export panel
document.getElementById('exportRulesBtn').addEventListener('click', () => {
  document.getElementById('mainMenu').classList.add('hidden');
  document.getElementById('exportRulesPanel').classList.remove('hidden');

    chrome.storage.local.get('selectedFields', (result) => {
      if (result.selectedFields) {
        result.selectedFields.forEach(value => {
          const tile = document.querySelector(`.tile[data-value="${value}"]`);
          if (tile) tile.classList.add('selected');
      });
    }
  });
});

// Go back to main menu
document.querySelectorAll('.backBtn').forEach(btn => {
  btn.addEventListener('click', () => {
    const panel = btn.dataset.panel;
    document.getElementById(panel).classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');

  });
});

document.getElementById('getLayoutNameBtn').addEventListener('click', getC360Layout);

// Show C360 panel
document.getElementById('getLayoutNameBtn').addEventListener('click', () => {
  document.getElementById('mainMenu').classList.add('hidden');
  document.getElementById('c360Panel').classList.remove('hidden');

});

async function getC360Layout () {

  console.log('Called get360Layout');
  

  const endpoint = 'https://' + subdomain + '.gainsightcloud.com/v2/galaxy/assignment/resolve/cid';

  const payload = {
    "companyId": companyGSID,
    "entityId": companyGSID,
    "entityType": "company",
    "sharingType": "internal"
  }

  //console.log('payload'+JSON.stringify(payload));

  const response = await fetch( endpoint , {
    method: "POST",
    headers: {  "accept": "application/json", 
                "content-type": "application/json",
                "x-gs-host": "GAINSIGHT" },
    credentials: "include",
    body: JSON.stringify(payload)
  });

  console.log(response.status);
  //console.log(response);

  const data = await response.json();
  const layoutName = data.data.layout.name;
  const layoutId = data.data.layout.layoutId;
  const layoutDescription = data.data.layout.description;

  C360EditURL = 'https://' + subdomain + '.gainsightcloud.com/v1/ui/c360#/layout/' + layoutId + '/configure';

  document.getElementById('c360LayoutName').innerText = layoutName;
  document.getElementById('c360Id').innerText = layoutId;
  document.getElementById('c360Description').innerText = layoutDescription;
  document.getElementById('c360EditLink').href = C360EditURL;

  console.log('Layout Name is: '+ layoutName);
  console.log('Edit URL is: '+ C360EditURL);
}

document.getElementById('c360EditLink').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: C360EditURL });
});



async function getSfdcConnectionId () {

  console.log('Called getSdfcConnectionId');

  const endpoint = 'https://' + subdomain + '.gainsightcloud.com/v1/bionicreporting/config-ui/listsources';

  const response = await fetch( endpoint , {
    method: "GET",
    headers: {  "accept": "application/json", 
                "content-type": "application/json",
                "x-gs-host": "GAINSIGHT" },
    credentials: "include"
  });

  console.log(response.status);

  const data = await response.json();
  const sfdcConnectionId = data.data.find(connection => connection.connectionType === "SFDC") ?.connectionId;
  
  console.log('cid: '+ sfdcConnectionId);

  return sfdcConnectionId;
}


async function getSfdcPicklistValues () {

  console.log('Called getSfdcPicklistValues');
  
  const sfdcConnectionId = await getSfdcConnectionId();

  const endpoint = 'https://' + subdomain + '.gainsightcloud.com/v1/api/reporting/describe/SFDC/'+ 'Account' +'?ci='+ sfdcConnectionId +'&ic=true&cl=0&ppos=true&hcias=true';

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
  
}

// Show SFDC Depemdency panel
document.getElementById('sfdcDependencyPanelBtn').addEventListener('click', () => {
  document.getElementById('mainMenu').classList.add('hidden');
  document.getElementById('sfdcDependencyPanel').classList.remove('hidden');

});

async function getSfdcFieldReferencesDownload () {
  console.log('Called getSfdcFieldReferencesDownload');

  chrome.storage.local.remove('cachedDependantObjects');
  //renderTableDynamic(cachedDependantObjects);

  const csvOutput = await getAllSfdcObjectFieldReferences();

  //console.log('current Cache: '+JSON.stringify(cachedDependantObjects));
  renderTableDynamic(cachedDependantObjects);
  downloadCsv(csvOutput);
}

//Render Dependency Data
function renderTableDynamic(data) {
    const items = data;
    const headers = Object.keys(items[0]); // ["apiName", "references"]

    const headerRow = headers.map(h => `<th>${h}</th>`).join('');
    const rows = items.map(item =>
        `<tr>${headers.map(h => `<td>${item[h]}</td>`).join('')}</tr>`
    ).join('');

    document.getElementById('tableContainer').innerHTML = `
        <h2>SFDC Dependency Summary</h2>
        <table>
            <thead><tr>${headerRow}</tr></thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}

async function testRenderRuleConfig () {
  const config = await getRuleConfig('8f1673d9-5651-4a77-ab92-7d145d586a0b');
  renderTableDynamic(config);
}

async function getAllDropdowns () {

  console.log('called getAllDropdowns');

  const endpoint = 'https://'+ subdomain +'.gainsightcloud.com/v1/meta/gdm/filteredPicklists';

  const payload = {
    limit: 200, 
    pageNo: 1, 
    searchString: "", 
    types: [], 
    variants: []};

  const response = await fetch( endpoint , {
    method: "POST",
    headers: {  "accept": "application/json", 
                "content-type": "application/json",
                "x-gs-host": "GAINSIGHT" },
    credentials: "include",
    body: JSON.stringify(payload)
  });

  console.log('Response'+response.status);

  const data = await response.json();

  dropdownList = data.data.picklistList.map(item => item.categoryDetails.gsid);

  console.log('dropdownList: '+dropdownList);
  return dropdownList;
}

async function getAllDropdownValues() {

  console.log('called getAllDropdownValues');

  const batchSize = 100;

  const dropdownGsids = await getAllDropdowns();

  //let headers = [];

  for (let i = 0; i < dropdownGsids.length; i += batchSize) {
        const batch = dropdownGsids.slice(i, i + batchSize);

        console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(dropdownGsids.length / batchSize)}`);

        const promises = batch.map(object => getSingleDropdownValues(object));
        const results = await Promise.all(promises);

        //results.forEach(result => {});

      //headers = [
  //...results.map(f => f)];

    }

  //const headers = [
  //...results.map(f => f)];
  const headers = [
    "dropdownName",
    "dropdownType",
    "dropdownVariant",
    "dropdownGsid",
    "valueName",
    "valueDisplayOrder",
    "valueIsActive",
    "valueDefault",
    "valueGsid",
    "valueDescription",
    "valueShortName",
    "valueColor"
  ]

  const result = [headers, ...allRows];
  const csv = result.map(row => row.join(',')).join('\n');
  downloadCsv(csv, 'dropdown-export.csv');
}

async function getSingleDropdownValues(dropdownGsid) {

  console.log('called getSingleDropdownValues');

  const endpoint = 'https://'+ subdomain +'.gainsightcloud.com/v1/meta/gdm/picklists/'+ dropdownGsid;

  const response = await fetch( endpoint , {
    method: "GET",
    headers: {  "accept": "application/json", 
                "content-type": "application/json",
                "x-gs-host": "GAINSIGHT" },
    credentials: "include"
  });

  console.log(response.status);

  const data = await response.json();

  const categoryFields = ['name', 'type', 'variant', 'gsid'];
  const childFields = ['name', 'displayOrder', 'active', 'default', 'gsid', 'description', 'shortName', 'color'];

  const category = data.data.categoryDetails;
  const childItems = data.data.childItems;

  const rows = childItems.map(item => [
    ...categoryFields.map(f => category[f]),
    ...childFields.map(f => item[f])
  ]);

  allRows = [...allRows, ...rows];
  //console.log('allRows: '+ allRows);

  return rows;
}