/**
 * Generic wave-survival runtime (vanilla canvas, zero deps → keeps the build self-contained).
 * Reads `window.__SPEC__` (a WaveSurvivalSpec) and runs the whole game from it: the game is DATA,
 * not code. Generating a game for this sub-genre is therefore free deterministic codegen — no model
 * tokens (docs/05). Escalation formulas mirror the spec's `waves.escalation` multipliers.
 *
 * Exported as a string so the adapter can inline it into a single HTML file. Plain ES5-ish JS so it
 * runs everywhere (TikTok webview, Telegram, etc.) without a transpile step.
 */
export const RUNTIME_JS = String.raw`
(function () {
  var spec = (window.__SPEC__) || {};
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var W = 0, H = 0;
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  window.addEventListener('resize', resize); resize();

  var pal = (spec.theme && spec.theme.palette) || ['#6db36b', '#f4d35e', '#8d5a2b'];
  var BG = '#0c0c12', FG = pal[1] || '#ffffff', ENEMY = pal[0] || '#e0457b', PLAYER = pal[1] || '#67e8f9';

  var ps = spec.player || {};
  var baseHp = ps.hp || 100, baseDmg = ps.damage || 10, baseSpeed = (ps.speed || 3) * 60, baseFire = ps.fireRate || 4;
  var enemiesSpec = (spec.enemies && spec.enemies.length) ? spec.enemies : [{ id: 'e', hp: 20, speed: 1.5, damage: 5, spawnWeight: 1 }];
  var esc = (spec.waves && spec.waves.escalation) || { hpMul: 1.1, speedMul: 1.05, countMul: 1.2 };
  var waveCfg = spec.waves || { intervalSec: 8, baseCount: 5 };
  var upgrades = (spec.upgrades && spec.upgrades.length) ? spec.upgrades : [];
  var winCfg = spec.win || { mode: 'endless' };

  var player = { x: 0, y: 0, hp: baseHp, maxHp: baseHp, speed: baseSpeed, fireRate: baseFire, damage: baseDmg, r: 14 };
  var enemies = [], bullets = [];
  var wave = 0, kills = 0, time = 0, fireCd = 0, waveGap = 0, msg = '', msgT = 0, state = 'play';
  var keys = {}, pointer = null;

  function powN(b, e) { return Math.pow(b, e); }
  function pickEnemy() {
    var total = 0, i;
    for (i = 0; i < enemiesSpec.length; i++) total += (enemiesSpec[i].spawnWeight || 1);
    var r = Math.random() * total;
    for (i = 0; i < enemiesSpec.length; i++) { r -= (enemiesSpec[i].spawnWeight || 1); if (r <= 0) return enemiesSpec[i]; }
    return enemiesSpec[0];
  }
  function spawnWave() {
    wave++;
    var count = Math.max(1, Math.round((waveCfg.baseCount || 5) * powN(esc.countMul || 1, wave - 1)));
    for (var i = 0; i < count; i++) {
      var t = pickEnemy();
      var ang = Math.random() * Math.PI * 2, dist = Math.max(W, H) * 0.6;
      enemies.push({
        x: player.x + Math.cos(ang) * dist,
        y: player.y + Math.sin(ang) * dist,
        hp: (t.hp || 20) * powN(esc.hpMul || 1, wave - 1),
        speed: (t.speed || 1.5) * 60 * powN(esc.speedMul || 1, wave - 1),
        dmg: t.damage || 5, r: 12, hit: 0
      });
    }
    msg = 'Wave ' + wave; msgT = 1.2;
  }
  function applyUpgrade() {
    if (!upgrades.length) return;
    var u = upgrades[Math.floor(Math.random() * upgrades.length)];
    var e = u.effect || {}, m = e.mul || 1;
    if (e.stat === 'playerDamage') player.damage *= m;
    else if (e.stat === 'playerSpeed') player.speed *= m;
    else if (e.stat === 'fireRate') player.fireRate *= m;
    else if (e.stat === 'playerHp') { player.maxHp *= m; player.hp = Math.min(player.maxHp, player.hp * m); }
    msg = u.label || 'Upgrade!'; msgT = 1.4;
  }
  function restart() {
    enemies = []; bullets = []; wave = 0; kills = 0; time = 0; fireCd = 0; waveGap = 0;
    player.hp = player.maxHp = baseHp; player.damage = baseDmg; player.speed = baseSpeed; player.fireRate = baseFire;
    player.x = W / 2; player.y = H / 2; state = 'play'; spawnWave();
  }

  window.addEventListener('keydown', function (e) { keys[e.key.toLowerCase()] = true; if (state !== 'play') restart(); });
  window.addEventListener('keyup', function (e) { keys[e.key.toLowerCase()] = false; });
  function setPointer(e) { var t = e.touches ? e.touches[0] : e; pointer = { x: t.clientX, y: t.clientY }; }
  canvas.addEventListener('mousemove', setPointer);
  canvas.addEventListener('mousedown', function (e) { if (state !== 'play') { restart(); return; } setPointer(e); });
  canvas.addEventListener('touchstart', function (e) { if (state !== 'play') { restart(); return; } setPointer(e); e.preventDefault(); }, { passive: false });
  canvas.addEventListener('touchmove', function (e) { setPointer(e); e.preventDefault(); }, { passive: false });

  function nearest() {
    var best = null, bd = Infinity;
    for (var i = 0; i < enemies.length; i++) {
      var dx = enemies[i].x - player.x, dy = enemies[i].y - player.y, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = enemies[i]; }
    }
    return best;
  }
  function update(dt) {
    time += dt;
    var mx = 0, my = 0;
    if (keys['a'] || keys['arrowleft']) mx -= 1;
    if (keys['d'] || keys['arrowright']) mx += 1;
    if (keys['w'] || keys['arrowup']) my -= 1;
    if (keys['s'] || keys['arrowdown']) my += 1;
    if (mx === 0 && my === 0 && pointer) {
      var pdx = pointer.x - player.x, pdy = pointer.y - player.y, pd = Math.hypot(pdx, pdy);
      if (pd > 4) { mx = pdx / pd; my = pdy / pd; }
    }
    var ml = Math.hypot(mx, my) || 1;
    player.x += (mx / ml) * player.speed * dt;
    player.y += (my / ml) * player.speed * dt;
    player.x = Math.max(player.r, Math.min(W - player.r, player.x));
    player.y = Math.max(player.r, Math.min(H - player.r, player.y));

    fireCd -= dt;
    if (fireCd <= 0) {
      var tgt = nearest();
      if (tgt) {
        var a = Math.atan2(tgt.y - player.y, tgt.x - player.x);
        bullets.push({ x: player.x, y: player.y, vx: Math.cos(a) * 480, vy: Math.sin(a) * 480, life: 1.6 });
        fireCd = 1 / Math.max(0.1, player.fireRate);
      }
    }
    for (var i = bullets.length - 1; i >= 0; i--) {
      var b = bullets[i]; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.life <= 0) { bullets.splice(i, 1); continue; }
      for (var j = enemies.length - 1; j >= 0; j--) {
        var en = enemies[j];
        if (Math.hypot(en.x - b.x, en.y - b.y) < en.r + 3) {
          en.hp -= player.damage; bullets.splice(i, 1);
          if (en.hp <= 0) { enemies.splice(j, 1); kills++; }
          break;
        }
      }
    }
    for (var k = 0; k < enemies.length; k++) {
      var e = enemies[k], ex = player.x - e.x, ey = player.y - e.y, ed = Math.hypot(ex, ey) || 1;
      e.x += (ex / ed) * e.speed * dt; e.y += (ey / ed) * e.speed * dt; e.hit -= dt;
      if (ed < e.r + player.r && e.hit <= 0) { player.hp -= e.dmg; e.hit = 0.5; }
    }
    if (player.hp <= 0) { state = 'lose'; msg = 'Game Over - tap / key to retry'; return; }
    if (enemies.length === 0) {
      waveGap += dt;
      if (waveGap >= 0.8) { waveGap = 0; if (wave > 0) applyUpgrade(); spawnWave(); }
    }
    if (winCfg.mode === 'survive' && time >= (winCfg.seconds || 60)) { state = 'win'; msg = 'You survived! - tap to play again'; }
    if (msgT > 0) msgT -= dt;
  }
  function circle(x, y, r, c) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); }
  function draw() {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    for (var i = 0; i < bullets.length; i++) circle(bullets[i].x, bullets[i].y, 3, FG);
    for (var k = 0; k < enemies.length; k++) circle(enemies[k].x, enemies[k].y, enemies[k].r, ENEMY);
    circle(player.x, player.y, player.r, PLAYER);
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(8, 8, 190, 60);
    ctx.fillStyle = '#fff'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
    ctx.fillText('HP ' + Math.max(0, Math.round(player.hp)) + ' / ' + Math.round(player.maxHp), 16, 26);
    ctx.fillText('Wave ' + wave + '    Kills ' + kills, 16, 42);
    ctx.fillText('Time ' + time.toFixed(0) + 's', 16, 58);
    var bw = 200; ctx.fillStyle = '#333'; ctx.fillRect(W / 2 - bw / 2, 12, bw, 8);
    ctx.fillStyle = '#e0457b'; ctx.fillRect(W / 2 - bw / 2, 12, bw * Math.max(0, player.hp) / player.maxHp, 8);
    if (msgT > 0 || state !== 'play') {
      ctx.fillStyle = '#fff'; ctx.font = '24px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(msg, W / 2, H / 2);
    }
  }
  var last = (window.performance && performance.now()) || Date.now();
  function frame(t) {
    var dt = Math.min(0.05, (t - last) / 1000); last = t;
    if (state === 'play') update(dt);
    draw();
    requestAnimationFrame(frame);
  }
  restart();
  requestAnimationFrame(frame);
})();
`;
