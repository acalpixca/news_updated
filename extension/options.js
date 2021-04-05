var mySelectedNewsSources = [];

chrome.storage.sync.get(['mySelectedNewsSources'], function(result) {
  mySelectedNewsSources = typeof result.mySelectedNewsSources !== "undefined" ? result.mySelectedNewsSources : [];
  loadMySelectedNewsSourcesTableData(mySelectedNewsSources);
});

// add event handler for button addSourceButton

let addNewsSourceToList = function() {

  // obtain content of newsUrlTxt input box
  let newsUrl = document.getElementById('newsUrlTxt').value;

  if (validURL(newsUrl)) {
    // check for duplicates
    var found = false;
    var i = 0;
    while ((!found) && (i< mySelectedNewsSources.length)) {
      found = mySelectedNewsSources[i].url === newsUrl;
      i++;
    }
    // end check for duplicates
    if (!found) {
      mySelectedNewsSources.push({url: newsUrl});
      // need to sync chrome.sync with a set
      chrome.storage.sync.set({'mySelectedNewsSources': mySelectedNewsSources }, function() {
         console.log('nySelectedNewsSources is set to ' + mySelectedNewsSources);
      });

      removeAllChildNodes(document.getElementById("mySelectedNewsSourcesList"));
      loadMySelectedNewsSourcesTableData(mySelectedNewsSources);
    } // end url not repeated in the user's list
    else {
      alert("You already have this as preferred news source.");
    } // end url is valid
  } // end
  else {
    alert("This is not a valid url (internet address)");
  }
  document.getElementById("newsUrlTxt").value = "";
};

document.getElementById("addSourceButton").addEventListener('click', addNewsSourceToList);

document.getElementById("newsUrlTxt").addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
   event.preventDefault();
   document.getElementById("addSourceButton").click();
  }
});

function loadMySelectedNewsSourcesTableData(items) {
  const table = document.getElementById("mySelectedNewsSourcesList");
  items.forEach( item => {
    let row = table.insertRow();
    let url = row.insertCell(0);
    url.innerHTML = '<a href="' + item.url + '">' + item.url + '</a>';
    let dlt = row.insertCell(1);
    dlt.innerHTML = '<button class="deleteButton" id="delete-' + item.url + '">X</button>';
    // add event handlers for row buttons
    // delete buttons:
    document.getElementById("delete-" + item.url).addEventListener('click',
    function(){
      var url = this.id.replace("delete-","");
      // eliminate the element with the url from trackedNews
      mySelectedNewsSources = mySelectedNewsSources.filter(function( obj ) {
        return obj.url !== url;
      });
      // repaint the list
      removeAllChildNodes(document.getElementById("mySelectedNewsSourcesList"));
      loadMySelectedNewsSourcesTableData(mySelectedNewsSources);
      // save the new list to chrome.storage
      chrome.storage.sync.set({'mySelectedNewsSources': mySelectedNewsSources }, function() {
        console.log('mySelectedNewsSources is set to ' + mySelectedNewsSources);
      });
    }
    , false);
  });
}

// this method is also used in popup.js and should be refactored.
function removeAllChildNodes(parent) {
  while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
  }
}

// checks if a string is a valid URL
function validURL(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  return !!pattern.test(str);
}
