(function () {
  'use strict';

  if (window.__smf_loaded) return;
  window.__smf_loaded = true;

  /* ─── geometry ──────────────────────────────────────────────────────── */

  function rect(w, s, e, n) {
    return [[[w, s], [e, s], [e, n], [w, n], [w, s]]];
  }

  function circle(lng, lat, r, n) {
    n = n || 22;
    var pts = [];
    for (var i = 0; i <= n; i++) {
      var a = (i / n) * 2 * Math.PI;
      pts.push([lng + r * Math.cos(a), lat + r * 0.63 * Math.sin(a)]);
    }
    return [pts];
  }

  function feat(name, salary, coords, meta) {
    return {
      type: 'Feature',
      properties: Object.assign({ name: name, avgSalary: salary }, meta || {}),
      geometry: { type: 'Polygon', coordinates: coords }
    };
  }

  /* ─── data ──────────────────────────────────────────────────────────── */

  var REGIONS = {
    type: 'FeatureCollection',
    features: [
      feat('Île-de-France',               3850, rect(1.60, 48.10, 3.60, 50.00), { pop: '12.2M hab.' }),
      feat('Hauts-de-France',             2400, rect(1.60, 50.00, 4.30, 51.10), { pop: '6.0M hab.'  }),
      feat('Grand Est',                   2450, rect(3.60, 47.40, 8.20, 50.00), { pop: '5.6M hab.'  }),
      feat('Normandie',                   2380, rect(-2.10, 48.40, 1.60, 50.10), { pop: '3.3M hab.' }),
      feat('Bretagne',                    2350, rect(-5.20, 47.30, -2.10, 48.90), { pop: '3.4M hab.'}),
      feat('Pays de la Loire',            2400, rect(-2.60, 46.30, 1.60, 48.40), { pop: '3.8M hab.' }),
      feat('Centre-Val de Loire',         2420, rect(0.10, 46.40, 3.60, 48.10),  { pop: '2.6M hab.' }),
      feat('Bourgogne-Franche-Comté',     2350, rect(3.60, 46.20, 7.10, 47.40), { pop: '2.8M hab.' }),
      feat('Auvergne-Rhône-Alpes',        2720, rect(2.10, 44.10, 7.20, 46.20), { pop: '8.1M hab.' }),
      feat('Nouvelle-Aquitaine',          2480, rect(-4.80, 43.00, 2.10, 47.30), { pop: '6.1M hab.' }),
      feat('Occitanie',                   2450, rect(2.10, 42.30, 4.90, 44.10),  { pop: '6.0M hab.' }),
      feat("Provence-Alpes-Côte d'Azur", 2850, rect(4.20, 43.16, 7.72, 44.90), { pop: '5.1M hab.' }),
      feat('Corse',                       2250, rect(8.53, 41.30, 9.57, 43.10),  { pop: '0.3M hab.' }),
    ]
  };

  var CITIES = {
    type: 'FeatureCollection',
    features: [
      feat('Paris',         4200, circle(2.352,  48.857, 0.12), { region: 'Île-de-France' }),
      feat('Lyon',          3200, circle(4.836,  45.764, 0.10), { region: 'Auvergne-Rhône-Alpes' }),
      feat('Marseille',     2900, circle(5.370,  43.297, 0.10), { region: "Prov.-Alpes-Côte d'Azur" }),
      feat('Toulouse',      2850, circle(1.444,  43.605, 0.09), { region: 'Occitanie' }),
      feat('Nice',          3100, circle(7.262,  43.710, 0.08), { region: "Prov.-Alpes-Côte d'Azur" }),
      feat('Nantes',        2800, circle(-1.554, 47.218, 0.09), { region: 'Pays de la Loire' }),
      feat('Montpellier',   2700, circle(3.877,  43.612, 0.08), { region: 'Occitanie' }),
      feat('Strasbourg',    2950, circle(7.752,  48.573, 0.08), { region: 'Grand Est' }),
      feat('Bordeaux',      2900, circle(-0.579, 44.838, 0.09), { region: 'Nouvelle-Aquitaine' }),
      feat('Lille',         2750, circle(3.057,  50.629, 0.09), { region: 'Hauts-de-France' }),
      feat('Rennes',        2780, circle(-1.678, 48.117, 0.08), { region: 'Bretagne' }),
      feat('Reims',         2600, circle(4.032,  49.258, 0.07), { region: 'Grand Est' }),
      feat('Le Havre',      2580, circle(0.108,  49.494, 0.07), { region: 'Normandie' }),
      feat('Saint-Étienne', 2450, circle(4.390,  45.435, 0.07), { region: 'Auvergne-Rhône-Alpes' }),
      feat('Toulon',        2600, circle(5.928,  43.124, 0.07), { region: "Prov.-Alpes-Côte d'Azur" }),
    ]
  };

  var ARR_DATA = [
    { lng:2.3473, lat:48.8603, s:4400 }, // 1er
    { lng:2.3491, lat:48.8661, s:4200 }, // 2e
    { lng:2.3601, lat:48.8630, s:4100 }, // 3e
    { lng:2.3527, lat:48.8551, s:4600 }, // 4e
    { lng:2.3512, lat:48.8515, s:4800 }, // 5e
    { lng:2.3337, lat:48.8503, s:5500 }, // 6e
    { lng:2.3143, lat:48.8556, s:5800 }, // 7e
    { lng:2.3073, lat:48.8748, s:6200 }, // 8e
    { lng:2.3364, lat:48.8770, s:3900 }, // 9e
    { lng:2.3591, lat:48.8760, s:3500 }, // 10e
    { lng:2.3793, lat:48.8621, s:3600 }, // 11e
    { lng:2.3894, lat:48.8429, s:3500 }, // 12e
    { lng:2.3607, lat:48.8320, s:3300 }, // 13e
    { lng:2.3272, lat:48.8342, s:3800 }, // 14e
    { lng:2.2909, lat:48.8417, s:3900 }, // 15e
    { lng:2.2697, lat:48.8633, s:5500 }, // 16e
    { lng:2.3114, lat:48.8840, s:4100 }, // 17e
    { lng:2.3430, lat:48.8924, s:3000 }, // 18e
    { lng:2.3804, lat:48.8823, s:2900 }, // 19e
    { lng:2.3960, lat:48.8648, s:2800 }, // 20e
  ];

  var DISTRICTS = {
    type: 'FeatureCollection',
    features: ARR_DATA.map(function (d, i) {
      return feat((i + 1) + 'e arrondissement', d.s,
        circle(d.lng, d.lat, 0.016, 20), { city: 'Paris' });
    })
  };

  var LAYER_DATA = { region: REGIONS, city: CITIES, district: DISTRICTS };

  /* ─── color ─────────────────────────────────────────────────────────── */

  var MIN_S = 1800, MAX_S = 6500;

  function salaryHue(s) {
    return Math.round(Math.max(0, Math.min(1, (s - MIN_S) / (MAX_S - MIN_S))) * 120);
  }
  function fillColor(s)   { return 'hsla(' + salaryHue(s) + ',78%,48%,0.52)'; }
  function strokeColor(s) { return 'hsl('  + salaryHue(s) + ',78%,28%)'; }

  /* ─── tooltip ───────────────────────────────────────────────────────── */

  var tip = null, tipVisible = false, mouseX = 0, mouseY = 0;

  function ensureTip() {
    if (tip || !document.body) return;
    tip = document.createElement('div');
    tip.style.cssText =
      'position:fixed;z-index:99999;pointer-events:none;display:none;' +
      'background:rgba(255,255,255,0.97);border:1px solid #ddd;border-radius:8px;' +
      'padding:10px 14px;min-width:190px;' +
      'font:13px/1.6 Roboto,Arial,sans-serif;' +
      'box-shadow:0 2px 12px rgba(0,0,0,0.18);';
    document.body.appendChild(tip);
    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX; mouseY = e.clientY;
      if (tipVisible) placeTip();
    });
  }

  function placeTip() {
    if (!tip) return;
    var mg = 14, w = tip.offsetWidth || 200, h = tip.offsetHeight || 80;
    var x = mouseX + mg, y = mouseY + mg;
    if (x + w > innerWidth  - mg) x = mouseX - w - mg;
    if (y + h > innerHeight - mg) y = mouseY - h - mg;
    tip.style.left = x + 'px';
    tip.style.top  = y + 'px';
  }

  function showTip(props) {
    ensureTip();
    if (!tip) return;
    var s = props.avgSalary;
    var sub = props.city || props.region || props.pop || '';
    tip.innerHTML =
      '<div style="font-weight:700;font-size:14px;margin-bottom:2px">' + props.name + '</div>' +
      (sub ? '<div style="color:#888;font-size:11px;margin-bottom:5px">' + sub + '</div>' : '') +
      '<hr style="border:none;border-top:1px solid #f0f0f0;margin:4px 0">' +
      '<div>Salaire moyen: <strong style="color:' + strokeColor(s) + '">' +
      s.toLocaleString('fr-FR') + ' €</strong><span style="color:#888">/mois</span></div>';
    tip.style.display = 'block';
    tipVisible = true;
    placeTip();
  }

  function hideTip() {
    tipVisible = false;
    if (tip) tip.style.display = 'none';
  }

  /* ─── legend + toggle ───────────────────────────────────────────────── */

  var legendEl = null, overlayOn = true, currentLevel = null;
  var LEVEL_LABELS = { region: 'Régions', city: 'Villes', district: 'Quartiers (Paris)' };

  function buildLegend() {
    var el = document.createElement('div');
    el.id = '_smf_legend';
    el.style.cssText =
      'position:fixed;bottom:80px;left:10px;z-index:5000;' +
      'background:rgba(255,255,255,0.95);border:1px solid #ccc;border-radius:8px;' +
      'padding:10px 14px;min-width:175px;' +
      'font:12px Roboto,Arial,sans-serif;' +
      'box-shadow:0 2px 8px rgba(0,0,0,0.15);user-select:none;';
    var g = 'linear-gradient(to right,hsl(0,78%,48%),hsl(60,78%,48%),hsl(120,78%,48%))';
    el.innerHTML =
      '<div style="font-weight:700;margin-bottom:6px">Salaire moyen mensuel</div>' +
      '<div style="height:10px;border-radius:4px;background:' + g + ';margin-bottom:3px"></div>' +
      '<div style="display:flex;justify-content:space-between;color:#555">' +
        '<span>1 800 €</span><span>4 150 €</span><span>6 500 €</span>' +
      '</div>' +
      '<div id="_smf_lvl" style="margin-top:7px;text-align:center;color:#555;font-size:11px">Niveau: Régions</div>';
    return el;
  }

  function buildToggle(map) {
    var btn = document.createElement('div');
    btn.id = '_smf_toggle';
    btn.style.cssText =
      'position:fixed;top:80px;right:10px;z-index:5000;' +
      'background:#fff;border-radius:3px;' +
      'box-shadow:0 1px 4px rgba(0,0,0,0.35);' +
      'cursor:pointer;padding:9px 14px;' +
      'font:600 13px Roboto,Arial,sans-serif;' +
      'user-select:none;display:flex;align-items:center;gap:8px;' +
      'border-left:4px solid #1a73e8;';

    function render() {
      var dot = '<span style="width:9px;height:9px;border-radius:50%;display:inline-block;flex-shrink:0;background:';
      if (overlayOn) {
        btn.style.borderLeftColor = '#1a73e8';
        btn.innerHTML = dot + '#1a73e8"></span><span style="color:#1a73e8">Зарплаты: ВКЛ</span>';
      } else {
        btn.style.borderLeftColor = '#bbb';
        btn.innerHTML = dot + '#bbb"></span><span style="color:#999">Зарплаты: ВЫКЛ</span>';
      }
    }
    render();

    btn.addEventListener('mouseenter', function () { btn.style.background = '#f5f5f5'; });
    btn.addEventListener('mouseleave', function () { btn.style.background = '#fff'; });
    btn.addEventListener('click', function () {
      overlayOn = !overlayOn;
      render();
      if (overlayOn) {
        currentLevel = null;
        applyLayer(map);
        if (legendEl) legendEl.style.display = '';
      } else {
        map.data.forEach(function (f) { map.data.remove(f); });
        currentLevel = null;
        hideTip();
        if (legendEl) legendEl.style.display = 'none';
      }
    });
    return btn;
  }

  function updateLevelLabel(level) {
    var el = document.getElementById('_smf_lvl');
    if (el) el.textContent = 'Niveau: ' + LEVEL_LABELS[level];
  }

  /* ─── layer management ──────────────────────────────────────────────── */

  function nearParis(map) {
    var c = map.getCenter();
    return Math.abs(c.lat() - 48.857) < 0.18 && Math.abs(c.lng() - 2.352) < 0.28;
  }

  function getLevel(map) {
    var z = map.getZoom();
    if (z <= 7)  return 'region';
    if (z <= 11) return 'city';
    return nearParis(map) ? 'district' : 'city';
  }

  function applyLayer(map) {
    if (!overlayOn) return;
    var level;
    try { level = getLevel(map); } catch (e) { return; }
    if (level === currentLevel) return;
    currentLevel = level;
    map.data.forEach(function (f) { map.data.remove(f); });
    try { map.data.addGeoJson(LAYER_DATA[level]); } catch (e) { console.error('[SalaryMaps]', e); return; }
    map.data.setStyle(function (f) {
      var s = f.getProperty('avgSalary');
      return { fillColor: fillColor(s), fillOpacity: 0.52,
               strokeColor: strokeColor(s), strokeWeight: 1.5, strokeOpacity: 0.85 };
    });
    updateLevelLabel(level);
    console.log('[SalaryMaps] layer:', level);
  }

  /* ─── attach overlay to map instance ───────────────────────────────── */

  function attachToMap(map) {
    if (map.__smf_done) return;
    map.__smf_done = true;
    console.log('[SalaryMaps] attached to map');

    // Wait for body in case we're called very early
    function doAttach() {
      ensureTip();
      if (!document.getElementById('_smf_legend')) {
        legendEl = buildLegend();
        document.body.appendChild(legendEl);
      }
      if (!document.getElementById('_smf_toggle')) {
        document.body.appendChild(buildToggle(map));
      }
      applyLayer(map);
    }

    if (document.body) {
      doAttach();
    } else {
      document.addEventListener('DOMContentLoaded', doAttach);
    }

    map.addListener('zoom_changed', function () {
      hideTip();
      if (overlayOn) { currentLevel = null; applyLayer(map); }
    });

    var ct = null;
    map.addListener('center_changed', function () {
      clearTimeout(ct);
      ct = setTimeout(function () { if (overlayOn) applyLayer(map); }, 300);
    });

    map.data.addListener('mouseover', function (e) {
      map.data.overrideStyle(e.feature, { fillOpacity: 0.75, strokeWeight: 2.5 });
      showTip(e.feature.getProperties());
    });
    map.data.addListener('mouseout', function (e) {
      map.data.revertStyle(e.feature);
      hideTip();
    });
  }

  /* ─── find map instance (three strategies) ──────────────────────────── */

  var foundMaps = [];
  function hasMap(m) { return foundMaps.indexOf(m) !== -1; }

  function onMapFound(m) {
    if (!m || hasMap(m)) return;
    foundMaps.push(m);
    try {
      // If getZoom() returns a number the map is already initialised
      if (typeof m.getZoom() === 'number') {
        attachToMap(m);
      } else {
        google.maps.event.addListenerOnce(m, 'idle', function () { attachToMap(m); });
      }
    } catch (e) {
      google.maps.event.addListenerOnce(m, 'idle', function () { attachToMap(m); });
    }
  }

  function patchMaps(maps) {
    if (maps.__smf_patched) return;
    maps.__smf_patched = true;
    console.log('[SalaryMaps] patching google.maps');

    // ── Strategy A: patch prototype ──────────────────────────────────
    // These methods are called by the Maps engine on every render/interaction,
    // so patching them catches the existing instance immediately.
    var METHODS = ['setZoom','setCenter','panTo','fitBounds','setOptions',
                   'getDiv','getBounds','getCenter','getZoom','getMapTypeId'];
    METHODS.forEach(function (name) {
      var orig = maps.Map.prototype[name];
      if (typeof orig !== 'function') return;
      maps.Map.prototype[name] = function () {
        onMapFound(this);                     // no-op after first call
        return orig.apply(this, arguments);
      };
    });

    // ── Strategy B: proxy constructor ────────────────────────────────
    maps.Map = new Proxy(maps.Map, {
      construct: function (T, args, NT) {
        var inst = Reflect.construct(T, args, NT);
        onMapFound(inst);
        google.maps.event.addListenerOnce(inst, 'idle', function () { onMapFound(inst); });
        return inst;
      }
    });

    // ── Strategy C: trigger resize ────────────────────────────────────
    // Forces the Maps engine to call getDiv/getBounds etc. on any live instance,
    // which routes through our patched prototype → onMapFound.
    function kick() { try { window.dispatchEvent(new Event('resize')); } catch (e) {} }
    setTimeout(kick, 50);
    setTimeout(kick, 300);
    setTimeout(kick, 1000);
    setTimeout(kick, 3000);
  }

  /* ─── watch for google / google.maps ────────────────────────────────── */

  function watchMapsOn(g) {
    if (g.maps) { patchMaps(g.maps); return; }
    // google object exists but .maps not set yet — intercept the assignment
    var _m = undefined;
    try {
      Object.defineProperty(g, 'maps', {
        configurable: true,
        get: function () { return _m; },
        set: function (v) { _m = v; if (v) patchMaps(v); }
      });
    } catch (e) { /* will be caught by polling */ }
  }

  function watchForGoogle() {
    // Already available?
    if (window.google) { watchMapsOn(window.google); }

    // Intercept future window.google assignments
    var _g = window.google;
    try {
      Object.defineProperty(window, 'google', {
        configurable: true,
        get: function () { return _g; },
        set: function (v) { _g = v; if (v) watchMapsOn(v); }
      });
    } catch (e) { /* non-configurable — rely on polling */ }

    // Polling safety-net — checks every 300 ms for up to 20 s
    var pid = setInterval(function () {
      var g = window.google;
      if (!g || !g.maps) return;
      if (!g.maps.__smf_patched) patchMaps(g.maps);
      else clearInterval(pid);
    }, 300);
    setTimeout(function () { clearInterval(pid); }, 20000);
  }

  watchForGoogle();

})();
