// Inject into page context so we can access window.google
(function () {
  const s = document.createElement('script');
  s.src = chrome.runtime.getURL('injected.js');
  // Prepend before any other scripts
  (document.head || document.documentElement).appendChild(s);
})();
