/* ================= 한강 편의점: wallet, basket, queue, checkout ================= */
// Money lives in this browser only (localStorage): a daily allowance, so coming back tomorrow buys the chicken.
const WALLET_KEY = "hangang-wallet", ALLOWANCE = 4000, BASKET_MAX = 10, BAG_MAX = 20, SCAN_STEP = .55;
const wallet = (() => {
  let w = null; try { w = JSON.parse(localStorage.getItem(WALLET_KEY) || "null"); } catch (e) {}
  if (!w || typeof w.money !== "number" || !isFinite(w.money)) w = { money: 0, day: "", bag: [] };
  w.money = clamp(Math.floor(w.money), 0, 1e7); w.bag = Array.isArray(w.bag) ? w.bag.filter(k => PRODUCTS[k]).slice(0, BAG_MAX) : [];
  return w;
})();
function saveWallet() { try { localStorage.setItem(WALLET_KEY, JSON.stringify(wallet)); } catch (e) {} updateBagBtn(); }
function giveAllowance() {
  const k = kst(), day = k.getFullYear() + "-" + (k.getMonth() + 1) + "-" + k.getDate();
  if (wallet.day === day) return false;
  wallet.day = day; wallet.money += ALLOWANCE; saveWallet(); return true;
}
function insideStore(x, z, m = 0) { return Math.abs(x - STORE.x) < STORE.hw - m && Math.abs(z - STORE.z) < STORE.hd - m; }
function basketTotal() { return me.basket ? me.basket.reduce((s, k) => s + PRODUCTS[k].price, 0) : 0; }
function boxDist(lx, lz, f) { const dx = Math.max(f.x0 - lx, 0, lx - f.x1), dz = Math.max(f.z0 - lz, 0, lz - f.z1); return Math.hypot(dx, dz); }
function storeZone() {
  const lx = me.x - STORE.x, lz = me.z - STORE.z;
  if (Math.hypot(lx - FIX.basket.x, lz - FIX.basket.z) < 1.5) return "basket";
  if (boxDist(lx, lz, FIX.hotcase) < 1.0 && lz < FIX.counter.z0) return "chicken";
  if (boxDist(lx, lz, FIX.freezer) < 1.0) return "ice";
  if (boxDist(lx, lz, FIX.fridge) < 1.0) return "drink";
  if (boxDist(lx, lz, FIX.gondolaA) < .9 || boxDist(lx, lz, FIX.gondolaB) < .9) return "snack";
  if (lx > -2.6 && lx < 5.8 && lz > .5 && lz < FIX.counter.z0) return "queue";
  return null;
}
// the checkout line: earliest to join goes first, everyone walks themselves to their own spot
function queueList() {
  const l = [];
  for (const [peer, o] of others) if (o.p.q > 0 && insideStore(o.p.x, o.p.z, -1)) l.push([o.p.q, peer]);
  if (me.q) l.push([me.q, myPeer || "~me"]);
  l.sort((a, b) => a[0] - b[0] || (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0));
  return l.map(x => x[1]);
}
function myQueueIndex() { return queueList().indexOf(myPeer || "~me"); }
const QSPOT = i => { const k = Math.min(i, 8); return [STORE.x + 3.1 - k * 1.0, STORE.z + 1.35]; };
function queueArrived() { const i = myQueueIndex(); if (i < 0) return false; const [qx, qz] = QSPOT(i); return Math.hypot(qx - me.x, qz - me.z) < .25; }
function queueWalk(dt) {
  const i = myQueueIndex(); if (i < 0) { me.moving = false; return; }
  const [qx, qz] = QSPOT(i), dx = qx - me.x, dz = qz - me.z, d = Math.hypot(dx, dz);
  // look toward the counter from the shop floor so the clerk does not block the view
  if (performance.now() - cam.dragAt > 1500) { cam.tYaw = lerpAngle(cam.tYaw, Math.PI, Math.min(1, dt * 2.5)); cam.tPitch += (.3 - cam.tPitch) * Math.min(1, dt * 2); }
  if (d < .05) { me.moving = false; me.speed = 0; me.r = lerpAngle(me.r, Math.PI, Math.min(1, dt * 8)); return; }
  const step = Math.min(d, 2.4 * dt); me.x += dx / d * step; me.z += dz / d * step; me.moving = true; me.speed = 2.4;
  me.r = lerpAngle(me.r, yawFrom(dx, dz), Math.min(1, dt * 10));
}
// leaving with unpaid things sets off the gate
let gateWarnAt = 0, wasInStore = false;
function storeGate(nx, nz) {
  if (insideStore(me.x, me.z) && !insideStore(nx, nz) && me.basket && me.basket.length) {
    const n = performance.now();
    if (n - gateWarnAt > 2500) { gateWarnAt = n; toast("계산하지 않은 물건이 있어요! 계산대에서 계산해 주세요"); if (audio.ready) audio.alarm(); clerkSay("손님, 계산 먼저 부탁드려요~"); }
    return [me.x, me.z];
  }
  return [nx, nz];
}
function clerkSay(text) { if (storeObj.clerk) showBubble(() => storeObj.clerk, text, 2.4, "clerk"); }
let payState = null;
function startPay() {
  if (!me.basket || !me.basket.length) return;
  const total = basketTotal();
  if (total > wallet.money) { toast(`${won(total - wallet.money)}이 모자라요. 장바구니에서 몇 개 빼 주세요`); openBag(); return; }
  payState = { t: 0, n: me.basket.length, total, beeps: 0 }; clerkSay("계산 도와드릴게요~");
}
function finishPay() {
  const total = payState.total; payState = null;
  wallet.money -= total; wallet.bag = wallet.bag.concat(me.basket).slice(-BAG_MAX); saveWallet();
  me.basket = null; me.q = 0;
  toast(`결제 완료! ${won(total)} · 남은 돈 ${won(wallet.money)} · 산 물건은 가방에 넣었어요`);
  clerkSay("감사합니다~ 또 오세요!"); if (audio.ready) audio.ding();
  publish(true); actKey = ""; refreshActions();
}
// action buttons and clicks (wired from 10-actions.js)
function storeActions(acts, status) {
  if (!started || boarded || anim || me.st !== "walk") return status;
  if (me.q) {
    acts.length = 0;
    if (payState) return `삑, 삑… 계산 중 (${Math.min(payState.n, payState.beeps)}/${payState.n})`;
    const i = myQueueIndex();
    if (i === 0 && queueArrived()) acts.push(["pay", "계산하기 · " + won(basketTotal()), "primary"]);
    acts.push(["unqueue", "줄에서 나가기", ""]);
    return i <= 0 ? "내 차례예요! 계산하기를 눌러 주세요" : `계산 대기 중 · 앞에 ${i}명`;
  }
  if (!insideStore(me.x, me.z)) return status;
  const z = storeZone();
  if (!me.basket) {
    if (z === "basket") acts.unshift(["basket", "장바구니 들기", "primary"]);
    else if (z && CATS[z]) status = "입구에서 장바구니를 먼저 들어 주세요";
    else status = status || "어서오세요, 한강 편의점입니다";
  } else {
    if (z && CATS[z]) acts.unshift(["shop:" + z, CATS[z].verb, "primary"]);
    if (z === "queue" && me.basket.length) acts.unshift(["queue", "계산 줄 서기", "primary"]);
    acts.push(["basketview", "장바구니 " + me.basket.length + "개", ""]);
    if (!status) status = me.basket.length ? `장바구니 ${won(basketTotal())} · 내 돈 ${won(wallet.money)}` : "진열대 앞에서 물건을 골라 보세요";
  }
  return status;
}
function storeClick(a) {
  if (a === "basket") { me.basket = []; toast("장바구니를 들었어요"); return true; }
  if (a.startsWith("shop:")) { openShop(a.slice(5)); return true; }
  if (a === "basketview") { openBag(); return true; }
  if (a === "queue") { me.q = Date.now(); toast("계산 줄에 섰어요"); return true; }
  if (a === "unqueue") { me.q = 0; payState = null; return true; }
  if (a === "pay") { startPay(); return true; }
  return false;
}
// shop and bag panels
function openShop(cat) {
  const C = CATS[cat]; if (!C) return;
  $("shopTitle").textContent = C.title; const grid = $("shopGrid"); grid.textContent = "";
  C.items.forEach(k => {
    const P = PRODUCTS[k], cell = document.createElement("div"); cell.className = "item";
    const dot = document.createElement("img"); dot.className = "swatch"; dot.alt = ""; dot.src = PRODUCT_URL[k]; dot.style.background = P.color;
    const nm = document.createElement("b"); nm.textContent = P.name;
    const pr = document.createElement("span"); pr.className = "price"; pr.textContent = won(P.price);
    const btn = document.createElement("button"); btn.textContent = "담기"; btn.dataset.k = k;
    cell.append(dot, nm, pr, btn); grid.appendChild(cell);
  });
  refreshShopFoot(); $("shopModal").hidden = false;
}
function refreshShopFoot() { $("shopSum").textContent = `장바구니 ${me.basket ? me.basket.length : 0}개 · ${won(basketTotal())}`; $("shopWallet").textContent = "내 돈 " + won(wallet.money); }
$("shopGrid").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b || !me.basket) return;
  if (me.basket.length >= BASKET_MAX) { toast("장바구니가 가득 찼어요"); return; }
  me.basket.push(b.dataset.k); refreshShopFoot(); if (audio.ready) audio.click();
  toast(PRODUCTS[b.dataset.k].name + "을(를) 담았어요"); publish(true); actKey = "";
});
function openBag() {
  $("bagMoney").textContent = "내 돈 " + won(wallet.money);
  const bl = $("basketList"), gl = $("bagList"); bl.textContent = ""; gl.textContent = "";
  $("basketSec").hidden = !me.basket;
  (me.basket || []).forEach((k, i) => bl.appendChild(bagRow(PRODUCTS[k].name + " · " + won(PRODUCTS[k].price), "빼기", "drop", i, k)));
  if (me.basket && !me.basket.length) bl.appendChild(Object.assign(document.createElement("p"), { className: "empty", textContent: "아직 담은 물건이 없어요" }));
  wallet.bag.forEach((k, i) => gl.appendChild(PRODUCTS[k].cook ? bagRow(PRODUCTS[k].name, "라면 기계에서 끓여요", "none", i, k) : bagRow(PRODUCTS[k].name, PRODUCTS[k].cat === "drink" ? "꺼내기" : "먹기", "eat", i, k)));
  if (!wallet.bag.length) gl.appendChild(Object.assign(document.createElement("p"), { className: "empty", textContent: "산 물건이 없어요. 한강 편의점에 들러 보세요" }));
  $("bagModal").hidden = false;
}
function bagRow(label, btnText, act, i, k) {
  const r = document.createElement("div"); r.className = "row";
  const s = document.createElement("span"); s.textContent = label;
  if (k && PRODUCT_URL[k]) { const im = document.createElement("img"); im.src = PRODUCT_URL[k]; im.alt = ""; im.className = "thumb"; r.appendChild(im); }
  const b = document.createElement("button"); b.textContent = btnText; b.dataset.act = act; b.dataset.i = i; if (act === "none") b.disabled = true;
  r.append(s, b); return r;
}
$("bagModal").addEventListener("click", e => {
  if (e.target === $("bagModal")) { $("bagModal").hidden = true; return; }
  const b = e.target.closest("button[data-act]"); if (!b) return; const i = +b.dataset.i;
  if (b.dataset.act === "drop" && me.basket) { me.basket.splice(i, 1); publish(true); actKey = ""; openBag(); return; }
  if (b.dataset.act === "eat") {
    if (me.hold) { toast("들고 있는 걸 먼저 다 먹어 주세요"); return; }
    if (me.st === "swim" || me.st === "lie" || boarded) { toast("지금은 먹을 수 없어요"); return; }
    if (!PRODUCTS[wallet.bag[i]] || PRODUCTS[wallet.bag[i]].cook) return;
    const k = wallet.bag.splice(i, 1)[0]; saveWallet();
    const drink = PRODUCTS[k].cat === "drink";
    me.hold = k; me.eat = drink ? 0 : Date.now(); u_lastBite.me = -1; $("bagModal").hidden = true;
    if (drink) toast(PRODUCTS[k].name + "를 꺼냈어요. 옆 사람도 음료가 있으면 '짠' 해 보세요");
    publish(true); actKey = ""; refreshActions();
  }
});
$("shopClose").addEventListener("click", () => { $("shopModal").hidden = true; actKey = ""; refreshActions(); });
$("shopModal").addEventListener("click", e => { if (e.target === $("shopModal")) $("shopModal").hidden = true; });
$("bagClose").addEventListener("click", () => { $("bagModal").hidden = true; });
$("bagBtn").addEventListener("click", openBag);
addEventListener("keydown", e => { if (e.key === "Escape") { $("shopModal").hidden = true; $("bagModal").hidden = true; } });
function updateBagBtn() { $("bagMoneyBtn").textContent = won(wallet.money); }
function storeOnJoin() {
  const got = giveAllowance(); updateBagBtn(); $("bagBtn").hidden = false; $("bagBtn").classList.toggle("desk", !touchy);
  if (got) setTimeout(() => toast(`오늘의 용돈 ${won(ALLOWANCE)}을 받았어요! 내 돈 ${won(wallet.money)}`), 1600);
}
// per-frame: door, entry chime, clerk, checkout scanning
function updateStore(dt) {
  const S = STORE, dxw = S.x + STORE_DOOR.lx, dzw = S.z + S.hd;
  let near = 99;
  const chk = (x, z) => { near = Math.min(near, Math.hypot(x - dxw, z - dzw)); };
  if (started) chk(me.x, me.z); others.forEach(o => chk(o.x, o.z));
  storeObj.open += ((near < 2.6 ? 1 : 0) - storeObj.open) * Math.min(1, dt * 5);
  storeObj.doorL.position.x = STORE_DOOR.lx - .55 - storeObj.open * 1.0; storeObj.doorR.position.x = STORE_DOOR.lx + .55 + storeObj.open * 1.0;
  const inNow = started && insideStore(me.x, me.z);
  if (inNow && !wasInStore) { if (audio.ready) audio.chime(); clerkSay("어서오세요~ 한강 편의점입니다"); camSaved = cam.tDist; cam.tDist = Math.min(cam.tDist, 3.6); actKey = ""; }
  if (!inNow && wasInStore) { if (me.basket) { me.basket = null; toast("장바구니를 제자리에 두었어요"); publish(true); } me.q = 0; if (camSaved) cam.tDist = camSaved; camSaved = 0; actKey = ""; }
  wasInStore = inNow;
  const clerk = storeObj.clerk;
  updateAvatar(clerk, dt, T, {});
  if (payState) {
    payState.t += dt; const b = Math.floor(payState.t / SCAN_STEP);
    if (b > payState.beeps && payState.beeps < payState.n) { payState.beeps = b; if (audio.ready) audio.beep(); actKey = ""; }
    const a = clerk.userData.arms[1]; a.rotation.x = 1.1 + Math.sin(payState.t * 11) * .25; a.rotation.z = .25;
    if (payState.t > payState.n * SCAN_STEP + .7) finishPay();
  }
}
let camSaved = 0;
// camera stays inside the store when you are inside
function storeCam(px, py, pz) {
  if (!started || !insideStore(me.x, me.z)) return [px, py, pz];
  return [clamp(px, STORE.x - STORE.hw + .35, STORE.x + STORE.hw - .35), Math.min(py, 2.85), clamp(pz, STORE.z - STORE.hd + .35, STORE.z + STORE.hd - .35)];
}
