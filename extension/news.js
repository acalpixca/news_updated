function compareFootprints(entitiesA, entitiesB, keyPhrasesA, keyPhrasesB) {
  // compare entities
  let entitiesAlength = entitiesA.length;
  let entitiesBlength = entitiesB.length;
  // we store these because we may splice one of the arrays
  if (entitiesAlength > entitiesBlength) {
    let entitiesC = [...entitiesB];
    entitiesB = [...entitiesA];
    entitiesA = [...entitiesC];
  }
  // Finding coindidences in two sorted lists. It's O(n log n) and I'm happy about this!
  let sameEntities = 0;
  entitiesA.forEach((item, index)=> {
    let foundElementIndex = entitiesB.findIndex((elt)=> (elt.name === item.name) && (elt.type === item.type));
    if (foundElementIndex > -1) {
      sameEntities++;
      // truncate entitiesB to start from index+1
      entitiesB = entitiesB.slice(foundElementIndex + 1);
    }
  });

  // compare keyPhrases
  let keyPhrasesAlength = keyPhrasesA.length;
  let keyPhrasesBlength = keyPhrasesB.length;
  // we store these because we may splice one of the arrays
  if (keyPhrasesAlength > keyPhrasesBlength) {
    let keyPhrasesC = [...keyPhrasesB];
    keyPhrasesB = [...keyPhrasesA];
    keyPhrasesA = [...keyPhrasesC];
  }
  // Finding coindidences in two sorted lists. It's O(n log n) and I'm happy about this!
  let sameKeyPhrases = 0;
  keyPhrasesA.forEach((item, index)=> {
    let foundElementIndex = keyPhrasesB.findIndex((elt)=> elt === item);
    if (foundElementIndex > -1) {
      samekeyPhrases++;
      // truncate keyPhrasesB to start from index+1
      keyPhrasesB = keyPhrasesB.slice(foundElementIndex + 1);
    }
  });

  let similarity = (2 * (sameEntities + sameKeyPhrases)) / (entitiesAlength + entitiesBlength + keyPhrasesAlength + keyPhrasesBlength);
  return (similarity);
}

function setNewsLedgerInBrowserStorage(ledger) {
  if (ledger) {
    chrome.storage.local.set({'blockchainLedger': ledger }, function() {
      console.log('blockchain is set to ' + ledger);
    });
  }
}

function getNewsLedgerInBrowserStorage() {
  chrome.storage.local.get(['blockchainLedger'], function(result) {
    blockchainLedger = result.blockchainLedger !== "undefined" ? result.blockchainLedger: [] ;
  });
}

function hasNewsAlert(url) {
  let news = trackedNews.find(x => x.url === url);
  if (news) return news.alert
  else return false;
}

function removeAlertfromNews(url) {
  let newsIndex = trackedNews.findIndex(x => x.url === url);
  if (newsIndex) {
    trackedNews[newsIndex].alert = false;
    chrome.storage.local.set({'trackedNews': trackedNews }, function() {
      console.log('trackedNews is set to ' + trackedNews);
      removeAllChildNodes(document.getElementById("trackedNewsList"));
      loadTableData(trackedNews);
    });
  }
}

function getNewsHistoryFromBlockchainLedger(newsUrl) {
  let items = [];
  if (blockchainLedger) {
    let foundNewsIndex = blockchainLedger.findIndex((elt) => elt.url === newsUrl);
    if (foundNewsIndex > -1) {
      if ( blockchainLedger[foundNewsIndex].originalNews==="self") {
        //newsUrl is original news
        items.push({
          title: blockchainLedger[foundNewsIndex].title,
          url: blockchainLedger[foundNewsIndex].url,
          language: blockchainLedger[foundNewsIndex].language,
          originalNews: blockchainLedger[foundNewsIndex].originalNews,
          dateStored: blockchainLedger[foundNewsIndex].dateStored
        });
      }
      else {
      // let's find the index of the original news first
        let originalNewsIndex = blockchainLedger.findIndex((elt) => elt.url === blockchainLedger[foundNewsIndex].originalNews);
        if (originalNewsIndex> -1) {
          items.push({
            title: blockchainLedger[originalNewsIndex].title,
            url: blockchainLedger[originalNewsIndex].url,
            language: blockchainLedger[originalNewsIndex].language,
            originalNews: blockchainLedger[originalNewsIndex].originalNews,
            dateStored: blockchainLedger[originalNewsIndex].dateStored
          });
        }
        // now we need to extract and push any item in the ledger whose parent is blockchainLedger[foundNewsIndex].originalNews
        const result = blockchainLedger.filter(item => item.originalNews === blockchainLedger[foundNewsIndex].originalNews);
        // OJO, RESULT NO TIENE LOS CAMPOS ADECUADOS
        result.forEach((it) => {
          items.push({
            Title: it.title,
            url: it.url,
            language: it.language,
            originalNews: it.originalNews,
            dateStored: it.dateStored
          });
        });
      } // end else - url is not original news
    } // end if foundNewsIndex

  } // end if ledger has contents
  return(items);
} // end function

function loadOneNewsHistory(items) {
  const table = document.getElementById("oneNewsDetailViewList");
  if (items.length<=0) {
    let row = table.insertRow();
    let nothing = row.insertCell(0);
    nothing.innerHTML = '<p>No history yet</p>';
  }
  else {
    items.forEach( item => {
      let row = table.insertRow();
      let url = row.insertCell(0);
      url.innerHTML = '<a href="' + item.url + '">' + item.title + '</a>';
      let date = row.insertCell(1);
      date.innerHTML = item.dateStored;
    });
  }
} // end load table


function addParentNewsToLedger(item) {
  // [{title, url, originalNews, dateStored, language, hash}]
  let ledgerItem = {
    title: item.title,
    url: item.url,
    originalNews: "self",
    dateStored: new Date(),
    language: item.language,
    hash: ""
  };
  if (blockchainLedger) {
    blockchainLedger.push(ledgerItem);
    alert(JSON.stringify(blockchainLedger));
  }
  else return (ledgerItem);
}


const sha256 = async function (message) {
    // encode as UTF-8
    const msgBuffer = new TextEncoder().encode(message);

    // hash the message
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

    // convert ArrayBuffer to Array
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // convert bytes to hex string
    const hashHex = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');
    return hashHex;
};
