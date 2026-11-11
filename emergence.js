/* Cosmic Perspectives — "Emergence" hero animation
   A 14-second repeating cycle: a stellar nursery beside a spiral galaxy releases stardust;
   the dust forms an Earth, then another, then Earths as many as the stars. Stardust beings
   rise from countless Earths; the few who find the light gather into gods of flame, each
   one the artist's own photograph, "Dancing Fire Spirit". Many gods, though far fewer than
   the Earths. They dance, then return to the cosmos as embers.
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
  var earthImg = new Image(); earthImg.crossOrigin = 'anonymous'; earthImg.src = root.getAttribute('data-earth') || 'earth.webp';
  var flameImg = new Image(); flameImg.crossOrigin = 'anonymous'; flameImg.src = root.getAttribute('data-flame') || 'flame-woman.webp';
  var FW = 450, FH = 884;                                   // flame-woman image size
  function flameRect(g) { g = g || GODS[0]; var h = g.h, w = h * FW / FH; return { x: g.x - w / 2, y: g.y - h / 2, w: w, h: h }; }
  var flamePts = null;                                      // bright points of the flame, for the beings to fly to
  function sampleFlame() {
    if (!flameImg.naturalWidth) return;
    var w = 150, h = Math.round(150 * FH / FW), c = document.createElement('canvas'); c.width = w; c.height = h;
    var g = c.getContext('2d'); g.drawImage(flameImg, 0, 0, w, h);
    var pts = [];
    try {
      var d = g.getImageData(0, 0, w, h).data;
      for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { var k = (y * w + x) * 4; if (d[k + 3] > 150 && d[k] > 200) pts.push([x / w, y / h]); }
    } catch (err) { pts = []; }
    if (!pts.length) for (var f = 0; f < 600; f++) { var v = Math.random(); pts.push([0.5 + (Math.random() - 0.5) * 0.4 * (0.4 + v), 0.12 + v * 0.8]); }   // fallback: a flame-shaped column
    flamePts = pts; assignFlameTargets();
  }

  // ---------- the gods of flame: as many as find the light — many, yet far fewer than the Earths ----------
  // x, y fractions of the scene; h = height as a fraction of scene height; t = moment of ignition
  var GODS = [
    { x: 0.5, y: 0.5, h: 0.8, t: 0.6, flip: false },
    { x: 0.2, y: 0.28, h: 0.24, t: 0.585, flip: true },
    { x: 0.83, y: 0.24, h: 0.2, t: 0.6, flip: false },
    { x: 0.79, y: 0.77, h: 0.26, t: 0.615, flip: true },
    { x: 0.22, y: 0.78, h: 0.2, t: 0.625, flip: false },
    { x: 0.64, y: 0.13, h: 0.11, t: 0.635, flip: true },
    { x: 0.08, y: 0.52, h: 0.13, t: 0.645, flip: false },
    { x: 0.36, y: 0.12, h: 0.09, t: 0.65, flip: true },
    { x: 0.94, y: 0.5, h: 0.12, t: 0.655, flip: true }
  ].map(function (g, i) { return { x: g.x * IMG_W, y: g.y * IMG_H, h: g.h * IMG_H, t: g.t, flip: g.flip, ph: i * 1.9 }; });
  function nearestGod(x, y) {   // the light a being is drawn toward: close and bright wins
    var best = 0, bd = 1e9;
    for (var i = 0; i < GODS.length; i++) { var g = GODS[i], d = Math.hypot(g.x - x, (g.y - y) * 1.4) / Math.sqrt(g.h); if (d < bd) { bd = d; best = i; } }
    return best;
  }
  function insideGod(x, y) { for (var i = 0; i < GODS.length; i++) { var r = flameRect(GODS[i]); if (x > r.x + r.w * 0.1 && x < r.x + r.w * 0.9 && y > r.y && y < r.y + r.h) return i; } return -1; }

  // ---------- the Earths: a few near ones, then a field as many as the stars ----------
  var HERO = [
    { x: 0.31, y: 0.42, r: 0.075, t: 0.12, n: 3 },
    { x: 0.69, y: 0.6, r: 0.06, t: 0.2, n: 3 },
    { x: 0.37, y: 0.74, r: 0.034, t: 0.27, n: 2 }, { x: 0.6, y: 0.27, r: 0.03, t: 0.28, n: 2 },
    { x: 0.7, y: 0.36, r: 0.032, t: 0.29, n: 2 }, { x: 0.33, y: 0.2, r: 0.026, t: 0.3, n: 1 },
    { x: 0.62, y: 0.82, r: 0.028, t: 0.31, n: 1 }, { x: 0.13, y: 0.38, r: 0.026, t: 0.31, n: 1 },
    { x: 0.88, y: 0.63, r: 0.026, t: 0.32, n: 1 }
  ].map(function (e) { return { x: e.x * IMG_W, y: e.y * IMG_H, r: e.r * IMG_H, t: e.t, n: e.n, rot: Math.random() * 6.28 }; });
  var NF = small ? 1200 : 2200, FIELD = [];
  for (var fi = 0; fi < NF; fi++) {
    var fx = Math.random() * IMG_W, fy = Math.random() * IMG_H, rr0 = Math.random();
    FIELD.push({ x: fx, y: fy, r: IMG_H * (0.0011 + 0.0075 * Math.pow(rr0, 4)), t: 0.27 + 0.2 * Math.pow(Math.random(), 0.7), rot: Math.random() * 6.28, tw: Math.random() * 6.28, god: -1 });
  }
  FIELD.forEach(function (e) { e.inside = insideGod(e.x, e.y); });
  HERO.forEach(function (e) { e.inside = insideGod(e.x, e.y); });
  var earthSmall = null;                                     // a pre-shrunk Earth for the star field
  function buildEarthSmall() { var c = document.createElement('canvas'); c.width = c.height = 32; c.getContext('2d').drawImage(earthImg, 0, 0, 32, 32); earthSmall = c; }

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
    for (var y = 2; y < H; y += 3) for (var x = 2; x < W; x += 3) if (d[(y * W + x) * 4 + 3] > 128) SIL.push([(x - 120) / 310, (y - 330) / 310]);
  })();

  // ---------- particles ----------
  var N = small ? 700 : 1300, PER = small ? 30 : 48, P = [], B = [], SP = [];
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function nurserySpawn() { return { x: rnd(0.68, 0.97) * IMG_W, y: rnd(0.12, 0.9) * IMG_H }; }
  function build() {
    // stardust → the near Earths
    var wsum = 0; HERO.forEach(function (e) { wsum += e.r * e.r; });
    P = [];
    for (var i = 0; i < N; i++) {
      var pick = Math.random() * wsum, ei = 0; while (pick > HERO[ei].r * HERO[ei].r && ei < HERO.length - 1) { pick -= HERO[ei].r * HERO[ei].r; ei++; }
      var e = HERO[ei], s = Math.random() < 0.8 ? nurserySpawn() : { x: GAL.x + Math.cos(i) * GAL.r * rnd(0.2, 0.9), y: GAL.y + Math.sin(i) * GAL.r * rnd(0.2, 0.9) };
      var ang = rnd(0, 6.28), rr = Math.sqrt(Math.random()) * e.r, tx = e.x + Math.cos(ang) * rr, ty = e.y + Math.sin(ang) * rr;
      var bend = rnd(0.2, 0.55) * (Math.random() < 0.5 ? -1 : 1), mx = (s.x + tx) / 2, my = (s.y + ty) / 2;
      P.push({ s: s, t: { x: tx, y: ty }, c: { x: mx - (ty - s.y) * bend, y: my + (tx - s.x) * bend }, e: e, d: rnd(0, 0.05), size: rnd(0.6, 1.5), spr: hue[(Math.random() * 3) | 0], ph: rnd(0, 6.28) });
    }
    // stardust beings on the near Earths; each is drawn toward its nearest light
    B = [];
    HERO.forEach(function (e) {
      for (var j = 0; j < e.n; j++) {
        var ang = -Math.PI / 2 + (e.n === 1 ? 0 : (j - (e.n - 1) / 2) * 0.62), h = Math.max(e.r * 1.15, 0.034 * IMG_H);
        var being = { e: e, ang: ang, h: h, pop: e.t + 0.1 + j * 0.035 + rnd(0, 0.02), go: rnd(0.55, 0.6), god: nearestGod(e.x, e.y - e.r), pts: [] };
        for (var q = 0; q < PER; q++) {
          var sp = SIL[(Math.random() * SIL.length) | 0];
          being.pts.push({ u: sp[0] + rnd(-0.01, 0.01), v: sp[1], f: null, bend: rnd(-0.5, 0.5), lag: rnd(0, 0.05), size: rnd(0.7, 1.4), ph: rnd(0, 6.28),
                           spr: Math.random() < 0.5 ? SPR.white : SPR.gold, rise: { x: rnd(-0.18, 0.18) * IMG_W, y: -rnd(0.2, 0.6) * IMG_H, gal: Math.random() < 0.2 } });
        }
        B.push(being);
      }
    });
    // sparks of consciousness rising from the far Earths: many rise; some find the light
    SP = [];
    FIELD.forEach(function (e) {
      if (Math.random() > (small ? 0.3 : 0.25)) return;
      var finds = Math.random() < 0.3;
      SP.push({ e: e, pop: e.t + rnd(0.05, 0.14), lift: rnd(0.012, 0.03) * IMG_H, finds: finds, god: nearestGod(e.x, e.y), go: rnd(0.54, 0.62), f: null,
                bend: rnd(-0.6, 0.6), ph: rnd(0, 6.28), size: rnd(0.6, 1.2), rise: { x: rnd(-0.1, 0.1) * IMG_W, y: -rnd(0.15, 0.45) * IMG_H } });
    });
    // every god gathers its own beings
    assignFlameTargets();
  }
  function assignFlameTargets() {
    if (!flamePts) return;
    function pick() { return flamePts[(Math.random() * flamePts.length) | 0]; }
    B.forEach(function (b) { b.pts.forEach(function (p) { p.f = pick(); }); });
    SP.forEach(function (p) { p.f = pick(); });
  }
  function godPoint(gi, f, flip) { var r = flameRect(GODS[gi]), u = flip ? 1 - f[0] : f[0]; return { x: r.x + u * r.w, y: r.y + f[1] * r.h }; }
  function beingPos(b, p) {
    var ca = Math.cos(b.ang + Math.PI / 2), sa = Math.sin(b.ang + Math.PI / 2);
    var fx = b.e.x + Math.cos(b.ang) * b.e.r * 0.98, fy = b.e.y + Math.sin(b.ang) * b.e.r * 0.98;
    var lx = p.u * b.h, ly = p.v * b.h;
    return { x: fx + lx * ca - ly * sa, y: fy + lx * sa + ly * ca };
  }
  var ignitions = []; for (var k = 0; k < 9; k++) ignitions.push({ x: rnd(0.7, 0.95) * IMG_W, y: rnd(0.15, 0.8) * IMG_H, at: rnd(0.0, 0.2), s: rnd(0.6, 1.2) });

  // ---------- easing ----------
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(v) { v = clamp(v); return v * v * (3 - 2 * v); }
  function easeOut(v) { v = clamp(v); return 1 - Math.pow(1 - v, 3); }
  function band(t, a, b, c, d) { return t < a || t > d ? 0 : t < b ? (t - a) / (b - a) : t <= c ? 1 : (d - t) / (d - c); }
  function godAlpha(g, t) { return band(t, g.t - 0.02, g.t + 0.08, 0.86, 0.97); }

  // ---------- layout ----------
  var W = 0, H = 0, dpr = 1, sc = 1, ox = 0, oy = 0;
  function resize() {
    var r = canvas.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    sc = Math.max(W / IMG_W, H / IMG_H);
    ox = W / 2 - FIG.x * sc; oy = H / 2 - FIG.y * sc;
  }
  function X(x) { return ox + x * sc; } function Y(y) { return oy + y * sc; }

  // a god of flame, drawn from the photograph in seamless one-pixel-exact slices so she sways and dances
  var warp = document.createElement('canvas'), wctx = warp.getContext('2d'), PAD = 40;
  warp.width = FW + PAD * 2; warp.height = FH;
  // distant gods: their dance is baked once into a strip of small frames, so nine gods cost almost nothing per frame
  var QS = 0.25, NQ = 32, QW = Math.round((FW + PAD * 2) * QS), QH = Math.round(FH * QS), atlas = null;
  function buildAtlas() {
    var fq = document.createElement('canvas'); fq.width = Math.round(FW * QS); fq.height = QH; fq.getContext('2d').drawImage(flameImg, 0, 0, fq.width, fq.height);
    atlas = document.createElement('canvas'); atlas.width = QW * 8; atlas.height = QH * (NQ / 8); var a = atlas.getContext('2d'), S = 24, sh = QH / S;
    for (var f = 0; f < NQ; f++) {
      var ph = f / NQ * Math.PI * 2;
      for (var i = 0; i < S; i++) {
        var y0 = Math.round(i * sh), y1 = Math.round((i + 1) * sh), hgt = 1 - i / S;
        var off = (Math.sin(ph + i * 0.45) + 0.5 * Math.sin(ph * 2 + i * 1.05)) * 7 * QS * 0.85 * (0.3 + hgt);
        a.drawImage(fq, 0, y0, fq.width, y1 - y0, (f % 8) * QW + PAD * QS + off, Math.floor(f / 8) * QH + y0, fq.width, y1 - y0);
      }
    }
  }
  function drawGod(g, alpha, sec, energy) {
    if (!flameImg.naturalWidth || alpha <= 0) return;
    var r = flameRect(g), dh = r.h * sc; if (dh < 6) return;
    var big = g.h > 0.5, t2 = sec + g.ph;
    if (big) {
      var S = 68, sh = FH / S;
      wctx.clearRect(0, 0, warp.width, warp.height);
      for (var i = 0; i < S; i++) {
        var y0 = Math.round(i * sh), y1 = Math.round((i + 1) * sh), hgt = 1 - i / S;
        var off = (Math.sin(t2 * 3.2 + i * 0.16) + 0.5 * Math.sin(t2 * 5.1 + i * 0.37)) * 7 * energy * (0.3 + hgt);
        wctx.drawImage(flameImg, 0, y0, FW, y1 - y0, PAD + off, y0, FW, y1 - y0);
      }
    } else if (!atlas) buildAtlas();
    var fr = big ? 0 : ((Math.floor((t2 / 1.9) * NQ) % NQ) + NQ) % NQ;
    function blit() { if (big) ctx.drawImage(warp, -dw / 2, -dh * flick, dw, dh * flick); else ctx.drawImage(atlas, (fr % 8) * QW, Math.floor(fr / 8) * QH, QW, QH, -dw / 2, -dh * flick, dw, dh * flick); }
    var dw = r.w * sc * (FW + PAD * 2) / FW, lean = Math.sin(t2 * 1.3) * 0.03 * energy, flick = 1 + 0.02 * Math.sin(t2 * 7) * energy;
    ctx.save(); ctx.translate(X(g.x), Y(r.y) + dh); ctx.rotate(lean); if (g.flip) ctx.scale(-1, 1);
    var hr = dh * (0.95 + 0.05 * Math.sin(t2 * 6));
    ctx.globalCompositeOperation = 'lighter'; if (big || !lite) { ctx.globalAlpha = alpha * 0.4; ctx.drawImage(SPR.fglow, -hr / 2, -dh / 2 - hr / 2, hr, hr); }
    if (big) { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = alpha * 0.6; blit(); }
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = alpha * ((big ? 0.62 : 0.95) + 0.1 * Math.sin(t2 * 9)); blit();
    ctx.restore();
  }

  // ---------- frame ----------
  // timeline (fraction of the 14 s loop):
  //   0.00–0.47 stardust forms an Earth, another, then Earths as many as the stars
  //   0.22–0.56 stardust beings rise on the Earths · 0.54–0.70 those who find the light stream to the gods
  //   0.58–0.88 the gods of flame ignite and dance · 0.86–0.99 embers return to the cosmos
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
    if (!earthSmall && earthImg.naturalWidth) buildEarthSmall();

    var GA = GODS.map(function (g) { return godAlpha(g, t); });
    var energy = 0.4 + 0.6 * ease((t - 0.62) / 0.1), allA = band(t, 0.58, 0.68, 0.86, 0.97);

    // 1. stars ignite in the nursery
    ctx.globalCompositeOperation = 'lighter';
    ignitions.forEach(function (g) {
      var a = band(t, g.at, g.at + 0.03, g.at + 0.06, g.at + 0.2) + 0.15 * band(t, 0, 0.05, 0.9, 1);
      if (a <= 0) return; var r = (18 + 30 * g.s) * sc * 2.2 * (0.7 + 0.3 * a);
      ctx.globalAlpha = a * 0.75; ctx.drawImage(SPR.white, X(g.x) - r / 2, Y(g.y) - r / 2, r, r);
    });

    // 2. Earths as many as the stars — twinkling on, wave after wave
    if (earthSmall) {
      for (var fi = 0; fi < FIELD.length; fi += lite ? 2 : 1) {
        var e = FIELD[fi], a = band(t, e.t - 0.01, e.t + 0.03, 0.86, 0.97) * (e.inside >= 0 ? 1 - 0.85 * GA[e.inside] : 1 - 0.3 * allA);
        if (a <= 0) continue;
        var r = e.r * sc, tw = 0.65 + 0.35 * Math.sin(sec * 2.3 + e.tw);
        if (r < 1.6) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * 0.55 * tw; ctx.drawImage(SPR.teal, X(e.x) - 2.2, Y(e.y) - 2.2, 4.4, 4.4); continue; }
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * 0.28 * tw; var gr2 = r * 2.4; ctx.drawImage(SPR.teal, X(e.x) - gr2, Y(e.y) - gr2, gr2 * 2, gr2 * 2);
        { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = a * (0.75 + 0.25 * tw); ctx.drawImage(earthSmall, X(e.x) - r, Y(e.y) - r, r * 2, r * 2); }
      }
    }
    // the near Earths emerge — glow, flash, then the planet itself
    HERO.forEach(function (e) {
      var a = band(t, e.t - 0.02, e.t + 0.05, 0.84, 0.96) * (e.inside >= 0 ? 1 - 0.85 * GA[e.inside] : 1 - 0.4 * allA);
      if (a <= 0) return;
      var grow = 0.55 + 0.45 * easeOut((t - e.t + 0.02) / 0.08), r = e.r * sc * grow;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a * 0.55; var ar = r * 2.6; ctx.drawImage(SPR.teal, X(e.x) - ar, Y(e.y) - ar, ar * 2, ar * 2);
      var fl = band(t, e.t - 0.02, e.t, e.t + 0.01, e.t + 0.06);
      if (fl > 0) { ctx.globalAlpha = fl; var fr0 = r * 3; ctx.drawImage(SPR.white, X(e.x) - fr0, Y(e.y) - fr0, fr0 * 2, fr0 * 2); }
      if (earthImg.naturalWidth) {
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = a;
        ctx.save(); ctx.translate(X(e.x), Y(e.y)); ctx.rotate(e.rot + sec * 0.03); ctx.drawImage(earthImg, -r, -r, r * 2, r * 2); ctx.restore();
      }
    });

    // 3. stardust flows in and becomes the near Earths
    ctx.globalCompositeOperation = 'lighter';
    var base = Math.max(1, sc * 4.6);
    for (var i = 0; i < P.length; i++) {
      var p = P[i], a0 = Math.max(0.01, p.e.t - 0.13) + p.d, a1 = p.e.t + p.d * 0.4;
      if (t < a0 || t > a1 + 0.05) continue;
      var u = ease((t - a0) / (a1 - a0)), iu = 1 - u, s = p.size * base * (0.8 + 0.4 * iu);
      var x = iu * iu * p.s.x + 2 * iu * u * p.c.x + u * u * p.t.x, y = iu * iu * p.s.y + 2 * iu * u * p.c.y + u * u * p.t.y;
      var a2 = clamp((t - a0) / 0.03) * (t > a1 ? 1 - (t - a1) / 0.05 : 1);
      ctx.globalAlpha = a2 * (0.75 + 0.25 * Math.sin(now / 160 + p.ph));
      ctx.drawImage(p.spr, X(x) - s, Y(y) - s, s * 2, s * 2);
    }

    // 4. the gods of flame — each one the photograph — ignite as their beings arrive (far ones first)
    for (var gi = GODS.length - 1; gi >= 0; gi--) drawGod(GODS[gi], GA[gi], sec, energy);

    // 5. sparks from the far Earths: many rise; those who find the light stream to a god
    ctx.globalCompositeOperation = 'lighter';
    var ssz = Math.max(0.7, sc * 2.4);
    for (var si = 0; si < SP.length; si++) {
      var q = SP[si], pp = clamp((t - q.pop) / 0.03);
      if (pp <= 0) continue;
      var bx0 = q.e.x, by0 = q.e.y - q.e.r - q.lift * ease(pp), sx, sy, sa, ss = q.size * ssz, sspr = SPR.white;
      var tg = q.f ? godPoint(q.god, q.f, GODS[q.god].flip) : { x: GODS[q.god].x, y: GODS[q.god].y };
      if (!q.finds) {                                        // rises, glows, and settles back to its Earth
        sx = bx0 + Math.sin(sec * 2 + q.ph) * 0.002 * IMG_H; sy = by0; sa = pp * band(t, q.pop, q.pop + 0.03, 0.72, 0.86) * 0.7; sspr = SPR.gold;
      } else if (t < q.go) { sx = bx0; sy = by0; sa = pp * 0.9; }
      else if (t < q.go + 0.1) {
        var g3 = ease((t - q.go) / 0.1), ig3 = 1 - g3, cx3 = (bx0 + tg.x) / 2 - (tg.y - by0) * q.bend * 0.5, cy3 = (by0 + tg.y) / 2 + (tg.x - bx0) * q.bend * 0.5;
        sx = ig3 * ig3 * bx0 + 2 * ig3 * g3 * cx3 + g3 * g3 * tg.x; sy = ig3 * ig3 * by0 + 2 * ig3 * g3 * cy3 + g3 * g3 * tg.y; sa = 0.9; sspr = g3 > 0.7 ? SPR.flame : SPR.white;
      } else if (t < 0.86) { sx = tg.x; sy = tg.y - ((sec * 0.6 + q.ph) % 1) * 0.008 * IMG_H; sa = 0.55; sspr = SPR.flame; }
      else { var rb2 = easeOut((t - 0.86) / 0.12); sx = tg.x + q.rise.x * rb2; sy = tg.y + q.rise.y * rb2; sa = (1 - clamp((t - 0.88) / 0.1)) * 0.8; sspr = SPR.ember; }
      if (sa <= 0.01) continue;
      ctx.globalAlpha = sa * (0.75 + 0.25 * Math.sin(now / 160 + q.ph));
      ctx.drawImage(sspr, X(sx) - ss, Y(sy) - ss, ss * 2, ss * 2);
    }

    // 6. stardust beings on the near Earths pop up, then stream to the light nearest them
    var bsz = Math.max(0.8, sc * 3.2);
    for (var bi = 0; bi < B.length; bi++) {
      var b = B[bi], pop = clamp((t - b.pop) / 0.03), gd = GODS[b.god];
      if (pop <= 0) continue;
      var bounce = pop < 1 ? 0.6 + 0.6 * Math.sin(pop * Math.PI * 0.85) : 1;
      for (var qi = 0; qi < b.pts.length; qi++) {
        var bp = b.pts[qi], pos = beingPos(b, bp), bx, by, ba, bs = bp.size * bsz, spr = bp.spr;
        var sx2 = b.e.x + (pos.x - b.e.x) * bounce, sy2 = b.e.y + (pos.y - b.e.y) * bounce;
        var go0 = b.go + bp.lag, go1 = go0 + 0.1;
        var tp = bp.f ? godPoint(b.god, bp.f, gd.flip) : { x: gd.x, y: gd.y };
        var tgx = tp.x + Math.sin(sec * 3 + bp.ph) * 0.004 * gd.h, tgy = tp.y + Math.cos(sec * 2.6 + bp.ph) * 0.004 * gd.h - ((sec * 0.6 + bp.ph) % 1) * 0.012 * gd.h;
        if (t < go0) { bx = sx2 + Math.sin(now / 420 + bp.ph) * 0.0012 * IMG_H; by = sy2 + Math.cos(now / 500 + bp.ph) * 0.0012 * IMG_H; ba = pop * 0.95; }
        else if (t < go1) {
          var g2 = ease((t - go0) / (go1 - go0)), ig = 1 - g2;
          var cxp = (sx2 + tgx) / 2 - (tgy - sy2) * bp.bend * 0.6, cyp = (sy2 + tgy) / 2 + (tgx - sx2) * bp.bend * 0.6 - 0.1 * IMG_H;
          bx = ig * ig * sx2 + 2 * ig * g2 * cxp + g2 * g2 * tgx; by = ig * ig * sy2 + 2 * ig * g2 * cyp + g2 * g2 * tgy;
          ba = 0.95; bs *= 1 + 0.4 * Math.sin(g2 * Math.PI); spr = g2 > 0.7 ? SPR.flame : spr;
        } else if (t < 0.86) { bx = tgx; by = tgy; ba = 0.6; spr = bp.ph > 3.5 ? SPR.flame : SPR.ember; }
        else {
          var rb = easeOut((t - 0.86) / (0.12 - bp.lag)), ex = bp.rise.gal ? GAL.x : tgx + bp.rise.x, ey = bp.rise.gal ? GAL.y : tgy + bp.rise.y;
          bx = tgx + (ex - tgx) * rb + Math.sin(sec * 3 + bp.ph) * 6 * rb; by = tgy + (ey - tgy) * rb;
          ba = (1 - clamp((t - 0.88) / 0.1)) * 0.9; spr = rb < 0.3 ? SPR.flame : SPR.ember; bs *= 1.1 - 0.5 * rb;
        }
        if (ba <= 0.01) continue;
        ctx.globalAlpha = ba * (0.75 + 0.25 * Math.sin(now / 160 + bp.ph));
        ctx.drawImage(spr, X(bx) - bs, Y(by) - bs, bs * 2, bs * 2);
      }
      var spk = band(t, b.pop + 0.01, b.pop + 0.03, b.pop + 0.05, b.pop + 0.12);
      if (spk > 0) { var hp = beingPos(b, { u: 0, v: -0.9 }), sr = b.h * sc * 0.9; ctx.globalAlpha = spk * 0.9; ctx.drawImage(SPR.glow, X(hp.x) - sr / 2, Y(hp.y) - sr / 2, sr, sr); }
    }
    // a flash as each god ignites
    for (var gj = 0; gj < GODS.length; gj++) {
      var g4 = GODS[gj], fl4 = band(t, g4.t + 0.03, g4.t + 0.06, g4.t + 0.07, g4.t + 0.14);
      if (fl4 > 0) { var br = g4.h * sc * (0.6 + 0.6 * ease((t - g4.t - 0.03) / 0.1)); ctx.globalAlpha = fl4 * 0.6; ctx.drawImage(SPR.fglow, X(g4.x) - br / 2, Y(g4.y) - br / 2, br, br); }
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';

    // captions
    var phase = t < 0.24 ? 0 : t < 0.58 ? 1 : 2;
    if (phase !== last) { caps.forEach(function (c, j) { c.classList.toggle('is-on', j === phase); }); last = phase; }
  }

  var running = false, raf = 0, visible = true;
  // slow devices: if frames run long, draw every other far Earth and drop the distant gods' halos
  var lite = false, ema = 16, prevNow = 0;
  function loop(now) { if (prevNow) { ema = ema * 0.95 + Math.min(100, now - prevNow) * 0.05; if (!lite && ema > 30) lite = true; } prevNow = now; draw(now); raf = requestAnimationFrame(loop); }
  function start() { if (running || reduce || !visible || document.hidden) return; running = true; raf = requestAnimationFrame(loop); }
  function stop() { running = false; prevNow = 0; cancelAnimationFrame(raf); }
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
