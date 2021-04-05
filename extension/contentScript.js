chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    if (request.greeting == "hello") {
      // ISSUE - sendResponse truncates the response. Not good for large html.
      console.log(document.body.innerText);
      sendResponse({
        fullHtml: document.body.outerHTML,
        fullText: document.body.innerText}
        );
    }
  }
);
