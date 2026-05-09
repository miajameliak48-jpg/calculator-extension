'use strict';

var injecting = {};
var geoPromise = null;

var GEO_KEY = 'smf_geo_v2';
var REG_URL  = 'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions-version-simplifiee.geojson';
var DEP_URL  = 'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements-version-simplifiee.geojson';

function getGeoData() {
  if (!geoPromise) geoPromise = loadGeo();
  return geoPromise;
}

async function loadGeo() {
  var stored = await chrome.storage.local.get(GEO_KEY);
  if (stored[GEO_KEY]) return stored[GEO_KEY];

  console.log('[SalaryMaps] fetching GeoJSON from GitHub...');
  var results = await Promise.all([
    fetch(REG_URL).then(function(r) { return r.json(); }),
    fetch(DEP_URL).then(function(r) { return r.json(); })
  ]);

  var geo = { regions: results[0], departements: results[1] };
  await chrome.storage.local.set({ [GEO_KEY]: geo });
  console.log('[SalaryMaps] GeoJSON cached.');
  return geo;
}

function isMapsUrl(url) {
  return url && (
    url.indexOf('google.com/maps') >= 0 ||
    url.indexOf('maps.google.com') >= 0
  );
}

async function tryInject(tabId) {
  if (injecting[tabId]) return;
  injecting[tabId] = true;

  try {
    var geo = await getGeoData();

    // Step 1: inject geo data as a global variable in MAIN world
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      world: 'MAIN',
      func: function(geoData) { window.__SMF_GEO__ = geoData; },
      args: [geo]
    });

    // Step 2: inject the overlay script
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['injected.js'],
      world: 'MAIN'
    });
  } catch (e) {
    // Tab may not be ready yet — suppress benign errors
  } finally {
    injecting[tabId] = false;
  }
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (!isMapsUrl(tab.url || '')) return;

  if (changeInfo.status === 'loading') {
    // Kick off geo fetch in background so it's ready when page loads
    getGeoData().catch(function() {});
    return;
  }

  if (changeInfo.status === 'complete') {
    tryInject(tabId);
  }
});

chrome.runtime.onInstalled.addListener(function() {
  // Pre-fetch and cache GeoJSON on install
  getGeoData().catch(function(e) {
    console.warn('[SalaryMaps] geo prefetch failed:', e);
  });

  // Inject into already-open Maps tabs
  chrome.tabs.query({}, function(tabs) {
    for (var i = 0; i < tabs.length; i++) {
      if (isMapsUrl(tabs[i].url || '')) {
        tryInject(tabs[i].id);
      }
    }
  });
});

// Pre-fetch on SW startup (after termination/restart)
getGeoData().catch(function() {});
