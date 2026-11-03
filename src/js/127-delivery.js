/* ================= 한강통닭 치킨 배달 ================= */
// The order (menu + time) rides along in presence, and every screen plays the same timeline,
// so everyone sees the same rider without any server.
const DV_FEE = 1000, DV_MENU = ["halfchk", "chicken", "gangjeong"];
const DV_RIDE_IN = 90, DV_RIDE = 15, DV_LANE = 30.6, DV_WALK_SPEED = 1.7;
const dvLogo = signTex([["한강통닭", 44, .55]], "#c0392b", "#fff6e0", 256, 96);

function makeHelmet(av) {
  const h = new THREE.Mesh(new THREE.SphereGeometry(.5, 24, 16, 0, Math.PI * 2, 0, Math.PI * .56), mat(0xd8322f));
  h.rotation.x = .3; h.position.y = .03; av.userData.head.add(h);
  const v = new THREE.Mesh(new THREE.BoxGeometry(.62, .05, .22), mat(0x2a2d31)); v.position.set(0, .12, -.42); av.userData.head.add(v);
}
function makeScooter() {
  const g = new THREE.Group(), bike = makeBike(0xd8322f); g.add(bike);
  const boxM = [mat(0xc0392b), mat(0xc0392b), mat(0xc0392b), mat(0xc0392b), new THREE.MeshLambertMaterial({ map: dvLogo }), new THREE.MeshLambertMaterial({ map: dvLogo })];
  const box = new THREE.Mesh(new THREE.BoxGeometry(.5, .42, .46), boxM); box.position.set(0, 1.06, .62); g.add(box);
  const rider = makeAvatar({ g: "m", c: 0, pose: "bike" }); setAvatarState(rider, "bike", false, true); rider.position.set(0, .84, .08); makeHelmet(rider); g.add(rider);
  g.traverse(m => { if (m.isMesh) m.castShadow = true; });
  g.userData = { bike, rider, h: 2.4 }; return g;
}
const deliveries = new Map(); // key -> local playback state

function dvCustomer(key) {
  if (key === "me") return myAvatar ? { x: me.x, z: me.z, r: me.st === "sit" || me.st === "lie" ? 0 : me.r, st: me.st, y: me.y, obj: myAvatar } : null;
  const o = others.get(key); return o ? { x: o.x, z: o.z, r: o.p.st === "sit" || o.p.st === "lie" ? 0 : o.p.r, st: o.p.st, y: o.p.y, obj: o.obj } : null;
}
function dvTimeline(d, c, t) {
  const parkX = clamp(c.x, BOUND.x0 + 4, BOUND.x1 - 4), side = parkX - 70 < BOUND.x0 + 5 ? 1 : -1;
  const startX = parkX + side * 70, front = [c.x - Math.sin(c.r) * 1.05, c.z - Math.cos(c.r) * 1.05];
  if (d.walk == null && t >= DV_RIDE_IN + DV_RIDE) d.walk = Math.hypot(front[0] - parkX, front[1] - DV_LANE) / DV_WALK_SPEED + .3;
  const walk = d.walk == null ? 6 : d.walk, t1 = DV_RIDE_IN + DV_RIDE, t2 = t1 + walk, t3 = t2 + 3, t4 = t3 + walk, t5 = t4 + 14;
  return { parkX, side, startX, front, t1, t2, t3, t4, t5 };
}
function updateDeliveries(dt) {
  const now = Date.now(), live = new Set();
  const consider = (key, dv) => {
    if (!dv || !PRODUCTS[dv.k]) return;
    const t = (now - dv.at) / 1000; if (t < DV_RIDE_IN || t > 220) return;
    const c = dvCustomer(key); if (!c) return;
    const id = key + ":" + dv.at; live.add(id);
    let d = deliveries.get(id);
    if (!d) {
      d = { scooter: makeScooter(), walker: makeAvatar({ g: "m", c: 0, name: "한강통닭" }), walk: null, said: 0 };
      makeHelmet(d.walker); setAvatarState(d.walker, "walk", false, true); scene.add(d.scooter); scene.add(d.walker); deliveries.set(id, d);
      if (audio.ready) { const dd = Math.hypot(c.x - cam.tx, c.z - cam.tz); if (dd < 40) audio.tone(audio.sfx, "square", 520, 500, .12, .05, audio.ac.currentTime); }
    }
    const L = dvTimeline(d, c, t), S = d.scooter, W = d.walker;
    let sx = L.parkX, sr = L.side > 0 ? Math.PI / 2 : -Math.PI / 2, riding = false, wx = L.parkX + .9, wz = DV_LANE, wr = 0, walking = false, holding = false, wv = false;
    if (t < L.t1) { const k = ease(clamp((t - DV_RIDE_IN) / DV_RIDE, 0, 1)); sx = L.startX + (L.parkX - L.startX) * k; riding = true; }
    else if (t < L.t2) { const k = clamp((t - L.t1) / (L.t2 - L.t1), 0, 1); wx = L.parkX + .9 + (L.front[0] - L.parkX - .9) * k; wz = DV_LANE + (L.front[1] - DV_LANE) * k; wr = yawFrom(L.front[0] - L.parkX - .9, L.front[1] - DV_LANE); walking = true; holding = true; wv = true; }
    else if (t < L.t3) { wx = L.front[0]; wz = L.front[1]; wr = yawFrom(c.x - wx, c.z - wz); holding = t < L.t2 + 1.2; wv = true; }
    else if (t < L.t4) { const k = clamp((t - L.t3) / (L.t4 - L.t3), 0, 1); wx = L.front[0] + (L.parkX + .9 - L.front[0]) * k; wz = L.front[1] + (DV_LANE - L.front[1]) * k; wr = yawFrom(L.parkX + .9 - L.front[0], DV_LANE - L.front[1]); walking = true; wv = true; }
    else { const k = clamp((t - L.t4) / (L.t5 - L.t4), 0, 1); sx = L.parkX - L.side * 70 * ease(k); sr = -sr; riding = true; }
    // the scooter faces along the path; parked while the rider walks
    S.position.set(sx, 0, DV_LANE); S.rotation.y = lerpAngle(S.rotation.y, sr, riding ? 1 : Math.min(1, dt * 3));
    S.visible = t < L.t5; S.userData.rider.visible = riding;
    if (riding) { S.userData.bike.userData.wheels.forEach(w => w.rotation.x -= dt * 9); updateAvatar(S.userData.rider, dt, T, { crank: 0 }); }
    W.visible = wv; if (wv) { W.position.set(wx, 0, wz); W.rotation.y = lerpAngle(W.rotation.y, wr, Math.min(1, dt * 8)); updateAvatar(W, dt, T, { moving: walking, speed: 3, hold: holding ? dv.k : null, eatT: -1 }); }
    // lines and the handover
    if (t >= L.t2 && d.said < 1) { d.said = 1; showBubble(() => W, "한강통닭입니다~ 치킨 왔어요!", 2.6, "dv-" + id); if (audio.ready && Math.hypot(c.x - cam.tx, c.z - cam.tz) < 25) audio.pop(); }
    if (t >= L.t3 && d.said < 2) { d.said = 2; showBubble(() => W, "맛있게 드세요~", 2.2, "dv-" + id); }
    if (key === "me" && t >= L.t2 + 1.2 && me.dv && me.dv.at === dv.at && !me.dv.got) receiveDelivery();
  };
  if (me.dv) consider("me", me.dv);
  for (const [peer, o] of others) consider(peer, o.p.dv);
  for (const [id, d] of deliveries) if (!live.has(id)) { scene.remove(d.scooter); scene.remove(d.walker); deliveries.delete(id); }
  if (me.dv && (now - me.dv.at) / 1000 > 220) { me.dv = null; publish(true); }
}
function receiveDelivery() {
  const k = me.dv.k; me.dv.got = true;
  const canHold = !me.hold && !boarded && (me.st === "walk" || me.st === "sit" || me.st === "bench" || me.st === "stool") && me.level === "ground";
  if (canHold) { me.hold = k; me.eat = 0; toast(PRODUCTS[k].name + " 도착! '먹기'를 누르면 먹을 수 있어요"); }
  else { if (wallet.bag.length < BAG_MAX) wallet.bag.push(k); saveWallet(); toast(PRODUCTS[k].name + " 도착! 가방에 넣어 두었어요"); }
  if (audio.ready) audio.ding();
  publish(true); actKey = "";
}
function dvPhase() {
  if (!me.dv || me.dv.got) return "";
  const t = (Date.now() - me.dv.at) / 1000;
  return t < DV_RIDE_IN ? "치킨 튀기는 중 " + fmt(Math.ceil(DV_RIDE_IN - t)) : t < DV_RIDE_IN + DV_RIDE ? "배달 출발! 오토바이가 오고 있어요" : "곧 도착해요";
}
function deliveryActions(acts) {
  if (!started || anim || boarded) return;
  if (me.dv && !me.dv.got && (Date.now() - me.dv.at) / 1000 < DV_RIDE_IN) { acts.push(["dvcancel", "배달 취소", ""]); return; }
  if ((!me.dv || me.dv.got) && me.level === "ground" && ["sit", "lie", "bench", "stool"].includes(me.st)) acts.push(["dvorder", "치킨 배달", ""]);
}
function deliveryClick(a) {
  if (a === "dvorder") { openDelivery(); return true; }
  if (a === "dvcancel") {
    if (!me.dv || (Date.now() - me.dv.at) / 1000 >= DV_RIDE_IN) { toast("이미 출발해서 취소할 수 없어요"); return true; }
    wallet.money += PRODUCTS[me.dv.k].price + DV_FEE; saveWallet(); me.dv = null; toast("배달을 취소했어요. 돈은 돌려받았어요"); return true;
  }
  return false;
}
function openDelivery() {
  const grid = $("dvGrid"); grid.textContent = "";
  DV_MENU.forEach(k => {
    const P = PRODUCTS[k], cell = document.createElement("div"); cell.className = "item";
    const im = document.createElement("img"); im.className = "swatch"; im.alt = ""; im.src = PRODUCT_URL[k];
    const nm = document.createElement("b"); nm.textContent = P.name;
    const pr = document.createElement("span"); pr.className = "price"; pr.textContent = won(P.price + DV_FEE);
    const btn = document.createElement("button"); btn.textContent = "주문하기"; btn.dataset.k = k; btn.disabled = wallet.money < P.price + DV_FEE;
    cell.append(im, nm, pr, btn); grid.appendChild(cell);
  });
  $("dvWallet").textContent = "내 돈 " + won(wallet.money); $("dvModal").hidden = false;
}
$("dvGrid").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b || (me.dv && !me.dv.got)) return;
  const k = b.dataset.k, cost = PRODUCTS[k].price + DV_FEE;
  if (wallet.money < cost) { toast("돈이 모자라요. 용돈을 모아서 다시 시켜 보세요"); return; }
  wallet.money -= cost; saveWallet(); me.dv = { k, at: Date.now() };
  $("dvModal").hidden = true; publish(true); actKey = ""; refreshActions(); if (audio.ready) audio.click();
  toast("한강통닭에 " + PRODUCTS[k].name + "을(를) 주문했어요. 2분쯤 뒤에 도착해요");
});
$("dvClose").addEventListener("click", () => { $("dvModal").hidden = true; });
$("dvModal").addEventListener("click", e => { if (e.target === $("dvModal")) $("dvModal").hidden = true; });
