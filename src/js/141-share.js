/* ================= 치킨 나눠 먹기 ================= */
// Someone eating chicken can pass a piece (3 at most) to a person sitting or standing close by.
// The offer rides in the giver's presence ({to, id, k}); the receiver answers with sa = offer id.
// Each piece given takes 20 seconds off the giver's own chicken.
const SHARE_MAX = 3, SHARE_CUT = 20000, SHARE_TTL = 20000, SHARE_NEAR = 2.8;
const HEART_C = new THREE.Color(0xff6b9a);
const isShareKind = k => !!(PRODUCTS[k] && PRODUCTS[k].share);
function myShareCount() { return me.shareKey === me.eat ? me.shareN || 0 : 0; }
function canShareNow() {
  if (!me.hold || !me.eat || isShareKind(me.hold) || !PRODUCTS[me.hold] || PRODUCTS[me.hold].cat !== "chicken") return false;
  const left = eatTime(me.hold) - (Date.now() - me.eat) / 1000;
  return left > SHARE_CUT / 1000 + 5 && myShareCount() < SHARE_MAX;
}
const takerOk = o => !o.p.hi && ["walk", "sit", "bench", "stool"].includes(o.p.st);
function shareActions(acts, status) {
  if (!started || anim || boarded) return status;
  const now = Date.now();
  // an offer for me
  for (const [peer, o] of others) {
    const s = o.p.sh; if (!s || s.to !== myPeer || now - s.id > SHARE_TTL || me.sa === s.id) continue;
    if (me.hold || !["walk", "sit", "bench", "stool"].includes(me.st) || Math.hypot(o.x - me.x, o.z - me.z) > SHARE_NEAR + 1.5) continue;
    acts.unshift(["shtake:" + peer, `🍗 ${o.p.n}님이 치킨을 나눠 줬어요! 받기`, "primary"]);
  }
  // offering mine
  if (me.sh && now - me.sh.id < SHARE_TTL) { const o = others.get(me.sh.to); return `🍗 ${o ? o.p.n : "상대"}님이 받기를 기다리는 중…`; }
  if (!canShareNow() || !["sit", "bench", "stool"].includes(me.st)) return status;
  let best = null, bd = SHARE_NEAR;
  for (const [peer, o] of others) { if (!takerOk(o)) continue; const d = Math.hypot(o.x - me.x, o.z - me.z); if (d < bd) { bd = d; best = [peer, o]; } }
  if (best) acts.push(["share:" + best[0], `🍗 ${best[1].p.n}님에게 나눠 주기 (${SHARE_MAX - myShareCount()}번 남음)`, ""]);
  return status;
}
function shareClick(a) {
  if (a.startsWith("share:")) {
    const peer = a.slice(6), o = others.get(peer);
    if (!o || !takerOk(o) || !canShareNow()) { toast("지금은 나눠 줄 수 없어요"); return true; }
    me.sh = { to: peer, id: Date.now(), k: PRODUCTS[me.hold].sauce ? "chkshareY" : "chkshare" };
    showBubble(() => myAvatar, "자, 한 조각 먹어 봐!", 2, "me"); return true;
  }
  if (a.startsWith("shtake:")) {
    const o = others.get(a.slice(7)), s = o && o.p.sh;
    if (!s || s.to !== myPeer || Date.now() - s.id > SHARE_TTL) { toast("치킨이 식어 버렸어요… 다시 나눠 달라고 해 볼까요?"); return true; }
    if (me.hold) { toast("손을 비우고 받아 주세요"); return true; }
    me.hold = s.k; me.eat = Date.now(); me.sa = s.id; me.em = null;
    showBubble(() => myAvatar, "고마워! 잘 먹을게 🍗", 2, "me"); if (audio.ready) audio.pop();
    return true;
  }
  return false;
}
function updateShare() {
  if (!started) return;
  const now = Date.now();
  if (me.sh) {
    const o = others.get(me.sh.to);
    if (o && o.p.sa === me.sh.id) { // they took it: my own chicken runs out 20 seconds sooner
      const n = myShareCount() + 1; me.eat -= SHARE_CUT; me.shareKey = me.eat; me.shareN = n;
      toast(`${o.p.n}님과 치킨을 나눠 먹어요 💛`); me.sh = null; publish(true); actKey = "";
    } else if (now - me.sh.id > SHARE_TTL || !me.eat) { me.sh = null; publish(true); actKey = ""; }
  }
  if (me.sa && now - me.sa > 90000) me.sa = 0;
}
