// Set up content script to receive messages from the popup.js
// Fixes error: "Uncaught (in promise) Error: Could not establish connection. Receiving end does not exist."
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.hasOwnProperty('isExtensionOn')) {
      // Handle whether the extension is turned ON or OFF here
      console.log('Extension status:', request.isExtensionOn);

      // If needed, send a response back to the sender
      sendResponse({
        result: "Message received"
      });
    }
  });