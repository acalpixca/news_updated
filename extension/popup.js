// This is what happens when the extension button is clicked on the browser!
// popup.html is loaded, and this script popup.js executes...

// trackedNews is the list of tracked news that the user is following
document.getElementById('trackedNewsListView').style.display = 'block';
document.getElementById('oneNewsDetailView').style.display = 'none';

var trackedNews = []; // IN GLOBALS.JS

chrome.storage.local.get(['trackedNews'], function(result) {
  // alert("result is " + JSON.stringify(result));
  // trackedNews = result ? result.trackedNews: [] ;
  trackedNews = result.trackedNews !== "undefined" ? result.trackedNews: [] ;
  loadTableData(trackedNews);
});

var mySelectedNewsSources = [];  // IN GLOBALS.JS

chrome.storage.local.get(['mySelectedNewsSources'], function(result) {
  mySelectedNewsSources = result ? result.mySelectedNewsSources: [] ;
});



// var blockchainLedger = [];  // IN GLOBALS.JS
// [{title, url, originalNews, dateStored}]
// originalNews is the url of the first time the story was tracked by me
// the display will be sorted according to dateStored.
let blockchainLedger = [{
  title: "Initial block",
  url: "no url",
  originalNews: "self",
  dateStored: new Date(),
  language: "en",
  hash: ""
}] ;

chrome.storage.local.get(['blockchainLedger'], function(result) {
  // alert("result is " + JSON.stringify(result));
  // trackedNews = result ? result.trackedNews: [] ;
  let blockchainLedger = result.blockchainLedger !== "undefined" ? result.blockchainLedger: [{
    title: "Initial block",
    url: "no url",
    originalNews: "self",
    dateStored: new Date(),
    language: "en",
    hash: ""
  }] ;
  // loadTableData(trackedNews);
});



// Event Listeners for Click buttons
emptyTrackedNews.addEventListener("click", async () => {
  trackedNews = [];
  chrome.storage.local.set({'trackedNews': trackedNews }, function() {
    console.log('trackedNews is set to ' + trackedNews);
    removeAllChildNodes(document.getElementById("trackedNewsList"));
  });
}); // end addEventListener emptyTrackedNews

addTrackedNews.addEventListener("click", async () => {
  chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
    currentWindow: true
  }, processActiveTab);
}); // end addEventListener addTrackedNews

function processActiveTab(tabs) {
  // Anything you need to do when the user decides to track a piece of news!
  // executes INSIDE a chrome.tabs.query

  var tab = tabs[0];

// Check if the news are already being tracked by user
  var found = false;
  var i = 0;
  while ((!found) && (i< trackedNews.length)) {
    found = trackedNews[i].url === tab.url;
    i++;
  }
  // update the html table
  if (!found) {
    let language = "es";
    chrome.tabs.detectLanguage(tab.id, (lang) => {
      console.log(lang);
      language = lang;
    });

  // push the URL into the trackedNews list. Sync with Chrome storage.

    let thisNewsIndex = trackedNews ? trackedNews.length : 0;
    trackedNews.push({url: tab.url, title: tab.title, alert: false, language: language, fingerprint: {entities: [], keyPhrases: []}});
    chrome.storage.local.set({'trackedNews': trackedNews }, function() {
      console.log('trackedNews is set to ' + trackedNews);
    // alert('trackedNews is set to ' + JSON.stringify(trackedNews));
    });

    let possibleLedgerItem = addParentNewsToLedger({
      url: tab.url, title: tab.title, language: language
    });
    if (possibleLedgerItem) {
      blockchainLedger.push(possibleLedgerItem);
    }
    setNewsLedgerInBrowserStorage(blockchainLedger);
  // update html table
    removeAllChildNodes(document.getElementById("trackedNewsList"));
    loadTableData(trackedNews);




    // AI COGNITIVE ANALYSIS STARTS HERE!

    // Obtain language ISO code according to browser
    // Obtain text content of current tab
    chrome.tabs.sendMessage(tabs[0].id, {greeting: "hello"}, function(response) {
      getBarebonesNews(response.fullHtml).then((value)=>{
        alert("Soy popup.js y esto es lo recibido de getBarebonesNews: " + value);
//        // value.text tiene el texto limpio de mi página. Es el que luego hay que enviar a
//        // las api de azure text Analytics
        let currentTabText = "";
        if (value.text) {
          currentTabText = value.text;
        }
        else {
          currentTabText = response.fullText;
        }
        let apiReturn = {};
        // 1. Obtain language of the news we're processing
        getCognitiveTextAnalysis('language', currentTabText).then((value)=> {
          apiReturn=value;
          let lang = processAPIResult('language', apiReturn);
          // 2. Obtain the keyPhrases of the news we're processing. Update trackedNews
          getCognitiveTextAnalysis('keyPhrases', currentTabText, lang).then((value) => {
            trackedNews[thisNewsIndex].fingerprint.keyPhrases = processAPIResult('keyPhrases', value);
            // 3. Obtain the entities of the news we're processing. Update trackedNews
            getCognitiveTextAnalysis('entities', currentTabText, lang).then((value) => {
              trackedNews[thisNewsIndex].fingerprint.entities = processAPIResult('entities', value);
              // and finally, update trackedNews on chrome.sync
              chrome.storage.local.set({'trackedNews': trackedNews }, function() {
                console.log('trackedNews is set to ' + trackedNews);
              });
          }); // end then step 2

        })
      })
      .catch(e => {
        alert('There has been a problem with your fetch operation: ' + e.message);
      });
    }); // end of getBarebonesNews(response.fullHtml).then((value)
  }); // end of chrome.tabs.sendMessage(tabs[0].id, {greeting: "hello"}, function(response)
  } // end of processing the news, that wasn't previously in the list
  else {
    alert("You're already tracking this piece of news.");
  }
} // end function processActiveTab


// HELPER FUNCTIONS: CLEAN AND POPULATE HTML TABLE WITH TRACKED NEWS
// AND DYNAMICALLY CREATE ACTION BUTTONS INSIDE THE TABLE

function loadTableData(items) {
  const table = document.getElementById("trackedNewsList");
  items.forEach( item => {
    let row = table.insertRow();
    let title = row.insertCell(0);
    title.innerHTML = '<a href="' + item.url + '">' + item.title + '</a>';
    let status = row.insertCell(1);
    status.innerHTML = hasNewsAlert(item.url)? '<img src="images/warningSmall.png">' : ""; // "Todo OK";
    let action = row.insertCell(2);
    action.innerHTML = '<button class="getUpdateButton" id="getUpdate-' + item.url + '">See History</button>';
    let dlt = row.insertCell(3);
    dlt.innerHTML = '<button class="deleteButton" id="delete-' + item.url + '">X</button>';

    // add event handlers for row buttons
    // delete buttons:
    document.getElementById("delete-" + item.url).addEventListener('click',
    function(){
      var url = this.id.replace("delete-","");
      // eliminate the element with the url from trackedNews
      trackedNews = trackedNews.filter(function( obj ) {
        return obj.url !== url;
      });
      // repaint the list
      removeAllChildNodes(document.getElementById("trackedNewsList"));
      loadTableData(trackedNews);
      // save the new list to chrome.storage
      chrome.storage.local.set({'trackedNews': trackedNews }, function() {
        console.log('trackedNews is set to ' + trackedNews);
      });
    }
    , false);
    // get update buttons:
    document.getElementById("getUpdate-" + item.url).addEventListener('click',
    function(){
      var url = this.id.replace("getUpdate-","");
      document.getElementById('trackedNewsListView').style.display = 'none';
      document.getElementById('oneNewsDetailView').style.display = 'block';
      removeAlertfromNews(url);
      removeAllChildNodes(document.getElementById("oneNewsDetailViewList"));
      loadOneNewsHistory(getNewsHistoryFromBlockchainLedger(url));
    }
    , false);
    // end get update buttons
  });
}

function removeAllChildNodes(parent) {
  while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
  }
}

// button closeDetailView
document.getElementById("closeDetailView").addEventListener("click", async () => {
  document.getElementById('trackedNewsListView').style.display = 'block';
  document.getElementById('oneNewsDetailView').style.display = 'none';
});


// TEST testStuff





document.getElementById("testStuff").addEventListener("click", async () => {
  alert("clickey!");

  /* CHECK IF ANY NEWS IN trackedNews has updates out there in the Web. */
  alert("CHECKING FOR NEWS UPDATES...");
  alert("Estas son las que tengo \n" + JSON.stringify(trackedNews));
  if (trackedNews !== "undefined" || !trackedNews) {
    trackedNews.forEach((item, index)=> {
        alert("Item " + index + " es " + JSON.stringify(item.fingerprint));
    }); // end forEach
  }
  else { alert("trackedNews not loaded");}
}); // end addEventListener testStuff




document.getElementById("hiddenButtonSearchWeb").addEventListener("click", async () => {

  /* CHECK IF ANY NEWS IN trackedNews has updates out there in the Web. */
  if (trackedNews !== "undefined" || !trackedNews) {
    let searchString ="";
    trackedNews.forEach((item, index)=> {
        alert("Item " + index + " es " + JSON.stringify(item.fingerprint));
        item.fingerprint.entities.forEach((it1)=>{
          searchString = searchString + " " + it1.name;
        });
        item.fingerprint.keyPhrases.forEach((it2)=>{
          searchString = searchString + " " + it2;
        });
        // searchString="Holiday on ice";
        getBingNewsAPI(searchString).then((value)=>{
          if (JSON.parse(value).webPages !=="undefined" && JSON.parse(value).webPages.value !=="undefined" && JSON.parse(value).webPages.value.length > 0 ) {
            // add news to blockchainLedger. Make its parent item.url
            let newLedgerItem = {
              title: JSON.parse(value).webPages.value[0].name,
              url: JSON.parse(value).webPages.value[0].url,
              language: "es",
              originalNews: item.url,
              dateStored:  new Date(),
              hash: "" // sha256(JSON.stringify(blockchainLedger[blockchainLedger.length-1]));
            };

            if (blockchainLedger) {
              // TODO: compare original news and the result given by BING with function compareFootprints.
              // if similarity > 50% then we push to the ledger.
              // next hackaton ;-) but check the function in news.js, it's pretty awesome.
              blockchainLedger.push(newLedgerItem);
              setNewsLedgerInBrowserStorage(blockchainLedger);
            }
            else alert("No ledger :-(");
        } // if (JSON.parse(value).webPages !=="undefined" && JS
        else {
          alert("getBingNewsAPI did not return any news related to my search criteria.");
        }

        }); // getBingNewsAPI(searchString).then((value)=>{
    }); // end trackedNews.forEach((item, index)

  } // end if (trackedNews !== "undefined" || !trackedNews) {
  else {
    alert("trackedNews not loaded");
  }
}); // end addEventListener "hiddenButtonSearchWeb


setTimeout(function(){
  // alert("Hello");
  document.getElementById("hiddenButtonSearchWeb").click();
}, 3000);
