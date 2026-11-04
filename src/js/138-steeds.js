/* ================= 탈것 동물: 경주 때 랜덤으로 배정 ================= */
// rare 0 = 일반, 1 = 희귀, 2 = 전설. w = draw weight in percent (sums to 100)
const STEEDS = [
  { id: "pony", name: "망아지", icon: "🐴", rare: 0, w: 10.875, v: 0.95, acc: 1.35, cn: 0.55, ti: 1.5, lr: 1.3 },
  { id: "horse", name: "말", icon: "🐎", rare: 0, w: 10.875, v: 1, acc: 1, cn: 1, ti: 1, lr: 1 },
  { id: "donkey", name: "당나귀", icon: "🫏", rare: 0, w: 10.875, v: 0.92, acc: 1, cn: 0.8, ti: 0, lr: 1.05 },
  { id: "camel", name: "낙타", icon: "🐪", rare: 0, w: 10.875, v: 0.94, acc: 0.85, cn: 1.4, ti: 0.5, lr: 0.85 },
  { id: "alpaca", name: "알파카", icon: "🦙", rare: 0, w: 10.875, v: 0.9, acc: 0.85, cn: 0.9, ti: 0.6, lr: 1.1 },
  { id: "reindeer", name: "순록", icon: "🦌", rare: 0, w: 10.875, v: 0.97, acc: 1, cn: 0.7, ti: 1, lr: 1 },
  { id: "cow", name: "젖소", icon: "🐄", rare: 0, w: 10.875, v: 0.88, acc: 0.8, cn: 0.6, ti: 0.4, lr: 0.85 },
  { id: "ostrich", name: "타조", icon: "🪿", rare: 0, w: 10.875, v: 1.03, acc: 1.25, cn: 1.6, ti: 1.3, lr: 1.7 },
  { id: "zebra", name: "얼룩말", icon: "🦓", rare: 1, w: 8, v: 1.04, acc: 1.2, cn: 1, ti: 1, lr: 1.05 },
  { id: "redhare", name: "적토마", icon: "🔥", rare: 1, w: 4, v: 1.07, acc: 1.1, cn: 0.9, ti: 0.9, lr: 1.05 },
  { id: "unicorn", name: "유니콘", icon: "🦄", rare: 2, w: 1, v: 1.08, acc: 1.1, cn: 0.9, ti: 0.9, lr: 1 }
];
const RARE_NAME = ["일반", "희귀", "전설"];
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
// the same draw on every screen: the race id and the rider decide it
function drawSteed(seed) {
  let r = (hashStr(seed) % 100000) / 1000;
  for (let i = 0; i < STEEDS.length; i++) { r -= STEEDS[i].w; if (r < 0) return i; }
  return 1;
}

const stripeTex = (vertical) => canvasTex(256, 256, (x, W, H) => {
  x.fillStyle = "#f4f1ea"; x.fillRect(0, 0, W, H); x.fillStyle = "#1d1d22";
  for (let i = 0; i < 14; i++) {
    const p = (i + .2) * W / 14, w = 6 + (i * 37 % 7);
    x.beginPath();
    if (vertical) { x.moveTo(p, 0); x.bezierCurveTo(p + 10, H * .3, p - 10, H * .6, p + 4, H); x.lineTo(p + 4 + w, H); x.bezierCurveTo(p - 10 + w, H * .6, p + 10 + w, H * .3, p + w, 0); }
    else { x.moveTo(0, p); x.lineTo(W, p + 4); x.lineTo(W, p + 4 + w); x.lineTo(0, p + w); }
    x.fill();
  }
}, 1, 1);
const spotTex = () => canvasTex(256, 256, (x, W, H) => {
  x.fillStyle = "#f7f5f0"; x.fillRect(0, 0, W, H); x.fillStyle = "#26262b";
  const pts = [[40, 60, 34], [150, 40, 26], [210, 140, 40], [90, 170, 30], [30, 220, 22], [180, 230, 24], [120, 105, 18]];
  pts.forEach(([cx, cy, r]) => { x.beginPath(); for (let a = 0; a < 6.3; a += .5) { const rr = r * (.75 + .35 * Math.sin(a * 3 + cx)); x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.fill(); });
}, 1, 1);
let zebraBody = null, zebraLeg = null, cowBody = null;
const RAINBOW = [0xff8fab, 0xffc36b, 0xfff07a, 0x9be3a0, 0x8ec5ff, 0xc3a6ff];

function makeSteed(k) {
  const S = STEEDS[k], id = S.id, g = new THREE.Group(), torso = new THREE.Group(); g.add(torso);
  const ud = { k, legs: [], torso, ph: Math.random() * 6, hooves: [] }; g.userData = ud;
  const M = c => mat(c), dark = { pony: 0xf2d27a, horse: 0x3b2a20, donkey: 0x55504c, camel: 0x9b7b4f, alpaca: 0xe8dcc6, reindeer: 0x5a4030, cow: 0x2a2a2e, ostrich: 0x222226, zebra: 0x1d1d22, redhare: 0x4a0f0f, unicorn: 0xffffff }[id];
  const coat = { pony: 0xd9a066, horse: 0x8a5a3c, donkey: 0x9a948e, camel: 0xd7b47e, alpaca: 0xf6efe2, reindeer: 0x8b6a4e, cow: 0xffffff, ostrich: 0x2b2b30, zebra: 0xffffff, redhare: 0xa8321f, unicorn: 0xfdfbff }[id];
  let bodyM;
  if (id === "zebra") { zebraBody = zebraBody || stripeTex(true); bodyM = new THREE.MeshLambertMaterial({ map: zebraBody }); }
  else if (id === "cow") { cowBody = cowBody || spotTex(); bodyM = new THREE.MeshLambertMaterial({ map: cowBody }); }
  else bodyM = M(coat);
  const darkM = M(dark), hoofM = M(id === "unicorn" ? 0xffb3d1 : id === "redhare" ? 0x2a1a14 : 0x3a3330);
  const legM = id === "zebra" ? new THREE.MeshLambertMaterial({ map: zebraLeg = zebraLeg || stripeTex(false) }) : id === "ostrich" ? M(0xf0a8a0) : bodyM;
  const add = (par, geo, m, x, y, z, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); par.add(o); return o; };
  const SPH = new THREE.SphereGeometry(1, 18, 14);
  const eyes = (head, x, y, z) => [-1, 1].forEach(s => { add(head, SPH, M(0x1b1b1f), s * x, y, z, .055, .065, .05); add(head, SPH, eyeHi, s * x + .015 * s, y + .025, z - .03, .018, .018, .018); });

  // body size per animal (chibi proportions: short legs, round bodies)
  const P = {
    pony: { s: .85, leg: .5, rx: .34, ry: .3, rz: .62, neck: .45, tilt: .55 },
    horse: { s: 1, leg: .62, rx: .34, ry: .32, rz: .72, neck: .55, tilt: .6 },
    donkey: { s: .92, leg: .52, rx: .33, ry: .31, rz: .64, neck: .42, tilt: .7 },
    camel: { s: 1, leg: .82, rx: .36, ry: .32, rz: .72, neck: .7, tilt: .95 },
    alpaca: { s: .95, leg: .55, rx: .4, ry: .36, rz: .6, neck: .7, tilt: .15 },
    reindeer: { s: 1, leg: .6, rx: .34, ry: .31, rz: .66, neck: .45, tilt: .5 },
    cow: { s: 1, leg: .5, rx: .42, ry: .37, rz: .76, neck: .3, tilt: .9 },
    ostrich: { s: 1, leg: .95, rx: .42, ry: .36, rz: .5, neck: .85, tilt: .3 },
    zebra: { s: 1, leg: .6, rx: .34, ry: .32, rz: .7, neck: .52, tilt: .6 },
    redhare: { s: 1.05, leg: .66, rx: .35, ry: .32, rz: .74, neck: .58, tilt: .55 },
    unicorn: { s: 1.02, leg: .64, rx: .34, ry: .32, rz: .72, neck: .56, tilt: .55 }
  }[id];
  const by = P.leg + P.ry * .55;
  if (id === "alpaca" || id === "ostrich") { // fluffy coats are lumpy
    add(torso, SPH, bodyM, 0, by, 0, P.rx, P.ry, P.rz);
    [[.18, .12, -.25], [-.18, .1, .2], [.12, .2, .25], [-.2, .16, -.2]].forEach(([x, y, z]) => add(torso, SPH, bodyM, x, by + y, z, .24, .2, .26));
  } else add(torso, SPH, bodyM, 0, by, 0, P.rx, P.ry, P.rz);

  // legs (pivot at the top so they can swing)
  const legSpots = id === "ostrich" ? [[-.16, 0], [.16, 0]] : [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => [sx * P.rx * .55, sz * P.rz * .62]);
  legSpots.forEach(([x, z]) => {
    const piv = new THREE.Group(); piv.position.set(x, by - P.ry * .35, z); torso.add(piv);
    const L = by - P.ry * .35, thick = id === "alpaca" ? .1 : id === "cow" ? .09 : id === "ostrich" ? .045 : .07;
    add(piv, new THREE.CylinderGeometry(thick, thick * .8, L, 8), legM, 0, -L / 2, 0);
    if (id === "alpaca") add(piv, SPH, bodyM, 0, -L * .25, 0, .13, .2, .13);
    const hoof = add(piv, new THREE.CylinderGeometry(thick * 1.05, thick * 1.15, .09, 8), id === "ostrich" ? M(0xf0a8a0) : hoofM, 0, -L + .045, id === "ostrich" ? -.05 : 0, 1, 1, id === "ostrich" ? 2 : 1);
    ud.legs.push(piv); ud.hooves.push(hoof);
  });

  // neck and head
  const neck = new THREE.Group(); neck.position.set(0, by + P.ry * .3, -P.rz * (id === "ostrich" ? .95 : .78)); neck.rotation.x = -P.tilt; torso.add(neck); ud.neck = neck; ud.neckBase = -P.tilt;
  const nr = id === "ostrich" ? .085 : id === "alpaca" ? .15 : .15;
  add(neck, new THREE.CylinderGeometry(nr * .8, nr, P.neck, 10), id === "ostrich" ? M(0xf0a8a0) : bodyM, 0, P.neck / 2, 0);
  if (id === "alpaca") add(neck, SPH, bodyM, 0, P.neck * .5, 0, .17, P.neck * .55, .17);
  const head = new THREE.Group(); head.position.set(0, P.neck, 0); head.rotation.x = P.tilt; neck.add(head); ud.head = head;
  if (id === "ostrich") {
    add(head, SPH, M(0xf0a8a0), 0, .05, 0, .13, .12, .14); add(head, new THREE.ConeGeometry(.05, .16, 8), M(0xe8b04a), 0, .02, -.17).rotation.x = -Math.PI / 2;
    eyes(head, .075, .09, -.08);
  } else {
    const hl = id === "cow" ? .3 : id === "alpaca" ? .2 : .32, hw = id === "cow" ? .22 : .17;
    add(head, SPH, id === "cow" ? M(0xffffff) : bodyM, 0, .06, -.08, hw, .18, hl);
    add(head, SPH, M(id === "cow" ? 0xf6b6b6 : id === "donkey" || id === "camel" || id === "alpaca" ? 0xe9e0d4 : id === "unicorn" ? 0xffe6f0 : 0x5a3a2a), 0, 0, -.08 - hl * .85, hw * .78, .12, .14);
    eyes(head, hw * .62, .14, -.12);
    // ears
    const earL = id === "donkey" ? .36 : id === "alpaca" ? .24 : .16, earM = id === "zebra" ? M(0xf4f1ea) : bodyM;
    [-1, 1].forEach(s => { const e = add(head, new THREE.ConeGeometry(.055, earL, 8), earM, s * hw * .55, .2 + earL * .4, .05); e.rotation.z = -s * .25; if (id === "cow") { e.rotation.z = -s * 1.3; e.position.y = .12; e.position.x = s * hw * 1.05; } });
    if (id === "alpaca") add(head, SPH, bodyM, 0, .24, 0, .17, .12, .17); // pom-pom
  }

  // per-animal extras
  if (["pony", "horse", "zebra", "redhare", "unicorn", "donkey"].includes(id)) {
    if (id === "unicorn") RAINBOW.forEach((c, i) => add(neck, new THREE.BoxGeometry(.07, P.neck * .2, .1), M(c), 0, P.neck * (.12 + i * .16), nr + .02));
    else add(neck, new THREE.BoxGeometry(.06, P.neck * 1.05, .12), id === "zebra" ? M(0x1d1d22) : darkM, 0, P.neck * .55, nr + .02);
    if (id !== "donkey") add(head, new THREE.BoxGeometry(.06, .12, .16), id === "unicorn" ? M(RAINBOW[0]) : darkM, 0, .24, .02); // forelock
  }
  if (id === "unicorn") { const h = add(head, new THREE.ConeGeometry(.05, .38, 12), new THREE.MeshPhongMaterial({ color: 0xf2c14e, shininess: 100, emissive: 0x3a2a00 }), 0, .4, -.16); h.rotation.x = -.45; }
  if (id === "reindeer") [-1, 1].forEach(s => {
    const ant = new THREE.Group(); ant.position.set(s * .1, .22, 0); ant.rotation.z = -s * .35; head.add(ant); const am = M(0xc9a87a);
    add(ant, new THREE.CylinderGeometry(.025, .03, .42, 6), am, 0, .21, 0);
    [[.14, .25, .7], [.3, .2, -.6], [.38, .14, .8]].forEach(([y, l, r]) => { const b = add(ant, new THREE.CylinderGeometry(.018, .022, l, 6), am, Math.sin(r) * l / 2 * s, y + Math.cos(r) * l / 2, 0); b.rotation.z = -r * s; });
    add(neck, SPH, M(0xf2eadf), 0, P.neck * .25, -nr * .6, .16, .2, .1);
  });
  if (id === "cow") { const bell = add(neck, new THREE.CylinderGeometry(.04, .07, .1, 10), new THREE.MeshPhongMaterial({ color: 0xe8b84a, shininess: 90 }), 0, .02, -nr - .05); [-1, 1].forEach(s => { const h = add(head, new THREE.ConeGeometry(.035, .14, 8), M(0xf3ead6), s * .12, .24, .02); h.rotation.z = -s * .6; }); }
  if (id === "camel") { add(torso, SPH, bodyM, 0, by + P.ry * .95, -P.rz * .48, .2, .22, .22); add(torso, SPH, bodyM, 0, by + P.ry * .95, P.rz * .48, .2, .22, .22); }
  if (id === "ostrich") { const plume = add(torso, SPH, M(0xffffff), 0, by + .12, P.rz * .95, .2, .16, .16); ud.tailM = plume; }

  // tail
  const tail = new THREE.Group(); tail.position.set(0, by + P.ry * .25, P.rz * .95); torso.add(tail); ud.tail = tail;
  if (id === "ostrich") tail.visible = false;
  else if (id === "unicorn") RAINBOW.forEach((c, i) => add(tail, new THREE.BoxGeometry(.05, .5, .05), M(c), (i - 2.5) * .035, -.25, .02));
  else if (id === "cow" || id === "donkey") { add(tail, new THREE.CylinderGeometry(.02, .02, .5, 6), id === "cow" ? M(0xf2f2f2) : bodyM, 0, -.25, 0); add(tail, SPH, darkM, 0, -.52, 0, .05, .09, .05); }
  else if (id === "alpaca" || id === "reindeer") add(tail, SPH, id === "reindeer" ? M(0xf6f1e8) : bodyM, 0, -.04, .02, .1, .12, .09);
  else if (id === "camel") add(tail, new THREE.CylinderGeometry(.03, .02, .4, 6), darkM, 0, -.2, 0);
  else add(tail, new THREE.CylinderGeometry(.07, .03, .55, 8), id === "zebra" ? M(0x1d1d22) : darkM, 0, -.27, .03);
  ud.tailBase = id === "alpaca" || id === "reindeer" ? 0 : .35;

  // saddle (a riding blanket in the rarity colour)
  const top = by + P.ry * (id === "camel" ? .92 : .95);
  const blanket = add(torso, new THREE.BoxGeometry(P.rx * 2.05, .05, .55), M([0x2a9d8f, 0x6c5ce7, 0xf2c14e][S.rare]), 0, top - .02, 0);
  blanket.rotation.x = 0; add(torso, new THREE.BoxGeometry(.36, .1, .42), M(S.rare === 2 ? 0xfff2c4 : 0x6b3e26), 0, top + .04, .02);
  const sc = P.s * 1.15; ud.rideY = (top + .08) * sc;
  g.scale.setScalar(sc);
  g.traverse(m => { if (m.isMesh) m.castShadow = true; });
  return g;
}

/* galloping and the special effects */
const hoofW = new THREE.Vector3(), FIRE_C = [new THREE.Color(0xff6a2a), new THREE.Color(0xffb347), new THREE.Color(0xff3b1f)];
function animateSteed(g, speed, dt, T) {
  const u = g.userData, run = clamp(speed / 7, 0, 1), moving = speed > .4;
  u.ph += dt * (moving ? (3 + speed * 1.15) * (STEEDS[u.k].lr || 1) : 0);
  const amp = moving ? .25 + .55 * run : 0, p = u.ph, biped = u.legs.length === 2;
  if (biped) { u.legs[0].rotation.x = Math.sin(p) * amp * 1.2; u.legs[1].rotation.x = Math.sin(p + Math.PI) * amp * 1.2; }
  else { const ph = [0, .55, Math.PI, Math.PI + .55]; u.legs.forEach((l, i) => { l.rotation.x = Math.sin(p + ph[i]) * amp; }); }
  const bob = moving ? Math.abs(Math.sin(p)) * .08 * run : Math.sin(T * 1.6) * .008;
  u.torso.position.y = bob; u.torso.rotation.x = moving ? Math.sin(p) * .05 * run : 0;
  u.neck.rotation.x = u.neckBase + (moving ? Math.sin(p + .8) * .14 * run : Math.sin(T * .9) * .04);
  u.tail.rotation.x = u.tailBase + (moving ? .35 * run + Math.sin(p * 2) * .2 : 0);
  u.tail.rotation.z = moving ? 0 : Math.sin(T * 1.7) * .3;
  u.bob = bob * g.scale.y;
  if (!moving) return;
  const id = STEEDS[u.k].id;
  const boost = !!u.boost;
  if (id === "redhare" && Math.random() < .9) u.hooves.forEach(h => { if (Math.random() < (boost ? 1 : .55)) { h.getWorldPosition(hoofW); sparksS.emit(hoofW.x, hoofW.y + .05, hoofW.z, rnd(-.4, .4), rnd(.8, 2.2), rnd(-.4, .4), FIRE_C[Math.floor(Math.random() * 3)], rnd(.25, .5), -1.5, 3); } });
  if (id === "redhare" && boost) for (let i = 0; i < 6; i++) { u.torso.getWorldPosition(hoofW); sparksM.emit(hoofW.x + rnd(-.4, .4), hoofW.y + rnd(.4, 1), hoofW.z + rnd(-.4, .4), rnd(-.6, .6), rnd(.5, 2), rnd(-.6, .6), FIRE_C[i % 3], rnd(.3, .6), -1, 3); }
  if (id === "unicorn") for (let i = 0; i < (boost ? 14 : 3); i++) { u.tail.getWorldPosition(hoofW); sparksS.emit(hoofW.x + rnd(-.2, .2), hoofW.y + rnd(-.3, .2), hoofW.z + rnd(-.2, .2), rnd(-.3, .3), rnd(-.1, .6), rnd(-.3, .3), FW_COLS[Math.floor(Math.random() * FW_COLS.length)], rnd(.6, 1.1), .3, 2); }
}
// hang a steed under an avatar (the avatar sits on the saddle); k = null takes it away
function avatarSteed(av, k, speed, dt, boost) {
  const u = av.userData;
  if (u.steed && (k == null || u.steedK !== k)) { u.steed.parent.remove(u.steed); u.steed = null; }
  if (k == null) return;
  if (!u.steed) { u.steed = makeSteed(k); u.steedK = k; av.add(u.steed); }
  u.steed.position.y = -u.steed.userData.rideY; u.steed.userData.boost = !!boost;
  animateSteed(u.steed, speed, dt, T);
  u.inner.position.y += u.steed.userData.bob || 0;
}
const steedRideY = k => { const g = steedCache[k] || (steedCache[k] = makeSteed(k)); return g.userData.rideY; };
const steedCache = {};
