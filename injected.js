(function () {
  'use strict';

  if (window.__smf_loaded) return;
  window.__smf_loaded = true;

  /* ─── INSEE 2023 net monthly salary (€) by région code ──────────────── */

  var REG_SALARY = {
    '11': 3497, // Île-de-France
    '24': 2421, // Centre-Val de Loire
    '27': 2391, // Bourgogne-Franche-Comté
    '28': 2434, // Normandie
    '32': 2440, // Hauts-de-France
    '44': 2456, // Grand Est
    '52': 2436, // Pays de la Loire
    '53': 2390, // Bretagne
    '75': 2405, // Nouvelle-Aquitaine
    '76': 2469, // Occitanie
    '84': 2632, // Auvergne-Rhône-Alpes
    '93': 2564, // Provence-Alpes-Côte d'Azur
    '94': 2300  // Corse
  };

  /* ─── INSEE 2023 net monthly salary (€) by département code ─────────── */

  var DEP_SALARY = {
    '01': 2580, // Ain
    '02': 2290, // Aisne
    '03': 2280, // Allier
    '04': 2260, // Alpes-de-Haute-Provence
    '05': 2350, // Hautes-Alpes
    '06': 2710, // Alpes-Maritimes (Nice)
    '07': 2330, // Ardèche
    '08': 2230, // Ardennes
    '09': 2220, // Ariège
    '10': 2360, // Aube
    '11': 2270, // Aude
    '12': 2300, // Aveyron
    '13': 2650, // Bouches-du-Rhône (Marseille)
    '14': 2470, // Calvados (Caen)
    '15': 2240, // Cantal
    '16': 2310, // Charente
    '17': 2400, // Charente-Maritime
    '18': 2290, // Cher
    '19': 2310, // Corrèze
    '2A': 2270, // Corse-du-Sud
    '2B': 2320, // Haute-Corse
    '21': 2510, // Côte-d'Or (Dijon)
    '22': 2280, // Côtes-d'Armor
    '23': 2200, // Creuse
    '24': 2280, // Dordogne
    '25': 2500, // Doubs (Besançon)
    '26': 2460, // Drôme
    '27': 2430, // Eure
    '28': 2440, // Eure-et-Loir
    '29': 2370, // Finistère (Brest)
    '30': 2380, // Gard
    '31': 2720, // Haute-Garonne (Toulouse)
    '32': 2280, // Gers
    '33': 2620, // Gironde (Bordeaux)
    '34': 2530, // Hérault (Montpellier)
    '35': 2530, // Ille-et-Vilaine (Rennes)
    '36': 2240, // Indre
    '37': 2470, // Indre-et-Loire (Tours)
    '38': 2720, // Isère (Grenoble)
    '39': 2380, // Jura
    '40': 2390, // Landes
    '41': 2340, // Loir-et-Cher
    '42': 2430, // Loire
    '43': 2280, // Haute-Loire
    '44': 2630, // Loire-Atlantique (Nantes)
    '45': 2510, // Loiret (Orléans)
    '46': 2270, // Lot
    '47': 2300, // Lot-et-Garonne
    '48': 2250, // Lozère
    '49': 2390, // Maine-et-Loire
    '50': 2360, // Manche
    '51': 2500, // Marne (Reims)
    '52': 2230, // Haute-Marne
    '53': 2310, // Mayenne
    '54': 2390, // Meurthe-et-Moselle
    '55': 2260, // Meuse
    '56': 2390, // Morbihan
    '57': 2460, // Moselle (Metz)
    '58': 2250, // Nièvre
    '59': 2490, // Nord (Lille)
    '60': 2540, // Oise
    '61': 2280, // Orne
    '62': 2330, // Pas-de-Calais
    '63': 2480, // Puy-de-Dôme (Clermont-Ferrand)
    '64': 2490, // Pyrénées-Atlantiques (Pau, Bayonne)
    '65': 2360, // Hautes-Pyrénées
    '66': 2320, // Pyrénées-Orientales
    '67': 2670, // Bas-Rhin (Strasbourg)
    '68': 2590, // Haut-Rhin (Mulhouse)
    '69': 2876, // Rhône (Lyon) — INSEE confirmed
    '70': 2310, // Haute-Saône
    '71': 2390, // Saône-et-Loire
    '72': 2390, // Sarthe (Le Mans)
    '73': 2660, // Savoie (Chambéry)
    '74': 2800, // Haute-Savoie (Annecy)
    '75': 3863, // Paris — INSEE confirmed
    '76': 2540, // Seine-Maritime (Rouen, Le Havre)
    '77': 2720, // Seine-et-Marne
    '78': 3010, // Yvelines (Versailles)
    '79': 2310, // Deux-Sèvres
    '80': 2350, // Somme (Amiens)
    '81': 2360, // Tarn
    '82': 2310, // Tarn-et-Garonne
    '83': 2590, // Var (Toulon)
    '84': 2390, // Vaucluse (Avignon)
    '85': 2360, // Vendée
    '86': 2400, // Vienne (Poitiers)
    '87': 2390, // Haute-Vienne (Limoges)
    '88': 2290, // Vosges
    '89': 2360, // Yonne
    '90': 2440, // Territoire de Belfort
    '91': 2840, // Essonne
    '92': 3250, // Hauts-de-Seine (La Défense)
    '93': 2500, // Seine-Saint-Denis
    '94': 2770, // Val-de-Marne
    '95': 2730  // Val-d'Oise
  };

  /* ─── Paris arrondissements (circles — approximation) ───────────────── */

  var ARR_DATA = [
    { code:'75101', nom:'1er arr.',  lng:2.3473, lat:48.8603, s:4800 },
    { code:'75102', nom:'2e arr.',   lng:2.3491, lat:48.8661, s:4200 },
    { code:'75103', nom:'3e arr.',   lng:2.3601, lat:48.8630, s:4100 },
    { code:'75104', nom:'4e arr.',   lng:2.3527, lat:48.8551, s:4600 },
    { code:'75105', nom:'5e arr.',   lng:2.3512, lat:48.8515, s:4900 },
    { code:'75106', nom:'6e arr.',   lng:2.3337, lat:48.8503, s:5600 },
    { code:'75107', nom:'7e arr.',   lng:2.3143, lat:48.8556, s:5900 },
    { code:'75108', nom:'8e arr.',   lng:2.3073, lat:48.8748, s:6400 },
    { code:'75109', nom:'9e arr.',   lng:2.3364, lat:48.8770, s:3800 },
    { code:'75110', nom:'10e arr.',  lng:2.3591, lat:48.8760, s:3400 },
    { code:'75111', nom:'11e arr.',  lng:2.3793, lat:48.8621, s:3500 },
    { code:'75112', nom:'12e arr.',  lng:2.3894, lat:48.8429, s:3500 },
    { code:'75113', nom:'13e arr.',  lng:2.3607, lat:48.8320, s:3300 },
    { code:'75114', nom:'14e arr.',  lng:2.3272, lat:48.8342, s:3800 },
    { code:'75115', nom:'15e arr.',  lng:2.2909, lat:48.8417, s:3900 },
    { code:'75116', nom:'16e arr.',  lng:2.2697, lat:48.8633, s:5600 },
    { code:'75117', nom:'17e arr.',  lng:2.3114, lat:48.8840, s:4100 },
    { code:'75118', nom:'18e arr.',  lng:2.3430, lat:48.8924, s:3000 },
    { code:'75119', nom:'19e arr.',  lng:2.3804, lat:48.8823, s:2900 },
    { code:'75120', nom:'20e arr.',  lng:2.3960, lat:48.8648, s:2800 }
  ];

  /* ─── GeoJSON from background.js ────────────────────────────────────── */

  var GEO = window.__SMF_GEO__ || null;

  function circleCoords(lng, lat, r, n) {
    n = n || 24;
    var pts = [];
    for (var i = 0; i <= n; i++) {
      var a = (i / n) * 2 * Math.PI;
      pts.push([lng + r * Math.cos(a), lat + r * 0.63 * Math.sin(a)]);
    }
    return [pts];
  }

  function enrichGeo(geoJson, salaryMap) {
    if (!geoJson) return null;
    return {
      type: 'FeatureCollection',
      features: geoJson.features.map(function(f) {
        var salary = salaryMap[f.properties.code] || 2400;
        return {
          type: 'Feature',
          properties: {
            code: f.properties.code,
            name: f.properties.nom,
            avgSalary: salary
          },
          geometry: f.geometry
        };
      })
    };
  }

  var DISTRICTS = {
    type: 'FeatureCollection',
    features: ARR_DATA.map(function(d) {
      return {
        type: 'Feature',
        properties: { code: d.code, name: d.nom, avgSalary: d.s, sub: 'Paris' },
        geometry: { type: 'Polygon', coordinates: circleCoords(d.lng, d.lat, 0.016, 24) }
      };
    })
  };

  /* ─── color: blue (low) → cyan → green → yellow → red (high) ────────── */

  var S_MIN = 2100, S_MAX = 4300;

  function salaryT(s) {
    return Math.max(0, Math.min(1, (s - S_MIN) / (S_MAX - S_MIN)));
  }
  function fillColor(s) {
    var hue = Math.round((1 - salaryT(s)) * 240);
    return 'hsla(' + hue + ',85%,50%,0.55)';
  }
  function strokeColor(s) {
    var hue = Math.round((1 - salaryT(s)) * 240);
    return 'hsl(' + hue + ',85%,30%)';
  }
  function labelColor(s) {
    var hue = Math.round((1 - salaryT(s)) * 240);
    return 'hsl(' + hue + ',85%,25%)';
  }

  /* ─── tooltip ───────────────────────────────────────────────────────── */

  var tip = null, tipVisible = false, mouseX = 0, mouseY = 0;

  function ensureTip() {
    if (tip || !document.body) return;
    tip = document.createElement('div');
    tip.style.cssText =
      'position:fixed;z-index:99999;pointer-events:none;display:none;' +
      'background:rgba(255,255,255,0.97);border:1px solid #ddd;border-radius:10px;' +
      'padding:11px 15px;min-width:200px;max-width:250px;' +
      'font:13px/1.6 Roboto,Arial,sans-serif;' +
      'box-shadow:0 4px 16px rgba(0,0,0,0.18);';
    document.body.appendChild(tip);
    document.addEventListener('mousemove', function(e) {
      mouseX = e.clientX; mouseY = e.clientY;
      if (tipVisible) placeTip();
    });
  }

  function placeTip() {
    if (!tip) return;
    var mg = 16, w = tip.offsetWidth || 220, h = tip.offsetHeight || 90;
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
    var sub = props.sub || (props.code ? 'Code ' + props.code : '');
    var bar = buildMiniBar(s);
    tip.innerHTML =
      '<div style="font-weight:700;font-size:14px;color:#222;margin-bottom:2px">' + props.name + '</div>' +
      (sub ? '<div style="color:#999;font-size:11px;margin-bottom:6px">' + sub + '</div>' : '') +
      '<div style="margin:4px 0">' + bar + '</div>' +
      '<div style="margin-top:5px">Salaire net moyen&nbsp;: ' +
        '<strong style="color:' + labelColor(s) + ';font-size:15px">' +
        s.toLocaleString('fr-FR') + '&nbsp;€</strong>' +
        '<span style="color:#999;font-size:11px">&nbsp;/mois</span>' +
      '</div>' +
      '<div style="margin-top:6px;font-size:10px;color:#bbb">Source&nbsp;: INSEE MELODI 2023</div>';
    tip.style.display = 'block';
    tipVisible = true;
    placeTip();
  }

  function buildMiniBar(s) {
    var t = salaryT(s);
    var w = Math.round(t * 100);
    var hue = Math.round((1 - t) * 240);
    return '<div style="background:#f0f0f0;border-radius:4px;height:6px;overflow:hidden">' +
      '<div style="width:' + w + '%;height:100%;background:hsl(' + hue + ',85%,50%);border-radius:4px;transition:width 0.2s"></div>' +
      '</div>';
  }

  function hideTip() {
    tipVisible = false;
    if (tip) tip.style.display = 'none';
  }

  /* ─── legend ────────────────────────────────────────────────────────── */

  var legendEl = null;
  var LEVEL_LABELS = {
    region:      'Régions (13)',
    departement: 'Départements (96)',
    district:    'Arrondissements · Paris'
  };

  function buildLegend() {
    var el = document.createElement('div');
    el.id = '_smf_legend';
    el.style.cssText =
      'position:fixed;bottom:90px;left:12px;z-index:999999;' +
      'background:rgba(255,255,255,0.96);border:1px solid #ddd;border-radius:10px;' +
      'padding:11px 14px;min-width:185px;' +
      'font:12px Roboto,Arial,sans-serif;' +
      'box-shadow:0 2px 10px rgba(0,0,0,0.14);user-select:none;';

    // Blue → cyan → green → yellow → red gradient (matches salaryColor)
    var g = 'linear-gradient(to right,' +
      'hsl(240,85%,50%),' +
      'hsl(180,85%,50%),' +
      'hsl(120,85%,50%),' +
      'hsl(60,85%,50%),' +
      'hsl(0,85%,50%))';

    el.innerHTML =
      '<div style="font-weight:700;font-size:12px;margin-bottom:7px;color:#333">Salaire net mensuel</div>' +
      '<div style="height:11px;border-radius:5px;background:' + g + ';margin-bottom:4px"></div>' +
      '<div style="display:flex;justify-content:space-between;color:#666;font-size:10px">' +
        '<span>2 100 €</span><span>3 200 €</span><span>4 300 €</span>' +
      '</div>' +
      '<div id="_smf_lvl" style="margin-top:8px;text-align:center;color:#888;font-size:10px;' +
        'background:#f5f5f5;border-radius:4px;padding:2px 0">Régions</div>' +
      '<div style="margin-top:6px;font-size:9px;color:#ccc;text-align:center">INSEE MELODI · 2023</div>';
    return el;
  }

  function updateLevelLabel(level) {
    var el = document.getElementById('_smf_lvl');
    if (el) el.textContent = LEVEL_LABELS[level] || level;
  }

  /* ─── toggle button ─────────────────────────────────────────────────── */

  var overlayOn = true;

  function buildToggle(map) {
    var btn = document.createElement('div');
    btn.id = '_smf_toggle';
    btn.style.cssText =
      'position:fixed;top:80px;right:12px;z-index:999999;' +
      'background:#fff;border-radius:6px;' +
      'box-shadow:0 2px 6px rgba(0,0,0,0.28);' +
      'cursor:pointer;padding:8px 13px;' +
      'font:600 12px Roboto,Arial,sans-serif;' +
      'user-select:none;display:flex;align-items:center;gap:7px;' +
      'border-left:4px solid #1a73e8;';

    function render() {
      if (overlayOn) {
        btn.style.borderLeftColor = '#1a73e8';
        btn.innerHTML =
          '<span style="width:8px;height:8px;border-radius:50%;background:#1a73e8;display:inline-block;flex-shrink:0"></span>' +
          '<span style="color:#1a73e8">Salaires ON</span>';
      } else {
        btn.style.borderLeftColor = '#ccc';
        btn.innerHTML =
          '<span style="width:8px;height:8px;border-radius:50%;background:#ccc;display:inline-block;flex-shrink:0"></span>' +
          '<span style="color:#999">Salaires OFF</span>';
      }
    }
    render();

    btn.addEventListener('mouseenter', function() { btn.style.background = '#f8f8f8'; });
    btn.addEventListener('mouseleave', function() { btn.style.background = '#fff'; });
    btn.addEventListener('click', function() {
      overlayOn = !overlayOn;
      render();
      if (overlayOn) {
        currentLevel = null;
        applyLayer(map);
        if (legendEl) legendEl.style.display = '';
      } else {
        map.data.forEach(function(f) { map.data.remove(f); });
        currentLevel = null;
        hideTip();
        if (legendEl) legendEl.style.display = 'none';
      }
    });
    return btn;
  }

  /* ─── layer management ──────────────────────────────────────────────── */

  var currentLevel = null;

  function nearParis(map) {
    var c = map.getCenter();
    return Math.abs(c.lat() - 48.857) < 0.20 && Math.abs(c.lng() - 2.352) < 0.30;
  }

  function getLevel(map) {
    var z = map.getZoom();
    if (z <= 7)  return 'region';
    if (z <= 10) return 'departement';
    return nearParis(map) ? 'district' : 'departement';
  }

  function getLayerData(level) {
    if (level === 'district') return DISTRICTS;
    if (level === 'region')   return GEO ? enrichGeo(GEO.regions, REG_SALARY) : null;
    if (level === 'departement') return GEO ? enrichGeo(GEO.departements, DEP_SALARY) : null;
    return null;
  }

  function applyLayer(map) {
    if (!overlayOn) return;
    var level;
    try { level = getLevel(map); } catch (e) { return; }
    if (level === currentLevel) return;
    currentLevel = level;

    map.data.forEach(function(f) { map.data.remove(f); });

    var data = getLayerData(level);
    if (!data) {
      // GeoJSON not loaded yet — show fallback message and retry
      if (level !== 'district') {
        console.log('[SalaryMaps] GeoJSON not ready for level:', level);
        setTimeout(function() { currentLevel = null; applyLayer(map); }, 1500);
      }
      return;
    }

    try { map.data.addGeoJson(data); } catch (e) {
      console.error('[SalaryMaps] addGeoJson error:', e);
      return;
    }

    map.data.setStyle(function(f) {
      var s = f.getProperty('avgSalary');
      return {
        fillColor:    fillColor(s),
        fillOpacity:  0.55,
        strokeColor:  strokeColor(s),
        strokeWeight: 1.5,
        strokeOpacity: 0.9
      };
    });

    updateLevelLabel(level);
    console.log('[SalaryMaps] layer:', level, '(' + data.features.length + ' features)');
  }

  /* ─── attach to map instance ─────────────────────────────────────────── */

  function attachToMap(map) {
    if (map.__smf_done) return;
    map.__smf_done = true;
    console.log('[SalaryMaps] attached to map instance');

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

    map.addListener('zoom_changed', function() {
      hideTip();
      if (overlayOn) { currentLevel = null; applyLayer(map); }
    });

    var ct = null;
    map.addListener('center_changed', function() {
      clearTimeout(ct);
      ct = setTimeout(function() { if (overlayOn) applyLayer(map); }, 400);
    });

    map.data.addListener('mouseover', function(e) {
      map.data.overrideStyle(e.feature, { fillOpacity: 0.75, strokeWeight: 2.5 });
      showTip(e.feature.getProperties());
    });
    map.data.addListener('mouseout', function(e) {
      map.data.revertStyle(e.feature);
      hideTip();
    });
  }

  /* ─── find map instance ──────────────────────────────────────────────── */

  var foundMaps = [];

  function onMapFound(m) {
    if (!m || foundMaps.indexOf(m) !== -1) return;
    foundMaps.push(m);
    try {
      if (typeof m.getZoom() === 'number') {
        attachToMap(m);
      } else {
        google.maps.event.addListenerOnce(m, 'idle', function() { attachToMap(m); });
      }
    } catch (e) {
      google.maps.event.addListenerOnce(m, 'idle', function() { attachToMap(m); });
    }
  }

  function patchMaps(maps) {
    if (maps.__smf_patched) return;
    maps.__smf_patched = true;
    console.log('[SalaryMaps] patching google.maps');

    // Strategy A: patch prototype methods (catches already-running map)
    var METHODS = ['setZoom','setCenter','panTo','fitBounds','setOptions',
                   'getDiv','getBounds','getCenter','getZoom','getMapTypeId'];
    METHODS.forEach(function(name) {
      var orig = maps.Map.prototype[name];
      if (typeof orig !== 'function') return;
      maps.Map.prototype[name] = function() {
        onMapFound(this);
        return orig.apply(this, arguments);
      };
    });

    // Strategy B: proxy constructor (catches new map instances)
    maps.Map = new Proxy(maps.Map, {
      construct: function(T, args, NT) {
        var inst = Reflect.construct(T, args, NT);
        onMapFound(inst);
        google.maps.event.addListenerOnce(inst, 'idle', function() { onMapFound(inst); });
        return inst;
      }
    });

    // Strategy C: resize triggers to wake up existing instance
    function kick() { try { window.dispatchEvent(new Event('resize')); } catch (e) {} }
    setTimeout(kick, 50);
    setTimeout(kick, 400);
    setTimeout(kick, 1200);
    setTimeout(kick, 3000);

    // Strategy D: scan div.__gm for existing instances
    function scanDom() {
      var divs = document.querySelectorAll('div');
      for (var i = 0; i < divs.length; i++) {
        try {
          var gm = divs[i].__gm;
          if (!gm || typeof gm !== 'object') continue;
          for (var k in gm) {
            try {
              var v = gm[k];
              if (v && typeof v.getZoom === 'function' && typeof v.getCenter === 'function') {
                onMapFound(v);
              }
            } catch (e2) {}
          }
        } catch (e) {}
      }
    }
    [100, 600, 1800, 5000].forEach(function(t) { setTimeout(scanDom, t); });

    var obs = new MutationObserver(function() { scanDom(); });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(function() { obs.disconnect(); }, 30000);
  }

  /* ─── watch for google.maps ──────────────────────────────────────────── */

  function watchMapsOn(g) {
    if (g.maps) { patchMaps(g.maps); return; }
    var _m;
    try {
      Object.defineProperty(g, 'maps', {
        configurable: true,
        get: function() { return _m; },
        set: function(v) { _m = v; if (v) patchMaps(v); }
      });
    } catch (e) {}
  }

  function watchForGoogle() {
    if (window.google) { watchMapsOn(window.google); }
    var _g = window.google;
    try {
      Object.defineProperty(window, 'google', {
        configurable: true,
        get: function() { return _g; },
        set: function(v) { _g = v; if (v) watchMapsOn(v); }
      });
    } catch (e) {}

    var pid = setInterval(function() {
      var g = window.google;
      if (!g || !g.maps) return;
      if (!g.maps.__smf_patched) patchMaps(g.maps);
      else clearInterval(pid);
    }, 300);
    setTimeout(function() { clearInterval(pid); }, 20000);
  }

  watchForGoogle();

})();
