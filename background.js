'use strict';

var injected = {};

function isMapsUrl(url) {
  return url && (
    url.indexOf('google.com/maps') >= 0 ||
    url.indexOf('maps.google.com') >= 0
  );
}

function tryInject(tabId) {
  chrome.scripting.executeScript(
    { target: { tabId: tabId }, files: ['injected.js'], world: 'MAIN' },
    function () {
      // Suppress "Could not establish connection" and similar benign errors
      var _err = chrome.runtime.lastError;
    }
  );
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  // Reset injection flag on every new navigation
  if (changeInfo.status === 'loading') {
    delete injected[tabId];
  }

  if (!isMapsUrl(tab.url || '')) return;
  if (injected[tabId]) return;

  // Inject when page is fully loaded (document + all scripts executed)
  if (changeInfo.status === 'complete') {
    injected[tabId] = true;
    tryInject(tabId);
  }
});

// Inject into already-open Maps tabs when the extension is installed/reloaded
chrome.runtime.onInstalled.addListener(function () {
  chrome.tabs.query({}, function (tabs) {
    for (var i = 0; i < tabs.length; i++) {
      if (isMapsUrl(tabs[i].url || '')) {
        tryInject(tabs[i].id);
      }
    }
  });
});
