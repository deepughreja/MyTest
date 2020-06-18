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
var currencyUpdateData = [];
const sortColumnName = 'lastChangeBid';
const sortColumnorder = 'asc';
var intervalTime = 0;
var intervalLimit = 30;
const connectionSuccessfullMessage = "Successfully connected to a stomp server.Click on 'Start Live Update' to receive the update from stomp server";
// Change this to get detailed logging from the stomp library
global.DEBUG = false;

// URLs
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

//Function that runs in every second
function setMidPriceInterval() {
  setInterval(() => {
    intervalTime = intervalTime + 1;
    if (intervalTime > intervalLimit) {
      intervalTime = 0;
      clearMidPriceValues();
    }
  }, 1000);
}

// Calls on Start Live Update button click
function startLiveCurrencyUpdate() {
  // Timer function that runs in every second
  setMidPriceInterval();
  // subscribing stomp to receive the updated value of price
  return client.subscribe(liveCurrencyUpdateUrl, message => stompMessageHandler(message));
}

function stompMessageHandler(message) {
  //Parse message body
  var object = JSON.parse(message.body);
  //Add or update the data in global array
  updateLiveData(object);
  //Apply sorting on array
  currencyUpdateData.sort(compareValues(sortColumnName, sortColumnorder));
  // Clears default text
  clearEmptyRecordText();
  //Render table after sorting
  renderTableWithSparkLine(currencyUpdateData, object);
}

function updateLiveData(object) {
  const filteredData = currencyUpdateData.filter(obj => obj.name == object.name);
  
  if (filteredData.length == 0) {
    //Adding rows first time in array
    currencyUpdateData.push({
      "name": object.name,
      "bestBid": object.bestBid,
      "bestAsk": object.bestAsk,
      "openBid": object.openBid,
      "openAsk": object.openAsk,
      "lastChangeAsk": object.lastChangeAsk,
      "lastChangeBid": object.lastChangeBid,
      "midPrice": (object.bestBid + object.bestAsk) / 2,
      "midPriceArray": [calculateMidPrice(object.bestBid, object.bestAsk)]
    });
  }
  else {
    // Update rows based on recieved data from stomp
    var data = filteredData[0];
    data.bestBid = object.bestBid;
    data.bestAsk = object.bestAsk;
    data.openBid = object.openBid;
    data.openAsk = object.openAsk;
    data.lastChangeAsk = object.lastChangeAsk;
    data.lastChangeBid = object.lastChangeBid;
    data.midPrice = data.midPrice == 0 ? calculateMidPrice(object.bestBid, object.bestAsk) : ((data.midPrice + (calculateMidPrice(object.bestBid, object.bestAsk))) / 2);
    if (data.midPrice && data.midPriceArray)
      data.midPriceArray.push(data.midPrice);
  }
}

// Clears midprice value to 0 after 30 seconds
function clearMidPriceValues() {
  currencyUpdateData.forEach((element, index) => {
    element.midPrice = 0;
    element.midPriceArray = [];
  });
}

// Sorting Logic
function compareValues(key, order = 'asc') {
  return function innerSort(a, b) {
    if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
      return 0;
    }
    const varA = (typeof a[key] === 'string')
      ? a[key].toUpperCase() : a[key];
    const varB = (typeof b[key] === 'string')
      ? b[key].toUpperCase() : b[key];

    let comparison = 0;
    if (varA > varB) {
      comparison = 1;
    } else if (varA < varB) {
      comparison = -1;
    }
    return (
      (order === 'desc') ? (comparison * -1) : comparison
    );
  };
}

// calculate Mid Price
var calculateMidPrice = (bestBid, bestAsk) => (bestBid + bestAsk) / 2;
//Draw SparkLine
var drawSparkLine =
  (sparkElement, array) => new Sparkline(sparkElement).draw(arrayRotate(array));

// Clears 'No record found' text
function clearEmptyRecordText() {
  var emptyRow = document.getElementById('emptyRecordBlock');
  if (emptyRow) {
    emptyRow.remove();
  }
}

// Render Table Values
function renderTableWithSparkLine(currecyArray, messageObject) {
  // Render table based on sorted array
  var tableBody = document.getElementById('tBody');
  tableBody.innerHTML = '';
  currecyArray.forEach(object => {
    var tr = document.createElement('tr');
    tr.innerHTML = '<td>' + object.name + '</td>' +
      '<td>' + object.bestBid + '</td>' +
      '<td>' + object.bestAsk + '</td>' +
      '<td>' + object.openBid + '</td>' +
      '<td>' + object.openAsk + '</td>' +
      '<td>' + object.lastChangeAsk + '</td>' +
      '<td>' + object.lastChangeBid + '</td>' +
      '<td><span id="sparkLine"></span></td>';
    tableBody.appendChild(tr);
    //Render sparkline
    if (object.midPriceArray.length > 0)
      drawSparkLine(tr.getElementsByTagName('span')[0], object.midPriceArray);
  });
}

// callback and error handler for stomp
client.connect({}, () => {
  document.getElementById('stompMessage').innerHTML = connectionSuccessfullMessage
}, () => (error) => {
  alert(error.headers.message)
});

