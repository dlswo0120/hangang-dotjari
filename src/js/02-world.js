/* ================= world ================= */
const UPV = new THREE.Vector3(0, 1, 0);
const MAT_W = 1.5, MAT_L = 2.2;
const mat = (c, o = {}) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o));
function rand(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const R = rand(20261029);

function canvasTex(w, h, draw, rx, ry) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4; return t;
}
const grassTex = canvasTex(256, 256, (x, w, h) => {
  x.fillStyle = "#6f9a52"; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { const g = 120 + R() * 60 | 0; x.fillStyle = `rgba(${70 + R() * 40 | 0},${g},${55 + R() * 30 | 0},${0.25 + R() * 0.4})`; x.fillRect(R() * w, R() * h, 1 + R() * 2, 3 + R() * 6); }
  for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(${R() < .5 ? "150,185,95" : "70,110,55"},.18)`; x.beginPath(); x.arc(R() * w, R() * h, 8 + R() * 24, 0, 7); x.fill(); }
}, 120, 16);
const pathTex = canvasTex(256, 64, (x, w, h) => {
  x.fillStyle = "#cbc4b6"; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 1800; i++) { const v = 170 + R() * 60 | 0; x.fillStyle = `rgba(${v},${v - 6},${v - 16},.5)`; x.fillRect(R() * w, R() * h, 1.5, 1.5); }
  x.fillStyle = "rgba(120,112,100,.35)"; for (let i = 0; i < w; i += 64) x.fillRect(i, 0, 2, h);
}, 175, 1);
const laneTex = canvasTex(128, 64, (x, w, h) => {
  x.fillStyle = "#8f5a4a"; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 1400; i++) { const v = R(); x.fillStyle = v < .5 ? "rgba(60,30,25,.35)" : "rgba(190,130,110,.3)"; x.fillRect(R() * w, R() * h, 1.2, 1.2); }
}, 350, 1);
const woodTex = canvasTex(128, 32, (x, w, h) => {
  x.fillStyle = "#8a6040"; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 60; i++) { x.strokeStyle = `rgba(${R() < .5 ? "60,38,22" : "170,120,80"},.35)`; x.beginPath(); const y = R() * h; x.moveTo(0, y); x.bezierCurveTo(w * .3, y + R() * 4 - 2, w * .7, y + R() * 4 - 2, w, y); x.stroke(); }
}, 1, 1);
const grass = new THREE.Mesh(new THREE.PlaneGeometry(700, 90), mat(0xffffff, { map: grassTex })); grass.rotation.x = -Math.PI / 2; grass.position.set(40, 0, 45); grass.receiveShadow = true; scene.add(grass);
const edge = new THREE.Mesh(new THREE.BoxGeometry(700, 1.2, 2.4), mat(0x9a958a)); edge.position.set(40, -0.2, 0.4); edge.receiveShadow = true; scene.add(edge);
const steps = new THREE.Mesh(new THREE.BoxGeometry(700, 0.5, 1.4), mat(0xb6b0a2)); steps.position.set(40, 0.05, 2.2); steps.receiveShadow = true; scene.add(steps);
const pathM = new THREE.Mesh(new THREE.PlaneGeometry(700, 4.2), mat(0xffffff, { map: pathTex })); pathM.rotation.x = -Math.PI / 2; pathM.position.set(40, 0.03, 29.2); pathM.receiveShadow = true; scene.add(pathM);
const bike = new THREE.Mesh(new THREE.PlaneGeometry(700, 2.6), mat(0xffffff, { map: laneTex })); bike.rotation.x = -Math.PI / 2; bike.position.set(40, 0.031, 32.4); bike.receiveShadow = true; scene.add(bike);
for (let x = -300; x < 380; x += 6) { const d = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.14), new THREE.MeshBasicMaterial({ color: 0xe8d38a })); d.rotation.x = -Math.PI / 2; d.position.set(x, 0.035, 32.4); scene.add(d); }
// 한강 편의점 footprint (the building itself is in 035-store-world.js)
const STORE = { x: 60, z: 19.5, hw: 6, hd: 4.5 };
const underRoof = (x, z) => (Math.abs(x - STORE.x) < STORE.hw + .3 && Math.abs(z - STORE.z) < STORE.hd + .3) || (x > 24.3 && x < 35.7 && z > 22.7 && z < 24.3);
// grass tufts and little flowers near where people sit (hidden under picnic mats)
const PLANTS = [], ZERO_M = new THREE.Matrix4().makeScale(0, 0, 0);
function hidePlantsUnderMats(rects) {
  const dirty = new Set();
  for (const pl of PLANTS) {
    let under = false;
    for (const r of rects) if (Math.abs(pl.x - r.x) < MAT_W / 2 + .1 && Math.abs(pl.z - r.z) < MAT_L / 2 + .1) { under = true; break; }
    if (under !== pl.hidden) { pl.hidden = under; pl.mesh.setMatrixAt(pl.i, under ? ZERO_M : pl.m); dirty.add(pl.mesh); }
  }
  dirty.forEach(m => m.instanceMatrix.needsUpdate = true);
}
{
  const tuftG = new THREE.ConeGeometry(0.05, 0.2, 3); tuftG.translate(0, 0.1, 0);
  const N = LOW_END ? 2200 : 4800, tufts = new THREE.InstancedMesh(tuftG, mat(0xffffff), N), o = new THREE.Object3D(), c = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const back = R() < .12; o.position.set(-150 + R() * 365, 0, back ? 34.6 + R() * 4 : 3.4 + R() * 23.2);
    o.rotation.set((R() - .5) * .5, R() * 6, (R() - .5) * .5); const k = .5 + R() * .7; o.scale.set(k, k, k); o.updateMatrix();
    tufts.setColorAt(i, c.setHSL(.24 + R() * .05, .4, .26 + R() * .1));
    if (underRoof(o.position.x, o.position.z)) { tufts.setMatrixAt(i, ZERO_M); continue; }
    tufts.setMatrixAt(i, o.matrix);
    PLANTS.push({ mesh: tufts, i, x: o.position.x, z: o.position.z, m: o.matrix.clone(), hidden: false });
  }
  scene.add(tufts);
  const FN = 700, fl = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 6, 4), new THREE.MeshLambertMaterial({ color: 0xffffff }), FN);
  const fc = [0xfff6e0, 0xffe066, 0xffb3c7, 0xc9b6ff];
  for (let i = 0; i < FN; i++) {
    let cx = -145 + R() * 355, cz = 4 + R() * 21; o.position.set(cx + (R() - .5) * 2, 0.12, cz + (R() - .5) * 2); o.rotation.set(0, 0, 0); o.scale.set(1, .7, 1); o.updateMatrix();
    fl.setColorAt(i, c.set(fc[i % 4]));
    if (underRoof(o.position.x, o.position.z)) { fl.setMatrixAt(i, ZERO_M); continue; }
    fl.setMatrixAt(i, o.matrix);
    PLANTS.push({ mesh: fl, i, x: o.position.x, z: o.position.z, m: o.matrix.clone(), hidden: false });
  }
  scene.add(fl);
}
const trunkM = mat(0x6b5040), leafMs = [mat(0x5a8a45), mat(0x4a7a3f), mat(0x76a050), mat(0x8fae5a)];
function tree(x, z, s) {
  const g = new THREE.Group();
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * s, 0.32 * s, 3 * s, 7), trunkM); t.position.y = 1.5 * s; t.castShadow = true; g.add(t);
  const lm = leafMs[Math.floor(R() * leafMs.length)];
  [[0, 3.8, 0, 1.9], [0.95, 3.25, 0.3, 1.35], [-0.85, 3.35, -0.2, 1.45], [0.1, 4.85, 0.1, 1.35], [0.2, 3.4, -0.9, 1.2]].forEach(([a, b, c, r]) => {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 1), lm); m.position.set(a * s, b * s, c * s); m.rotation.set(R(), R(), R()); m.castShadow = true; g.add(m);
  });
  g.position.set(x, 0, z); scene.add(g);
}
for (let x = -150; x < 260; x += 7 + R() * 6) tree(x, 40 + R() * 14, 0.85 + R() * 0.45);
for (let x = -150; x < 260; x += 14 + R() * 10) tree(x, 58 + R() * 14, 1 + R() * 0.5);

const lampHeadM = new THREE.MeshBasicMaterial({ color: 0xffd7a0 });
for (let x = -140; x < 260; x += 22) {
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 4.4, 6), mat(0x3d4247)); p.position.set(x, 2.2, 26.6); scene.add(p);
  const h = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), lampHeadM); h.position.set(x, 4.5, 26.6); scene.add(h);
}
const BENCHES = [];
for (let x = -60; x < 240; x += 44) {
  BENCHES.push({ x: x + 11, z: 26 });
  const b = new THREE.Group();
  const wm = mat(0xffffff, { map: woodTex });
  const s = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.6), wm); s.position.y = 0.5; b.add(s);
  const bk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 0.1), wm); bk.position.set(0, 0.9, 0.3); b.add(bk);
  [-1, 1].forEach(k => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.5), mat(0x3d4247)); l.position.set(k, 0.25, 0); b.add(l); });
  b.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  b.position.set(x + 11, 0, 26); scene.add(b);
}
// walkable map limits, marked by hedges on land and a buoy line on the water
const BOUND = { x0: -150, x1: 215, landZ0: 0.6, landZ1: 38.5, waterZ0: -32 };
// anything another player can legitimately reach, bridge deck included (used to sanity-check their position)
const WORLD = { x0: -165, x1: 230, z0: -160, z1: 42 };
[BOUND.x0 - 1, BOUND.x1 + 1].forEach(x => {
  for (let z = 4; z < 38; z += 2.2) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6), leafMs[1]); b.position.set(x, 0.35, z); b.scale.y = 0.7; scene.add(b); }
});
const buoyM = mat(0xf26b3a);
for (let x = BOUND.x0; x <= BOUND.x1; x += 6) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), buoyM); b.position.set(x, -0.5, BOUND.waterZ0 - 1); scene.add(b); }
for (let z = BOUND.waterZ0; z < -1; z += 6) [BOUND.x0 - 1, BOUND.x1 + 1].forEach(x => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), buoyM); b.position.set(x, -0.5, z); scene.add(b); });

// far bank & city
const far = new THREE.Mesh(new THREE.BoxGeometry(2400, 3, 40), mat(0x4f5a4a)); far.position.set(0, 0.5, -278); scene.add(far);
const farRoad = new THREE.Mesh(new THREE.BoxGeometry(2400, 2.5, 6), mat(0x6c6a66)); farRoad.position.set(0, 4, -262); scene.add(farRoad);
const wc = document.createElement("canvas"); wc.width = 64; wc.height = 128;
const wx = wc.getContext("2d"); wx.fillStyle = "#000"; wx.fillRect(0, 0, 64, 128);
for (let y = 4; y < 128; y += 8) for (let x = 4; x < 64; x += 8) { if (R() < 0.3) { wx.fillStyle = R() < 0.8 ? "#ffd9a0" : "#cfe6ff"; wx.fillRect(x, y, 4, 4); } }
const winTex = new THREE.CanvasTexture(wc); winTex.wrapS = winTex.wrapT = THREE.RepeatWrapping; winTex.repeat.set(2, 3);
const cityM = new THREE.MeshLambertMaterial({ color: 0x8a909c, emissive: 0xffffff, emissiveMap: winTex, emissiveIntensity: 0.6 });
const city = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), cityM, 220);
const dummy = new THREE.Object3D(); const tints = [0x8a909c, 0x9ca3ad, 0x7d8592, 0xa6a39b, 0x6f7886];
for (let i = 0; i < 220; i++) {
  const w = 10 + R() * 18, h = 10 + Math.pow(R(), 2.4) * 48, d = 10 + R() * 14;
  dummy.position.set(-1000 + R() * 2000, h / 2 + 1, -300 - R() * 120); dummy.scale.set(w, h, d); dummy.rotation.y = (R() - 0.5) * 0.2; dummy.updateMatrix();
  city.setMatrixAt(i, dummy.matrix); city.setColorAt(i, new THREE.Color(tints[i % 5]));
}
scene.add(city);
for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(120 + R() * 120, 70 + R() * 70, 5), mat(0x3e4b4a)); m.position.set(-1000 + i * 250 + R() * 80, 30, -470 - R() * 60); scene.add(m); }
// a hill with a tall tower, like the one everyone looks for from the river
const towerGlow = new THREE.MeshBasicMaterial({ color: 0xfff0d0 });
{
  const hill = new THREE.Mesh(new THREE.SphereGeometry(130, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x415246)); hill.scale.y = 0.5; hill.position.set(-150, 0, -520); scene.add(hill);
  const tw = new THREE.Group(), tm = mat(0xe9e6df);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.4, 70, 12), tm); shaft.position.y = 35; tw.add(shaft);
  const pod = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 5.2, 9, 16), tm); pod.position.y = 66; tw.add(pod);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(6.6, 6.6, 1.6, 16), towerGlow); ring.position.y = 68; tw.add(ring);
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1, 34, 8), tm); ant.position.y = 88; tw.add(ant);
  tw.position.set(-150, 62, -520); scene.add(tw);
}
const cloudTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d");
  for (let i = 0; i < 7; i++) { const g = x.createRadialGradient(30 + i * 11, 70 - Math.sin(i) * 14, 2, 30 + i * 11, 70 - Math.sin(i) * 14, 30); g.addColorStop(0, "rgba(255,255,255,.9)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 128, 128); }
  return new THREE.CanvasTexture(c); })();
const clouds = [];
for (let i = 0; i < 14; i++) {
  const m = new THREE.SpriteMaterial({ map: cloudTex, transparent: true, depthWrite: false, fog: false, opacity: 0.8 });
  const sp = new THREE.Sprite(m); const k = 160 + R() * 160; sp.scale.set(k, k * 0.45, 1);
  sp.position.set(-900 + R() * 1800, 140 + R() * 120, -500 - R() * 400); scene.add(sp); clouds.push(sp);
}

// bridges
const bridgeLights = [];
const OBST = []; // {x, z, r} circles and {x0, x1, z0, z1} boxes that block walking, swimming and boats
function bridge(x, opt) {
  const g = new THREE.Group(), deckM = mat(opt.deck || 0xa9a59c);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(16, 1.6, 300), deckM); deck.position.set(0, 11, -130); g.add(deck);
  const rail = new THREE.Mesh(new THREE.BoxGeometry(16.4, 0.5, 300), mat(0xd8d4ca)); rail.position.set(0, 12.1, -130); g.add(rail);
  for (let z = 14; z > -280; z -= opt.span) {
    if (z > -40) [-5, 5].forEach(k => OBST.push({ x: x + k, z, r: 1.35 }));
    [-5, 5].forEach(k => { const p = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 13, 10), deckM); p.position.set(k, 4, z); g.add(p); });
    const cap = new THREE.Mesh(new THREE.BoxGeometry(14, 1, 3), deckM); cap.position.set(0, 9.9, z); g.add(cap);
  }
  if (opt.arch) {
    const archM = mat(opt.archColor);
    [-7.5, 7.5].forEach(k => {
      const pts = []; for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push(new THREE.Vector3(k, 12 + Math.sin(u * Math.PI) * opt.archH, opt.arch[0] + (opt.arch[1] - opt.arch[0]) * u)); }
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.7, 8, false), archM));
      for (let i = 2; i < 23; i += 2) { const u = i / 24, hh = Math.sin(u * Math.PI) * opt.archH; const hg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, hh, 4), archM); hg.position.set(k, 12 + hh / 2, opt.arch[0] + (opt.arch[1] - opt.arch[0]) * u); g.add(hg); }
    });
  }
  const lm = new THREE.MeshBasicMaterial({ color: opt.light }); bridgeLights.push({ m: lm, base: new THREE.Color(opt.light) });
  const lg = new THREE.SphereGeometry(0.35, 6, 6);
  for (let z = 10; z > -275; z -= 9) [-8, 8].forEach(k => { const l = new THREE.Mesh(lg, lm); l.position.set(k, 12.7, z); g.add(l); });
  g.position.x = x; scene.add(g);
}
bridge(-70, { span: 36, arch: [-95, -165], archH: 18, archColor: 0xb8423a, light: 0xffe0a8 });
bridge(125, { span: 30, light: 0x9fd2ff, deck: 0x9a9ca2 });
bridge(-560, { span: 40, light: 0xffd08a });
bridge(640, { span: 34, arch: [-60, -200], archH: 26, archColor: 0xe9e4d6, light: 0xffffff });

// the red arch bridge is walkable: stairs from the park, a waist-high glass rail on both sides
const BR = { x: -70, half: 7.25, y: 12.35, z0: -150, z1: 18 };
const STAIR = { top: -62.6, bot: -38, z0: 8.2, z1: 10.8 };
const inStairs = (x, z) => x >= STAIR.top && x <= STAIR.bot && z >= STAIR.z0 && z <= STAIR.z1;
const stairY = x => BR.y * clamp((STAIR.bot - x) / (STAIR.bot - STAIR.top), 0, 1);
const inDeck = (x, z) => x >= BR.x - BR.half - 0.4 && x <= BR.x + BR.half + 0.4 && z >= BR.z0 && z <= BR.z1;
{
  const railM = mat(0xe3e8ec);
  const glassM = new THREE.MeshBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide });
  const postG = new THREE.CylinderGeometry(0.035, 0.035, 0.8, 6);
  const railRun = (x, za, zb) => {
    const len = za - zb, zc = (za + zb) / 2;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, len, 6), railM); top.rotation.x = Math.PI / 2; top.position.set(x, BR.y + 0.8, zc); scene.add(top);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.66), glassM); glass.rotation.y = Math.PI / 2; glass.position.set(x, BR.y + 0.42, zc); scene.add(glass);
    const n = Math.max(1, Math.floor(len / 3)), posts = new THREE.InstancedMesh(postG, railM, n + 1);
    for (let i = 0; i <= n; i++) { dummy.position.set(x, BR.y + 0.4, za - i * len / n); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); posts.setMatrixAt(i, dummy.matrix); }
    scene.add(posts);
  };
  const W = BR.x - BR.half - 0.3, E = BR.x + BR.half + 0.3;
  railRun(W, 20, -280);
  railRun(E, 20, STAIR.z1 + 0.15); railRun(E, STAIR.z0 - 0.15, -280);
  const north = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, E - W, 6), railM); north.rotation.z = Math.PI / 2; north.position.set(BR.x, BR.y + 0.8, BR.z1 + 0.6); scene.add(north);
  const northG = new THREE.Mesh(new THREE.PlaneGeometry(E - W, 0.66), glassM); northG.position.set(BR.x, BR.y + 0.42, BR.z1 + 0.6); scene.add(northG);
  // stairs
  const stepM = mat(0xbcb6a9), n = 30, run = (STAIR.bot - STAIR.top) / n, depth = STAIR.z1 - STAIR.z0 + 0.3;
  for (let i = 0; i < n; i++) {
    const h = BR.y * (i + 1) / n;
    const st = new THREE.Mesh(new THREE.BoxGeometry(run + 0.02, h, depth), stepM);
    st.position.set(STAIR.bot - run * (i + 0.5), h / 2, (STAIR.z0 + STAIR.z1) / 2); scene.add(st);
  }
  const a = new THREE.Vector3(STAIR.bot, 0.85, 0), b = new THREE.Vector3(STAIR.top, BR.y + 0.85, 0), d = b.clone().sub(a), L = d.length();
  [STAIR.z0 - 0.12, STAIR.z1 + 0.12].forEach(z => {
    const hr = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, L, 6), railM);
    hr.quaternion.setFromUnitVectors(UPV, d.clone().normalize()); hr.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, z); scene.add(hr);
    for (let i = 0; i <= 10; i++) { const x = STAIR.bot - (STAIR.bot - STAIR.top) * i / 10; const p = new THREE.Mesh(postG, railM); p.position.set(x, stairY(x) + 0.42, z); scene.add(p); }
  });
}

// light streaks on water
const sc = document.createElement("canvas"); sc.width = 8; sc.height = 128;
const sx = sc.getContext("2d"); const grd = sx.createLinearGradient(0, 0, 0, 128);
grd.addColorStop(0, "rgba(255,255,255,0)"); grd.addColorStop(0.15, "rgba(255,255,255,.9)"); grd.addColorStop(1, "rgba(255,255,255,0)");
sx.fillStyle = grd; sx.fillRect(0, 0, 8, 128);
const streakTex = new THREE.CanvasTexture(sc), streaks = [], streakSrc = [];
for (let i = 0; i < 70; i++) streakSrc.push([-700 + R() * 1400, -250, R() < 0.75 ? 0xffd39a : 0xbfe0ff, 40 + R() * 70]);
[-70, 125, -560, 640].forEach((bx, j) => { for (let z = -40; z > -240; z -= 36) streakSrc.push([bx + (R() < 0.5 ? -8 : 8), z, j === 1 ? 0x9fd2ff : 0xffe0a8, 22]); });
streakSrc.forEach(([x, z, c, len]) => {
  const m = new THREE.MeshBasicMaterial({ map: streakTex, color: c, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 });
  const s = new THREE.Mesh(new THREE.PlaneGeometry(1.4, len), m); s.rotation.x = -Math.PI / 2; s.position.set(x, -0.5, z + len / 2); scene.add(s); streaks.push({ m, ph: R() * 6 });
});

