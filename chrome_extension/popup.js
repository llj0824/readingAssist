document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('settings-form');
  const highlightColorInput = document.getElementById('highlight-color');

  // Load saved settings
  chrome.storage.sync.get('highlightColor', (data) => {
    if (data.highlightColor) {
      highlightColorInput.value = data.highlightColor;
    }
  });

  // Save user settings
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    chrome.storage.sync.set({
      highlightColor: highlightColorInput.value
    }, () => {
      console.log('Settings saved');
    });
  });
});