/* ================= 주류: 19세 확인 · 셀프 생맥주 · 볼 빨개짐 ================= */
const ADULT_KEY = "hangang-adult";
function adultOk() { try { return localStorage.getItem(ADULT_KEY) === "1"; } catch (e) { return false; } }
let ageThen = null;
function askAge(then) { if (adultOk()) { then(); return; } ageThen = then; $("ageModal").hidden = false; }
$("ageYes").addEventListener("click", () => { try { localStorage.setItem(ADULT_KEY, "1"); } catch (e) {} $("ageModal").hidden = true; const f = ageThen; ageThen = null; if (f) f(); });
$("ageNo").addEventListener("click", () => { $("ageModal").hidden = true; ageThen = null; toast("주류는 19세 이상만 살 수 있어요. 음료는 언제든 괜찮아요!"); });

/* the tap */
const nearBeerTap = () => started && me.st === "walk" && insideStore(me.x, me.z) && boxDist(me.x - STORE.x, me.z - STORE.z, FIX.beer) < 1.1;
function beerActions(acts, status) {
  if (!nearBeerTap() || anim || me.q) return status;
  if (wallet.bag.includes("beercup")) { if (!me.hold) acts.unshift(["pour", "생맥주 따르기", "primary"]); else status = "손에 든 걸 먼저 다 먹어 주세요"; }
  else status = "셀프 생맥주 · 냉장고에서 '생맥주 잔'을 사서 계산하면 따를 수 있어요";
  return status;
}
function beerClick(a) { if (a !== "pour") return false; openPour(); return true; }

const pour = { b: 0, f: 0, hold: null, open: false, last: 0, done: false };
audio.pourOn = function (on) {
  const ac = this.ac, t = ac.currentTime;
  if (!this.pourG) { const s = ac.createBufferSource(); s.buffer = this.pink; s.loop = true; const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 700; bp.Q.value = .7; this.pourG = ac.createGain(); this.pourG.gain.value = 0; s.connect(bp); bp.connect(this.pourG); this.pourG.connect(this.sfx); s.start(); }
  this.pourG.gain.setTargetAtTime(on ? .35 : 0, t, .05);
};
function openPour() {
  Object.assign(pour, { b: 0, f: 0, hold: null, open: true, last: performance.now(), done: false });
  $("pourMsg").textContent = "맥주를 먼저 따르고, 거품을 올려 7:3을 맞춰 보세요"; drawPour(); $("pourModal").hidden = false; requestAnimationFrame(pourTick);
}
function drawPour() {
  $("pourBeer").style.height = Math.min(100, pour.b * 100) + "%";
  $("pourFoam").style.bottom = Math.min(100, pour.b * 100) + "%"; $("pourFoam").style.height = Math.max(0, Math.min(100 - pour.b * 100, pour.f * 100)) + "%";
}
function pourTick(now) {
  if (!pour.open) return;
  const dt = Math.min(.25, (now - pour.last) / 1000); pour.last = now;
  if (pour.hold === "b") { pour.b += .3 * dt; pour.f += .025 * dt; }
  else if (pour.hold === "f") pour.f += .22 * dt;
  else if (pour.f > 0) pour.f = Math.max(0, pour.f - .01 * dt); // foam settles a little
  drawPour();
  if (pour.b + pour.f > 1.07 && !pour.done) { finishPour(true); return; }
  requestAnimationFrame(pourTick);
}
["pourB", "pourF"].forEach(id => {
  const el = $(id), kind = id === "pourB" ? "b" : "f";
  el.addEventListener("pointerdown", e => { e.preventDefault(); pour.hold = kind; el.classList.add("on"); if (audio.ready) audio.pourOn(true); });
  const up = () => { if (pour.hold === kind) pour.hold = null; el.classList.remove("on"); if (audio.ready) audio.pourOn(false); };
  ["pointerup", "pointerleave", "pointercancel"].forEach(ev => el.addEventListener(ev, up));
});
$("pourDone").addEventListener("click", () => finishPour(false));
$("pourClose").addEventListener("click", () => { pour.open = false; pour.hold = null; if (audio.ready) audio.pourOn(false); $("pourModal").hidden = true; });
function finishPour(overflow) {
  if (pour.done) return; pour.done = true; pour.open = false; pour.hold = null; if (audio.ready) audio.pourOn(false);
  const total = pour.b + pour.f, ratio = total > 0 ? pour.f / total : 0;
  if (total < .15) { pour.done = false; toast("잔이 아직 비어 있어요. 버튼을 꾹 눌러 따라 보세요"); pour.open = true; pour.last = performance.now(); requestAnimationFrame(pourTick); return; }
  let q, msg;
  if (overflow) { q = 0; msg = "앗, 거품이 넘쳤어요…"; }
  else if (total >= .9 && ratio >= .22 && ratio <= .38) { q = 2; msg = "완벽한 7:3! 🍺"; }
  else if (total < .75) { q = 1; msg = "조금 덜 찼지만 시원해요"; }
  else { q = 1; msg = ratio < .22 ? "거품이 조금 아쉬운 한 잔" : "거품이 풍성한 한 잔"; }
  const i = wallet.bag.indexOf("beercup"); if (i >= 0) { wallet.bag.splice(i, 1); saveWallet(); }
  me.hold = "beer"; me.eat = 0; me.bq = { at: Date.now(), q };
  $("pourMsg").textContent = msg;
  setTimeout(() => { $("pourModal").hidden = true; }, 1100);
  showBubble(() => myAvatar, msg, 2.6, "me"); if (audio.ready) (q === 2 ? audio.ding() : audio.pop());
  publish(true); actKey = ""; refreshActions();
}

/* cheeks get a little red after a drink or two */
const ALC_WINDOW = 40 * 60000;
function noteDrink(k) { if (PRODUCTS[k] && PRODUCTS[k].alc) { me.drinks = (me.drinks || []).filter(t => Date.now() - t < ALC_WINDOW); me.drinks.push(Date.now()); } }
function redness() { return Math.min(3, (me.drinks || []).filter(t => Date.now() - t < ALC_WINDOW).length); }
function blushAvatar(av, rd) {
  const u = av.userData;
  if (rd > 0 && !u.redM) {
    const m = new THREE.MeshBasicMaterial({ color: 0xff4d5e, transparent: true, opacity: 0, depthWrite: false });
    u.redM = m; [-1, 1].forEach(k => { const s = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), m); s.position.set(k * .25, -.13, -.36); s.scale.set(.1, .06, .03); u.head.add(s); });
  }
  if (u.redM) u.redM.opacity = [0, .28, .45, .6][rd] || 0;
}
const seenBq = new Map();
function updateBeer() {
  if (myAvatar) blushAvatar(myAvatar, redness());
  for (const [peer, o] of others) {
    blushAvatar(o.obj, o.p.rd || 0);
    const bq = o.p.bq; if (!bq || seenBq.get(peer) === bq.at) continue; seenBq.set(peer, bq.at);
    if (Date.now() - bq.at < 4000) { const id = peer, msg = ["거품이 넘쳤어요…", "생맥주 한 잔!", "완벽한 7:3! 🍺"][bq.q] || "생맥주 한 잔!"; showBubble(() => (others.get(id) || {}).obj, msg, 2.4, id); }
  }
}
