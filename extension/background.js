chrome.runtime.onInstalled.addListener(() => {
  // every time we install the extension we wipe off the blockchain
  chrome.storage.local.set({'blockchainLedger': [] }, function() {
    alert('Starting a new Blockchain since the extension has just been installed');
  });

// and here we load it to memory
  chrome.storage.local.get(['blockchainLedger'], function(result) {
    blockchainLedger = result.blockchainLedger !== "undefined" ? result.blockchainLedger: [] ;
  });
}); // end add listener
