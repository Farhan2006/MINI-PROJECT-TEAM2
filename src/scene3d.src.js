import * as THREE from "three";

/* FPGA-controlled variable-gain amplifier, as a living 3D board.
   Left lanes carry small input signals into the chip; the right lanes carry the
   amplified output (bigger and brighter as the gain rises); top/bottom lanes carry
   the FPGA control lines. Click the chip to step the gain. */

var GAINS = [1, 10, 50, 100];
var ACCENT = 0x2997ff, VIOLET = 0xa77bff, PINK = 0xff6fb5, INPUT = 0x9cc2ff;

function glowTexture() {
  var c = document.createElement("canvas"); c.width = c.height = 128;
  var g = c.getContext("2d"), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(.25, "rgba(255,255,255,.55)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function dieTexture() {
  var S = 512, c = document.createElement("canvas"); c.width = c.height = S;
  var g = c.getContext("2d");
  var bg = g.createLinearGradient(0, 0, S, S); bg.addColorStop(0, "#0d1220"); bg.addColorStop(1, "#16102a");
  g.fillStyle = bg; g.fillRect(0, 0, S, S);
  g.strokeStyle = "rgba(120,160,255,.13)"; g.lineWidth = 1;
  for (var i = 0; i <= 32; i++) { g.beginPath(); g.moveTo(i * S / 32, 0); g.lineTo(i * S / 32, S); g.stroke(); g.beginPath(); g.moveTo(0, i * S / 32); g.lineTo(S, i * S / 32); g.stroke(); }
  /* tiny logic-cell array */
  for (var y = 0; y < 8; y++) for (var x = 0; x < 8; x++) {
    if (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453 % 1 > .45) { g.fillStyle = "rgba(41,151,255," + (.12 + ((x * 7 + y * 3) % 5) * .05) + ")"; g.fillRect(40 + x * 54, 40 + y * 54, 42, 42); }
  }
  var edge = g.createLinearGradient(0, 0, S, S); edge.addColorStop(0, "#2997ff"); edge.addColorStop(1, "#a77bff");
  g.strokeStyle = edge; g.lineWidth = 6; g.strokeRect(14, 14, S - 28, S - 28);
  g.fillStyle = "rgba(8,10,18,.72)"; g.fillRect(70, 190, S - 140, 132);
  g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = "700 96px -apple-system, 'Segoe UI', Inter, sans-serif"; g.fillText("FPGA", S / 2, 240);
  g.font = "500 26px -apple-system, 'Segoe UI', Inter, sans-serif"; g.fillStyle = "rgba(190,210,255,.85)"; g.fillText("VARIABLE GAIN · x1 – x100", S / 2, 298);
  g.fillStyle = "#2997ff"; g.beginPath(); g.arc(46, 46, 8, 0, 6.283); g.fill();
  var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

function ease(t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }
function rnd(s) { var x = Math.sin(s * 127.1) * 43758.5453; return x - Math.floor(x); }

export function mount(container, opts) {
  opts = opts || {};
  var compact = !!opts.compact, still = !!opts.still;
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.className = "stage3d-canvas";
  container.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(compact ? 34 : 30, 1, .1, 100);
  var camBase = compact ? new THREE.Vector3(0, 5.6, 8.6) : new THREE.Vector3(0, 6.0, 8.8);
  camera.position.copy(camBase); camera.lookAt(0, 0, 0);

  var root = new THREE.Group(); scene.add(root);

  /* lights */
  scene.add(new THREE.AmbientLight(0x8da2ff, 1.1));
  var key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 8, 5); scene.add(key);
  var rimL = new THREE.PointLight(ACCENT, 90, 14, 2); rimL.position.set(-4, 2.4, 2); scene.add(rimL);
  var rimR = new THREE.PointLight(PINK, 60, 14, 2); rimR.position.set(4.5, 2.2, -2); scene.add(rimR);
  var ptr = new THREE.PointLight(VIOLET, 70, 9, 2); ptr.position.set(0, 1.4, 0); scene.add(ptr);
  var chipGlow = new THREE.PointLight(ACCENT, 25, 6, 2); chipGlow.position.set(0, 1.2, 0); root.add(chipGlow);

  /* board */
  var board = new THREE.Mesh(new THREE.BoxGeometry(14, .14, 10), new THREE.MeshStandardMaterial({ color: 0x0a1226, roughness: .75, metalness: .25, transparent: true, opacity: .92 }));
  board.position.y = -.08; root.add(board);
  var edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(14, .14, 10)), new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: .55 }));
  edges.position.y = -.08; root.add(edges);
  var grid = new THREE.GridHelper(14, 28, 0x2d4a8a, 0x1a2c58); grid.position.y = .001; grid.material.transparent = true; grid.material.opacity = .28; root.add(grid);

  /* chip */
  var chip = new THREE.Group(); root.add(chip);
  var body = new THREE.Mesh(new THREE.BoxGeometry(2.4, .3, 2.4), new THREE.MeshStandardMaterial({ color: 0x1b1d26, metalness: .75, roughness: .32 }));
  body.position.y = .15; chip.add(body);
  var plate = new THREE.Mesh(new THREE.PlaneGeometry(2.05, 2.05), new THREE.MeshBasicMaterial({ map: dieTexture(), toneMapped: false }));
  plate.rotation.x = -Math.PI / 2; plate.position.y = .302; chip.add(plate);
  var pinMat = new THREE.MeshStandardMaterial({ color: 0xcfd3e0, metalness: .95, roughness: .22 });
  var pinsLR = new THREE.InstancedMesh(new THREE.BoxGeometry(.3, .06, .1), pinMat, 28);
  var pinsTB = new THREE.InstancedMesh(new THREE.BoxGeometry(.1, .06, .3), pinMat, 28);
  var m4 = new THREE.Matrix4(), n = 14;
  for (var k = 0; k < n; k++) {
    var t = -1.0 + 2.0 * k / (n - 1);
    m4.makeTranslation(-1.3, .06, t); pinsLR.setMatrixAt(k, m4);
    m4.makeTranslation(1.3, .06, t); pinsLR.setMatrixAt(n + k, m4);
    m4.makeTranslation(t, .06, -1.3); pinsTB.setMatrixAt(k, m4);
    m4.makeTranslation(t, .06, 1.3); pinsTB.setMatrixAt(n + k, m4);
  }
  chip.add(pinsLR, pinsTB);

  /* halo rings + orbiting charge */
  var tex = glowTexture();
  var ringMat = new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false });
  var ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.05, .012, 8, 160), ringMat);
  var ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.5, .008, 8, 160), new THREE.MeshBasicMaterial({ color: VIOLET, transparent: true, opacity: .4, blending: THREE.AdditiveBlending, depthWrite: false }));
  ring1.rotation.x = ring2.rotation.x = Math.PI / 2; ring1.position.y = .55; ring2.position.y = .35;
  root.add(ring1, ring2);
  function glow(color, size, op) {
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: color, transparent: true, opacity: op == null ? 1 : op, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.scale.set(size, size, 1); return s;
  }
  var orbs = [glow(0xffffff, .42), glow(PINK, .32), glow(ACCENT, .36)]; orbs.forEach(function (o) { root.add(o); });

  /* ripple on click */
  var ripple = new THREE.Mesh(new THREE.RingGeometry(.96, 1, 96), new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  ripple.rotation.x = -Math.PI / 2; ripple.position.y = .02; root.add(ripple);
  var rip = 1;

  /* lanes: [type, points] */
  var lanes = [];
  function lane(type, pts, count) {
    var path = new THREE.CurvePath();
    for (var i = 0; i < pts.length - 1; i++) path.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
    var color = type === "in" ? INPUT : type === "out" ? ACCENT : VIOLET;
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    root.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: type === "ctl" ? .4 : .5 })));
    var pad = glow(color, .22, .9); pad.position.copy(type === "out" ? pts[pts.length - 1] : pts[0]); pad.position.y = .03; root.add(pad);
    var pulses = [];
    for (var j = 0; j < count; j++) {
      var s = glow(color, .2, 1); root.add(s);
      pulses.push({ s: s, u: (j + rnd(lanes.length * 7 + j)) / count, v: .1 + rnd(lanes.length + j * 3) * .07 });
    }
    lanes.push({ type: type, path: path, pulses: pulses, color: color });
  }
  var L = compact ? 4 : 7;
  for (var i = 0; i < L; i++) {
    var z = -.9 + 1.8 * i / (L - 1), jz = (i % 2 ? 1 : -1) * (.5 + rnd(i + 3) * 1.1);
    lane("in", [new THREE.Vector3(-6.7, .03, z + jz), new THREE.Vector3(-4.3, .03, z + jz), new THREE.Vector3(-3.3, .03, z), new THREE.Vector3(-1.34, .03, z)], 3);
    lane("out", [new THREE.Vector3(1.34, .03, z), new THREE.Vector3(3.3, .03, z), new THREE.Vector3(4.3, .03, z - jz), new THREE.Vector3(6.7, .03, z - jz)], 3);
  }
  var C = compact ? 2 : 4;
  for (var q = 0; q < C; q++) {
    var x = -.9 + 1.8 * q / (C - 1 || 1), jx = (q % 2 ? 1 : -1) * (.4 + rnd(q + 11) * .8), sg = q % 2 ? 1 : -1;
    lane("ctl", [new THREE.Vector3(x + jx, .03, -4.7), new THREE.Vector3(x + jx, .03, -3.2), new THREE.Vector3(x, .03, -2.4), new THREE.Vector3(x, .03, -1.34)], 2);
    lane("ctl", [new THREE.Vector3(-x + jx * sg, .03, 4.7), new THREE.Vector3(-x + jx * sg, .03, 3.2), new THREE.Vector3(-x, .03, 2.4), new THREE.Vector3(-x, .03, 1.34)], 2);
  }

  /* state */
  var gi = 0, gainT = 1, gain = 1, flash = 0;
  var tgt = { x: 0, y: 0 }, cur = { x: 0, y: 0 }, mouse = { x: 0, y: 0, in: false };
  var hover = false, hoverS = 0, introT = still ? 2 : 0, clock = new THREE.Clock();
  var ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -.9), hit = new THREE.Vector3();
  var onScreen = true, running = false, raf = 0, W = 1, H = 1;

  function size() {
    var r = container.getBoundingClientRect(); W = Math.max(2, r.width); H = Math.max(2, r.height);
    renderer.setSize(W, H, false); camera.aspect = W / H;
    var fit = compact ? 1 : Math.max(1, 1.5 / camera.aspect); /* keep the board in frame on tall/narrow screens */
    camera.position.copy(camBase).multiplyScalar(fit); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix();
    renderer.domElement.style.width = "100%"; renderer.domElement.style.height = "100%";
  }
  size();
  var ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(size) : null; if (ro) ro.observe(container);

  function onMove(e) {
    var r = container.getBoundingClientRect();
    tgt.x = (e.clientX / innerWidth - .5) * 2; tgt.y = (e.clientY / innerHeight - .5) * 2;
    mouse.in = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1; mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  }
  addEventListener("pointermove", onMove, { passive: true });

  function setGain(i) {
    gi = (i + GAINS.length) % GAINS.length; gainT = GAINS[gi]; flash = 1; rip = 0;
    if (opts.onGain) opts.onGain(gainT);
  }
  if (!compact) {
    container.addEventListener("click", function () { if (hover) setGain(gi + 1); });
    container.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setGain(gi + 1); } });
  }

  function render() {
    var dt = Math.min(.05, clock.getDelta()), t = clock.elapsedTime;
    if (!still) introT += dt;
    var ie = ease(Math.min(1, introT / 1.6));

    /* pointer easing + parallax */
    cur.x += (tgt.x - cur.x) * Math.min(1, dt * 3); cur.y += (tgt.y - cur.y) * Math.min(1, dt * 3);
    root.rotation.y = (1 - ie) * -1.3 + cur.x * .38 + Math.sin(t * .25) * .06;
    root.rotation.x = cur.y * .12;
    root.scale.setScalar(.7 + .3 * ie);
    camera.position.x = camBase.x + cur.x * .5;

    /* hover / pointer light */
    hover = false;
    if (mouse.in && !compact) {
      ndc.set(mouse.x, mouse.y); ray.setFromCamera(ndc, camera);
      hover = ray.intersectObjects([body, plate], false).length > 0;
      if (ray.ray.intersectPlane(plane, hit)) { root.worldToLocal(hit); ptr.position.x += (hit.x - ptr.position.x) * .15; ptr.position.z += (hit.z - ptr.position.z) * .15; }
      container.style.cursor = hover ? "pointer" : "";
    } else if (!compact) { container.style.cursor = ""; ptr.position.x *= .96; ptr.position.z *= .96; }
    hoverS += ((hover ? 1 : 0) - hoverS) * Math.min(1, dt * 8);

    /* chip: drop-in, float, hover pop */
    var drop = (1 - ie) * 3.2;
    chip.position.y = drop + Math.sin(t * 1.4) * .04 + hoverS * .12;
    chip.scale.setScalar(1 + hoverS * .04);

    /* gain */
    gain += (gainT - gain) * Math.min(1, dt * 3.2);
    flash *= Math.pow(.02, dt);
    var lg = Math.log10(gain);                  /* 0 .. 2 */
    chipGlow.intensity = 22 + lg * 24 + flash * 80;
    rimL.intensity = 80 + flash * 60 + hoverS * 40;
    ringMat.opacity = .45 + lg * .16 + flash * .3;
    ring1.rotation.z = t * (.35 + hoverS * .9 + lg * .15); ring2.rotation.z = -t * .22;
    ring1.position.y = .55 + Math.sin(t * 1.4 + 1) * .04; ring2.position.y = .35 + Math.sin(t * 1.1) * .05;
    orbs.forEach(function (o, i) {
      var a = t * (.9 + i * .35) + i * 2.1, r = i === 1 ? 2.5 : 2.05;
      o.position.set(Math.cos(a) * r, (i === 1 ? .35 : .55) + Math.sin(a * 1.7) * .08, Math.sin(a) * r);
      o.material.opacity = .7 + .3 * Math.sin(t * 3 + i);
    });

    /* click ripple */
    if (rip < 1) { rip = Math.min(1, rip + dt * 1.1); var e = ease(rip); ripple.scale.setScalar(1.6 + e * 5.5); ripple.material.opacity = (1 - rip) * .8; } else ripple.material.opacity = 0;

    /* pulses */
    var p = new THREE.Vector3();
    for (var li = 0; li < lanes.length; li++) {
      var ln = lanes[li];
      for (var pi = 0; pi < ln.pulses.length; pi++) {
        var pu = ln.pulses[pi];
        if (!still) pu.u = (pu.u + dt * pu.v * (ln.type === "ctl" ? .8 : 1 + hoverS * .6)) % 1;
        ln.path.getPointAt(pu.u, p); pu.s.position.copy(p);
        var k = Math.sin(pu.u * Math.PI);          /* fade at both ends */
        var base = ln.type === "in" ? .16 : ln.type === "ctl" ? .16 : .16 * (1 + lg * 1.25);
        var op = ln.type === "out" ? (.55 + lg * .22) : .85;
        pu.s.scale.setScalar((base + (ln.type === "out" ? Math.sin(t * 8 + pi) * .02 * lg : 0)) * (.5 + k));
        pu.s.material.opacity = Math.min(1, op) * Math.min(1, k * 2.2);
        if (ln.type === "out") pu.s.material.color.setHex(gain > 40 ? PINK : ACCENT);
      }
    }
    renderer.render(scene, camera);
  }

  function loop() { if (!running) return; render(); raf = requestAnimationFrame(loop); }
  function play() { if (running || still) return; running = true; clock.getDelta(); loop(); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  if (still) { render(); }
  else {
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; onScreen && !document.hidden ? play() : stop(); }, { threshold: 0 }).observe(container);
    else play();
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : (onScreen && play()); });
    play();
  }
  return { setGain: setGain, render: render };
}
