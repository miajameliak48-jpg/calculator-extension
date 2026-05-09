---
name: implement-map-feature
description: Adds a new feature to the Leaflet or Google Maps layer in the extension (markers, clusters, popups, heatmap, polygons, filters). Use when the task involves map rendering, marker behavior, or map UI controls.
---

You are implementing a map feature for a Chrome extension that uses Leaflet (Side Panel) and/or Google Maps (injected overlay). Before writing any code:

## Step 1 — Understand the map context

Read these files:
- `sidepanel.html` / `sidepanel.js` — if working on the Leaflet side panel
- `injected.js` — if working on the Google Maps overlay
- `agent_docs/architecture.md` — understand data flow (how listings reach the map)
- `agent_docs/messages.md` — ListingItem schema (what fields are available)

Ask: "Which map? Leaflet (side panel) or Google Maps (injected overlay)?"

## Step 2 — Leaflet feature patterns

### Adding markers with custom popups

```javascript
// In sidepanel.js — after map initialization
const markers = L.featureGroup(); // use featureGroup not layerGroup for bounds

function renderListings(listings) {
  markers.clearLayers();
  listings.forEach(listing => {
    if (!listing.coordinates) return;
    
    const marker = L.marker([listing.coordinates.lat, listing.coordinates.lng], {
      icon: createPriceIcon(listing.price, listing.currency)
    });
    
    marker.bindPopup(createPopupHTML(listing), {
      maxWidth: 280,
      className: 'hm-popup'
    });
    
    markers.addLayer(marker);
  });
  
  map.addLayer(markers);
  if (markers.getLayers().length > 0) {
    map.fitBounds(markers.getBounds(), { padding: [40, 40] });
  }
}

function createPriceIcon(price, currency) {
  const symbol = currency === 'RUB' ? '₽' : currency === 'USD' ? '$' : '€';
  const label = price >= 1_000_000
    ? `${(price / 1_000_000).toFixed(1)}M`
    : `${Math.round(price / 1000)}K`;
    
  return L.divIcon({
    html: `<div class="price-pin">${label}${symbol}</div>`,
    className: '', // empty — prevents default Leaflet styling
    iconSize: null,
    iconAnchor: [0, 0]
  });
}

function createPopupHTML(l) {
  return `
    <div class="listing-popup">
      <div class="price">${l.price.toLocaleString()} ${l.currency}</div>
      <div class="address">${l.address}</div>
      ${l.area ? `<div class="area">${l.area} м²</div>` : ''}
      <a href="${l.url}" target="_blank" rel="noopener">Открыть</a>
    </div>
  `;
}
```

### Marker clustering

```javascript
// Requires lib/leaflet.markercluster.js (download locally)
const cluster = L.markerClusterGroup({
  maxClusterRadius: 60,
  showCoverageOnHover: false,
  zoomToBoundsOnClick: true,
  iconCreateFunction: (c) => L.divIcon({
    html: `<div class="cluster-icon">${c.getChildCount()}</div>`,
    className: '',
  })
});
cluster.addLayer(markers);
map.addLayer(cluster);
```

### Heatmap (цена/плотность)

```javascript
// Requires lib/leaflet-heat.js (download locally)
const heat = L.heatLayer(
  listings.map(l => [l.coordinates.lat, l.coordinates.lng, l.price / 1_000_000]),
  { radius: 35, blur: 25, maxZoom: 15, max: 20 }
);
map.addLayer(heat);
```

### Price choropleth (полигоны с цветом по цене)

```javascript
// Аналогично текущему injected.js но для Leaflet
function getColor(pricePerSqm) {
  const hue = Math.round(Math.max(0, Math.min(1, (pricePerSqm - 80000) / (400000 - 80000))) * 120);
  return `hsla(${hue},78%,48%,0.5)`;
}

L.geoJSON(neighborhoodGeoJSON, {
  style: (feature) => ({
    fillColor: getColor(feature.properties.avgPricePerSqm),
    fillOpacity: 0.5,
    color: '#333',
    weight: 1
  }),
  onEachFeature: (feature, layer) => {
    layer.bindTooltip(`
      <strong>${feature.properties.name}</strong><br>
      ${feature.properties.avgPricePerSqm?.toLocaleString()} ₽/м²
    `);
  }
}).addTo(map);
```

## Step 3 — Google Maps feature patterns (injected.js)

The current `injected.js` uses `map.data.addGeoJson()` for the salary layer. Follow the same pattern for housing data.

```javascript
// Adding a housing data layer to Google Maps
function addHousingLayer(map, listings) {
  // Remove old layer
  map.data.forEach(f => { if (f.getProperty('type') === 'housing') map.data.remove(f); });
  
  listings.forEach(listing => {
    if (!listing.coordinates) return;
    map.data.add({
      geometry: new google.maps.Data.Point({
        lat: listing.coordinates.lat,
        lng: listing.coordinates.lng
      }),
      properties: { type: 'housing', ...listing }
    });
  });
  
  map.data.setStyle(f => {
    if (f.getProperty('type') !== 'housing') return {};
    return {
      icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#1a73e8', fillOpacity: 0.8, strokeWeight: 1 }
    };
  });
  
  map.data.addListener('click', e => {
    const props = e.feature.getProperties();
    // Open listing popup or send message to extension
    window.open(props.url, '_blank');
  });
}
```

## Step 4 — CSS for map UI elements

All CSS for Side Panel elements goes in `sidepanel.css` (or inline `<style>` in sidepanel.html).  
All CSS for injected overlay elements — use explicit `style.cssText` strings (no external CSS from extension into page).

```css
/* sidepanel.css — price pin styling */
.price-pin {
  background: white;
  border: 2px solid #1a73e8;
  border-radius: 12px;
  padding: 2px 8px;
  font: 600 11px/1.4 Arial, sans-serif;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  cursor: pointer;
  transform: translateX(-50%);
}
.price-pin:hover { background: #e8f0fe; }
```

## Step 5 — Performance rules for maps

- **5,000+ markers**: Always cluster (markerCluster) or use canvas rendering (`L.canvas()`)
- **Avoid re-creating markers on each update**: Clear layer and re-add, or diff and update
- **Leaflet map container must have explicit height**: `height: 100vh` or `height: 500px` — never `height: auto`
- **Destroy map on page unload**: `map.remove()` to prevent memory leaks in long sessions
- **Debounce moveend event**: Don't trigger data refresh on every pixel scroll

## Step 6 — Test the feature

1. Load unpacked extension in `chrome://extensions/`
2. Open the target page (or `chrome-extension://ID/sidepanel.html` directly)
3. Verify markers appear, popups work, clusters form
4. Check Console for errors
5. Check memory after 5 minutes of use (DevTools → Memory → Heap snapshot)
