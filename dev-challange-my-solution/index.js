/**
 * This javascript file will constitute the entry point of your solution.
 *
 * Edit it as you need.  It currently contains things that you might find helpful to get started.
 */
// This is not really required, but means that changes to index.html will cause a reload.
require('./site/index.html')
// Apply the styles in style.css to the page.
require('./site/style.css')

// Variables and constants
var sparklineArray = [1, 2, 3, 4, 5];
var midPriceList = {};
const nameIndex = 0;
const bestBidIndex = 1;
const bestAskIndex = 2;
const openBidIndex = 3;
const openAskIndex = 4;
const lastChangeAskIndex = 5;
const lastChangeBidIndex = 6;
const tableId = 'table';
const connectionSuccessfullMessage = "Successfully connected to a stomp server.Click on 'Start Live Update' to receive the update from stomp server";
// Change this to get detailed logging from the stomp library
global.DEBUG = false;
const url = "ws://localhost:8011/stomp"
const liveCurrencyUpdateUrl = "/fx/prices";
const client = Stomp.client(url);

// To rotate the array values for sparkLines
function arrayRotate(arr, reverse) {
  if (reverse) arr.unshift(arr.pop());
  else arr.push(arr.shift());
  return arr;
}

// Event handler for 'Start Live Update' button
document.getElementById("btnStartLiveUpdate").addEventListener("click", () => {
  startLiveCurrencyUpdate();
});

// Calls on Start Live Update button click
function startLiveCurrencyUpdate() {
  setMidPriceInterval();
  // subscribing stomp to receive the updated value of price
  return client.subscribe(liveCurrencyUpdateUrl, (message) => {
    // Storing Mid Price value for specific interval 
    storeMidPrice(JSON.parse(message.body));
    // Fuction responsible for adding new row,Updating column values and updating midprice value
    processTableData(message.body, false);
  });
}

// handler to draw the spark lines
var drawSparkLine = (sparkElement) => new Sparkline(sparkElement).draw(arrayRotate(sparklineArray));
// get current datetime
var getCurrentDate = (today) => today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + ' ' + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

//Function runs in every 30 second to set the midprice
function setMidPriceInterval() {
  setInterval(() => {
    processTableData(midPriceList, true);
    midPriceList = [];
    var dateStr = getCurrentDate(new Date());
    document.getElementById('midPriceUpdateTime').innerHTML = dateStr;
  }, 30000);
}

// Storing Mid Price value for specific interval 
function storeMidPrice(message) {
  var midPrice = (message.bestBid + message.bestAsk) / 2;
  if (midPriceList[message.name]) {
    midPriceList[message.name] = (midPriceList[message.name] + midPrice) / 2;
  }
  midPriceList[message.name] = midPrice;
}

// Fuction responsible for adding new row,Updating column values and updating midprice value
function processTableData(input, isMidPriceUpdate) {
  // Initialization
  var message;
  var isRowFound = false;
  var table = document.getElementById(tableId);
  var rows = document.getElementById(tableId).rows//.namedItem("myRow").innerHTML

  // Clears 'No record found' text
  ClearEmptyRecordText();

  //Iterate over the rows 
  for (i = 0; i < rows.length; i++) {
    //Updating midPrice Values
    if (isMidPriceUpdate) {
      if (input[table.rows[i].cells[0].innerHTML]) {
        table.rows[i].cells[7].innerHTML = input[table.rows[i].cells[0].innerHTML] + '<span id="sparkLine"></span>';
        drawSparkLine(table.rows[i].cells[7].getElementsByTagName('span')[0]);
      }
    }
    else {
      // Updating the value based on received response from stomp
      message = JSON.parse(input);
      if (table.rows[i].cells[nameIndex].innerHTML == message.name) {
        table.rows[i].cells[bestBidIndex].innerHTML = message.bestBid;
        table.rows[i].cells[bestAskIndex].innerHTML = message.bestAsk;
        table.rows[i].cells[openBidIndex].innerHTML = message.openBid;
        table.rows[i].cells[openAskIndex].innerHTML = message.openAsk;
        table.rows[i].cells[lastChangeAskIndex].innerHTML = message.lastChangeAsk;
        table.rows[i].cells[lastChangeBidIndex].innerHTML = message.lastChangeBid;
        isRowFound = true;
        break;
      }
    }
  }
  if (!isMidPriceUpdate) {
    if (!isRowFound) {
      // Adding new values first time in the table
      addCurrencyRow(message);
    }
    else {
      //sorting logic
      sortTable(tableId, lastChangeBidIndex);
    }
  }
}

//Sorting Logic
function sortTable(table_id, sortColumn) {
  var tableData = document.getElementById(table_id).getElementsByTagName('tbody').item(0);
  var rowData = tableData.getElementsByTagName('tr');
  for (var i = 0; i < rowData.length - 1; i++) {
    for (var j = 0; j < rowData.length - (i + 1); j++) {
      if (Number(rowData.item(j).getElementsByTagName('td').item(sortColumn).innerHTML.replace(/[^0-9\.]+/g, "")) < Number(rowData.item(j + 1).getElementsByTagName('td').item(sortColumn).innerHTML.replace(/[^0-9\.]+/g, ""))) {
        tableData.insertBefore(rowData.item(j + 1), rowData.item(j));
      }
    }
  }
}

// Clears 'No record found' text
function ClearEmptyRecordText() {
  var emptyRow = document.getElementById('emptyRecordBlock');
  if (emptyRow) {
    emptyRow.remove();
  }
}

// Adding values first time
function addCurrencyRow(object) {
  var table = document.getElementById('tBody');
  var tr = document.createElement('tr');
  tr.innerHTML = '<td>' + object.name + '</td>' +
    '<td>' + object.bestBid + '</td>' +
    '<td>' + object.bestAsk + '</td>' +
    '<td>' + object.openBid + '</td>' +
    '<td>' + object.openAsk + '</td>' +
    '<td>' + object.lastChangeAsk + '</td>' +
    '<td>' + object.lastChangeBid + '</td>' +
    '<td>NA</td>';
  table.appendChild(tr);
}

// callback and error handler for stomp
client.connect({}, () => {
  document.getElementById('stompMessage').innerHTML = connectionSuccessfullMessage
}, () => (error) => {
  alert(error.headers.message)
});

