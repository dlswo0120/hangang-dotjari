/* ================= avatars ================= */
const MAT_STYLES = [["#3f8f6b", "#efe6c6"], ["#3b6ea8", "#f2e9cf"], ["#c85a4a", "#f5e4c4"], ["#d9a441", "#fff4da"], ["#7a6ab0", "#efe8dc"]];
const matTex = MAT_STYLES.map(([a, b]) => {
  const c = document.createElement("canvas"); c.width = 64; c.height = 96; const x = c.getContext("2d");
  x.fillStyle = b; x.fillRect(0, 0, 64, 96); x.fillStyle = a; for (let i = 0; i < 96; i += 16) x.fillRect(0, i, 64, 8); x.fillRect(0, 0, 4, 96); x.fillRect(60, 0, 4, 96);
  return new THREE.CanvasTexture(c);
});
const SHIRTS = [0xe9a46b, 0x7fa7c9, 0x9cc59a, 0xe7c86b, 0xc99ad6, 0xef8f8f];
const skinM = mat(0xf2c9a0), cheekM = new THREE.MeshBasicMaterial({ color: 0xf0a3a0 }), eyeM = new THREE.MeshBasicMaterial({ color: 0x2a201c }), pantsM = mat(0x4a5361);
const tubeMs = [mat(0xff7a3d), mat(0xfaf6ee)];

function nameSprite(text, mine) {
  const c = document.createElement("canvas"); c.width = 256; c.height = 64; const x = c.getContext("2d");
  x.font = "28px 'Gowun Dodum', sans-serif";
  const w = Math.min(240, x.measureText(text).width + 34), l = (256 - w) / 2;
  x.fillStyle = mine ? "rgba(241,178,107,.92)" : "rgba(16,20,28,.62)";
  x.beginPath(); if (x.roundRect) x.roundRect(l, 10, w, 44, 22); else x.rect(l, 10, w, 44); x.fill();
  x.fillStyle = mine ? "#2a1a0b" : "#f4efe6"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, 128, 33);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false, transparent: true }));
  s.scale.set(1.9, 0.48, 1); return s;
}
// ---------- character rig: one body, many poses, smooth transitions ----------
const POSES = {
  stand: { hipY: .48, pitch: 0, lift: 0, thL: 0, thR: 0, knL: 0, knR: 0, arL: 0, arR: 0, azL: .12, azR: .12, lean: 0, nod: 0, matZ: -.15, matP: 0, tube: 0, label: 2.1 },
  kneel: { hipY: .3, pitch: 0, lift: 0, thL: .25, thR: .25, knL: -1.75, knR: -1.75, arL: 1.25, arR: 1.25, azL: .05, azR: .05, lean: .55, nod: .25, matZ: -.15, matP: 0, tube: 0, label: 1.9 },
  sit: { hipY: .13, pitch: 0, lift: 0, thL: 1.42, thR: 1.42, knL: -.45, knR: -.45, arL: .55, arR: .55, azL: .18, azR: .18, lean: -.05, nod: -.05, matZ: -.15, matP: 1, tube: 0, label: 1.8 },
  lie: { hipY: .3, pitch: Math.PI / 2, lift: .24, thL: .08, thR: -.04, knL: -.05, knR: -.15, arL: -.1, arR: -.1, azL: .35, azR: .35, lean: 0, nod: -.2, matZ: .5, matP: 1, tube: 0, label: 1.0 },
  stool: { hipY: .46, pitch: 0, lift: 0, thL: 1.5, thR: 1.5, knL: -1.35, knR: -1.35, arL: .7, arR: .7, azL: .1, azR: .1, lean: .05, nod: .05, matZ: -.15, matP: 0, tube: 0, label: 2.05 },
  bench: { hipY: .6, pitch: 0, lift: 0, thL: 1.5, thR: 1.5, knL: -1.45, knR: -1.45, arL: .45, arR: .45, azL: .15, azR: .15, lean: -.08, nod: 0, matZ: -.15, matP: 0, tube: 0, label: 2.2 },
  boat: { hipY: .06, pitch: 0, lift: 0, thL: 1.35, thR: 1.35, knL: -.9, knR: -.9, arL: .5, arR: .5, azL: .2, azR: .2, lean: -.05, nod: 0, matZ: -.15, matP: 0, tube: 0, label: 1.85 },
  bike: { hipY: 0, pitch: 0, lift: 0, thL: 1.2, thR: 1.2, knL: -1, knR: -1, arL: 1.25, arR: 1.25, azL: .05, azR: .05, lean: .35, nod: -.2, matZ: -.15, matP: 0, tube: 0, label: 1.6 },
  swim: { hipY: .3, pitch: Math.PI / 2, lift: .3, thL: 0, thR: 0, knL: 0, knR: 0, arL: 0, arR: 0, azL: .3, azR: .3, lean: 0, nod: -.3, matZ: .5, matP: 0, tube: 0, label: .95 },
  tube: { hipY: .12, pitch: 0, lift: 0, thL: .3, thR: .3, knL: -.4, knR: -.4, arL: .2, arR: .2, azL: 1.15, azR: 1.15, lean: -.1, nod: -.1, matZ: -.15, matP: 0, tube: 1, label: 1.85 }
};
const POSE_KEYS = Object.keys(POSES.stand);
const skin2 = mat(0xffdcc2), whiteM2 = mat(0xfffaf2), shortsM = mat(0x3e4a63), sockM = mat(0xffffff);
const shoeBoy = mat(0xf3f1ec), shoeGirl = mat(0xb5434f), bowM = mat(0xff7fa3), eyeHi = new THREE.MeshBasicMaterial({ color: 0xffffff });
const blushM = new THREE.MeshBasicMaterial({ color: 0xffa9a9, transparent: true, opacity: .75 }), mouthM = new THREE.MeshBasicMaterial({ color: 0x8a3d32 });
const G_SPH = new THREE.SphereGeometry(1, 20, 14), G_SPH_S = new THREE.SphereGeometry(1, 10, 8);
function makeAvatar({ g, c, pose, name, mine, matStyle }) {
  const col = SHIRTS[c % SHIRTS.length], top = mat(col), topD = mat(new THREE.Color(col).multiplyScalar(.8).getHex());
  const hairM = mat(g === "f" ? 0x5b3a2b : 0x2f2723, { side: THREE.DoubleSide });
  const root = new THREE.Group(), inner = new THREE.Group(), hips = new THREE.Group(), torso = new THREE.Group(), head = new THREE.Group();
  root.add(inner); inner.add(hips); hips.add(torso); torso.add(head); head.position.y = .84;
  const add = (parent, geo, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); parent.add(o); return o; };
  // body and clothes
  add(torso, new THREE.CylinderGeometry(.19, .24, .42, 16), top, 0, .21, 0);
  add(torso, G_SPH, top, 0, .41, 0, .19, .07, .19);
  add(torso, new THREE.CylinderGeometry(.075, .085, .1, 10), skin2, 0, .46, 0);
  if (g === "f") {
    add(torso, new THREE.CylinderGeometry(.2, .37, .32, 20), top, 0, .0, 0);
    add(torso, new THREE.CylinderGeometry(.372, .372, .04, 20), whiteM2, 0, -.15, 0);
    const collar = add(torso, new THREE.TorusGeometry(.13, .035, 6, 18), whiteM2, 0, .43, 0); collar.rotation.x = Math.PI / 2;
    [-1, 1].forEach(k => { const b = add(torso, G_SPH_S, bowM, k * .055, .36, -.2, .06, .04, .03); b.rotation.z = k * .4; });
  } else {
    add(torso, new THREE.CylinderGeometry(.245, .25, .17, 16), shortsM, 0, .0, 0);
    const hood = add(torso, new THREE.TorusGeometry(.13, .065, 8, 16), topD, 0, .45, .1); hood.rotation.x = Math.PI / 2.6;
    add(torso, new THREE.BoxGeometry(.24, .09, .03), topD, 0, .12, -.232);
    [-1, 1].forEach(k => add(torso, new THREE.CylinderGeometry(.008, .008, .12, 4), whiteM2, k * .05, .32, -.205));
  }
  // head and face (face looks toward -z)
  add(head, new THREE.SphereGeometry(.44, 28, 20), skin2);
  [-1, 1].forEach(k => {
    add(head, G_SPH_S, skin2, k * .43, -.05, 0, .06, .1, .08);
    add(head, G_SPH, eyeM, k * .15, -.04, -.405, .055, .075, .03);
    add(head, G_SPH_S, eyeHi, k * .15 + .02, -.015, -.43, .018, .018, .01);
    add(head, G_SPH_S, blushM, k * .26, -.15, -.35, .065, .035, .02);
  });
  const mouth = add(head, new THREE.TorusGeometry(.04, .011, 6, 12, Math.PI), mouthM, 0, -.15, -.425); mouth.rotation.z = Math.PI;
  const cap = add(head, new THREE.SphereGeometry(.465, 28, 18, 0, Math.PI * 2, 0, Math.PI * .56), hairM); cap.rotation.x = .38;
  const fringeZ = (x, y) => -Math.sqrt(Math.max(0, .465 * .465 - x * x - y * y)) + .04;
  if (g === "f") {
    [-.2, 0, .2].forEach((x, i) => { const b = add(head, G_SPH, hairM, x, .13, fringeZ(x, .13), .16, .1, .07); b.rotation.z = (i - 1) * -.35; });
    // long hair stays strictly behind the face (z > 0) so nothing hangs under the chin
    add(head, new THREE.SphereGeometry(.5, 24, 16, 0, Math.PI, Math.PI * .22, Math.PI * .58), hairM, 0, -.02, .02);
    [-1, 1].forEach(k => {
      add(head, G_SPH, hairM, k * .36, .33, .12, .15, .15, .15);
      const b1 = add(head, G_SPH_S, bowM, k * .28, .45, .02, .07, .045, .03); b1.rotation.z = k * .5;
      const b2 = add(head, G_SPH_S, bowM, k * .4, .47, .02, .07, .045, .03); b2.rotation.z = -k * .5;
    });
  } else {
    [-.24, -.08, .08, .24].forEach((x, i) => { const b = add(head, G_SPH, hairM, x, .12, fringeZ(x, .12), .12, .1, .06); b.rotation.z = (i % 2 ? .3 : -.3); });
    const tuft = add(head, new THREE.ConeGeometry(.05, .2, 6), hairM, .04, .5, .02); tuft.rotation.z = -.6;
  }
  // limbs
  const legs = [], knees = [], arms = [];
  [-1, 1].forEach(k => {
    const lp = new THREE.Group(); lp.position.set(k * .1, 0, 0); hips.add(lp);
    add(lp, new THREE.CylinderGeometry(.075, .068, .22, 10), skin2, 0, -.11, 0);
    const kp = new THREE.Group(); kp.position.y = -.22; lp.add(kp);
    add(kp, new THREE.CylinderGeometry(.068, .06, .2, 10), g === "f" ? sockM : skin2, 0, -.1, 0);
    if (g !== "f") add(kp, new THREE.CylinderGeometry(.063, .062, .06, 10), sockM, 0, -.17, 0);
    add(kp, G_SPH, g === "f" ? shoeGirl : shoeBoy, 0, -.22, -.035, .085, .055, .125);
    legs.push(lp); knees.push(kp);
    const ap = new THREE.Group(); ap.position.set(k * .25, .36, 0); torso.add(ap);
    if (g === "f") { add(ap, new THREE.CylinderGeometry(.075, .065, .1, 10), top, 0, -.04, 0); add(ap, new THREE.CylinderGeometry(.05, .048, .18, 8), skin2, 0, -.17, 0); }
    else add(ap, new THREE.CylinderGeometry(.062, .056, .25, 10), top, 0, -.12, 0);
    add(ap, G_SPH_S, skin2, 0, -.29, 0, .065, .065, .065);
    arms.push(ap);
  });
  root.traverse(o => { if (o.isMesh) o.castShadow = true; });
  // picnic mat that rolls out
  let matG = null, roll = null;
  if (matStyle != null) {
    const mm = new THREE.MeshLambertMaterial({ map: matTex[matStyle % matTex.length] });
    matG = new THREE.Group(); root.add(matG);
    const mesh = add(matG, new THREE.PlaneGeometry(MAT_W, MAT_L), mm, 0, .035, -MAT_L / 2); mesh.rotation.x = -Math.PI / 2; mesh.receiveShadow = true;
    roll = add(root, new THREE.CylinderGeometry(1, 1, MAT_W, 14), mm); roll.rotation.z = Math.PI / 2; roll.castShadow = true;
  }
  const tubeG = new THREE.Group(); root.add(tubeG);
  for (let i = 0; i < 6; i++) { const seg = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.17, 8, 8, Math.PI / 3), tubeMs[i % 2]); seg.rotation.x = Math.PI / 2; seg.rotation.z = i * Math.PI / 3; seg.position.y = 0.42; tubeG.add(seg); }
  let sprite = null;
  if (name) { sprite = nameSprite(name, mine); root.add(sprite); }
  Object.assign(root.userData, { inner, hips, torso, head, legs, knees, arms, matG, roll, tubeG, sprite, cur: Object.assign({}, POSES[pose || "stand"]), queue: [], pose: pose || "stand", st: null, tubeOn: false, phase: Math.random() * 6, h: 2.1, seed: Math.random() * 10 });
  applyRig(root, root.userData.cur);
  return root;
}
function planMoves(from, to) {
  const T = (pose, dur, o) => ({ pose, dur, o: o || {} });
  if (to === "sit") { if (from === "lie") return [T("sit", .6, { matP: 1 })]; if (from === "walk") return [T("kneel", .55, { matP: 1 }), T("sit", .45)]; }
  if (to === "lie") { if (from === "sit") return [T("lie", .65)]; if (from === "walk") return [T("kneel", .55, { matP: 1 }), T("sit", .35), T("lie", .55)]; }
  if (to === "stand") {
    if (from === "sit") return [T("kneel", .55, { matP: 0 }), T("stand", .4)];
    if (from === "lie") return [T("sit", .5), T("kneel", .55, { matP: 0 }), T("stand", .4)];
  }
  if (to === "bench") return [T("bench", .55)];
  if (to === "stool") return [T("stool", .5)];
  return [T(to, .35)];
}
function setAvatarState(av, st, tube, instant) {
  const u = av.userData, to = st === "walk" ? "stand" : st === "swim" ? (tube ? "tube" : "swim") : st;
  if (u.st === st && u.tubeOn === !!tube) return;
  const from = u.st; u.st = st; u.tubeOn = !!tube; u.pose = to;
  if (instant || from === null) { u.queue = []; u.cur = Object.assign({}, POSES[to]); return; }
  u.queue = planMoves(from, to).map(m => ({ to: Object.assign({}, POSES[m.pose], m.o), dur: m.dur, t: 0, from: null }));
}
const ease = x => x * x * (3 - 2 * x);
function updateAvatar(av, dt, t, o = {}) {
  const u = av.userData, cur = u.cur;
  if (u.queue.length) {
    const q = u.queue[0]; if (!q.from) q.from = Object.assign({}, cur);
    q.t += dt; const k = ease(Math.min(1, q.t / q.dur));
    for (const key of POSE_KEYS) cur[key] = q.from[key] + (q.to[key] - q.from[key]) * k;
    if (q.t >= q.dur) u.queue.shift();
  }
  const v = Object.assign({}, cur), busy = u.queue.length > 0, ph = t + u.seed;
  if (!busy) {
    if (u.pose === "stand") {
      if (o.moving) {
        const fast = (o.speed || 0) > 5, amp = fast ? .8 : .5;
        u.phase += dt * Math.max(2.5, o.speed || 3) * 2.5;
        const s = Math.sin(u.phase);
        v.thL += s * amp; v.thR -= s * amp;
        v.knL -= Math.max(0, Math.sin(u.phase + 1.3)) * amp * 1.3; v.knR -= Math.max(0, Math.sin(u.phase + 1.3 + Math.PI)) * amp * 1.3;
        v.arL -= s * amp * .9; v.arR += s * amp * .9;
        v.hipY += Math.abs(Math.cos(u.phase)) * .045; v.lean += fast ? .2 : .05;
      } else { v.nod += Math.sin(ph * .7) * .04; v.arL += Math.sin(ph * 1.1) * .03; v.arR += Math.sin(ph * 1.1 + 1) * .03; }
    } else if (u.pose === "sit") { v.knL += Math.sin(ph * 1.6) * .08; v.knR += Math.sin(ph * 1.6 + 2) * .08; v.nod += Math.sin(ph * .5) * .06; }
    else if (u.pose === "stool") { v.knL += Math.sin(ph * 1.8) * .12; v.knR += Math.sin(ph * 1.8 + 2) * .12; v.nod += Math.sin(ph * .5) * .05; }
    else if (u.pose === "bench") { v.knL += Math.sin(ph * 2.2) * .28; v.knR += Math.sin(ph * 2.2 + Math.PI) * .28; v.nod += Math.sin(ph * .5) * .05; }
    else if (u.pose === "lie") { v.nod += Math.sin(ph * .4) * .05; }
    else if (u.pose === "swim") {
      u.phase += dt * (o.moving ? 3.2 : 1.2);
      v.arL = u.phase; v.arR = u.phase + Math.PI; v.thL += Math.sin(ph * 9) * .3; v.thR -= Math.sin(ph * 9) * .3;
    } else if (u.pose === "tube") { v.thL += Math.sin(ph * 3) * .35; v.thR -= Math.sin(ph * 3) * .35; }
    else if (u.pose === "boat" || u.pose === "bike") {
      if (o.seat === 2) { v.knL += Math.sin(ph * 2) * .3; v.knR += Math.sin(ph * 2 + Math.PI) * .3; v.arL = .3; v.arR = .3; v.azL = v.azR = .5; }
      else { const c = o.crank || 0; v.thL = POSES[u.pose].thL + Math.sin(c) * .32; v.knL = POSES[u.pose].knL - .1 - Math.cos(c) * .42; v.thR = POSES[u.pose].thR + Math.sin(c + Math.PI) * .32; v.knR = POSES[u.pose].knR - .1 - Math.cos(c + Math.PI) * .42; }
    }
  }
  // carrying and eating: the ramen bowl or a snack from the store
  const realKind = o.hold === true ? "ramen" : (o.hold || null), isChicken = !!(PRODUCTS[realKind] && PRODUCTS[realKind].cat === "chicken");
  // eating chicken while seated: the box goes down in front and a drumstick comes up in hand
  const boxEat = isChicken && o.eatT >= 0 && (u.pose === "sit" || u.pose === "stool" || u.pose === "bench") && !u.queue.length;
  const holdKind = boxEat ? "drumstick" : realKind;
  const holding = !!holdKind && u.pose !== "lie" && u.pose !== "swim" && u.pose !== "tube";
  if (boxEat && !u.chBox) { u.chBox = makeChickenBox(); av.add(u.chBox); }
  if (u.chBox) {
    u.chBox.visible = boxEat;
    if (boxEat) { u.chBox.position.set(0, .02, -.75); const left = 1 - Math.min(1, o.eatT / eatTime(realKind)); u.chBox.userData.pieces.forEach((p, i) => { p.visible = i < Math.ceil(left * 10); }); }
  }
  if (holding && (!u.bowl || u.heldKind !== holdKind)) {
    if (u.bowl) u.torso.remove(u.bowl);
    u.bowl = makeHeld(holdKind); u.heldKind = holdKind; u.torso.add(u.bowl);
    if (!u.chop) {
      const ch = new THREE.Group(), stick = new THREE.CylinderGeometry(.006, .006, .26, 4), wood = mat(0xd8b479);
      [-.012, .012].forEach(x => { const c = new THREE.Mesh(stick, wood); c.position.set(x, -.3, -.1); c.rotation.x = Math.PI / 2.3; ch.add(c); });
      u.arms[1].add(ch); u.chop = ch;
    }
  }
  if (u.bowl) { u.bowl.visible = holding; u.chop.visible = holding && o.eatT >= 0 && (holdKind === "ramen" || holdKind === "gangjeong" || holdKind === "chicken" || holdKind === "halfchk"); }
  const bk = typeof o.basket === "number" ? o.basket : -1;
  if (bk >= 0) {
    if (!u.basketM) { u.basketM = makeBasket(); u.arms[0].add(u.basketM); u.basketM.position.set(0, -.4, 0); }
    u.basketM.visible = true; setBasketCount(u.basketM, bk);
    if (!holding) { v.arL = .15 + Math.sin(ph * 3) * .04; v.azL = .22; }
    u.basketM.rotation.x = -v.arL;
  } else if (u.basketM) u.basketM.visible = false;
  if (holding) {
    v.arL = 1.05; v.arR = 1.05; v.azL = -.28; v.azR = -.28;
    let by = .2, bz = -.34;
    if (o.eatT >= 0) {
      const e = o.eatT, bite = (e * (isChicken ? .25 : .9)) % 1, lift = Math.max(0, Math.sin(Math.min(1, bite * (isChicken ? 3 : 1)) * Math.PI * 2));
      v.arL = 1.35; v.azL = -.2; v.arR = 1.55 + lift * 1.0 + Math.sin(e * 22) * .05 * lift; v.azR = -.42;
      v.nod += .22 - lift * .12; v.lean += .12; by = .36; bz = -.3;
      if (u.bowl.userData.soup) u.bowl.userData.soup.position.y = .12 - Math.min(1, e / EAT_TIME) * .07;
    } else if (u.bowl.userData.soup) u.bowl.userData.soup.position.y = .12;
    if (o.cheer > 0 && !(o.eatT >= 0)) { const c = o.cheer; v.arL += (2.25 - v.arL) * c; v.arR += (2.25 - v.arR) * c; v.azL = v.azR = -.18; by += .5 * c; bz -= .12 * c; v.nod -= .15 * c; }
    const left = o.eatT >= 0 && holdKind !== "ramen" && holdKind !== "drumstick" ? 1 - Math.min(1, o.eatT / eatTime(holdKind)) * .6 : 1;
    u.bowl.scale.setScalar(left * (u.bowl.userData.base || 1));
    let bx = 0;
    if (o.spin != null) { const a = o.spin; bx = Math.sin(a) * .28; by += .18 + Math.cos(a) * .28; v.arR = 1.6 + Math.cos(a) * .7; v.azR = -.2 + Math.sin(a) * .5; v.arL = .3; v.azL = .2; }
    u.bowl.position.set(bx, by, bz);
    if (u.bowl.userData.tip) u.bowl.userData.tip.visible = !!o.lit;
  }
  v.roll = 0; v.glz = 0;
  if (o.rod && o.fs) rodPose(v, o.fs);
  if (o.emote) emotePose(v, o.emote.i, o.emote.t, u.pose === "stand", u, o.emote.s); else if (u.vR) u.vR.visible = false;
  u.torso.scale.y = 1 + Math.sin(ph * 2.1) * .012;
  if (o.mat === false) v.matP = 0;
  applyRig(av, v);
}
function applyRig(av, v) {
  const u = av.userData;
  u.inner.rotation.x = v.pitch; u.inner.rotation.z = v.roll || 0; u.inner.position.y = v.lift; u.inner.position.z = v.glz || 0; u.hips.position.y = v.hipY;
  u.torso.rotation.x = -v.lean; u.head.rotation.x = -v.nod;
  u.legs[0].rotation.x = v.thL; u.legs[1].rotation.x = v.thR; u.knees[0].rotation.x = v.knL; u.knees[1].rotation.x = v.knR;
  u.arms[0].rotation.set(v.arL, 0, -v.azL); u.arms[1].rotation.set(v.arR, 0, v.azR);
  if (u.matG) {
    const p = clamp(v.matP, 0, 1), back = v.matZ + MAT_L / 2;
    u.matG.visible = p > .02; u.matG.position.z = back; u.matG.scale.z = Math.max(p, .001);
    const r = .025 + .12 * (1 - p); u.roll.visible = p > .02 && p < .985; u.roll.scale.set(r, 1, r); u.roll.position.set(0, r + .02, back - MAT_L * p);
  }
  u.tubeG.visible = v.tube > .02; u.tubeG.scale.setScalar(Math.max(v.tube, .001));
  if (u.sprite) u.sprite.position.y = v.label;
  u.h = v.label;
}

/* NPCs: walkers, runners, cyclists */
const npcs = [];
function makeBike(color) {
  const g = new THREE.Group(), fm = mat(color), tm = mat(0x2a2d31), wheels = [];
  [-0.55, 0.55].forEach(z => { const w = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.045, 6, 18), tm); w.rotation.y = Math.PI / 2; w.position.set(0, 0.34, z); g.add(w); wheels.push(w); });
  const bar = (p1, p2, m = fm, r = 0.035) => { const a = new THREE.Vector3(...p1), b = new THREE.Vector3(...p2), d = b.clone().sub(a); const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 5), m); o.quaternion.setFromUnitVectors(UPV, d.normalize()); o.position.copy(a).add(b).multiplyScalar(0.5); g.add(o); };
  bar([0, .34, .55], [0, .78, .05]); bar([0, .78, .05], [0, .82, -.45]); bar([0, .34, -.55], [0, .82, -.45]); bar([0, .34, .55], [0, .42, -.05]); bar([0, .42, -.05], [0, .78, .05]);
  bar([0, .82, -.45], [0, .98, -.5]); bar([-.26, .98, -.5], [.26, .98, -.5], tm, 0.03);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 0.26), tm); seat.position.set(0, 0.82, 0.1); g.add(seat);
  const basket = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.26), mat(0xc9a46a)); basket.position.set(0, 0.88, -0.72); g.add(basket);
  g.userData.wheels = wheels; return g;
}
function addNpc(o) {
  const n = Object.assign({ off: 0, toff: 0, offUntil: 0, sayAt: -99, bellAt: -99, nextBell: 4 + Math.random() * 12 }, o);
  if (o.kind === "bike") {
    const g = new THREE.Group(), bike = makeBike(o.color), rider = makeAvatar({ g: o.g, c: o.c, pose: "bike" });
    setAvatarState(rider, "bike", false, true); rider.position.set(0, 0.84, 0.08);
    g.add(bike); g.add(rider); g.userData.h = 2.4; n.obj = g; n.bike = bike; n.rider = rider; n.crank = 0;
    bike.traverse(m => { if (m.isMesh) m.castShadow = true; });
  } else { n.obj = makeAvatar({ g: o.g, c: o.c, pose: "stand" }); setAvatarState(n.obj, "walk", false, true); }
  scene.add(n.obj); npcs.push(n); return n;
}
addNpc({ kind: "walk", g: "f", c: 4, x: -40, dir: 1, speed: 1.4, lane: 28.2, dog: true });
addNpc({ kind: "walk", g: "m", c: 3, x: 40, dir: 1, speed: 1.1, lane: 29.6 });
addNpc({ kind: "run", g: "m", c: 1, x: 100, dir: -1, speed: 3.8, lane: 29.9 });
addNpc({ kind: "run", g: "f", c: 5, x: -60, dir: 1, speed: 3.3, lane: 29.1 });
addNpc({ kind: "run", g: "m", c: 2, x: -85, dir: 1, speed: 4.2, lane: 29.1 });
addNpc({ kind: "bike", g: "m", c: 0, x: -70, dir: 1, speed: 7.5, lane: 31.9, color: 0x5aa0d8 });
addNpc({ kind: "bike", g: "f", c: 3, x: 130, dir: -1, speed: 8.5, lane: 32.9, color: 0xe07a5f });
addNpc({ kind: "bike", g: "f", c: 2, x: 20, dir: 1, speed: 6.4, lane: 31.9, color: 0x8fbf7a });
const dog = new THREE.Group();
{ const fur = mat(0xd9b07a), dark = mat(0x6b4a30);
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.7), fur); b.position.y = 0.38; dog.add(b);
  const h = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), fur); h.position.set(0, 0.62, -0.42); dog.add(h);
  [-0.11, 0.11].forEach(k => { const e = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.16, 0.1), dark); e.position.set(k, 0.76, -0.4); dog.add(e); });
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.3, 6), fur); tail.position.set(0, 0.6, 0.38); tail.rotation.x = -0.8; dog.add(tail); dog.userData.tail = tail;
  dog.userData.legs = [];
  [[-0.11, -0.25], [0.11, -0.25], [-0.11, 0.25], [0.11, 0.25]].forEach(([x, z]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.26, 0.08), fur); l.position.set(x, 0.13, z); dog.add(l); dog.userData.legs.push(l); });
}
scene.add(dog);

/* speech bubbles */
const bubbles = [];
function bubbleSprite(text) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 128; const x = c.getContext("2d");
  x.font = "44px 'Gowun Dodum', sans-serif";
  const w = Math.min(496, x.measureText(text).width + 56), l = (512 - w) / 2;
  x.fillStyle = "rgba(255,252,246,.96)"; x.beginPath();
  if (x.roundRect) x.roundRect(l, 8, w, 84, 42); else x.rect(l, 8, w, 84);
  x.moveTo(244, 90); x.lineTo(256, 116); x.lineTo(270, 90); x.fill();
  x.fillStyle = "#2a2420"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, 256, 51);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false, transparent: true }));
  s.scale.set(2.6, 0.65, 1); s.renderOrder = 5; return s;
}
function showBubble(getObj, text, dur, key) {
  for (let i = bubbles.length - 1; i >= 0; i--) if (bubbles[i].key === key) { scene.remove(bubbles[i].s); bubbles.splice(i, 1); }
  const s = bubbleSprite(text); scene.add(s); bubbles.push({ getObj, s, until: T + dur, dur, key });
}

