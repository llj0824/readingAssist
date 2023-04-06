window.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggle-btn');
  updateToggleButtonState(toggleBtn);

  toggleBtn.addEventListener('change', (event) => {
    handleToggleButtonChange(event, toggleBtn);
  });
});

chrome.tabs.onUpdated.addListener(() => {
  const toggleBtn = document.getElementById('toggle-btn');
  updateToggleButtonState(toggleBtn);
});

function updateToggleButtonState(toggleBtn) {
  chrome.storage.sync.get(['isExtensionOn'], (result) => {
    toggleBtn.checked = result.isExtensionOn !== false;
  });
}

function handleToggleButtonChange(event, toggleBtn) {
  const isExtensionOn = event.target.checked;

  chrome.storage.sync.set({
    isExtensionOn: isExtensionOn
  });

  // The chrome.tabs.query method is used to query for specific tabs that match certain criteria.
  // In this case, we're looking for the active tab in the current window.
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, function(tabs) {
    // 'tabs' is an array containing all matching tabs (in our case, only one - the active tab).
    // We access it using tabs[0] since we want to target just that single active tab.

    // Now we use chrome.tabs.sendMessage to send a message from our popup script
    // to any content scripts running within that specific tab. This allows us
    // to communicate between different parts of our extension.

    // The first parameter passed into sendMessage() is the ID of the recipient tab,
    // which can be accessed through 'tabs[0].id'.

    // The second parameter is an object containing data you want to send as part 
    // of your message. In this example, we are sending an object with a property called 
    //'isExtensionOn', and its value will be either true or false depending on whether 
    //the toggle button in popup.html was turned ON or OFF by user interaction.
    chrome.tabs.sendMessage(tabs[0].id, {
      isExtensionOn: isExtensionOn
    });
  });
}