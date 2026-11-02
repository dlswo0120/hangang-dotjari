/* ================= 한강 불꽃 가게: 밤 8시~10시, 스파클러 · 분수 · 연발 ================= */
const FS = { x: 50, z: 7 }, FS_OPEN = 20, FS_CLOSE = 22, SPARK_LIFE = 40000, TWIRL = 3000;
const FS_ITEMS = ["sparkler", "fountain", "rocket"];
const fsForceOpen = /[?&#]fs\b/.test(location.search + location.hash);
function fireShopOpen() { const h = kst().getHours(); return fsForceOpen || (h >= FS_OPEN && h < FS_CLOSE); }
function mainShowNow() { const d = todayShowStart(), n = Date.now(); return n >= d && n < d + FW_DUR; }

/* small and medium spark pools (the big show uses its own) */
function sparkPool(N, size) {
  const drag = new Float32Array(N), pos = new Float32Array(N * 3), col = new Float32Array(N * 3), base = new Float32Array(N * 3), vel = new Float32Array(N * 3), life = new Float32Array(N), max = new Float32Array(N), grav = new Float32Array(N);
  for (let i = 0; i < N; i++) pos[i * 3 + 1] = -9999;
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size, map: fwDot, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  pts.frustumCulled = false; scene.add(pts);
  let next = 0, alive = 0;
  return {
    emit(x, y, z, vx, vy, vz, c, l, g, dg = 1.6) {
      drag[next] = dg;
      const i = next; next = (next + 1) % N; const j = i * 3;
      pos[j] = x; pos[j + 1] = y; pos[j + 2] = z; vel[j] = vx; vel[j + 1] = vy; vel[j + 2] = vz;
      base[j] = c.r; base[j + 1] = c.g; base[j + 2] = c.b; life[i] = max[i] = l; grav[i] = g; alive = Math.max(alive, l);
    },
    update(dt) {
      if (alive <= 0) return; alive -= dt;
      for (let i = 0; i < N; i++) {
        const j = i * 3;
        if (life[i] <= 0) { if (pos[j + 1] > -9000) { pos[j + 1] = -9999; col[j] = col[j + 1] = col[j + 2] = 0; } continue; }
        life[i] -= dt; const dr = 1 - Math.min(1, dt * drag[i]);
        vel[j] *= dr; vel[j + 1] = vel[j + 1] * dr - grav[i] * dt; vel[j + 2] *= dr;
        pos[j] += vel[j] * dt; pos[j + 1] += vel[j + 1] * dt; pos[j + 2] += vel[j + 2] * dt;
        const f = Math.max(0, life[i] / max[i]); col[j] = base[j] * f; col[j + 1] = base[j + 1] * f; col[j + 2] = base[j + 2] * f;
      }
      geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
    }
  };
}
const sparksS = sparkPool(3500, .16), sparksL = sparkPool(2500, .3), sparksM = sparkPool(2400, .8);
const GOLD = new THREE.Color(0xffd27a), WHITE = new THREE.Color(0xfff6dc), SPARK_COLS = FW_COLS;
const rnd = (a, b) => a + Math.random() * (b - a);

/* the stall */
const fsObj = { bulbs: [], shutter: null, signOpen: null, signClosed: null };
{
  const S = FS, add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; scene.add(o); return o; };
  add(new THREE.BoxGeometry(2.8, .9, .8), mat(0x6b4a33), S.x, .45, S.z);
  add(new THREE.BoxGeometry(2.9, .06, .9), mat(0x2a2d4a), S.x, .92, S.z);
  [-1.35, 1.35].forEach(k => add(new THREE.BoxGeometry(.08, 2.5, .08), mat(0x3a3d44), S.x + k, 1.25, S.z - .35));
  [-1.35, 1.35].forEach(k => add(new THREE.BoxGeometry(.08, 2.2, .08), mat(0x3a3d44), S.x + k, 1.1, S.z + .45));
  for (let i = 0; i < 7; i++) add(new THREE.BoxGeometry(.42, .08, 1.3), mat(i % 2 ? 0xffffff : 0xd8322f), S.x - 1.26 + i * .42, 2.38, S.z + .05).rotation.x = -.18;
  // goods on the counter
  [["sparkler", -.8], ["fountain", 0], ["rocket", .8]].forEach(([k, ox]) => { const p = add(new THREE.PlaneGeometry(.36, .45), new THREE.MeshLambertMaterial({ map: PRODUCT_TEX[k] }), S.x + ox, 1.18, S.z + .2); p.rotation.x = -.35; p.castShadow = false; });
  // string of bulbs, lit only while open
  for (let i = 0; i < 9; i++) { const b = add(new THREE.SphereGeometry(.06, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe2a0 }), S.x - 1.3 + i * .325, 2.12 - Math.sin(i / 8 * Math.PI) * .12, S.z + .7); b.castShadow = false; fsObj.bulbs.push(b); }
  const open = signTex([["한강 불꽃 가게", 44, .36], ["밤 8시~10시 · 여기서만 할 수 있는 불꽃놀이", 22, .78]], "#2a2d4a", "#ffe9a8");
  const closed = signTex([["한강 불꽃 가게", 44, .36], ["오늘 밤 8시에 열어요", 26, .78]], "#4a4d55", "#e8e8e8");
  fsObj.signOpen = add(new THREE.PlaneGeometry(2.6, .62), signMat(open), S.x, 1.72, S.z + .74); fsObj.signOpen.castShadow = false;
  fsObj.signClosed = add(new THREE.PlaneGeometry(2.6, .62), signMat(closed), S.x, 1.72, S.z + .741); fsObj.signClosed.castShadow = false;
  fsObj.shutter = add(new THREE.PlaneGeometry(2.7, .55), mat(0x7a7f88, { side: THREE.DoubleSide }), S.x, 1.15, S.z + .46); fsObj.shutter.castShadow = false;
  OBST.push({ x0: S.x - 1.5, x1: S.x + 1.5, z0: S.z - .5, z1: S.z + .5 });
}
const nearFireShop = () => me.level === "ground" && Math.abs(me.x - FS.x) < 2 && me.z > FS.z + .5 && me.z < FS.z + 2.6;

/* buying */
function openFireShop() {
  const grid = $("fsGrid"); grid.textContent = "";
  FS_ITEMS.forEach(k => {
    const P = PRODUCTS[k], cell = document.createElement("div"); cell.className = "item";
    const im = document.createElement("img"); im.className = "swatch"; im.alt = ""; im.src = PRODUCT_URL[k];
    const nm = document.createElement("b"); nm.textContent = P.name;
    const pr = document.createElement("span"); pr.className = "price"; pr.textContent = won(P.price);
    const btn = document.createElement("button"); btn.textContent = "사기"; btn.dataset.k = k;
    cell.append(im, nm, pr, btn); grid.appendChild(cell);
  });
  $("fsWallet").textContent = "내 돈 " + won(wallet.money); $("fsModal").hidden = false;
}
$("fsGrid").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return; const k = b.dataset.k, P = PRODUCTS[k];
  if (!fireShopOpen()) { toast("가게 문을 닫았어요. 밤 8시~10시에 열어요"); return; }
  if (wallet.money < P.price) { toast("돈이 모자라요"); return; }
  if (wallet.bag.length >= BAG_MAX) { toast("가방이 가득 찼어요"); return; }
  wallet.money -= P.price; wallet.bag.push(k); saveWallet(); $("fsWallet").textContent = "내 돈 " + won(wallet.money);
  if (audio.ready) audio.click(); toast(P.name + "을(를) 샀어요. 가방에서 꺼내 쓸 수 있어요");
});
$("fsClose").addEventListener("click", () => { $("fsModal").hidden = true; });
$("fsModal").addEventListener("click", e => { if (e.target === $("fsModal")) $("fsModal").hidden = true; });

/* from the bag */
function fireFromBag(i) {
  const k = wallet.bag[i], P = PRODUCTS[k]; if (!P || !P.fire) return;
  if (P.fire === "hand") {
    if (me.hold) { toast("손에 든 걸 먼저 다 먹거나 내려놓아 주세요"); return; }
    if (boarded || me.st === "swim" || me.st === "lie" || me.st === "bike") { toast("지금은 꺼낼 수 없어요"); return; }
    wallet.bag.splice(i, 1); saveWallet(); me.hold = "sparkler"; me.eat = 0; me.lit = 0; $("bagModal").hidden = true;
    toast("스파클러를 꺼냈어요. 불꽃 가게에서 불을 붙이거나, 불붙은 스파클러를 든 사람에게 옮겨 받으세요");
  } else {
    if (me.gf && Date.now() - me.gf.at < 14000) { toast("앞의 폭죽이 끝나면 놓을 수 있어요"); return; }
    if (mainShowNow()) { toast("한강 불꽃놀이가 끝나면 놓을 수 있어요. 지금은 같이 구경해요!"); return; }
    if (me.st !== "walk" || me.level !== "ground" || boarded) { toast("잔디 위에 서서 놓아 주세요"); return; }
    const x = me.x - Math.sin(me.r) * 1.4, z = me.z - Math.cos(me.r) * 1.4;
    if (!onGrass(x, z) || underRoof(x, z) || z < 1.5) { toast("잔디 위에서만 놓을 수 있어요"); return; }
    for (const o of others.values()) if (Math.hypot(o.x - x, o.z - z) < 2.4) { toast("사람이 너무 가까워요. 조금 떨어진 곳에 놓아 주세요"); return; }
    wallet.bag.splice(i, 1); saveWallet(); me.gf = { k, at: Date.now(), x: +x.toFixed(2), z: +z.toFixed(2) }; $("bagModal").hidden = true;
    toast("치익… 3초 뒤에 불꽃이 올라가요! 조금 물러서세요");
  }
  publish(true); actKey = ""; refreshActions();
}

/* actions */
function litOf(hold, lt) { return hold === "sparkler" && lt && Date.now() - lt < SPARK_LIFE; }
function nearLitSparkler() {
  for (const o of others.values()) if (litOf(o.p.hi, o.p.lt) && Math.hypot(o.x - me.x, o.z - me.z) < 1.9) return o;
  return null;
}
function fireActions(acts, status) {
  if (!started || anim || boarded) return status;
  if (me.hold === "sparkler") {
    if (!me.lit) {
      if (nearFireShop() && fireShopOpen()) acts.unshift(["light", "불 붙이기", "primary"]);
      else { const o = nearLitSparkler(); if (o) acts.unshift(["lightfrom", o.p.n + "님에게 불 옮겨 받기", "primary"]); else if (!status) status = "불꽃 가게나 불붙은 스파클러를 든 사람 곁으로 가 보세요"; }
    } else { acts.unshift(["twirl", "빙글빙글", "primary"]); acts.push(["sparkoff", "끄기", ""]); }
  }
  if (me.st === "walk" && nearFireShop()) {
    if (fireShopOpen()) { acts.unshift(["fireshop", "불꽃 사기", "primary"]); status = "한강 불꽃 가게 · 밤 10시까지 · 여기서만 할 수 있는 불꽃놀이"; }
    else status = "한강 불꽃 가게는 밤 8시~10시에만 열어요";
  }
  return status;
}
function fireClick(a) {
  if (a === "fireshop") { openFireShop(); return true; }
  if (a === "light" || a === "lightfrom") {
    me.lit = Date.now(); showBubble(() => myAvatar, "치익~", 1.4, "me"); if (audio.ready) audio.crunch(.5);
    if (a === "lightfrom") { const o = nearLitSparkler(); if (o) toast(o.p.n + "님이 불을 나눠 줬어요!"); }
    return true;
  }
  if (a === "twirl") { me.tw = Date.now(); return true; }
  if (a === "sparkoff") { me.hold = false; me.lit = 0; me.tw = 0; toast("스파클러를 껐어요"); return true; }
  return false;
}

/* per-frame: sparklers, ground fireworks, the stall lights */
const groundFw = new Map(), shells = [];
function sparkTipOf(av, out) { const b = av.userData.bowl; if (!b || !b.visible || !b.userData.tip) return false; b.userData.tip.getWorldPosition(out); return true; }
const tipV = new THREE.Vector3();
function emitSparkler(av, dt, dist) {
  if (dist > 45 || !sparkTipOf(av, tipV)) return;
  const n = Math.min(14, Math.floor(dt * 140 + Math.random()));
  for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u), sp = rnd(2.5, 5); sparksL.emit(tipV.x, tipV.y, tipV.z, r * Math.cos(a) * sp, u * sp + .8, r * Math.sin(a) * sp, Math.random() < .45 ? WHITE : GOLD, rnd(.35, .75), 4, 2.2); }
  if (audio.ready && dist < 9 && Math.random() < dt * 5) audio.crunch(.12 * (1 - dist / 9));
}
function spinOf(tw) { const t = Date.now() - (tw || 0); return tw && t < TWIRL ? t / 1000 * 8 : null; }
function updateFireShop(dt) {
  const now = Date.now(), open = fireShopOpen();
  fsObj.bulbs.forEach((b, i) => { b.visible = open; if (open) b.material.color.setHSL(.1, .9, .65 + .15 * Math.sin(T * 3 + i)); });
  fsObj.signOpen.visible = open; fsObj.signClosed.visible = !open; fsObj.shutter.visible = !open;
  // my sparkler burns out
  if (me.hold === "sparkler" && me.lit && now - me.lit > SPARK_LIFE) { me.hold = false; me.lit = 0; me.tw = 0; toast("스파클러가 다 탔어요"); publish(true); actKey = ""; }
  // sparks
  if (myAvatar && litOf(me.hold, me.lit)) emitSparkler(myAvatar, dt, 0);
  for (const o of others.values()) if (litOf(o.p.hi, o.p.lt)) emitSparkler(o.obj, dt, Math.hypot(o.x - cam.tx, o.z - cam.tz));
  // ground fireworks (mine and everyone else's)
  const live = new Set();
  const consider = (key, gf) => {
    if (!gf || !PRODUCTS[gf.k]) return; const t = (now - gf.at) / 1000; if (t < 0 || t > 16) return;
    const id = key + ":" + gf.at; live.add(id); let g = groundFw.get(id);
    if (!g) {
      const obj = gf.k === "fountain" ? new THREE.Mesh(new THREE.CylinderGeometry(.08, .18, .3, 10), mat(0xe94d8a)) : new THREE.Mesh(new THREE.BoxGeometry(.32, .26, .24), mat(0x3b6ea8));
      obj.position.set(gf.x, .14, gf.z); obj.castShadow = true; scene.add(obj); g = { obj, shots: 0 }; groundFw.set(id, g);
    }
    const d = Math.hypot(gf.x - cam.tx, gf.z - cam.tz), v = clamp(1 - d / 50, 0, 1);
    if (t < 3) { if (Math.random() < dt * 25) sparksS.emit(gf.x, .32, gf.z, rnd(-.5, .5), rnd(.5, 1.5), rnd(-.5, .5), GOLD, .3, 3); if (audio.ready && d < 15 && Math.random() < dt * 4) audio.crunch(.15 * v); }
    else if (gf.k === "fountain" && t < 11) {
      const hue = (t * .15) % 1, c = new THREE.Color().setHSL(hue, .9, .6), n = Math.floor(dt * 260 + Math.random());
      for (let i = 0; i < n; i++) sparksL.emit(gf.x, .32, gf.z, rnd(-1.5, 1.5), rnd(11, 14.5), rnd(-1.5, 1.5), Math.random() < .3 ? WHITE : c, rnd(1.8, 2.5), 6, .3);
      if (audio.ready && d < 20 && Math.random() < dt * 8) audio.crunch(.2 * v);
    } else if (gf.k === "rocket") {
      while (g.shots < 6 && t >= 3 + g.shots * .8) {
        g.shots++; shells.push({ x: gf.x, y: .3, z: gf.z, vy: 30, top: 24 + Math.random() * 8, col: SPARK_COLS[Math.floor(Math.random() * 7)] });
        if (audio.ready && d < 40) audio.tone(audio.sfx, "triangle", 900, 1800, .35, .05 * v + .001, audio.ac.currentTime);
      }
    }
  };
  if (me.gf) consider("me", me.gf);
  for (const [peer, o] of others) consider(peer, o.p.gf);
  for (const [id, g] of groundFw) if (!live.has(id)) { scene.remove(g.obj); groundFw.delete(id); }
  for (let i = shells.length - 1; i >= 0; i--) {
    const s = shells[i]; s.y += s.vy * dt; s.vy = Math.max(8, s.vy - 6 * dt);
    sparksL.emit(s.x, s.y, s.z, rnd(-.3, .3), -1.5, rnd(-.3, .3), GOLD, .45, 0);
    if (s.y >= s.top) {
      for (let k = 0; k < 120; k++) { const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u), sp = rnd(8, 10.5); sparksM.emit(s.x, s.y, s.z, r * Math.cos(a) * sp, u * sp, r * Math.sin(a) * sp, Math.random() < .2 ? WHITE : s.col, rnd(1.6, 2.2), 2.5, .9); }
      if (audio.ready) { const dd = Math.hypot(s.x - camera.position.x, s.y - camera.position.y, s.z - camera.position.z); audio.boom(clamp(.6 - dd / 120, .05, .6), Math.min(.4, dd / 340)); }
      shells.splice(i, 1);
    }
  }
  sparksS.update(dt); sparksL.update(dt); sparksM.update(dt);
}
