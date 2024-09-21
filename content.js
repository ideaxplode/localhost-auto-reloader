// content.js

window.addEventListener('focus', () => {
    chrome.runtime.sendMessage({ action: 'tabFocused' });
  });
  