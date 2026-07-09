/**
 * Generic idle-tycoon runtime (vanilla DOM, zero deps). Reads `window.__SPEC__` (an IdleTycoonSpec)
 * and builds the whole game from it — a different presentation from the wave-survival canvas runtime,
 * which is the point: the genre owns its runtime, the adapter just packages it.
 */
export const IDLE_RUNTIME_JS = String.raw`
(function () {
  var spec = window.__SPEC__ || {};
  var cur = spec.currency || { name: 'Coins', symbol: '', start: 0 };
  var gens = (spec.generators && spec.generators.length) ? spec.generators : [{ id: 'g', name: 'Worker', baseCost: 10, costGrowth: 1.15, baseRate: 1 }];
  var upgrades = spec.upgrades || [];
  var win = spec.win || { mode: 'endless' };
  var pal = (spec.theme && spec.theme.palette) || ['#6db36b', '#f4d35e', '#8d5a2b'];
  var clickPower = spec.clickPower || 0;

  var amount = cur.start || 0;
  var owned = gens.map(function () { return 0; });
  var rateMult = gens.map(function () { return 1; });
  var costMult = gens.map(function () { return 1; });
  var bought = {};
  var won = false;

  function fmt(n) { n = Math.floor(n); if (n < 1000) return '' + n; var u = ['K', 'M', 'B', 'T']; var i = -1; while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; } return n.toFixed(1) + u[i]; }
  function idx(id) { for (var i = 0; i < gens.length; i++) if (gens[i].id === id) return i; return -1; }
  function genCost(i) { return Math.ceil(gens[i].baseCost * costMult[i] * Math.pow(gens[i].costGrowth || 1, owned[i])); }
  function totalRate() { var r = 0; for (var i = 0; i < gens.length; i++) r += owned[i] * (gens[i].baseRate || 0) * rateMult[i]; return r; }

  function el(tag, txt) { var e = document.createElement(tag); if (txt != null) e.textContent = txt; return e; }
  var root = el('div');
  root.style.cssText = 'position:fixed;inset:0;overflow:auto;padding:16px;box-sizing:border-box;background:#0c0c12;color:#e7e7ee;font-family:system-ui,sans-serif';
  var amountEl = el('div'); amountEl.style.cssText = 'text-align:center;font-size:28px;font-weight:700;color:' + pal[1];
  var goalEl = el('div'); goalEl.style.cssText = 'text-align:center;font-size:12px;opacity:.7;margin-bottom:12px';
  var clickBtn = el('button', (cur.symbol || '') + ' Click (+' + clickPower + ')');
  clickBtn.style.cssText = 'display:block;margin:0 auto 16px;padding:14px 22px;font-size:16px;border:0;border-radius:12px;background:' + pal[0] + ';color:#04121a;font-weight:700;cursor:pointer';
  clickBtn.onclick = function () { amount += clickPower; refresh(); };
  root.appendChild(amountEl); root.appendChild(goalEl); root.appendChild(clickBtn);

  var genRows = [];
  var genWrap = el('div'); genWrap.style.cssText = 'max-width:520px;margin:0 auto 16px;display:flex;flex-direction:column;gap:8px';
  gens.forEach(function (g, i) {
    var btn = el('button');
    btn.style.cssText = 'text-align:left;padding:10px 12px;border:1px solid #262633;border-radius:10px;background:#15151f;color:#e7e7ee;cursor:pointer';
    btn.onclick = function () { var c = genCost(i); if (amount >= c) { amount -= c; owned[i]++; refresh(); } };
    genWrap.appendChild(btn); genRows.push(btn);
  });
  root.appendChild(genWrap);

  var upgRows = [];
  if (upgrades.length) {
    var upgWrap = el('div'); upgWrap.style.cssText = 'max-width:520px;margin:0 auto;display:flex;flex-direction:column;gap:6px';
    upgWrap.appendChild(el('div', 'Upgrades'));
    upgrades.forEach(function (u) {
      var btn = el('button');
      btn.style.cssText = 'text-align:left;padding:8px 10px;border:1px solid #262633;border-radius:8px;background:#1c1c28;color:#e7e7ee;cursor:pointer;font-size:13px';
      btn.onclick = function () { if (bought[u.id]) return; if (amount >= u.cost) { amount -= u.cost; bought[u.id] = 1; applyUpgrade(u); refresh(); } };
      upgWrap.appendChild(btn); upgRows.push({ u: u, btn: btn });
    });
    root.appendChild(upgWrap);
  }

  var banner = el('div'); banner.style.cssText = 'position:fixed;inset:0;display:none;place-items:center;background:rgba(0,0,0,.6);font-size:24px;text-align:center';
  root.appendChild(banner);
  document.body.appendChild(root);

  function applyUpgrade(u) {
    var apply = function (i) { if (u.effect.kind === 'rate') rateMult[i] *= u.effect.mul; else costMult[i] *= u.effect.mul; };
    if (u.effect.target === 'all') { for (var i = 0; i < gens.length; i++) apply(i); }
    else { var k = idx(u.effect.target); if (k >= 0) apply(k); }
  }

  function refresh() {
    amountEl.textContent = (cur.symbol || '') + ' ' + fmt(amount) + ' ' + (cur.name || '');
    goalEl.textContent = win.mode === 'reach' ? ('Goal: ' + fmt(win.amount) + ' ' + (cur.name || '')) : ('Rate: ' + fmt(totalRate()) + '/s');
    for (var i = 0; i < gens.length; i++) {
      var c = genCost(i);
      genRows[i].textContent = gens[i].name + '  ×' + owned[i] + '   ·  cost ' + fmt(c) + '   ·  +' + (gens[i].baseRate * rateMult[i]).toFixed(1) + '/s';
      genRows[i].disabled = amount < c; genRows[i].style.opacity = amount < c ? '.5' : '1';
    }
    for (var j = 0; j < upgRows.length; j++) {
      var ur = upgRows[j];
      ur.btn.textContent = (bought[ur.u.id] ? '✓ ' : '') + ur.u.label + '  ·  ' + fmt(ur.u.cost);
      ur.btn.disabled = bought[ur.u.id] || amount < ur.u.cost; ur.btn.style.opacity = (bought[ur.u.id] || amount < ur.u.cost) ? '.5' : '1';
    }
    if (!won && win.mode === 'reach' && amount >= win.amount) { won = true; banner.textContent = '🎉 You reached ' + fmt(win.amount) + ' ' + (cur.name || '') + '!'; banner.style.display = 'grid'; }
  }

  refresh();
  setInterval(function () { amount += totalRate() * 0.1; refresh(); }, 100);
})();
`;
