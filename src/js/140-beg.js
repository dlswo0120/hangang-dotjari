/* ================= 용돈 구걸 · 용돈 주기 ================= */
// Broke players (under 1,000원) can sit with a tin can; anyone nearby can drop 500~2,000원 in it.
// The gift rides in the giver's presence ({to, id, a}); the receiver credits it once (ids remembered in the wallet).
const BEG_UNDER = 1000, GIVE_DAY_MAX = 3000, RECV_DAY_MAX = 5000, GIFT_TTL = 90000;
const BEG_I = EMOTES.findIndex(E => E.id === "beg"), THANKS_I = EMOTES.findIndex(E => E.id === "thanks");
const BEG_LINES = ["라면 한 그릇만… 🍜", "500원만 주세요 🥺", "오늘 용돈을 다 써 버렸어요…", "치킨 냄새가 너무 좋아요…", "따뜻한 마음 받아요 🙏", "한강에서 꿈을 키우는 중이에요…"];

const givenToday = () => wallet.giveDay === todayKey() ? wallet.give || 0 : 0;
const recvToday = () => wallet.recvDay === todayKey() ? wallet.recv || 0 : 0;
const isBeg = em => { const a = activeEmote(em); return !!(a && a.i === BEG_I); };
function canBeg() {
  if (wallet.money >= BEG_UNDER) { toast("돈이 1,000원 아래로 떨어지면 할 수 있어요"); return false; }
  if (recvToday() >= RECV_DAY_MAX) { toast("오늘은 용돈을 충분히 받았어요. 내일 또 만나요!"); return false; }
  return true;
}

let giftTo = null; // peer we are about to give to
function begActions(acts, status) {
  if (!started || anim || boarded || me.st !== "walk") return status;
  if (isBeg(me.em)) return status;
  let best = null, bd = 3.2;
  for (const [peer, o] of others) {
    if (!isBeg(o.p.em) || (o.p.gr || 0) >= RECV_DAY_MAX) continue;
    const d = Math.hypot(o.x - me.x, o.z - me.z); if (d < bd) { bd = d; best = [peer, o]; }
  }
  if (best) acts.unshift(["gift:" + best[0], `💰 ${best[1].p.n}님에게 용돈 주기`, "primary"]);
  return status;
}
function begClick(a) {
  if (!a.startsWith("gift:")) return false;
  const peer = a.slice(5), o = others.get(peer);
  if (!o || !isBeg(o.p.em)) { toast("이미 자리를 떠났어요"); return true; }
  if (GIVE_DAY_MAX - givenToday() < 500) { toast("용돈은 하루에 3,000원까지 줄 수 있어요"); return true; }
  if (wallet.money < 500) { toast("줄 돈이 모자라요"); return true; }
  giftTo = peer;
  BET_INFO.gift = ["용돈 주기", `${o.p.n}님의 깡통에 얼마를 넣을까요?`, `오늘 더 줄 수 있는 돈 ${won(GIVE_DAY_MAX - givenToday())} · 받는 사람은 하루 5,000원까지`];
  openBet("gift"); return true;
}
BET_FN.gift = amt => {
  const o = others.get(giftTo);
  if (!o || !isBeg(o.p.em)) { toast("이미 자리를 떠났어요"); return; }
  if (amt > GIVE_DAY_MAX - givenToday()) { toast(`오늘은 ${won(GIVE_DAY_MAX - givenToday())}까지만 더 줄 수 있어요`); return; }
  if (amt > RECV_DAY_MAX - (o.p.gr || 0)) { toast(`${o.p.n}님은 오늘 ${won(RECV_DAY_MAX - (o.p.gr || 0))}까지만 더 받을 수 있어요`); return; }
  wallet.money -= amt; wallet.give = givenToday() + amt; wallet.giveDay = todayKey(); saveWallet();
  me.gv = { to: giftTo, id: Date.now(), a: amt };
  toast(`${o.p.n}님에게 ${won(amt)}을 줬어요. 마음이 따뜻해져요 💛`);
  publish(true); actKey = ""; refreshActions();
};

audio.coin = function (v) { const t = this.ac.currentTime; [0, .09, .2].forEach((d, i) => this.tone(this.sfx, "sine", 1900 + i * 350, 2600 + i * 300, .09, (.09 - i * .02) * v + .001, t + d)); };
const giftSeen = new Set();
let begBubbleKey = {};
function updateBeg() {
  if (!started) return;
  const now = Date.now();
  // the menu only offers begging while broke (or while already doing it)
  const btn = $("begBtn"); if (btn) { const show = wallet.money < BEG_UNDER || isBeg(me.em); if (btn.hidden === show) btn.hidden = !show; }
  if (isBeg(me.em) && wallet.money >= BEG_UNDER) { me.em = null; publish(true); }
  if (me.gv && now - me.gv.id > GIFT_TTL) { me.gv = null; publish(true); }
  me.gr = recvToday();
  // money for me
  for (const [peer, o] of others) {
    const g = o.p.gv; if (!g || g.to !== myPeer || now - g.id > GIFT_TTL) continue;
    wallet.gotIds = Array.isArray(wallet.gotIds) ? wallet.gotIds : [];
    if (wallet.gotIds.includes(g.id)) continue;
    const got = Math.max(0, Math.min(g.a, RECV_DAY_MAX - recvToday()));
    wallet.gotIds.push(g.id); wallet.gotIds = wallet.gotIds.slice(-30);
    wallet.money += got; wallet.recv = recvToday() + got; wallet.recvDay = todayKey(); saveWallet();
    toast(got ? `${o.p.n}님이 ${won(got)}을 줬어요! 고맙습니다 🙇` : `${o.p.n}님의 마음만 받았어요 (오늘 받을 수 있는 돈을 다 받았어요)`);
    if (isBeg(me.em) || me.st === "walk" || me.st === "sit") me.em = { i: THANKS_I, at: now };
    publish(true);
  }
  // everyone sees the coins land: a bubble over the receiver, sparkles, a clink
  const show = (from, g) => {
    if (giftSeen.has(g.id) || now - g.id > 8000) { giftSeen.add(g.id); return; }
    giftSeen.add(g.id);
    const target = g.to === myPeer ? "me" : g.to, obj = () => target === "me" ? myAvatar : (others.get(target) || {}).obj;
    const av = obj(); if (!av) return;
    showBubble(obj, `💰 ${from}님이 ${won(g.a)}을 넣었어요!`, 2.8, "gift-" + g.id);
    sparkBurst(av);
    const d = Math.hypot(av.position.x - cam.tx, av.position.z - cam.tz); if (audio.ready && d < 25) audio.coin(clamp(1 - d / 25, .2, 1));
  };
  if (me.gv) show(me.name, me.gv);
  for (const o of others.values()) if (o.p.gv) show(o.p.n, o.p.gv);
  // pleading lines now and then, the same on every screen
  const lines = (key, em, obj) => {
    const a = activeEmote(em); if (!a || a.i !== BEG_I) return;
    const n = Math.floor(a.t / 7); if (begBubbleKey[key] === em.at + ":" + n) return; begBubbleKey[key] = em.at + ":" + n;
    showBubble(obj, BEG_LINES[(Math.floor(em.at / 1000) + n) % BEG_LINES.length], 3, "beg-" + key);
  };
  lines("me", me.em, () => myAvatar);
  for (const [peer, o] of others) lines(peer, o.p.em, () => (others.get(peer) || {}).obj);
}
