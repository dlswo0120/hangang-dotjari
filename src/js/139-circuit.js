/* ================= 한강 동물 레이스: 서킷 · 2~4명 · 랜덤 동물 · 3바퀴 ================= */
// A small racing circuit east of the second bridge, with a hairpin, an S-section and a chicane.
// Everyone gets a random animal for free when the race starts; the stake is the only cost.
const CIRC_PTS = [[160, 22.5], [178, 22.5], [193, 22.3], [201, 19.5], [204, 13.5], [203.5, 7.5], [199, 4.8], [194.5, 6.5], [193.5, 11.5], [189, 15.5], [183, 13.5], [179, 8.5], [173, 7], [168, 10.5], [163, 8], [155, 5.2], [148, 6.8], [145.5, 12], [147.5, 17.5], [152.5, 19.8]];
const CIRC_W = 5.4, CIRC_LAPS = 3, CIRC_COUNT = 3000, CIRC_LIMIT = 120000, CIRC_N = 600;
const CIRC_GATE = [158, 25.6];
const circ = (() => {
  const curve = new THREE.CatmullRomCurve3(CIRC_PTS.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, "centripetal");
  const pts = curve.getSpacedPoints(CIRC_N), len = curve.getLength();
  const P = [], T = [], Nn = [], K = [];
  for (let i = 0; i < CIRC_N; i++) {
    const a = pts[i], b = pts[(i + 1) % CIRC_N]; P.push([a.x, a.z]);
    const tx = b.x - a.x, tz = b.z - a.z, l = Math.hypot(tx, tz); T.push([tx / l, tz / l]);
    Nn.push([tz / l, -tx / l]); // left of the direction of travel
  }
  for (let i = 0; i < CIRC_N; i++) { // signed curvature, + turning left
    const a = T[(i - 3 + CIRC_N) % CIRC_N], b = T[(i + 3) % CIRC_N], ds = len / CIRC_N * 6;
    K.push((a[0] * b[1] - a[1] * b[0]) / ds * -1);
  }
  // smooth the curvature a little
  const Ks = K.map((_, i) => { let s = 0; for (let j = -4; j <= 4; j++) s += K[(i + j + CIRC_N) % CIRC_N]; return s / 9; });
  return { P, T, N: Nn, K: Ks, len };
})();
function circAt(s) { // position, direction, left normal and curvature at distance s along the centre line
  const L = circ.len, f = ((s % L) + L) % L / L * CIRC_N, i = Math.floor(f) % CIRC_N, j = (i + 1) % CIRC_N, t = f - Math.floor(f);
  const p = circ.P[i], q = circ.P[j];
  return { x: p[0] + (q[0] - p[0]) * t, z: p[1] + (q[1] - p[1]) * t, t: circ.T[i], n: circ.N[i], k: circ.K[i] };
}

/* the track itself */
{
  const N = CIRC_N, L = circ.len, half = CIRC_W / 2;
  const ribbon = (inner, outer, y, vScale) => {
    const pos = [], uv = [], idx = [];
    for (let i = 0; i <= N; i++) {
      const k = i % N, p = circ.P[k], n = circ.N[k], v = i / N * L / vScale;
      pos.push(p[0] + n[0] * inner, y, p[1] + n[1] * inner, p[0] + n[0] * outer, y, p[1] + n[1] * outer); uv.push(0, v, 1, v);
      if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals(); return geo;
  };
  const dirt = canvasTex(128, 256, (x, W, H) => {
    x.fillStyle = "#b9875a"; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 900; i++) { x.fillStyle = Math.random() < .5 ? "rgba(90,55,30,.18)" : "rgba(255,230,190,.16)"; x.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
    x.fillStyle = "rgba(255,255,255,.9)"; x.fillRect(5, 0, 4, H); x.fillRect(W - 9, 0, 4, H);
    x.fillStyle = "rgba(255,255,255,.35)"; for (let y = 0; y < H; y += 64) x.fillRect(W / 2 - 1, y, 2, 32);
  }, 1, 1);
  dirt.wrapT = THREE.RepeatWrapping;
  const road = new THREE.Mesh(ribbon(half, -half, .05, 6), new THREE.MeshLambertMaterial({ map: dirt, side: THREE.DoubleSide })); road.receiveShadow = true; scene.add(road);
  // red and white kerbs on the corners only
  const kerbT = canvasTex(16, 64, (x, W, H) => { x.fillStyle = "#e0433a"; x.fillRect(0, 0, W, H / 2); x.fillStyle = "#f6f6f6"; x.fillRect(0, H / 2, W, H / 2); }, 1, 1); kerbT.wrapT = THREE.RepeatWrapping;
  const kerbM = new THREE.MeshLambertMaterial({ map: kerbT, side: THREE.DoubleSide });
  [1, -1].forEach(side => {
    let start = -1;
    for (let i = 0; i <= N; i++) {
      const on = i < N && Math.abs(circ.K[i]) > .07 && Math.sign(circ.K[i]) === -side; // the outside of each bend
      if (on && start < 0) start = i;
      if (!on && start >= 0) {
        const pos = [], uv = [], idx = [];
        for (let j = start; j <= i; j++) { const p = circ.P[j % N], n = circ.N[j % N], a = side * half, b = side * (half + .55), v = j / N * L / 1.2; pos.push(p[0] + n[0] * a, .06, p[1] + n[1] * a, p[0] + n[0] * b, .06, p[1] + n[1] * b); uv.push(0, v, 1, v); if (j < i) { const q = (j - start) * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); } }
        const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
        scene.add(new THREE.Mesh(geo, kerbM)); start = -1;
      }
    }
  });
  // white wooden fence on both sides
  const postG = new THREE.BoxGeometry(.1, .7, .1), railG = new THREE.BoxGeometry(.06, .07, 1), wood = mat(0xf4f1ea);
  const spots = []; for (let s = 0; s < L; s += 2.2) spots.push(s);
  const posts = new THREE.InstancedMesh(postG, wood, spots.length * 2), rails = new THREE.InstancedMesh(railG, wood, spots.length * 4);
  const d = new THREE.Object3D(); let pi = 0, ri = 0;
  [1, -1].forEach(side => spots.forEach((s, i) => {
    const off = side * (half + .9), a = circAt(s), b = circAt(spots[(i + 1) % spots.length] || L);
    // skip the start/finish straight's gate opening on the near side
    const ax = a.x + a.n[0] * off, az = a.z + a.n[1] * off, bx = b.x + b.n[0] * off, bz = b.z + b.n[1] * off;
    d.position.set(ax, .35, az); d.rotation.set(0, 0, 0); d.scale.set(1, 1, 1); d.updateMatrix(); posts.setMatrixAt(pi++, d.matrix);
    const len = Math.hypot(bx - ax, bz - az);
    [.3, .58].forEach(h => { d.position.set((ax + bx) / 2, h, (az + bz) / 2); d.rotation.set(0, Math.atan2(bx - ax, bz - az), 0); d.scale.set(1, 1, len); d.updateMatrix(); rails.setMatrixAt(ri++, d.matrix); });
  }));
  posts.castShadow = rails.castShadow = true; scene.add(posts, rails);
  // checkered start/finish line and a gate over it
  const a0 = circAt(0), chk = canvasTex(128, 32, (x, W, H) => { for (let r = 0; r < 2; r++) for (let c = 0; c < 8; c++) { x.fillStyle = (r + c) % 2 ? "#fff" : "#222"; x.fillRect(c * W / 8, r * H / 2, W / 8, H / 2); } }, 1, 1);
  const line = new THREE.Mesh(new THREE.PlaneGeometry(CIRC_W, .9), new THREE.MeshLambertMaterial({ map: chk })); line.rotation.x = -Math.PI / 2; line.rotation.z = Math.atan2(a0.t[1], a0.t[0]) * -1 + Math.PI / 2; line.rotation.order = "XZY";
  line.position.set(a0.x, .07, a0.z); line.rotation.set(-Math.PI / 2, 0, -Math.atan2(-a0.t[0], -a0.t[1])); scene.add(line);
  [-1, 1].forEach(s => { const p = new THREE.Mesh(new THREE.BoxGeometry(.2, 3.4, .2), mat(0x2a9d8f)); p.position.set(a0.x + a0.n[0] * s * (half + .4), 1.7, a0.z + a0.n[1] * s * (half + .4)); p.castShadow = true; scene.add(p); });
  const ban = new THREE.Mesh(new THREE.PlaneGeometry(CIRC_W + .8, .8), signMat(signTex([["🏁 한강 동물 레이스", 46, .55]], "#2a9d8f", "#ffffff", 512, 72)));
  ban.position.set(a0.x, 3.1, a0.z); ban.rotation.y = Math.atan2(-a0.t[0], -a0.t[1]) + Math.PI; scene.add(ban); const ban2 = ban.clone(); ban2.rotation.y += Math.PI; scene.add(ban2);
  // hay bales on the outside of the hairpin and a few flags
  const hay = mat(0xe6c35c);
  [[206.5, 6], [205.5, 3.6], [203, 2.4], [207, 9]].forEach(([x, z]) => { const h = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .8, 14), hay); h.rotation.z = Math.PI / 2; h.rotation.y = Math.random(); h.position.set(x, .5, z); h.castShadow = true; scene.add(h); });
  [[143, 4], [143, 22], [208, 23], [174, 3.2], [186, 19.2]].forEach(([x, z], i) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 2.6, 6), mat(0xdddddd)); pole.position.set(x, 1.3, z); scene.add(pole);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(.8, .5), new THREE.MeshLambertMaterial({ color: [0xe0433a, 0xf2c14e, 0x2a9d8f, 0x6c5ce7, 0xff8fab][i], side: THREE.DoubleSide })); fl.position.set(x + .4, 2.3, z); scene.add(fl);
  });
  // rules board at the gate
  const [gx, gz] = CIRC_GATE;
  const post = new THREE.Mesh(new THREE.BoxGeometry(.12, 2.4, .12), mat(0x3a3d44)); post.position.set(gx, 1.2, gz); scene.add(post);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.5), signMat(signTex([["한강 동물 레이스", 42, .17], ["2~4명 · 판돈 500~2,000원 · 3바퀴", 24, .38], ["동물은 출발할 때 랜덤으로 공짜 배정!", 24, .55], ["Space·W(모바일 🥕) 박자 맞춰 달리기", 22, .72], ["A·D/조이스틱으로 방향 · 안쪽이 빨라요", 22, .87]], "#2a9d8f", "#ffffff", 512, 300)));
  sign.position.set(gx, 2.0, gz - .07); sign.rotation.y = Math.PI; scene.add(sign); const s2 = sign.clone(); s2.rotation.y = 0; s2.position.z = gz + .07; scene.add(s2);
}
const nearCircGate = () => me.level === "ground" && me.st === "walk" && Math.hypot(me.x - CIRC_GATE[0], me.z - CIRC_GATE[1]) < 6;

/* who is in which race — host: me.ac = {id, bet, st, go}  joiner: me.aj = {h, id, at}  progress: me.ap = {id, s, f, k} */
function circOf(hostKey) {
  const host = hostKey === "me" ? { key: "me", peer: myPeer, rc: me.ac, n: me.name } : (() => { const o = others.get(hostKey); return o && o.p.ac ? { key: hostKey, peer: hostKey, rc: o.p.ac, n: o.p.n } : null; })();
  if (!host || !host.rc) return null;
  const list = [{ key: host.key, peer: host.peer, n: host.n, at: host.rc.id }];
  if (host.key !== "me" && me.aj && me.aj.h === host.peer && me.aj.id === host.rc.id) list.push({ key: "me", peer: myPeer, n: me.name, at: me.aj.at });
  for (const [peer, o] of others) if (peer !== host.key && o.p.aj && o.p.aj.h === host.peer && o.p.aj.id === host.rc.id) list.push({ key: peer, peer, n: o.p.n, at: o.p.aj.at });
  list.sort((a, b) => a.at - b.at || (a.key < b.key ? -1 : 1));
  return { host, list: list.slice(0, 4), rc: host.rc };
}
function myCirc() { if (me.ac) return circOf("me"); if (me.aj) return circOf(me.aj.h === myPeer ? "me" : me.aj.h); return null; }
const circProg = key => key === "me" ? me.ap : (others.get(key) || { p: {} }).p.ap;
const circLive = () => { const r = myCirc(); return !!(r && r.rc.st === "go"); };

function circuitActions(acts, status) {
  if (!started || anim || boarded) return status;
  const r = myCirc();
  if (r) {
    acts.length = 0;
    if (r.rc.st !== "go") {
      if (me.ac) { if (r.list.length >= 2) acts.push(["acgo", `출발! (${r.list.length}명)`, "primary"]); acts.push(["accancel", "레이스 취소", ""]); }
      else acts.push(["acleave", "참가 취소", ""]);
      return `🏁 동물 레이스 · 판돈 ${won(r.rc.bet)} · ${r.list.map(m => m.n).join(", ")} · ${r.list.length}/4명` + (me.ac && r.list.length < 2 ? " · 한 명 더 오면 출발할 수 있어요" : "");
    }
    return circStatus(r);
  }
  if (me.st !== "walk" || !nearCircGate()) return status;
  const open = [];
  for (const [peer, o] of others) { const rc = o.p.ac; if (rc && rc.st === "open" && Date.now() - rc.id < 180000) { const q = circOf(peer); if (q && q.list.length < 4) open.push(q); } }
  open.forEach(o => acts.unshift(["acjoin:" + o.host.key, `🏇 ${o.host.n}님 레이스 참가 · ${won(o.rc.bet)}`, "primary"]));
  if (!open.length) { acts.unshift(["acopen", "동물 레이스 열기", "primary"]); status = "한강 동물 레이스 · 출발하면 동물이 랜덤으로 나와요"; }
  return status;
}
function circuitClick(a) {
  const free = () => { if (me.hold || me.basket) { toast("손을 비우고 와 주세요"); return false; } if (me.rc || me.rj || me.fd || me.fj || me.bh || me.bj) { toast("다른 경기에 참가 중이에요"); return false; } return true; };
  if (a === "acopen") { if (free()) openBet("circuit"); return true; }
  if (a.startsWith("acjoin:")) {
    const r = circOf(a.slice(7)); if (!r || r.rc.st !== "open" || r.list.length >= 4) { toast("이미 출발했거나 자리가 없어요"); return true; }
    if (!free()) return true;
    if (wallet.money < r.rc.bet) { toast("판돈이 모자라요"); return true; }
    wallet.money -= r.rc.bet; saveWallet(); me.aj = { h: r.host.peer, id: r.rc.id, at: Date.now(), bet: r.rc.bet }; me.ap = null;
    toast(`${won(r.rc.bet)}을 걸고 참가했어요! 출발하면 어떤 동물이 나올까요?`); return true;
  }
  if (a === "acgo") { const r = myCirc(); if (!r || r.list.length < 2) return true; me.ac.st = "go"; me.ac.go = Date.now() + CIRC_COUNT + 1500; return true; }
  if (a === "accancel" || a === "acleave") {
    const r = myCirc(); if (r && r.rc.st !== "go") { wallet.money += r.rc.bet; saveWallet(); toast("레이스에서 빠졌어요. 판돈을 돌려받았어요"); }
    me.ac = null; me.aj = null; me.ap = null; return true;
  }
  return false;
}
BET_INFO.circuit = ["동물 레이스 판돈", "출발하면 모두에게 동물이 랜덤으로 배정돼요. 동물마다 빠르기·가속·코너링·지구력이 달라요. 서킷 3바퀴를 먼저 도는 사람이 이겨요.", "2명 70·30% · 3명 55·30·15% · 4명 50·25·15·10%"];
BET_FN.circuit = bet => {
  wallet.money -= bet; saveWallet(); me.ac = { id: Date.now(), bet, st: "open" }; me.aj = null; me.ap = null;
  toast(`${won(bet)}을 걸고 동물 레이스를 열었어요. 근처 사람들이 참가할 수 있어요`); publish(true); actKey = ""; refreshActions();
};

/* riding */
const CIRC_VMAX = 11, CARROT_GAP = 230; // taps closer than this (ms) tire the animal
const ride = { id: 0, s: 0, l: 0, v: 0, sta: 1, last: 0, tired: 0, bump: 0, t: 0, lap: 0, k: 1, said: 0, paid: 0, boost: 0, streak: 0, rbLap: -1 };
const steedOf = () => STEEDS[ride.k] || STEEDS[1];
const rideMax = () => CIRC_VMAX * steedOf().v * (ride.boost > 0 ? 1.18 : 1);
function gridSlot(i) { return { s: -3.2 - Math.floor(i / 2) * 3.4, l: (i % 2 ? -1 : 1) * 1.25 }; }
function carrot() {
  const r = myCirc(); if (!r || r.rc.st !== "go" || Date.now() < r.rc.go || (me.ap && me.ap.f)) return;
  const now = performance.now(), gap = now - ride.last; ride.last = now;
  if (ride.tired > 0) return;
  const S = steedOf();
  // 적토마: five taps in a good rhythm light up the 불꽃 질주
  ride.streak = gap > 280 && gap < 700 ? ride.streak + 1 : 0;
  if (S.id === "redhare" && ride.streak >= 5 && ride.boost <= 0) { ride.boost = 2; ride.streak = 0; showBubble(() => myAvatar, "🔥 불꽃 질주!", 1.6, "me"); if (audio.ready) audio.ding(); }
  if (gap < CARROT_GAP) { ride.sta -= .2 * S.ti; if (S.ti > 0 && ride.sta <= 0) { ride.tired = 1.6; ride.sta = .6; ride.v *= .5; showBubble(() => myAvatar, "헥헥… 너무 급했어요", 1.4, "me"); return; } }
  else ride.sta = Math.min(1, ride.sta + .06);
  ride.v = Math.min(rideMax(), ride.v + 1.35 * S.acc);
  if (audio.ready) audio.step("path", Math.random() < .5);
}
addEventListener("keydown", e => {
  if (e.repeat || !circLive()) return; const k = e.key.toLowerCase();
  if (k === " " || k === "w" || k === "arrowup") { e.preventDefault(); carrot(); }
});
$("whipBtn").addEventListener("pointerdown", e => { e.preventDefault(); carrot(); });
function circuitStep(dt, inp) {
  const r = myCirc(); if (!r) return false;
  if (r.rc.st !== "go") { if (me.st === "ride") { me.st = "walk"; rebuildMe(); } return false; }
  const idx = Math.max(0, r.list.findIndex(m => m.key === "me"));
  if (ride.id !== r.rc.id) {
    const g = gridSlot(idx), k = drawSteed(r.rc.id + ":" + myPeer);
    Object.assign(ride, { id: r.rc.id, s: g.s, l: g.l, v: 0, sta: 1, last: 0, tired: 0, bump: 0, t: 0, lap: 0, k, said: 0, boost: 0, streak: 0, rbLap: -1 });
    if (me.hold) { if (me.hold !== "ramen" && wallet.bag.length < BAG_MAX) { wallet.bag.push(me.hold); saveWallet(); } me.hold = null; me.eat = 0; }
    me.st = "ride"; me.em = null; rebuildMe(); me.ap = { id: r.rc.id, s: g.s, f: 0, k };
    const S = STEEDS[k]; toast(`${S.icon} ${S.name}${S.rare ? ` (${RARE_NAME[S.rare]})` : ""}이(가) 나왔어요!`);
    publish(true);
  }
  const pn = performance.now(); dt = Math.min(.25, ride.t ? (pn - ride.t) / 1000 : dt); ride.t = pn;
  const before = Date.now() < r.rc.go, done = me.ap && me.ap.f;
  if (!before) {
    const S = steedOf();
    ride.tired = Math.max(0, ride.tired - dt); ride.bump = Math.max(0, ride.bump - dt); ride.boost = Math.max(0, ride.boost - dt);
    // 유니콘: halfway round every lap, a 3-second 무지개 질주 (no slowing down on the fence)
    const lapNow = Math.floor(Math.max(0, ride.s) / circ.len);
    if (S.id === "unicorn" && !done && ride.s > 0 && ride.s % circ.len > circ.len / 2 && ride.rbLap !== lapNow) { ride.rbLap = lapNow; ride.boost = 3; showBubble(() => myAvatar, "🌈 무지개 질주!", 1.6, "me"); if (audio.ready) audio.chime(); }
    ride.v *= Math.exp(-dt * (done ? 1.2 : .35)); if (ride.tired > 0) ride.v = Math.min(ride.v, 3);
    if (ride.boost > 0 && !done) ride.v = Math.min(rideMax(), ride.v + dt * 5);
    ride.v = Math.min(ride.v, rideMax());
    const c = circAt(ride.s), steer = clamp(inp.r, -1, 1);
    ride.l += -steer * 3.4 * dt - c.k * ride.v * ride.v * .03 * S.cn * dt; // steering, and the bends push you outward
    const lim = CIRC_W / 2 - .45;
    if (Math.abs(ride.l) > lim) { ride.l = Math.sign(ride.l) * lim; if (ride.bump <= 0 && ride.v > 4 && !(S.id === "unicorn" && ride.boost > 0)) { ride.bump = .8; ride.v *= .55; showBubble(() => myAvatar, "쿵!", .8, "me"); if (audio.ready) audio.chomp(.8); } }
    ride.s += ride.v * dt / Math.max(.4, 1 - c.k * ride.l); // the inside line is shorter
  }
  const c = circAt(ride.s);
  me.x = c.x + c.n[0] * ride.l; me.z = c.z + c.n[1] * ride.l; me.y = 0; me.level = "ground";
  me.r = yawFrom(c.t[0], c.t[1]); me.speed = ride.v; me.moving = ride.v > .4;
  if (!done) {
    const lap = Math.floor(Math.max(0, ride.s) / circ.len);
    if (lap > ride.lap && lap < CIRC_LAPS) { ride.lap = lap; showBubble(() => myAvatar, lap === CIRC_LAPS - 1 ? "마지막 바퀴!" : `${lap + 1}바퀴째!`, 1.4, "me"); if (audio.ready) audio.pop(); }
    me.ap = { id: r.rc.id, s: +ride.s.toFixed(1), f: 0, k: ride.k, b: ride.boost > 0 ? 1 : 0 };
    if (ride.s >= CIRC_LAPS * circ.len) { me.ap.f = Date.now() - r.rc.go; if (audio.ready) audio.ding(); showBubble(() => myAvatar, `골인! ${(me.ap.f / 1000).toFixed(1)}초`, 2.5, "me"); publish(true); }
  }
  return true;
}
function circStatus(r) {
  if (Date.now() < r.rc.go) return `🏁 출발 준비! ${touchy ? "🥕 버튼" : "Space·W"}를 박자 맞춰 눌러 달려요 · ${touchy ? "조이스틱" : "A·D"}로 방향`;
  if (me.ap && me.ap.f) return `🏁 골인! ${(me.ap.f / 1000).toFixed(1)}초 · 다른 선수를 기다려요`;
  const rank = 1 + r.list.filter(m => m.key !== "me" && ((circProg(m.key) || {}).f || (circProg(m.key) || {}).s > ride.s)).length;
  const bar = "■".repeat(Math.round(ride.sta * 5)) + "□".repeat(5 - Math.round(ride.sta * 5));
  const S = steedOf(), fx = ride.boost > 0 ? (S.id === "unicorn" ? " · 🌈 무지개 질주!" : " · 🔥 불꽃 질주!") : ride.tired > 0 ? " · 지쳤어요!" : "";
  return `🏁 ${S.icon} ${Math.min(CIRC_LAPS, ride.lap + 1)}/${CIRC_LAPS}바퀴 · ${rank}등 · ${S.ti ? "기운 " + bar : "지치지 않아요"}${fx}`;
}

/* countdown, rare-animal news, results */
let circCd = "", circAnn = new Set();
const steedSaid = {}, STEED_VOICE = { cow: "음메~ 🔔", alpaca: "퉤!", donkey: "히잉~", horse: "히히힝!", pony: "히힝!", ostrich: "꾸악!", camel: "후르르…", reindeer: "딸랑딸랑 🔔", zebra: "히히힝!", redhare: "히히힝!! 🔥", unicorn: "✨히히힝✨" };
function updateCircuit(dt) {
  // everyone's rare animals make the news
  const ann = (n, ap) => { if (!ap || circAnn.has(ap.id + n)) return; circAnn.add(ap.id + n); const S = STEEDS[ap.k]; if (!S || !S.rare) return;
    const bar = $("annBar"); bar.textContent = `${S.icon} ${n}님이 ${RARE_NAME[S.rare]} 동물 ${S.name}을(를) 탔어요!`; bar.hidden = false; bar.classList.remove("go"); void bar.offsetWidth; bar.classList.add("go"); clearTimeout(bar._t); bar._t = setTimeout(() => { bar.hidden = true; }, 6000); if (audio.ready) audio.ding(); };
  if (me.st === "ride" && me.ap) ann(me.name, me.ap);
  const voice = (key, ap, obj) => { if (!ap || ap.f) return; const S = STEEDS[ap.k], line = STEED_VOICE[S && S.id]; if (!line) return;
    const n = Math.floor((Date.now() + (hashStr(key) % 9000)) / 9000); if (steedSaid[key] === n) return; const first = steedSaid[key] == null; steedSaid[key] = n; if (!first) showBubble(obj, line, 1.3, "sv-" + key); };
  if (me.st === "ride") voice("me", me.ap, () => myAvatar);
  for (const [peer, o] of others) if (o.p.st === "ride") voice(peer, o.p.ap, () => (others.get(peer) || {}).obj);
  for (const o of others.values()) if (o.p.st === "ride" && o.p.ap) ann(o.p.n, o.p.ap);

  const r = myCirc(), cd = $("countdown"), btn = $("whipBox");
  if (!r) {
    if (btn && !btn.hidden) btn.hidden = true;
    if (me.st === "ride") { me.st = "walk"; rebuildMe(); me.x = CIRC_GATE[0] + 1.5; me.z = CIRC_GATE[1] + .5; me.ap = null; publish(true); }
    if (me.aj && ride.paid !== me.aj.id && !circOf(me.aj.h === myPeer ? "me" : me.aj.h)) { toast("레이스가 취소됐어요. 판돈을 돌려받았어요"); wallet.money += me.aj.bet || 0; saveWallet(); me.aj = null; }
    return;
  }
  if (me.aj) me.aj.bet = r.rc.bet;
  btn.hidden = !(r.rc.st === "go" && touchy && !(me.ap && me.ap.f));
  if (r.rc.st !== "go") return;
  const now = Date.now(), left = r.rc.go - now;
  if (left > 0 && left <= CIRC_COUNT) { const n = String(Math.ceil(left / 1000)); if (circCd !== r.rc.id + n) { circCd = r.rc.id + n; cd.textContent = n; cd.hidden = false; cd.classList.remove("pop"); void cd.offsetWidth; cd.classList.add("pop"); if (audio.ready) audio.pop(); } }
  else if (left <= 0 && left > -900) { if (circCd !== r.rc.id + "go") { circCd = r.rc.id + "go"; cd.textContent = "출발!"; cd.hidden = false; cd.classList.remove("pop"); void cd.offsetWidth; cd.classList.add("pop"); if (audio.ready) audio.ding(); } }
  else if (left <= -900 && circCd === r.rc.id + "go") { cd.hidden = true; circCd = r.rc.id + "run"; }
  // finished? everyone in, or time is up
  const prog = r.list.map(m => ({ m, p: circProg(m.key) || { s: 0, f: 0 } }));
  if (!(prog.every(x => x.p.f > 0) || now - r.rc.go > CIRC_LIMIT) || ride.paid === r.rc.id) return;
  ride.paid = r.rc.id;
  const order = prog.slice().sort((a, b) => (a.p.f || 1e9) - (b.p.f || 1e9) || (b.p.s || 0) - (a.p.s || 0));
  const n = order.length, pot = r.rc.bet * n, share = RACE_SHARE[Math.max(2, Math.min(4, n))];
  let given = 0; const pays = order.map((x, i) => { const p = i === n - 1 ? pot - given : Math.floor(pot * share[i] / 10) * 10; given += p; return p; });
  const mine = order.findIndex(x => x.m.key === "me");
  if (mine >= 0) { wallet.money += pays[mine]; saveWallet(); }
  showRaceResult(order, pays, mine, pot);
  $("raceResPot").textContent = `동물 레이스 · ${order.map(x => (STEEDS[(x.p.k ?? 1)] || STEEDS[1]).icon).join(" ")} · 총 상금 ${won(pot)}`;
  setTimeout(() => { me.ac = null; me.aj = null; me.ap = null; publish(true); actKey = ""; refreshActions(); }, 4000);
}
