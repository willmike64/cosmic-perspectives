/* Cosmic Perspectives — "Emergence" hero animation
   A 10-second repeating cycle: a stellar nursery beside a spiral galaxy releases stardust,
   the dust gathers into a human form, consciousness ignites, the form catches fire and
   becomes a dancing fire spirit, and the spirit scatters as embers back into the cosmos.
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
    flame: sprite(16, [[0, 'rgba(255,248,215,1)'], [0.25, 'rgba(255,170,60,.6)'], [1, 'rgba(240,90,20,0)']]),
    ember: sprite(16, [[0, 'rgba(255,220,150,1)'], [0.3, 'rgba(245,110,30,.55)'], [1, 'rgba(200,50,10,0)']]),
    fglow: sprite(128, [[0, 'rgba(255,230,170,.9)'], [0.18, 'rgba(255,150,50,.55)'], [0.5, 'rgba(220,80,20,.18)'], [1, 'rgba(160,40,10,0)']]),
    smoke: sprite(64, [[0, 'rgba(120,96,80,.35)'], [0.5, 'rgba(90,72,62,.14)'], [1, 'rgba(60,50,45,0)']]),
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

  // ---------- fire spirit: flowing flame ribbons (figure-local 240×340 space) ----------
  // Modelled on a flame dancer: arms arched overhead into a loop, head tilted back,
  // hair streaming behind, an S-curved body that pours down into the fire bed.
  var RIBBONS = [
    { w: [9, 8, 6, 5, 4.5, 5, 6, 7.5, 9], pts: [106,124, 86,86, 88,44, 108,14, 136,4, 162,20, 170,56, 160,96, 146,118] },   // arms, arched overhead
    { w: [9, 7, 5.5, 4.5, 3.5, 2.5], pts: [112,122, 100,96, 102,62, 118,36, 136,26, 150,34] },                   // inner edge of the arch
    { w: [10, 13, 13, 9], pts: [136,124, 141,104, 140,86, 133,72] },                                             // neck → head, face lifted
    { w: [6, 5, 4, 2.5, 1.2], pts: [132,82, 112,70, 88,76, 68,96, 60,122] },                                    // streaming hair
    { w: [15, 14, 12, 15, 18, 15, 14, 18, 26], pts: [140,118, 132,144, 120,172, 122,200, 138,224, 134,252, 122,282, 118,312, 120,344] }, // body S-curve
    { w: [9, 8, 8, 9, 8, 10, 13], pts: [124,128, 110,156, 102,190, 110,222, 98,258, 106,298, 110,344] },          // trailing flame behind the body
    { w: [5, 4, 2.5, 1], pts: [104,130, 80,156, 70,192, 84,224] },                                             // wisp off the shoulder
    { w: [6, 4.5, 3, 1], pts: [144,220, 164,238, 170,266, 154,294] },                                          // wisp off the hip
    { w: [4.5, 3, 0.8], pts: [136,4, 148,-12, 142,-30] }                                                       // flame tip above the hands
  ];
  var SEG = 14;
  function spline(r) {   // Catmull-Rom through the control points, with interpolated widths
    var p = r.pts, n = p.length / 2, out = [];
    for (var i = 0; i < n - 1; i++) {
      var i0 = Math.max(0, i - 1), i2 = i + 1, i3 = Math.min(n - 1, i + 2);
      for (var j = 0; j < SEG; j++) {
        var u = j / SEG, u2 = u * u, u3 = u2 * u;
        function cr(a, b, c, d) { return 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3); }
        out.push({ x: cr(p[i0 * 2], p[i * 2], p[i2 * 2], p[i3 * 2]), y: cr(p[i0 * 2 + 1], p[i * 2 + 1], p[i2 * 2 + 1], p[i3 * 2 + 1]), w: r.w[i] + (r.w[i + 1] - r.w[i]) * u });
      }
    }
    out.push({ x: p[(n - 1) * 2], y: p[(n - 1) * 2 + 1], w: r.w[n - 1] });
    return out;
  }
  var RS = RIBBONS.map(spline);
  var RW = RS.map(function (s) { var L = 0; for (var i = 1; i < s.length; i++) L += Math.hypot(s[i].x - s[i - 1].x, s[i].y - s[i - 1].y) * (s[i].w + 2); return L; });
  var RWsum = RW.reduce(function (a, b) { return a + b; }, 0);
  var live = RS.map(function (s) { return s.map(function () { return { x: 0, y: 0, nx: 0, ny: 0, w: 0 }; }); });
  // animate the ribbons: the flame sways more the higher it climbs, and the whole spirit dances
  function animateSpirit(sec, energy) {
    var lean = Math.sin(sec * 1.25) * 0.07 * energy, bob = Math.sin(sec * 2.5) * 3 * energy;
    var ca = Math.cos(lean), sa = Math.sin(lean);
    for (var r = 0; r < RS.length; r++) {
      var s = RS[r], L = live[r];
      for (var i = 0; i < s.length; i++) {
        var h = clamp((342 - s[i].y) / 360), amp = (1 + 4.2 * h) * energy;
        var dx = amp * (Math.sin(sec * 3.1 + s[i].y * 0.045 + r) + 0.3 * Math.sin(sec * 4.6 + s[i].y * 0.05 + r * 2));
        var dy = amp * 0.35 * Math.sin(sec * 4.1 + s[i].x * 0.07 + r) - bob * h;
        var lx = s[i].x + dx - 120, ly = s[i].y + dy - 342;      // pivot at the fire bed
        L[i].x = 120 + lx * ca - ly * sa; L[i].y = 342 + lx * sa + ly * ca;
        L[i].w = s[i].w * (0.88 + 0.18 * Math.sin(sec * 6 + i * 0.35 + r));
      }
      for (var k = 0; k < L.length; k++) {
        var a = L[Math.max(0, k - 1)], b = L[Math.min(L.length - 1, k + 1)], tx = b.x - a.x, ty = b.y - a.y, tl = Math.hypot(tx, ty) || 1;
        L[k].nx = -ty / tl; L[k].ny = tx / tl;
      }
    }
  }
  function LX(x) { return FIG.x + (x - 120) / 340 * FIG.h; }
  function LY(y) { return FIG.y + (y - 170) / 340 * FIG.h; }
  var FLAMES = [
    [0, 0.6, 'rgba(190,40,10,.13)'], [0, 1.0, 'rgba(255,90,20,.2)'],
    [0, 0.62, 'rgba(255,150,40,.42)'], [0, 0.34, 'rgba(255,215,120,.62)'], [0, 0.13, 'rgba(255,250,225,.9)']
  ];
  var WIDEN = [2.4, 1.6, 1.0, 0.58, 0.26];
  function drawRibbon(L, mult, color) {
    ctx.beginPath();
    for (var i = 0; i < L.length; i++) { var p = L[i], w = p.w * mult; i ? ctx.lineTo(X(LX(p.x + p.nx * w)), Y(LY(p.y + p.ny * w))) : ctx.moveTo(X(LX(p.x + p.nx * w)), Y(LY(p.y + p.ny * w))); }
    for (var j = L.length - 1; j >= 0; j--) { var q = L[j], v = q.w * mult; ctx.lineTo(X(LX(q.x - q.nx * v)), Y(LY(q.y - q.ny * v))); }
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  }
  var TONGUES = []; for (var tq = 0; tq < 15; tq++) TONGUES.push({ x: 62 + tq * 8.5 + (tq % 2) * 3, h: 22 + ((tq * 37) % 5) * 10 + (tq > 4 && tq < 11 ? 18 : 0), w: 10 + (tq % 3) * 4, ph: tq * 1.7 });
  function drawFireBed(sec, a) {
    for (var i = 0; i < TONGUES.length; i++) {
      var f = TONGUES[i], fl = 0.7 + 0.3 * Math.sin(sec * 8 + f.ph), h = f.h * fl, sw = Math.sin(sec * 4 + f.ph) * 6;
      var bx = X(LX(f.x)), by = Y(LY(344)), tx = X(LX(f.x + sw)), ty = Y(LY(344 - h)), hw = f.w / 340 * FIG.h * sc;
      var g = ctx.createLinearGradient(bx, by, tx, ty);
      g.addColorStop(0, 'rgba(255,235,170,' + 0.8 * a + ')'); g.addColorStop(0.45, 'rgba(255,130,30,' + 0.55 * a + ')'); g.addColorStop(1, 'rgba(200,40,10,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(bx - hw, by);
      ctx.quadraticCurveTo(bx - hw * 0.9 + (tx - bx) * 0.4, (by + ty) / 2, tx, ty);
      ctx.quadraticCurveTo(bx + hw * 0.9 + (tx - bx) * 0.4, (by + ty) / 2, bx + hw, by); ctx.closePath(); ctx.fill();
    }
  }
  // particles assigned to a place on a ribbon, so the stardust becomes the flame
  function spiritSlot() {
    var pick = Math.random() * RWsum, r = 0; while (pick > RW[r] && r < RW.length - 1) { pick -= RW[r]; r++; }
    return { r: r, i: (Math.random() * (RS[r].length - 1)) | 0, o: (Math.random() * 2 - 1) * 0.9, rise: rnd(0, 1) };
  }
  function spiritPos(p, sec) {
    var q = live[p.f.r][p.f.i], up = ((sec * 0.9 + p.f.rise) % 1);
    return { x: LX(q.x + q.nx * q.w * p.f.o), y: LY(q.y + q.ny * q.w * p.f.o - up * 7), up: up };
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
      var toGal = Math.random() < 0.25;
      return {
        s: s, t: t, c: { x: mx - dy * bend, y: my + dx * bend }, f: spiritSlot(),
        e: toGal ? { x: GAL.x + rnd(-0.5, 0.5) * GAL.r, y: GAL.y + rnd(-0.5, 0.5) * GAL.r }      // some embers return to the galaxy
                 : { x: rnd(-0.22, 0.22) * IMG_W, y: -rnd(0.25, 0.65) * IMG_H, rel: true },     // the rest rise as embers
        d: rnd(0, 0.14), size: rnd(0.6, 1.6), spr: hue[(Math.random() * 3) | 0], ph: rnd(0, 6.28)
      };
    });
  }
  var ignitions = []; for (var k = 0; k < 9; k++) ignitions.push({ x: rnd(0.7, 0.95) * IMG_W, y: rnd(0.15, 0.8) * IMG_H, at: rnd(0.0, 0.3), s: rnd(0.6, 1.2) });
  var SMOKE = []; for (var sm = 0; sm < 14; sm++) SMOKE.push({ x: rnd(70, 175), ph: rnd(0, 1), s: rnd(0.7, 1.4), dr: rnd(-1, 1) });

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
  // timeline (fraction of the 10 s loop):
  //   0.00–0.46 stardust travels · 0.40–0.60 the human form holds · 0.50–0.62 consciousness sparks
  //   0.58–0.70 the form catches fire · 0.68–0.86 the fire spirit dances · 0.84–0.99 embers return to the cosmos
  var t0 = performance.now(), last = -1;
  function draw(now, frozenT) {
    var ms = frozenT != null ? frozenT * LOOP : (now - t0) % LOOP, t = ms / LOOP, sec = now / 1000;
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

    var cx = X(FIG.x), cy = Y(FIG.y), base = Math.max(1, sc * 4.6);
    var catchFire = ease((t - 0.58) / 0.12);                      // human → flame
    var spirit = band(t, 0.62, 0.7, 0.84, 0.95);                  // ribbon visibility
    var release = clamp((t - 0.84) / 0.13);
    var energy = 0.35 + 0.65 * ease((t - 0.62) / 0.1);
    animateSpirit(sec, energy);

    // smoke drifts up behind the spirit (normal blending, very faint)
    var smokeA = band(t, 0.62, 0.72, 0.9, 1);
    if (smokeA > 0) {
      for (var m = 0; m < SMOKE.length; m++) {
        var sk = SMOKE[m], u = (sec * 0.12 + sk.ph) % 1, sr = (40 + 90 * u) * sk.s / 340 * FIG.h * sc;
        ctx.globalAlpha = smokeA * Math.sin(u * Math.PI) * 0.55;
        ctx.drawImage(SPR.smoke, X(LX(sk.x + sk.dr * 60 * u + Math.sin(sec + sk.ph * 6) * 10)) - sr, Y(LY(300 - 380 * u)) - sr, sr * 2, sr * 2);
      }
    }

    ctx.globalCompositeOperation = 'lighter';
    // 1. stars ignite in the nursery
    ignitions.forEach(function (g) {
      var a = band(t, g.at, g.at + 0.03, g.at + 0.06, g.at + 0.22) + 0.15 * band(t, 0, 0.05, 0.9, 1);
      if (a <= 0) return; var r = (18 + 30 * g.s) * sc * 2.2 * (0.7 + 0.3 * a);
      ctx.globalAlpha = a * 0.75; ctx.drawImage(SPR.white, X(g.x) - r / 2, Y(g.y) - r / 2, r, r);
    });

    // 2. the human form's soft body glow, warming toward fire
    var body = band(t, 0.4, 0.56, 0.62, 0.7);
    if (body > 0 && figGlow) {
      ctx.globalAlpha = body * (0.32 + 0.12 * Math.sin(now / 300));
      var gw = figGlow.w * sc, gh = figGlow.h * sc; ctx.drawImage(figGlow.c, cx - gw / 2, cy - gh / 2, gw, gh);
    }
    // 3. the fire spirit: heat glow, fire bed and flame ribbons
    if (spirit > 0) {
      var hr = FIG.h * sc * (1.05 + 0.06 * Math.sin(sec * 6));
      ctx.globalAlpha = spirit * 0.55; ctx.drawImage(SPR.fglow, cx - hr / 2, Y(LY(150)) - hr / 2, hr, hr);
      ctx.globalAlpha = spirit * 0.7; var hb = FIG.h * sc * 0.75; ctx.drawImage(SPR.fglow, cx - hb / 2, Y(LY(335)) - hb / 2, hb, hb);
      drawFireBed(sec, spirit);
      ctx.globalAlpha = spirit;
      for (var pass = 0; pass < FLAMES.length; pass++) for (var rb = 0; rb < live.length; rb++) drawRibbon(live[rb], WIDEN[pass], FLAMES[pass][2]);
      var hd = live[2][live[2].length - 1], hs = FIG.h * sc * 0.11;            // the lifted head, glowing brightest
      ctx.globalAlpha = spirit * 0.85; ctx.drawImage(SPR.fglow, X(LX(hd.x + 2)) - hs, Y(LY(hd.y + 4)) - hs, hs * 2, hs * 2);
    }

    // 4. stardust → human form → flame → embers
    for (var i = 0; i < P.length; i++) {
      var p = P[i], x, y, a, s = p.size * base, spr = p.spr;
      var a0 = 0.04 + p.d, a1 = 0.46 + p.d * 0.6;                 // travel window
      if (t < a1) {
        var u2 = ease((t - a0) / (a1 - a0)), iu = 1 - u2;
        x = iu * iu * p.s.x + 2 * iu * u2 * p.c.x + u2 * u2 * p.t.x;
        y = iu * iu * p.s.y + 2 * iu * u2 * p.c.y + u2 * u2 * p.t.y;
        a = clamp((t - a0) / 0.06) * (0.55 + 0.45 * u2);
        s *= 0.8 + 0.4 * (1 - u2);
      } else if (t < 0.84) {
        var w = Math.sin(now / 420 + p.ph) * 0.0025 * IMG_H;
        var hx = p.t.x + w, hy = p.t.y + Math.cos(now / 500 + p.ph) * 0.0025 * IMG_H;
        var warm = ease((t - 0.52) / 0.08);
        if (catchFire <= 0) { x = hx; y = hy; a = 0.9; spr = warm > 0.5 ? SPR.gold : p.spr; s *= 1 + warm * 0.25; }
        else {                                                     // the body catches fire, the dust flows into the flame
          var fp = spiritPos(p, sec), cf = ease((catchFire - p.d * 2) / (1 - 0.28));
          x = hx + (fp.x - hx) * cf; y = hy + (fp.y - hy) * cf;
          spr = cf < 0.35 ? SPR.gold : (p.ph > 4.4 ? SPR.white : p.ph > 1.6 ? SPR.flame : SPR.ember);
          a = 0.9 - cf * 0.35 * fp.up; s *= 1.25 - cf * 0.35 * fp.up;
        }
      } else {                                                     // the spirit scatters as embers
        var fp2 = spiritPos(p, sec), b = easeOut((release - p.d * 1.5) / (1 - 0.21));
        var ex = p.e.rel ? fp2.x + p.e.x : p.e.x, ey = p.e.rel ? fp2.y + p.e.y : p.e.y;
        x = fp2.x + (ex - fp2.x) * b + Math.sin(sec * 3 + p.ph) * 6 * b; y = fp2.y + (ey - fp2.y) * b;
        a = (1 - clamp((t - 0.86) / (0.13 - p.d * 0.3))) * 0.95; spr = b < 0.3 ? SPR.flame : SPR.ember;
        s *= 1.1 - 0.5 * b;
      }
      if (a <= 0.01) continue;
      ctx.globalAlpha = a * (0.75 + 0.25 * Math.sin(now / 160 + p.ph));
      ctx.drawImage(spr, X(x) - s, Y(y) - s, s * 2, s * 2);
    }

    // consciousness: a spark at the mind, a halo, then the flash that lights the fire
    var headY = Y(FIG.y - FIG.h * 0.38);
    var spark = band(t, 0.5, 0.56, 0.62, 0.68);
    if (spark > 0) {
      var sr2 = FIG.h * sc * (0.18 + 0.1 * spark + 0.03 * Math.sin(now / 120));
      ctx.globalAlpha = spark; ctx.drawImage(SPR.glow, cx - sr2 / 2, headY - sr2 / 2, sr2, sr2);
      var ring = clamp((t - 0.53) / 0.14);
      ctx.globalAlpha = spark * (1 - ring) * 0.8; ctx.strokeStyle = 'rgba(255,228,170,1)'; ctx.lineWidth = Math.max(1, sc * 3);
      ctx.beginPath(); ctx.arc(cx, headY, FIG.h * sc * (0.06 + ring * 0.32), 0, 6.2832); ctx.stroke();
    }
    var flash = band(t, 0.6, 0.64, 0.65, 0.74);
    if (flash > 0) {
      var br = FIG.h * sc * (0.7 + 0.9 * ease((t - 0.6) / 0.12));
      ctx.globalAlpha = flash * 0.75; ctx.drawImage(SPR.fglow, cx - br / 2, cy - br / 2, br, br);
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
    if (reduce) { draw(performance.now(), 0.78); caps.forEach(function (c) { c.classList.add('is-on'); }); root.classList.add('is-still'); return; }
    start();
  }
  bg.onload = function () { buildGalaxyLayer(); if (reduce) draw(performance.now(), 0.78); };
  window.addEventListener('resize', function () { resize(); if (reduce) draw(performance.now(), 0.78); });
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; visible ? start() : stop(); }).observe(root);
  // test hook: render a specific moment (0–1) of the cycle
  window.__emergence = { seek: function (f, n) { stop(); draw(n != null ? n : performance.now(), f); }, play: function () { start(); }, loop: LOOP };
  init();
})();
