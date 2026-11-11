/* Cosmic Perspectives — "Emergence" hero animation
   A 14-second repeating cycle: a stellar nursery beside a spiral galaxy releases stardust;
   the dust forms an Earth, then another, then Earths all across the cosmos. Stardust beings
   pop up on every Earth, then all of them rise and stream into the flame woman (the artist's
   own photograph, "Dancing Fire Spirit"), who dances and returns to the cosmos as embers.
   Pure canvas; no dependencies. Respects prefers-reduced-motion. */
(function () {
  var root = document.querySelector('[data-emergence]');
  if (!root) return;
  var canvas = root.querySelector('canvas');
  var ctx = canvas.getContext('2d');
  var caps = root.querySelectorAll('[data-cap]');
  var LOOP = 14000;                       // ms
  var IMG_W = 1774, IMG_H = 887;          // backdrop native size (scene coordinates)
  var GAL = { x: 0.19 * IMG_W, y: 0.47 * IMG_H, r: 0.175 * IMG_W };
  var FIG = { x: 0.5 * IMG_W, y: 0.5 * IMG_H, h: 0.86 * IMG_H };     // the flame woman's frame
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
    flame: sprite(16, [[0, 'rgba(255,248,215,1)'], [0.25, 'rgba(255,170,60,.6)'], [1, 'rgba(240,90,20,0)']]),
    ember: sprite(16, [[0, 'rgba(255,220,150,1)'], [0.3, 'rgba(245,110,30,.55)'], [1, 'rgba(200,50,10,0)']]),
    fglow: sprite(128, [[0, 'rgba(255,230,170,.9)'], [0.18, 'rgba(255,150,50,.55)'], [0.5, 'rgba(220,80,20,.18)'], [1, 'rgba(160,40,10,0)']]),
    smoke: sprite(64, [[0, 'rgba(120,96,80,.35)'], [0.5, 'rgba(90,72,62,.14)'], [1, 'rgba(60,50,45,0)']]),
    glow: sprite(128, [[0, 'rgba(255,250,235,1)'], [0.12, 'rgba(255,232,180,.85)'], [0.35, 'rgba(240,190,110,.32)'], [1, 'rgba(212,170,90,0)']])
  };
  var hue = [SPR.teal, SPR.rose, SPR.gold, SPR.white];

  // ---------- photographs: Earth (NASA, Apollo 17) and the flame woman (the artist's photo) ----------
  var earthImg = new Image(); earthImg.src = root.getAttribute('data-earth') || 'earth.webp';
  var flameImg = new Image(); flameImg.src = root.getAttribute('data-flame') || 'flame-woman.webp';
  var FW = 450, FH = 884;                                   // flame-woman image size
  function flameRect() { var h = FIG.h, w = h * FW / FH; return { x: FIG.x - w / 2, y: FIG.y - h / 2, w: w, h: h }; }
  var flamePts = null;                                      // bright points of the flame, for the beings to fly to
  function sampleFlame() {
    if (!flameImg.naturalWidth) return;
    var w = 150, h = Math.round(150 * FH / FW), c = document.createElement('canvas'); c.width = w; c.height = h;
    var g = c.getContext('2d'); g.drawImage(flameImg, 0, 0, w, h);
    var d = g.getImageData(0, 0, w, h).data, pts = [];
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { var k = (y * w + x) * 4; if (d[k + 3] > 150 && d[k] > 200) pts.push([x / w, y / h]); }
    flamePts = pts; assignFlameTargets();
  }

  // ---------- the Earths ----------
  // x, y as fractions of the scene; r as a fraction of scene height; t = moment it emerges
  var EARTHS = [
    { x: 0.31, y: 0.42, r: 0.085, t: 0.12, n: 3 },
    { x: 0.69, y: 0.6, r: 0.07, t: 0.22, n: 3 },
    { x: 0.27, y: 0.74, r: 0.045, t: 0.29, n: 2 }, { x: 0.585, y: 0.24, r: 0.04, t: 0.31, n: 2 },
    { x: 0.76, y: 0.3, r: 0.048, t: 0.32, n: 2 }, { x: 0.8, y: 0.76, r: 0.042, t: 0.34, n: 2 },
    { x: 0.4, y: 0.86, r: 0.038, t: 0.35, n: 1 }, { x: 0.61, y: 0.84, r: 0.034, t: 0.36, n: 1 },
    { x: 0.37, y: 0.14, r: 0.032, t: 0.37, n: 1 }, { x: 0.68, y: 0.12, r: 0.03, t: 0.38, n: 1 },
    { x: 0.14, y: 0.22, r: 0.034, t: 0.39, n: 1 }, { x: 0.9, y: 0.5, r: 0.036, t: 0.39, n: 1 },
    { x: 0.2, y: 0.55, r: 0.03, t: 0.4, n: 1 }, { x: 0.86, y: 0.16, r: 0.028, t: 0.41, n: 1 },
    { x: 0.1, y: 0.82, r: 0.03, t: 0.41, n: 1 }
  ].map(function (e) { return { x: e.x * IMG_W, y: e.y * IMG_H, r: e.r * IMG_H, t: e.t, n: e.n, rot: Math.random() * 6.28 }; });

  // ---------- stardust being: a tiny human form sampled from a drawn silhouette ----------
  var SIL = [];
  (function () {
    var W = 240, H = 340, c = document.createElement('canvas'); c.width = W; c.height = H;
    var g = c.getContext('2d'); g.fillStyle = '#fff';
    function poly(pts) { g.beginPath(); g.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); g.fill(); }
    function limb(x1, y1, x2, y2, w1, w2) {
      var a = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2, c1 = Math.cos(a), s1 = Math.sin(a);
      poly([x1 + c1 * w1, y1 + s1 * w1, x2 + c1 * w2, y2 + s1 * w2, x2 - c1 * w2, y2 - s1 * w2, x1 - c1 * w1, y1 - s1 * w1]);
      g.beginPath(); g.arc(x1, y1, w1, 0, 6.2832); g.fill(); g.beginPath(); g.arc(x2, y2, w2, 0, 6.2832); g.fill();
    }
    g.beginPath(); g.ellipse(120, 40, 17, 21, 0, 0, 6.2832); g.fill();
    limb(120, 56, 120, 70, 7, 8);
    g.beginPath(); g.moveTo(96, 78); g.bezierCurveTo(108, 70, 132, 70, 144, 78);
    g.bezierCurveTo(141, 110, 134, 132, 134, 150); g.bezierCurveTo(140, 168, 140, 180, 136, 190);
    g.lineTo(104, 190); g.bezierCurveTo(100, 180, 100, 168, 106, 150); g.bezierCurveTo(106, 132, 99, 110, 96, 78); g.fill();
    limb(100, 82, 64, 56, 9, 7); limb(64, 56, 34, 22, 7, 5);
    limb(140, 82, 176, 56, 9, 7); limb(176, 56, 206, 22, 7, 5);
    limb(112, 186, 108, 258, 12, 8); limb(108, 258, 106, 326, 8, 6);
    limb(128, 186, 132, 258, 12, 8); limb(132, 258, 134, 326, 8, 6);
    var d = g.getImageData(0, 0, W, H).data;
    for (var y = 2; y < H; y += 3) for (var x = 2; x < W; x += 3) if (d[(y * W + x) * 4 + 3] > 128) SIL.push([(x - 120) / 310, (y - 330) / 310]);   // feet at 0, height 1
  })();

  // ---------- particles ----------
  var N = small ? 900 : 1700, PER = small ? 34 : 56, P = [], B = [];
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function nurserySpawn() { return { x: rnd(0.68, 0.97) * IMG_W, y: rnd(0.12, 0.9) * IMG_H }; }
  function build() {
    // stardust → Earths (weighted toward the larger Earths)
    var wsum = 0; EARTHS.forEach(function (e) { wsum += e.r * e.r; });
    P = [];
    for (var i = 0; i < N; i++) {
      var pick = Math.random() * wsum, ei = 0; while (pick > EARTHS[ei].r * EARTHS[ei].r && ei < EARTHS.length - 1) { pick -= EARTHS[ei].r * EARTHS[ei].r; ei++; }
      var e = EARTHS[ei], s = Math.random() < 0.8 ? nurserySpawn() : { x: GAL.x + Math.cos(i) * GAL.r * rnd(0.2, 0.9), y: GAL.y + Math.sin(i) * GAL.r * rnd(0.2, 0.9) };
      var ang = rnd(0, 6.28), rr = Math.sqrt(Math.random()) * e.r, tx = e.x + Math.cos(ang) * rr, ty = e.y + Math.sin(ang) * rr;
      var bend = rnd(0.2, 0.55) * (Math.random() < 0.5 ? -1 : 1), mx = (s.x + tx) / 2, my = (s.y + ty) / 2;
      P.push({ s: s, t: { x: tx, y: ty }, c: { x: mx - (ty - s.y) * bend, y: my + (tx - s.x) * bend }, e: e, d: rnd(0, 0.05), size: rnd(0.6, 1.5), spr: hue[(Math.random() * 3) | 0], ph: rnd(0, 6.28) });
    }
    // stardust beings standing on each Earth, facing out from it
    B = [];
    EARTHS.forEach(function (e, ei) {
      for (var j = 0; j < e.n; j++) {
        var ang = -Math.PI / 2 + (e.n === 1 ? 0 : (j - (e.n - 1) / 2) * 0.62), h = Math.max(e.r * 1.1, 0.036 * IMG_H);
        var being = { e: e, ang: ang, h: h, pop: e.t + 0.1 + j * 0.035 + rnd(0, 0.02), go: rnd(0.55, 0.6), pts: [] };
        for (var q = 0; q < PER; q++) {
          var sp = SIL[(Math.random() * SIL.length) | 0];
          being.pts.push({ u: sp[0] + rnd(-0.01, 0.01), v: sp[1], f: null, bend: rnd(-0.5, 0.5), lag: rnd(0, 0.05), size: rnd(0.7, 1.4), ph: rnd(0, 6.28),
                           spr: Math.random() < 0.5 ? SPR.white : SPR.gold, rise: { x: rnd(-0.18, 0.18) * IMG_W, y: -rnd(0.2, 0.6) * IMG_H, gal: Math.random() < 0.2 } });
        }
        B.push(being);
      }
    });
    assignFlameTargets();
  }
  function assignFlameTargets() {
    if (!flamePts || !B.length) return;
    B.forEach(function (b) { b.pts.forEach(function (p) { p.f = flamePts[(Math.random() * flamePts.length) | 0]; }); });
  }
  function beingPos(b, p) {   // a point of a being, standing on its Earth's surface
    var ca = Math.cos(b.ang + Math.PI / 2), sa = Math.sin(b.ang + Math.PI / 2);
    var fx = b.e.x + Math.cos(b.ang) * b.e.r * 0.98, fy = b.e.y + Math.sin(b.ang) * b.e.r * 0.98;
    var lx = p.u * b.h, ly = p.v * b.h;
    return { x: fx + lx * ca - ly * sa, y: fy + lx * sa + ly * ca, hx: fx + Math.cos(b.ang) * b.h * 0.9, hy: fy + Math.sin(b.ang) * b.h * 0.9 };
  }
  var ignitions = []; for (var k = 0; k < 9; k++) ignitions.push({ x: rnd(0.7, 0.95) * IMG_W, y: rnd(0.15, 0.8) * IMG_H, at: rnd(0.0, 0.2), s: rnd(0.6, 1.2) });

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
    sc = Math.max(W / IMG_W, H / IMG_H);
    ox = W / 2 - FIG.x * sc; oy = H / 2 - FIG.y * sc;
  }
  function X(x) { return ox + x * sc; } function Y(y) { return oy + y * sc; }

  // the flame woman, drawn from the photograph: each frame the photo is re-laid in seamless
  // one-pixel-exact horizontal slices on an offscreen canvas, so she sways and dances
  var warp = document.createElement('canvas'), wctx = warp.getContext('2d'), PAD = 40;
  warp.width = FW + PAD * 2; warp.height = FH;
  function drawFlameWoman(alpha, sec, energy) {
    if (!flameImg.naturalWidth || alpha <= 0) return;
    wctx.clearRect(0, 0, warp.width, warp.height);
    var S = 68, sh = FH / S;
    for (var i = 0; i < S; i++) {
      var y0 = Math.round(i * sh), y1 = Math.round((i + 1) * sh), hgt = 1 - i / S;
      var off = (Math.sin(sec * 3.2 + i * 0.16) + 0.5 * Math.sin(sec * 5.1 + i * 0.37)) * 7 * energy * (0.3 + hgt);
      wctx.drawImage(flameImg, 0, y0, FW, y1 - y0, PAD + off, y0, FW, y1 - y0);
    }
    var r = flameRect(), dw = r.w * sc * (FW + PAD * 2) / FW, dh = r.h * sc, lean = Math.sin(sec * 1.3) * 0.03 * energy;
    ctx.save(); ctx.translate(X(FIG.x), Y(r.y) + dh); ctx.rotate(lean);
    var flick = 1 + 0.02 * Math.sin(sec * 7) * energy;
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = alpha * 0.6;
    ctx.drawImage(warp, -dw / 2, -dh * flick, dw, dh * flick);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = alpha * (0.62 + 0.1 * Math.sin(sec * 9));
    ctx.drawImage(warp, -dw / 2, -dh * flick, dw, dh * flick);
    ctx.restore();
  }

  // ---------- frame ----------
  // timeline (fraction of the 14 s loop):
  //   0.00–0.42 stardust forms Earth, then another, then Earths everywhere
  //   0.22–0.55 stardust beings pop up on every Earth · 0.55–0.70 they all stream to the flame woman
  //   0.62–0.88 the flame woman dances · 0.86–0.99 embers return to the cosmos
  var t0 = performance.now(), last = -1;
  function draw(now, frozenT) {
    var ms = frozenT != null ? frozenT * LOOP : (now - t0) % LOOP, t = ms / LOOP, sec = now / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.fillStyle = '#080c14'; ctx.fillRect(0, 0, W, H);
    if (bg.complete && bg.naturalWidth) {
      ctx.drawImage(bg, ox, oy, IMG_W * sc, IMG_H * sc);
      if (galLayer) {
        var rot = -((now - t0) / 1000) * 0.012;
        ctx.save(); ctx.translate(X(GAL.x), Y(GAL.y)); ctx.rotate(frozenT != null ? 0 : rot);
        var gr = GAL.r * sc; ctx.drawImage(galLayer, -gr, -gr, gr * 2, gr * 2); ctx.restore();
      }
    }
    var v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, 'rgba(8,12,20,0)'); v.addColorStop(1, 'rgba(8,12,20,.55)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);

    var flameA = band(t, 0.58, 0.7, 0.86, 0.97), energy = 0.4 + 0.6 * ease((t - 0.62) / 0.1);

    // 1. stars ignite in the nursery
    ctx.globalCompositeOperation = 'lighter';
    ignitions.forEach(function (g) {
      var a = band(t, g.at, g.at + 0.03, g.at + 0.06, g.at + 0.2) + 0.15 * band(t, 0, 0.05, 0.9, 1);
      if (a <= 0) return; var r = (18 + 30 * g.s) * sc * 2.2 * (0.7 + 0.3 * a);
      ctx.globalAlpha = a * 0.75; ctx.drawImage(SPR.white, X(g.x) - r / 2, Y(g.y) - r / 2, r, r);
    });

    // 2. the Earths emerge — glow, flash, then the planet itself
    EARTHS.forEach(function (e) {
      var behind = Math.abs(e.x - FIG.x) < 0.13 * IMG_W ? 0.85 : 0.4, a = band(t, e.t - 0.02, e.t + 0.05, 0.84, 0.96) * (1 - behind * flameA);
      if (a <= 0) return;
      var grow = 0.55 + 0.45 * easeOut((t - e.t + 0.02) / 0.08), r = e.r * sc * grow;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a * 0.55; var ar = r * 2.6; ctx.drawImage(SPR.teal, X(e.x) - ar, Y(e.y) - ar, ar * 2, ar * 2);
      var fl = band(t, e.t - 0.02, e.t, e.t + 0.01, e.t + 0.06);
      if (fl > 0) { ctx.globalAlpha = fl; var fr = r * 3; ctx.drawImage(SPR.white, X(e.x) - fr, Y(e.y) - fr, fr * 2, fr * 2); }
      if (earthImg.naturalWidth) {
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = a;
        ctx.save(); ctx.translate(X(e.x), Y(e.y)); ctx.rotate(e.rot + sec * 0.03); ctx.drawImage(earthImg, -r, -r, r * 2, r * 2); ctx.restore();
      }
    });

    // 3. stardust flows in and becomes each Earth
    ctx.globalCompositeOperation = 'lighter';
    var base = Math.max(1, sc * 4.6);
    for (var i = 0; i < P.length; i++) {
      var p = P[i], a0 = Math.max(0.01, p.e.t - 0.13) + p.d, a1 = p.e.t + p.d * 0.4;
      if (t < a0 || t > a1 + 0.05) continue;
      var u = ease((t - a0) / (a1 - a0)), iu = 1 - u, s = p.size * base * (0.8 + 0.4 * iu);
      var x = iu * iu * p.s.x + 2 * iu * u * p.c.x + u * u * p.t.x, y = iu * iu * p.s.y + 2 * iu * u * p.c.y + u * u * p.t.y;
      var a = clamp((t - a0) / 0.03) * (t > a1 ? 1 - (t - a1) / 0.05 : 1);
      ctx.globalAlpha = a * (0.75 + 0.25 * Math.sin(now / 160 + p.ph));
      ctx.drawImage(p.spr, X(x) - s, Y(y) - s, s * 2, s * 2);
    }

    // 4. the flame woman (the photograph) rises as the beings arrive
    if (flameA > 0) {
      var hr = FIG.h * sc * (0.95 + 0.05 * Math.sin(sec * 6));
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = flameA * 0.4;
      ctx.drawImage(SPR.fglow, X(FIG.x) - hr / 2, Y(FIG.y) - hr / 2, hr, hr);
      drawFlameWoman(flameA, sec, energy);
    }

    // 5. stardust beings: pop up on every Earth, then all stream into the flame woman
    ctx.globalCompositeOperation = 'lighter';
    var fr = flameRect(), bsz = Math.max(0.8, sc * 3.2);
    for (var bi = 0; bi < B.length; bi++) {
      var b = B[bi], pop = clamp((t - b.pop) / 0.03);
      if (pop <= 0) continue;
      var bounce = pop < 1 ? 0.6 + 0.6 * Math.sin(pop * Math.PI * 0.85) : 1;
      for (var q = 0; q < b.pts.length; q++) {
        var bp = b.pts[q], pos = beingPos(b, bp), bx, by, ba, bs = bp.size * bsz, spr = bp.spr;
        var sx = b.e.x + (pos.x - b.e.x) * bounce, sy = b.e.y + (pos.y - b.e.y) * bounce;
        var go0 = b.go + bp.lag, go1 = go0 + 0.1;
        var tgx = bp.f ? fr.x + bp.f[0] * fr.w : FIG.x, tgy = bp.f ? fr.y + bp.f[1] * fr.h : FIG.y;
        tgx += Math.sin(sec * 3 + bp.ph) * 0.004 * IMG_H; tgy += Math.cos(sec * 2.6 + bp.ph) * 0.004 * IMG_H - ((sec * 0.6 + bp.ph) % 1) * 0.01 * IMG_H;
        if (t < go0) {                                    // standing on the Earth, shimmering
          bx = sx + Math.sin(now / 420 + bp.ph) * 0.0012 * IMG_H; by = sy + Math.cos(now / 500 + bp.ph) * 0.0012 * IMG_H; ba = pop * 0.95;
        } else if (t < go1) {                             // rising and streaming to the flame woman
          var g2 = ease((t - go0) / (go1 - go0)), ig = 1 - g2;
          var cxp = (sx + tgx) / 2 - (tgy - sy) * bp.bend * 0.6, cyp = (sy + tgy) / 2 + (tgx - sx) * bp.bend * 0.6 - 0.12 * IMG_H;
          bx = ig * ig * sx + 2 * ig * g2 * cxp + g2 * g2 * tgx; by = ig * ig * sy + 2 * ig * g2 * cyp + g2 * g2 * tgy;
          ba = 0.95; bs *= 1 + 0.4 * Math.sin(g2 * Math.PI); spr = g2 > 0.7 ? SPR.flame : spr;
        } else if (t < 0.86) {                            // part of the flame now
          bx = tgx; by = tgy; ba = 0.75 * (1 - 0.4 * flameA) + 0.2; spr = bp.ph > 3.5 ? SPR.flame : SPR.ember;
        } else {                                          // embers return to the cosmos
          var rb = easeOut((t - 0.86) / (0.12 - bp.lag)), ex = bp.rise.gal ? GAL.x : tgx + bp.rise.x, ey = bp.rise.gal ? GAL.y : tgy + bp.rise.y;
          bx = tgx + (ex - tgx) * rb + Math.sin(sec * 3 + bp.ph) * 6 * rb; by = tgy + (ey - tgy) * rb;
          ba = (1 - clamp((t - 0.88) / 0.1)) * 0.9; spr = rb < 0.3 ? SPR.flame : SPR.ember; bs *= 1.1 - 0.5 * rb;
        }
        if (ba <= 0.01) continue;
        ctx.globalAlpha = ba * (0.75 + 0.25 * Math.sin(now / 160 + bp.ph));
        ctx.drawImage(spr, X(bx) - bs, Y(by) - bs, bs * 2, bs * 2);
      }
      // consciousness: a spark at each being's head as it appears
      var sp = band(t, b.pop + 0.01, b.pop + 0.03, b.pop + 0.05, b.pop + 0.12);
      if (sp > 0) { var hp = beingPos(b, { u: 0, v: -0.9 }), sr = b.h * sc * 0.9; ctx.globalAlpha = sp * 0.9; ctx.drawImage(SPR.glow, X(hp.x) - sr / 2, Y(hp.y) - sr / 2, sr, sr); }
    }
    // the flash as the last beings arrive
    var flash = band(t, 0.64, 0.67, 0.68, 0.76);
    if (flash > 0) { var br = FIG.h * sc * (0.6 + 0.6 * ease((t - 0.64) / 0.1)); ctx.globalAlpha = flash * 0.6; ctx.drawImage(SPR.fglow, X(FIG.x) - br / 2, Y(FIG.y) - br / 2, br, br); }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';

    // captions
    var phase = t < 0.24 ? 0 : t < 0.58 ? 1 : 2;
    if (phase !== last) { caps.forEach(function (c, j) { c.classList.toggle('is-on', j === phase); }); last = phase; }
  }

  var running = false, raf = 0, visible = true;
  function loop(now) { draw(now); raf = requestAnimationFrame(loop); }
  function start() { if (running || reduce || !visible || document.hidden) return; running = true; raf = requestAnimationFrame(loop); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  function init() {
    var rr = root.getBoundingClientRect();
    if (bg.naturalWidth) buildGalaxyLayer();
    build(); resize(); if (flameImg.naturalWidth) sampleFlame();
    if (reduce) { draw(performance.now(), 0.76); caps.forEach(function (c) { c.classList.add('is-on'); }); root.classList.add('is-still'); return; }
    start();
  }
  flameImg.onload = function () { sampleFlame(); };
  bg.onload = function () { buildGalaxyLayer(); if (reduce) draw(performance.now(), 0.76); };
  window.addEventListener('resize', function () { resize(); if (reduce) draw(performance.now(), 0.76); });
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; visible ? start() : stop(); }).observe(root);
  // test hook: render a specific moment (0–1) of the cycle
  window.__emergence = { seek: function (f, n) { stop(); draw(n != null ? n : performance.now(), f); }, play: function () { start(); }, loop: LOOP };
  init();
})();
