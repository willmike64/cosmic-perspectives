/* Cosmic Perspectives — "Emergence" hero animation
   A 10-second repeating cycle: a stellar nursery beside a spiral galaxy releases stardust,
   the dust gathers into a human form, consciousness ignites, and the form becomes light.
   Pure canvas; no dependencies. Respects prefers-reduced-motion. */
(function () {
  var root = document.querySelector('[data-emergence]');
  if (!root) return;
  var canvas = root.querySelector('canvas');
  var ctx = canvas.getContext('2d');
  var caps = root.querySelectorAll('[data-cap]');
  var LOOP = 10000;                       // ms
  var IMG_W = 1774, IMG_H = 887;          // backdrop native size (scene coordinates)
  var GAL = { x: 0.19 * IMG_W, y: 0.47 * IMG_H, r: 0.175 * IMG_W };
  var FIG = { x: 0.5 * IMG_W, y: 0.53 * IMG_H, h: 0.62 * IMG_H };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- backdrop + rotating galaxy layer ----------
  var bg = new Image();
  var small = window.innerWidth < 700;
  bg.src = root.getAttribute(small ? 'data-src-sm' : 'data-src');
  var galLayer = null;
  function buildGalaxyLayer() {
    var s = bg.naturalWidth / IMG_W;
    var R = Math.round(GAL.r * s), D = R * 2;
    var c = document.createElement('canvas'); c.width = c.height = D;
    var g = c.getContext('2d');
    g.drawImage(bg, GAL.x * s - R, GAL.y * s - R, D, D, 0, 0, D, D);
    g.globalCompositeOperation = 'destination-in';
    var m = g.createRadialGradient(R, R, R * 0.55, R, R, R);
    m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = m; g.fillRect(0, 0, D, D);
    galLayer = c;
  }

  // ---------- sprites ----------
  function sprite(r, stops) {
    var c = document.createElement('canvas'); c.width = c.height = r * 2;
    var g = c.getContext('2d'), gr = g.createRadialGradient(r, r, 0, r, r, r);
    stops.forEach(function (s) { gr.addColorStop(s[0], s[1]); });
    g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2); return c;
  }
  var SPR = {
    gold: sprite(16, [[0, 'rgba(255,240,200,1)'], [0.25, 'rgba(240,195,110,.55)'], [1, 'rgba(212,170,90,0)']]),
    teal: sprite(16, [[0, 'rgba(220,255,250,1)'], [0.25, 'rgba(110,210,195,.5)'], [1, 'rgba(77,184,168,0)']]),
    rose: sprite(16, [[0, 'rgba(255,225,230,1)'], [0.25, 'rgba(235,140,160,.5)'], [1, 'rgba(220,110,140,0)']]),
    white: sprite(16, [[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,248,230,.6)'], [1, 'rgba(255,240,210,0)']]),
    glow: sprite(128, [[0, 'rgba(255,250,235,1)'], [0.12, 'rgba(255,232,180,.85)'], [0.35, 'rgba(240,190,110,.32)'], [1, 'rgba(212,170,90,0)']])
  };
  var hue = [SPR.teal, SPR.rose, SPR.gold, SPR.white];

  // ---------- human form: sample points from a drawn silhouette ----------
  var figGlow = null;
  function figurePoints(n) {
    var W = 240, H = 340, c = document.createElement('canvas'); c.width = W; c.height = H;
    var g = c.getContext('2d'); g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineCap = 'round'; g.lineJoin = 'round';
    function poly(pts) { g.beginPath(); g.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); g.fill(); }
    function limb(x1, y1, x2, y2, w1, w2) {   // tapered limb
      var a = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2, c1 = Math.cos(a), s1 = Math.sin(a);
      poly([x1 + c1 * w1, y1 + s1 * w1, x2 + c1 * w2, y2 + s1 * w2, x2 - c1 * w2, y2 - s1 * w2, x1 - c1 * w1, y1 - s1 * w1]);
      g.beginPath(); g.arc(x1, y1, w1, 0, 6.2832); g.fill(); g.beginPath(); g.arc(x2, y2, w2, 0, 6.2832); g.fill();
    }
    g.beginPath(); g.ellipse(120, 40, 15, 19, 0, 0, 6.2832); g.fill();               // head
    limb(120, 56, 120, 70, 6, 7);                                                     // neck
    g.beginPath(); g.moveTo(96, 78); g.bezierCurveTo(108, 70, 132, 70, 144, 78);      // shoulders → torso → hips
    g.bezierCurveTo(141, 110, 134, 132, 134, 150); g.bezierCurveTo(140, 168, 140, 180, 136, 190);
    g.lineTo(104, 190); g.bezierCurveTo(100, 180, 100, 168, 106, 150); g.bezierCurveTo(106, 132, 99, 110, 96, 78); g.fill();
    limb(100, 82, 64, 56, 7.5, 5.5); limb(64, 56, 34, 22, 5.5, 4);                    // left arm, open and lifted
    limb(140, 82, 176, 56, 7.5, 5.5); limb(176, 56, 206, 22, 5.5, 4);                 // right arm
    g.beginPath(); g.ellipse(31, 18, 4.5, 6, -0.6, 0, 6.2832); g.fill();              // open hands
    g.beginPath(); g.ellipse(209, 18, 4.5, 6, 0.6, 0, 6.2832); g.fill();
    limb(112, 186, 108, 258, 10, 6.5); limb(108, 258, 106, 326, 6.5, 4.5);            // legs
    limb(128, 186, 132, 258, 10, 6.5); limb(132, 258, 134, 326, 6.5, 4.5);
    var d = g.getImageData(0, 0, W, H).data, inside = [], edge = [];
    for (var y = 1; y < H - 1; y += 1) for (var x = 1; x < W - 1; x += 1) {
      var k = (y * W + x) * 4 + 3; if (d[k] < 128) continue;
      if (d[k - 4] < 128 || d[k + 4] < 128 || d[k - W * 4] < 128 || d[k + W * 4] < 128) edge.push([x, y]); else inside.push([x, y]);
    }
    // soft luminous body behind the dust
    var gc = document.createElement('canvas'); gc.width = W + 80; gc.height = H + 80;
    var gg = gc.getContext('2d'); gg.filter = 'blur(9px)'; gg.drawImage(c, 40, 40);
    gg.filter = 'none'; gg.globalCompositeOperation = 'source-in'; gg.fillStyle = 'rgba(255,214,140,1)'; gg.fillRect(0, 0, gc.width, gc.height);
    figGlow = { c: gc, w: (W + 80) / H * FIG.h, h: (H + 80) / H * FIG.h };
    var pts = [];
    for (var i = 0; i < n; i++) {
      var src = (Math.random() < 0.45 ? edge : inside), p = src[(Math.random() * src.length) | 0];
      pts.push({ x: FIG.x + (p[0] - W / 2 + Math.random() - .5) / H * FIG.h, y: FIG.y + (p[1] - H / 2 + Math.random() - .5) / H * FIG.h });
    }
    return pts;
  }

  // ---------- particles ----------
  var N = small ? 1100 : 2100, P = [];
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function nurserySpawn() {   // weighted toward the bright pillars on the right
    var x = rnd(0.68, 0.97) * IMG_W, y = rnd(0.12, 0.9) * IMG_H;
    return { x: x, y: y };
  }
  function build() {
    var targets = figurePoints(N);
    P = targets.map(function (t, i) {
      var s = Math.random() < 0.82 ? nurserySpawn() : { x: GAL.x + Math.cos(i) * GAL.r * rnd(0.2, 0.9), y: GAL.y + Math.sin(i) * GAL.r * rnd(0.2, 0.9) };
      var mx = (s.x + t.x) / 2, my = (s.y + t.y) / 2, dx = t.x - s.x, dy = t.y - s.y;
      var bend = rnd(0.25, 0.6) * (Math.random() < 0.5 ? -1 : 1);
      var ang = Math.atan2(t.y - FIG.y, t.x - FIG.x) + rnd(-0.35, 0.35);
      var toGal = Math.random() < 0.28;
      var far = rnd(0.35, 0.95) * IMG_W;
      return {
        s: s, t: t, c: { x: mx - dy * bend, y: my + dx * bend },
        e: toGal ? { x: GAL.x + rnd(-0.5, 0.5) * GAL.r, y: GAL.y + rnd(-0.5, 0.5) * GAL.r }
                 : { x: FIG.x + Math.cos(ang) * far, y: FIG.y + Math.sin(ang) * far * 0.7 },
        d: rnd(0, 0.14), size: rnd(0.6, 1.6), spr: hue[(Math.random() * 3) | 0], ph: rnd(0, 6.28)
      };
    });
  }
  var ignitions = []; for (var k = 0; k < 9; k++) ignitions.push({ x: rnd(0.7, 0.95) * IMG_W, y: rnd(0.15, 0.8) * IMG_H, at: rnd(0.0, 0.3), s: rnd(0.6, 1.2) });

  // ---------- easing ----------
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(v) { v = clamp(v); return v * v * (3 - 2 * v); }
  function easeOut(v) { v = clamp(v); return 1 - Math.pow(1 - v, 3); }
  function band(t, a, b, c, d) { return t < a || t > d ? 0 : t < b ? (t - a) / (b - a) : t <= c ? 1 : (d - t) / (d - c); }

  // ---------- layout ----------
  var W = 0, H = 0, dpr = 1, sc = 1, ox = 0, oy = 0;
  function resize() {
    var r = canvas.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    sc = Math.max(W / IMG_W, H / IMG_H);                // cover
    // keep the figure centred; on narrow screens shift so galaxy edge and nursery edge both show
    ox = W / 2 - FIG.x * sc; oy = H / 2 - FIG.y * sc - (W / H < 1.6 ? H * 0.06 : -H * 0.01);
  }
  function X(x) { return ox + x * sc; } function Y(y) { return oy + y * sc; }

  // ---------- frame ----------
  var t0 = performance.now(), last = -1;
  function draw(now, frozenT) {
    var ms = frozenT != null ? frozenT * LOOP : (now - t0) % LOOP, t = ms / LOOP;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#080c14'; ctx.fillRect(0, 0, W, H);
    if (bg.complete && bg.naturalWidth) {
      ctx.drawImage(bg, ox, oy, IMG_W * sc, IMG_H * sc);
      if (galLayer) {   // the galaxy keeps turning, slowly, across cycles
        var rot = -((now - t0) / 1000) * 0.012;
        ctx.save(); ctx.translate(X(GAL.x), Y(GAL.y)); ctx.rotate(frozenT != null ? 0 : rot);
        var gr = GAL.r * sc; ctx.drawImage(galLayer, -gr, -gr, gr * 2, gr * 2); ctx.restore();
      }
    }
    // gentle vignette toward centre stage
    var v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, 'rgba(8,12,20,0)'); v.addColorStop(1, 'rgba(8,12,20,.55)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'lighter';
    // 1. stars ignite in the nursery
    ignitions.forEach(function (g) {
      var a = band(t, g.at, g.at + 0.03, g.at + 0.06, g.at + 0.22) + 0.15 * band(t, 0, 0.05, 0.9, 1);
      if (a <= 0) return; var r = (18 + 30 * g.s) * sc * 2.2 * (0.7 + 0.3 * a);
      ctx.globalAlpha = a * 0.75; ctx.drawImage(SPR.white, X(g.x) - r / 2, Y(g.y) - r / 2, r, r);
    });

    // 2–4. stardust → form → light
    var cx = X(FIG.x), cy = Y(FIG.y), base = Math.max(1, sc * 4.6);
    var body = band(t, 0.4, 0.56, 0.72, 0.8);
    if (body > 0 && figGlow) {
      ctx.globalAlpha = body * (0.32 + 0.12 * Math.sin(now / 300));
      var gw = figGlow.w * sc, gh = figGlow.h * sc; ctx.drawImage(figGlow.c, cx - gw / 2, cy - gh / 2, gw, gh);
    }
    for (var i = 0; i < P.length; i++) {
      var p = P[i], x, y, a, s = p.size * base, spr = p.spr;
      var a0 = 0.04 + p.d, a1 = 0.46 + p.d * 0.6;                 // travel window
      if (t < a1) {
        var u = ease((t - a0) / (a1 - a0)), iu = 1 - u;
        x = iu * iu * p.s.x + 2 * iu * u * p.c.x + u * u * p.t.x;
        y = iu * iu * p.s.y + 2 * iu * u * p.c.y + u * u * p.t.y;
        a = clamp((t - a0) / 0.06) * (0.55 + 0.45 * u);
        s *= 0.8 + 0.4 * (1 - u);
      } else if (t < 0.72) {                                       // the form holds and breathes
        var w = Math.sin(now / 420 + p.ph) * 0.0025 * IMG_H;
        x = p.t.x + w; y = p.t.y + Math.cos(now / 500 + p.ph) * 0.0025 * IMG_H;
        var warm = ease((t - 0.55) / 0.15);
        a = 0.9; spr = warm > 0.5 ? SPR.gold : p.spr; s *= 1 + warm * 0.25;
      } else {                                                     // becomes light, returns to the cosmos
        var b = easeOut((t - 0.72) / (0.97 - 0.72 - p.d * 0.3));
        x = p.t.x + (p.e.x - p.t.x) * b; y = p.t.y + (p.e.y - p.t.y) * b;
        a = (1 - clamp((t - 0.74) / (0.24 - p.d * 0.3))) * 0.95; spr = b < 0.4 ? SPR.white : SPR.gold;
        s *= 1.2 - 0.6 * b;
      }
      if (a <= 0.01) continue;
      ctx.globalAlpha = a * (0.75 + 0.25 * Math.sin(now / 160 + p.ph));
      ctx.drawImage(spr, X(x) - s, Y(y) - s, s * 2, s * 2);
    }

    // consciousness: a spark at the mind, a halo, then the form becomes a star
    var headY = Y(FIG.y - FIG.h * 0.38);
    var spark = band(t, 0.52, 0.6, 0.7, 0.76);
    if (spark > 0) {
      var sr = FIG.h * sc * (0.18 + 0.1 * spark + 0.03 * Math.sin(now / 120));
      ctx.globalAlpha = spark; ctx.drawImage(SPR.glow, cx - sr / 2, headY - sr / 2, sr, sr);
      var ring = clamp((t - 0.56) / 0.16);
      ctx.globalAlpha = spark * (1 - ring) * 0.8; ctx.strokeStyle = 'rgba(255,228,170,1)'; ctx.lineWidth = Math.max(1, sc * 3);
      ctx.beginPath(); ctx.arc(cx, headY, FIG.h * sc * (0.06 + ring * 0.32), 0, 6.2832); ctx.stroke();
    }
    var burst = band(t, 0.68, 0.75, 0.78, 0.95);
    if (burst > 0) {
      var br = FIG.h * sc * (0.6 + 1.6 * ease((t - 0.68) / 0.2));
      ctx.globalAlpha = burst; ctx.drawImage(SPR.glow, cx - br / 2, cy - br / 2 - FIG.h * sc * 0.1, br, br);
      ctx.save(); ctx.translate(cx, cy - FIG.h * sc * 0.1); ctx.rotate(now / 4000);
      ctx.globalAlpha = burst * 0.3; ctx.strokeStyle = 'rgba(255,236,190,1)'; ctx.lineWidth = Math.max(0.6, sc * 1.6);
      for (var q = 0; q < 24; q++) {
        var L = br * (0.55 + 0.35 * ((q * 7) % 5) / 4);
        ctx.rotate(6.2832 / 24); ctx.beginPath(); ctx.moveTo(br * 0.08, 0); ctx.lineTo(L, 0); ctx.stroke();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';

    // captions
    var phase = t < 0.3 ? 0 : t < 0.62 ? 1 : 2;
    if (phase !== last) { caps.forEach(function (c, j) { c.classList.toggle('is-on', j === phase); }); last = phase; }
  }

  var running = false, raf = 0, visible = true;
  function loop(now) { draw(now); raf = requestAnimationFrame(loop); }
  function start() { if (running || reduce || !visible || document.hidden) return; running = true; raf = requestAnimationFrame(loop); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  function init() {
    var rr = root.getBoundingClientRect();
    if (rr.width / Math.max(1, rr.height) < 1.6) { FIG.h = 0.5 * IMG_H; }
    if (bg.naturalWidth) buildGalaxyLayer();
    build(); resize();
    if (reduce) { draw(performance.now(), 0.64); caps.forEach(function (c) { c.classList.add('is-on'); }); root.classList.add('is-still'); return; }
    start();
  }
  bg.onload = function () { buildGalaxyLayer(); if (reduce) draw(performance.now(), 0.64); };
  window.addEventListener('resize', function () { resize(); if (reduce) draw(performance.now(), 0.64); });
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; visible ? start() : stop(); }).observe(root);
  // test hook: render a specific moment (0–1) of the cycle
  window.__emergence = { seek: function (f, n) { stop(); draw(n != null ? n : performance.now(), f); }, play: function () { start(); }, loop: LOOP };
  init();
})();
