/* ================= 낚시 대결: 2~4명, 3분 점수전 ================= */
const FD_TIME = 180000, FD_COUNT = 3000, FD_MULT = [1, 2, 5, 0], FD_MAX = 4;
const FD_SHARE = { 2: [.8, .2], 3: [.55, .3, .15], 4: [.5, .25, .15, .1] };
// host: me.fd = { id, bet, st: "open" | "go", go }   joiner: me.fj = { h, id, at, bet }   score: me.fsc = { id, s, n }
function fdOf(hostKey) {
  const h = hostKey === "me" ? { key: "me", peer: myPeer, fd: me.fd, n: me.name } : (() => { const o = others.get(hostKey); return o && o.p.fd ? { key: hostKey, peer: hostKey, fd: o.p.fd, n: o.p.n } : null; })();
  if (!h || !h.fd) return null;
  const list = [{ key: h.key, n: h.n, at: h.fd.id }];
  if (h.key !== "me" && me.fj && me.fj.h === h.peer && me.fj.id === h.fd.id) list.push({ key: "me", n: me.name, at: me.fj.at });
  for (const [peer, o] of others) if (peer !== h.key && o.p.fj && o.p.fj.h === h.peer && o.p.fj.id === h.fd.id) list.push({ key: peer, n: o.p.n, at: o.p.fj.at });
  list.sort((a, b) => a.at - b.at || (a.key < b.key ? -1 : 1));
  return { h, list: list.slice(0, FD_MAX), fd: h.fd };
}
function myDuel() { if (me.fd) return fdOf("me"); if (me.fj) return fdOf(me.fj.h === myPeer ? "me" : me.fj.h); return null; }
function inFishDuel() { const d = myDuel(); return !!(d && d.fd.st === "go" && Date.now() >= d.fd.go && Date.now() < d.fd.go + FD_TIME); }
const scoreOf = key => { const s = key === "me" ? me.fsc : (others.get(key) || { p: {} }).p.fsc; return s || { s: 0, n: 0 }; };
// live ranking, best first
function fdBoard(d) { return d.list.map(m => { const sc = scoreOf(m.key); return { ...m, s: sc.s, c: sc.n }; }).sort((a, b) => b.s - a.s); }
function fdBoardText(d) { return fdBoard(d).map((m, i) => `${i + 1}. ${m.key === "me" ? "나" : m.n} ${m.s}`).join(" · "); }

function duelActions(acts, status) {
  if (!started || anim || boarded || !me.rod) return status;
  const d = myDuel(), now = Date.now();
  if (d) {
    if (d.fd.st !== "go") {
      if (me.fd) { if (d.list.length >= 2) acts.unshift(["fdgo", `대결 시작! (${d.list.length}명)`, "primary"]); acts.push(["fdcancel", "대결 취소", ""]); }
      else acts.push(["fdleave", "대결 나가기", ""]);
      return `🎣 낚시 대결 · 판돈 ${won(d.fd.bet)} · ${d.list.map(m => m.n).join(", ")} · ${d.list.length}/${FD_MAX}명` + (d.list.length < 2 ? " · 한 명 더 오면 시작할 수 있어요" : "");
    }
    const left = d.fd.go + FD_TIME - now;
    if (left > 0 && now >= d.fd.go) return `🎣 ${fmt(left / 1000)} · ${fdBoardText(d)}`;
    return status;
  }
  if (me.st !== "walk" || !onFishDeck(me.x, me.z)) return status;
  for (const [peer, o] of others) {
    const fd = o.p.fd; if (!fd || fd.st !== "open" || now - fd.id > 180000) continue;
    const r = fdOf(peer); if (r && r.list.length < FD_MAX && Math.hypot(o.x - me.x, o.z - me.z) < 15) acts.push(["fdjoin:" + peer, `🎣 ${o.p.n}님 대결 참가 · ${won(fd.bet)} (${r.list.length}/${FD_MAX})`, ""]);
  }
  acts.push(["fdopen", "낚시 대결 열기", ""]);
  return status;
}
function duelClick(a) {
  if (a === "fdopen") { openBet("fish"); return true; }
  if (a.startsWith("fdjoin:")) {
    const r = fdOf(a.slice(7)); if (!r || r.list.length >= FD_MAX || r.fd.st !== "open") { toast("자리가 없거나 이미 시작했어요"); return true; }
    if (wallet.money < r.fd.bet) { toast("판돈이 모자라요"); return true; }
    wallet.money -= r.fd.bet; saveWallet(); me.fj = { h: r.h.peer, id: r.fd.id, at: Date.now(), bet: r.fd.bet }; me.fsc = { id: r.fd.id, s: 0, n: 0 };
    toast(`${won(r.fd.bet)}을 걸고 ${r.h.n}님의 낚시 대결에 참가했어요!`); return true;
  }
  if (a === "fdgo") { const r = myDuel(); if (!r || r.list.length < 2) return true; me.fd.st = "go"; me.fd.go = Date.now() + FD_COUNT; return true; }
  if (a === "fdcancel" || a === "fdleave") {
    const r = myDuel(); if (r && r.fd.st !== "go") { wallet.money += r.fd.bet; saveWallet(); toast("대결에서 빠졌어요. 판돈을 돌려받았어요"); }
    me.fd = null; me.fj = null; me.fsc = null; return true;
  }
  return false;
}
BET_FN.fish = bet => {
  if (!me.rod) { toast("낚싯대를 빌린 뒤에 대결을 열 수 있어요"); return; }
  wallet.money -= bet; saveWallet(); me.fd = { id: Date.now(), bet, st: "open" }; me.fj = null; me.fsc = { id: me.fd.id, s: 0, n: 0 };
  toast(`${won(bet)}을 걸고 낚시 대결을 열었어요. 데크 위 사람들이 참가할 수 있어요 (최대 ${FD_MAX}명)`); publish(true); actKey = ""; refreshActions();
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
  // rank by score; people tied on points split the shares of the places they share
  const board = fdBoard(d), n = board.length, pot = d.fd.bet * n, share = FD_SHARE[Math.max(2, Math.min(FD_MAX, n))];
  const pays = new Array(n).fill(0);
  for (let i = 0; i < n;) { let j = i; while (j + 1 < n && board[j + 1].s === board[i].s) j++; let sum = 0; for (let k = i; k <= j; k++) sum += share[k]; for (let k = i; k <= j; k++) pays[k] = Math.floor(pot * sum / (j - i + 1) / 10) * 10; i = j + 1; }
  const rest = pot - pays.reduce((a, b) => a + b, 0); pays[0] += rest;
  const mine = board.findIndex(m => m.key === "me");
  if (mine >= 0) { wallet.money += pays[mine]; saveWallet(); }
  const box = $("raceResList"); box.textContent = "";
  board.forEach((r, i) => { const row = document.createElement("div"); row.className = "row" + (r.key === "me" ? " me" : ""); const s1 = document.createElement("span"); s1.textContent = `${i + 1}등 · ${r.n} · ${r.s}점 (${r.c}마리)`; const s2 = document.createElement("b"); s2.textContent = "+" + won(pays[i]); row.append(s1, s2); box.appendChild(row); });
  $("raceResTitle").textContent = mine === 0 ? "🏆 낚시 대결 1등!" : mine > 0 ? `${mine + 1}등이에요` : "낚시 대결 결과";
  $("raceResPot").textContent = `낚시 대결 · ${n}명 · 총 상금 ${won(pot)}`; $("raceResModal").hidden = false; if (audio.ready) audio.ding();
  setTimeout(() => { me.fd = null; me.fj = null; me.fsc = null; publish(true); actKey = ""; refreshActions(); }, 4000);
}
