// Initialize the toggle state
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ reloadingEnabled: true }, () => {
      updateIcon(true);
    });
  });
  
  // Function to update the browser action icon
  function updateIcon(enabled) {
    const iconPath = enabled
      ? {
          "16": "icons/icon-enabled-16.png",
          "32": "icons/icon-enabled-32.png",
          "48": "icons/icon-enabled-48.png",
          "128": "icons/icon-enabled-128.png",
        }
      : {
          "16": "icons/icon-disabled-16.png",
          "32": "icons/icon-disabled-32.png",
          "48": "icons/icon-disabled-48.png",
          "128": "icons/icon-disabled-128.png",
        };
    chrome.action.setIcon({ path: iconPath });
  }
  
  // Function to check if the tab's URL matches the specified patterns
  function shouldReload(url) {
    const patterns = [
      'http://localhost',
      'https://localhost',
      'http://127.0.0.1',
      'https://127.0.0.1',
    ];
    return patterns.some((pattern) => url.startsWith(pattern));
  }
  
  // Debounce mechanism to prevent multiple reloads
  const reloadCooldown = 1000; // milliseconds
  const lastReloadTime = {};
  
  // Function to reload a tab with debounce
  function reloadTab(tabId, url) {
    const now = Date.now();
    if (lastReloadTime[tabId] && now - lastReloadTime[tabId] < reloadCooldown) {
      // Too soon since the last reload, skip reloading
      console.log('Skipping reload to prevent multiple reloads:', url);
      return;
    }
    lastReloadTime[tabId] = now;
  
    chrome.tabs.reload(tabId, { bypassCache: false }, () => {
      if (chrome.runtime.lastError) {
        console.error('Failed to reload tab:', chrome.runtime.lastError);
      } else {
        console.log('Tab reloaded:', url);
      }
    });
  }
  
  // Listener for messages from the content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'tabFocused') {
      // Get the toggle state
      chrome.storage.local.get({ reloadingEnabled: true }, (items) => {
        if (!items.reloadingEnabled) return; // Do nothing if reloading is disabled
  
        const tabId = sender.tab.id;
        const url = sender.tab.url;
  
        if (url && shouldReload(url)) {
          reloadTab(tabId, url);
        }
      });
    }
  });
  
  // Listener for tab activation
  chrome.tabs.onActivated.addListener((activeInfo) => {
    // Get the toggle state
    chrome.storage.local.get({ reloadingEnabled: true }, (items) => {
      if (!items.reloadingEnabled) return; // Do nothing if reloading is disabled
  
      // Get the active tab
      chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          return;
        }
  
        if (tab.url && shouldReload(tab.url)) {
          reloadTab(tab.id, tab.url);
        }
      });
    });
  });
  
  // Listener for window focus changes
  chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      // No window is focused (e.g., minimized or application focus lost)
      return;
    }
  
    // Get the toggle state
    chrome.storage.local.get({ reloadingEnabled: true }, (items) => {
      if (!items.reloadingEnabled) return; // Do nothing if reloading is disabled
  
      // Get the active tab in the focused window
      chrome.windows.get(windowId, { populate: true }, (window) => {
        if (chrome.runtime.lastError || !window) {
          console.error(chrome.runtime.lastError || 'Window not found');
          return;
        }
  
        const activeTab = window.tabs.find((tab) => tab.active);
        if (activeTab && activeTab.url && shouldReload(activeTab.url)) {
          reloadTab(activeTab.id, activeTab.url);
        }
      });
    });
  });
  
  // Listener for browser action (toolbar button) clicks
  chrome.action.onClicked.addListener(() => {
    // Toggle the reloading state
    chrome.storage.local.get({ reloadingEnabled: true }, (items) => {
      const newState = !items.reloadingEnabled;
      chrome.storage.local.set({ reloadingEnabled: newState }, () => {
        updateIcon(newState);
        console.log('Reloading is now', newState ? 'enabled' : 'disabled');
      });
    });
  });
  
  // Listener for keyboard shortcut commands
  chrome.commands.onCommand.addListener((command) => {
    if (command === 'toggle-reloading') {
      // Toggle the reloading state
      chrome.storage.local.get({ reloadingEnabled: true }, (items) => {
        const newState = !items.reloadingEnabled;
        chrome.storage.local.set({ reloadingEnabled: newState }, () => {
          updateIcon(newState);
          console.log('Reloading is now', newState ? 'enabled' : 'disabled');
        });
      });
    }
  });
  