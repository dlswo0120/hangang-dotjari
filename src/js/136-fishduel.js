/* ================= 낚시 1:1 대결: 3분 점수전, 이긴 사람 80% ================= */
const FD_TIME = 180000, FD_COUNT = 3000, FD_MULT = [1, 2, 5, 0];
// host: me.fd = { id, bet, st: "open" | "go", go }   joiner: me.fj = { h, id, at, bet }   score: me.fsc = { id, s, n }
function fdOf(hostKey) {
  const h = hostKey === "me" ? { key: "me", peer: myPeer, fd: me.fd, n: me.name } : (() => { const o = others.get(hostKey); return o && o.p.fd ? { key: hostKey, peer: hostKey, fd: o.p.fd, n: o.p.n } : null; })();
  if (!h || !h.fd) return null;
  let opp = null;
  if (h.key !== "me" && me.fj && me.fj.h === h.peer && me.fj.id === h.fd.id) opp = { key: "me", n: me.name };
  else for (const [peer, o] of others) if (peer !== h.key && o.p.fj && o.p.fj.h === h.peer && o.p.fj.id === h.fd.id) { opp = { key: peer, n: o.p.n }; break; }
  return { h, opp, fd: h.fd };
}
function myDuel() { if (me.fd) return fdOf("me"); if (me.fj) return fdOf(me.fj.h === myPeer ? "me" : me.fj.h); return null; }
function inFishDuel() { const d = myDuel(); return !!(d && d.fd.st === "go" && Date.now() >= d.fd.go && Date.now() < d.fd.go + FD_TIME); }
const scoreOf = key => { const s = key === "me" ? me.fsc : (others.get(key) || { p: {} }).p.fsc; return s || { s: 0, n: 0 }; };

function duelActions(acts, status) {
  if (!started || anim || boarded || !me.rod) return status;
  const d = myDuel(), now = Date.now();
  if (d) {
    const mine = scoreOf("me").s, theirs = d.opp ? scoreOf(d.h.key === "me" ? d.opp.key : d.h.key).s : 0, other = d.h.key === "me" ? d.opp : d.h;
    if (d.fd.st !== "go") {
      if (me.fd) { if (d.opp) acts.unshift(["fdgo", "대결 시작!", "primary"]); acts.push(["fdcancel", "대결 취소", ""]); }
      else acts.push(["fdleave", "대결 나가기", ""]);
      return `🎣 낚시 대결 · 판돈 ${won(d.fd.bet)} · ` + (d.opp ? `${d.h.n} vs ${d.opp.n}` : "상대를 기다리는 중…");
    }
    const left = d.fd.go + FD_TIME - now;
    if (left > 0 && now >= d.fd.go) return `🎣 대결 ${fmt(left / 1000)} · 나 ${mine}점 · ${other ? other.n : "상대"} ${theirs}점`;
    return status;
  }
  if (me.st !== "walk" || !onFishDeck(me.x, me.z)) return status;
  for (const [peer, o] of others) {
    const fd = o.p.fd; if (!fd || fd.st !== "open" || now - fd.id > 180000) continue;
    const r = fdOf(peer); if (r && !r.opp && Math.hypot(o.x - me.x, o.z - me.z) < 15) acts.push(["fdjoin:" + peer, `🎣 ${o.p.n}님과 대결 · ${won(fd.bet)}`, ""]);
  }
  acts.push(["fdopen", "낚시 대결 열기", ""]);
  return status;
}
function duelClick(a) {
  if (a === "fdopen") { openBet("fish"); return true; }
  if (a.startsWith("fdjoin:")) {
    const r = fdOf(a.slice(7)); if (!r || r.opp || r.fd.st !== "open") { toast("이미 상대가 있어요"); return true; }
    if (wallet.money < r.fd.bet) { toast("판돈이 모자라요"); return true; }
    wallet.money -= r.fd.bet; saveWallet(); me.fj = { h: r.h.peer, id: r.fd.id, at: Date.now(), bet: r.fd.bet }; me.fsc = { id: r.fd.id, s: 0, n: 0 };
    toast(`${won(r.fd.bet)}을 걸고 ${r.h.n}님과의 대결에 참가했어요!`); return true;
  }
  if (a === "fdgo") { const r = myDuel(); if (!r || !r.opp) return true; me.fd.st = "go"; me.fd.go = Date.now() + FD_COUNT; return true; }
  if (a === "fdcancel" || a === "fdleave") {
    const r = myDuel(); if (r && r.fd.st !== "go") { wallet.money += r.fd.bet; saveWallet(); toast("대결을 취소했어요. 판돈을 돌려받았어요"); }
    me.fd = null; me.fj = null; me.fsc = null; return true;
  }
  return false;
}
BET_FN.fish = bet => {
  if (!me.rod) { toast("낚싯대를 빌린 뒤에 대결을 열 수 있어요"); return; }
  wallet.money -= bet; saveWallet(); me.fd = { id: Date.now(), bet, st: "open" }; me.fj = null; me.fsc = { id: me.fd.id, s: 0, n: 0 };
  toast(`${won(bet)}을 걸고 낚시 대결을 열었어요. 데크 위 사람이 참가할 수 있어요`); publish(true); actKey = ""; refreshActions();
};
// called from strike(): only fish caught during the 3 minutes count
function duelCatch(F, cm) {
  if (!inFishDuel()) return 0;
  const pts = F.pts != null ? F.pts : Math.round(cm * FD_MULT[F.rare]), d = myDuel();
  me.fsc = { id: d.fd.id, s: (me.fsc && me.fsc.id === d.fd.id ? me.fsc.s : 0) + pts, n: (me.fsc && me.fsc.id === d.fd.id ? me.fsc.n : 0) + 1 };
  publish(true); return pts;
}
let fdShown = "", fdPaid = 0;
function updateDuel() {
  const d = myDuel(), cd = $("countdown");
  if (!d) { if (me.fj && fdPaid !== me.fj.id) { toast("대결이 취소됐어요. 판돈을 돌려받았어요"); wallet.money += me.fj.bet || 0; saveWallet(); me.fj = null; me.fsc = null; } return; }
  if (d.fd.st !== "go") return;
  const now = Date.now(), left = d.fd.go - now;
  if (left > 0) { const n = String(Math.ceil(left / 1000)); if (fdShown !== d.fd.id + n) { fdShown = d.fd.id + n; cd.textContent = n; cd.hidden = false; cd.classList.remove("pop"); void cd.offsetWidth; cd.classList.add("pop"); if (audio.ready) audio.pop(); } return; }
  if (left > -900) { if (fdShown !== d.fd.id + "go") { fdShown = d.fd.id + "go"; cd.textContent = "시작!"; cd.hidden = false; cd.classList.remove("pop"); void cd.offsetWidth; cd.classList.add("pop"); if (audio.ready) audio.ding(); } return; }
  if (fdShown === d.fd.id + "go") { cd.hidden = true; fdShown = d.fd.id + "on"; }
  if (now < d.fd.go + FD_TIME || fdPaid === d.fd.id) return;
  fdPaid = d.fd.id;
  const meKey = "me", otherKey = d.h.key === "me" ? (d.opp && d.opp.key) : d.h.key, otherName = d.h.key === "me" ? (d.opp && d.opp.n) : d.h.n;
  const a = scoreOf(meKey), b = otherKey ? scoreOf(otherKey) : { s: -1, n: 0 }, pot = d.fd.bet * 2;
  const pay = !otherKey ? pot : a.s > b.s ? pot * .8 : a.s < b.s ? pot * .2 : pot / 2;
  wallet.money += Math.round(pay); saveWallet();
  const rows = [{ n: me.name, s: a.s, c: a.n, pay: Math.round(pay), me: true }];
  if (otherKey) rows.push({ n: otherName, s: b.s, c: b.n, pay: pot - Math.round(pay) });
  rows.sort((x, y) => y.s - x.s);
  const box = $("raceResList"); box.textContent = "";
  rows.forEach((r, i) => { const row = document.createElement("div"); row.className = "row" + (r.me ? " me" : ""); const s1 = document.createElement("span"); s1.textContent = `${i + 1}등 · ${r.n} · ${r.s}점 (${r.c}마리)`; const s2 = document.createElement("b"); s2.textContent = "+" + won(r.pay); row.append(s1, s2); box.appendChild(row); });
  $("raceResTitle").textContent = a.s > b.s ? "🏆 대결 승리!" : a.s === b.s ? "무승부예요" : "아쉽게 졌어요";
  $("raceResPot").textContent = `낚시 대결 · 총 상금 ${won(pot)}`; $("raceResModal").hidden = false; if (audio.ready) audio.ding();
  setTimeout(() => { me.fd = null; me.fj = null; me.fsc = null; publish(true); actKey = ""; refreshActions(); }, 4000);
}
