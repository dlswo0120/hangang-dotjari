/* ================= 오리배 경주: 2~3팀, 부표 돌아오기, 둘이 같이 페달 ================= */
const BRC = { startZ: -6.4, turn: [DOCK.x, -25], half: 14, limit: 120000, count: 3500 };
const BR_SHARE = { 2: [.7, .3], 3: [.55, .3, .15] };
// host driver: me.bh = { id, bet, st, go }   joining driver: me.bj = { h, id, at }   passenger paid: me.bp = { id, bet }
// driver progress: me.bf = { id, turn, f }   pedal power: me.bpw (0..1)

/* buoys */
{
  const buoy = (x, z, big) => {
    const g = new THREE.Group(), m = new THREE.Mesh(new THREE.CylinderGeometry(big ? .5 : .3, big ? .6 : .35, big ? 1.2 : .7, 12), mat(0xff7a1a)); m.position.y = big ? .1 : -.1; g.add(m);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(big ? .52 : .31, big ? .52 : .31, .16, 12), mat(0xffffff)); band.position.y = big ? .25 : 0; g.add(band);
    if (big) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 2.2, 6), mat(0x3a3d44)); pole.position.y = 1.4; g.add(pole); const flag = new THREE.Mesh(new THREE.PlaneGeometry(.9, .55), new THREE.MeshLambertMaterial({ color: 0xd8322f, side: THREE.DoubleSide })); flag.position.set(.45, 2.2, 0); g.add(flag); g.userData.flag = flag; }
    g.position.set(x, -.6, z); scene.add(g); return g;
  };
  BRC.turnBuoy = buoy(BRC.turn[0], BRC.turn[1], true);
  [-BRC.half, -BRC.half / 2, 0, BRC.half / 2, BRC.half].forEach(dx => buoy(DOCK.x + dx, BRC.startZ, false));
}

/* who is racing */
function brP(key) { return key === "me" ? { bt: me.bt, bh: me.bh, bj: me.bj, bp: me.bp, bf: me.bf, bpw: me.bpw || 0, n: me.name } : ((others.get(key) || {}).p || null); }
const keyOfPeer = peer => peer === myPeer ? "me" : peer;
function teamOf(driverKey, id) {
  const D = brP(driverKey); if (!D || !D.bt) return null;
  const crew = claimsFor(D.bt.id).map(keyOfPeer), mateKey = crew.find(k => k !== driverKey) || null, M = mateKey ? brP(mateKey) : null;
  return { driverKey, mateKey, boat: D.bt.id, names: [D.n, M ? M.n : "?"], paid: !!(M && M.bp && M.bp.id === id), bf: D.bf && D.bf.id === id ? D.bf : null };
}
function brOf(hostKey) {
  const H = brP(hostKey); if (!H || !H.bh) return null;
  const id = H.bh.id, hostPeer = hostKey === "me" ? myPeer : hostKey, teams = [teamOf(hostKey, id)];
  const add = key => { const P = brP(key); if (P && P.bj && P.bj.h === hostPeer && P.bj.id === id && teams.length < 3) { const t = teamOf(key, id); if (t) teams.push(t); } };
  if (hostKey !== "me") add("me"); for (const peer of others.keys()) if (peer !== hostKey) add(peer);
  return { hostKey, hostPeer, bh: H.bh, teams: teams.filter(Boolean) };
}
function myBoatRace() {
  if (me.bh) return brOf("me");
  if (me.bj) return brOf(keyOfPeer(me.bj.h));
  if (boarded && !boarded.driver) { const drv = claimsFor(boarded.id)[0], D = drv && brP(keyOfPeer(drv)); if (D && D.bh) return brOf(keyOfPeer(drv)); if (D && D.bj) return brOf(keyOfPeer(D.bj.h)); }
  return null;
}
const boatRaceLive = () => { const r = myBoatRace(); return !!(r && r.bh.st === "go" && boarded); };
function boatInRace(id) {
  for (const key of ["me", ...others.keys()]) { const P = brP(key); if (P && P.bh && P.bh.st === "go") { const r = brOf(key); if (r && r.teams.some(t => t.boat === id)) return true; } }
  return false;
}

/* actions */
function boatRaceActions(acts, status) {
  if (!started || !boarded) return status;
  const b = boats[boarded.id], r = myBoatRace(), now = Date.now();
  if (r) {
    const mine = r.teams.find(t => t.boat === boarded.id);
    if (r.bh.st !== "go") {
      if (!boarded.driver && !(me.bp && me.bp.id === r.bh.id)) { acts.unshift(["brpay", `판돈 내고 함께하기 · ${won(r.bh.bet)}`, "primary"]); return `짝꿍이 오리배 경주에 참가했어요 · 판돈 ${won(r.bh.bet)}`; }
      if (me.bh) { const ready = r.teams.length >= 2 && r.teams.every(t => t.paid); if (ready) acts.unshift(["brgo", `출발! (${r.teams.length}팀)`, "primary"]); acts.push(["brcancel", "경주 취소", ""]); }
      else if (me.bj) acts.push(["brleave", "참가 취소", ""]);
      else acts.push(["brout", "빠지기", ""]);
      return `🦆 오리배 경주 · 판돈 ${won(r.bh.bet)} · ` + r.teams.map(t => t.names.join("·") + (t.paid ? "" : "(판돈 대기)")).join(" vs ") + (r.teams.length < 2 ? " · 한 팀 더 오면 출발할 수 있어요" : "");
    }
    if (now < r.bh.go) return "곧 출발해요! A·D를 번갈아 눌러 페달을 밟아요";
    acts.length = 0;
    const f = mine && mine.bf;
    return f && f.f ? "도착! 다른 팀을 기다려요" : (f && f.turn ? "반환점 통과! 선착장 쪽 줄로 돌아와요" : "빨간 깃발 부표를 돌아오세요") + (boarded.driver ? " · ←→ 방향 · A·D 페달" : " · A·D 페달");
  }
  if (!boarded.driver || Math.abs(b.x - DOCK.x) > BRC.half + 4 || b.z < -14) return status;
  if (claimsFor(boarded.id).length !== 2) return status;
  for (const [peer, o] of others) {
    if (!o.p.bh || o.p.bh.st !== "open" || now - o.p.bh.id > 240000) continue;
    const rr = brOf(peer); if (rr && rr.teams.length < 3 && !rr.teams.some(t => t.boat === boarded.id)) acts.unshift(["brjoin:" + peer, `🦆 ${o.p.n}팀 경주 참가 · ${won(o.p.bh.bet)}`, "primary"]);
  }
  acts.push(["bropen", "오리배 경주 열기", ""]);
  return status;
}
function boatRaceClick(a) {
  if (a === "bropen") { openBet("boat"); return true; }
  if (a.startsWith("brjoin:")) {
    const rr = brOf(a.slice(7)); if (!rr || rr.bh.st !== "open" || rr.teams.length >= 3) { toast("이미 출발했거나 자리가 없어요"); return true; }
    if (wallet.money < rr.bh.bet) { toast("판돈이 모자라요"); return true; }
    wallet.money -= rr.bh.bet; saveWallet(); me.bj = { h: rr.hostPeer, id: rr.bh.id, at: Date.now(), bet: rr.bh.bet }; me.bf = null;
    toast(`${won(rr.bh.bet)}을 걸고 경주에 참가했어요. 짝꿍도 판돈을 내면 준비 끝!`); return true;
  }
  if (a === "brpay") {
    const r = myBoatRace(); if (!r) return true; if (wallet.money < r.bh.bet) { toast("판돈이 모자라요"); return true; }
    wallet.money -= r.bh.bet; saveWallet(); me.bp = { id: r.bh.id, bet: r.bh.bet }; toast("판돈을 냈어요. 같이 힘차게 밟아요!"); return true;
  }
  if (a === "brgo") { const r = myBoatRace(); if (!r || r.teams.length < 2 || !r.teams.every(t => t.paid)) return true; me.bh.st = "go"; me.bh.go = Date.now() + BRC.count; return true; }
  if (a === "brcancel" || a === "brleave" || a === "brout") { brRefund(); me.bh = null; me.bj = null; me.bp = null; return true; }
  return false;
}
function brRefund() {
  const bet = me.bh ? me.bh.bet : me.bj ? me.bj.bet : me.bp ? me.bp.bet : 0, r = myBoatRace();
  if (bet && !(r && r.bh.st === "go")) { wallet.money += bet; saveWallet(); toast("경주를 그만뒀어요. 판돈을 돌려받았어요"); }
}
BET_FN.boat = bet => {
  if (!boarded || !boarded.driver) { toast("오리배를 운전할 때 열 수 있어요"); return; }
  wallet.money -= bet; saveWallet(); me.bh = { id: Date.now(), bet, st: "open" }; me.bh.bet = bet; me.bj = null; me.bf = null;
  toast(`${won(bet)}을 걸고 오리배 경주를 열었어요. 짝꿍도 판돈을 내야 해요`); publish(true); actKey = ""; refreshActions();
};

/* pedalling: both people press A and D in turn */
let brLast = "", brLastAt = 0;
function boatPedal(foot) {
  const now = performance.now(); if (now - brLastAt < TAP_MIN) return;
  if (foot === brLast) { me.bpw = (me.bpw || 0) * .5; brLast = ""; showBubble(() => myAvatar, "삐끗!", .8, "me"); return; }
  brLast = foot; brLastAt = now; me.bpw = Math.min(1, (me.bpw || 0) + .1);
}
// the driver moves the boat (returns true while a race controls it)
function boatRaceDrive(dt) {
  const r = myBoatRace(); if (!r || r.bh.st !== "go" || !boarded || !boarded.driver) return false;
  const slot = Math.max(0, r.teams.findIndex(t => t.boat === boarded.id)), now = Date.now();
  if (now < r.bh.go) { boatLocal.x = DOCK.x - 6 + slot * 6; boatLocal.z = BRC.startZ - 1; boatLocal.r = 0; me.bf = { id: r.bh.id, turn: 0, f: 0 }; return true; }
  if (me.bf && me.bf.f) return true;
  const mate = r.teams[slot] && r.teams[slot].mateKey, mp = mate ? (brP(mate) || {}).bpw || 0 : 0;
  const steer = (keys.has("arrowright") ? 1 : 0) - (keys.has("arrowleft") ? 1 : 0) + joyV.x;
  boatLocal.r -= clamp(steer, -1, 1) * dt * 1.5;
  const sp = ((me.bpw || 0) + mp) * 2.7 * dt;
  boatLocal.x += -Math.sin(boatLocal.r) * sp; boatLocal.z += -Math.cos(boatLocal.r) * sp;
  [boatLocal.x, boatLocal.z] = pushOut(boatLocal.x, boatLocal.z, 1.4);
  boatLocal.x = clamp(boatLocal.x, BOUND.x0 + 1, BOUND.x1 - 1); boatLocal.z = clamp(boatLocal.z, BOUND.waterZ0 + 1, -3.4);
  if (!me.bf) me.bf = { id: r.bh.id, turn: 0, f: 0 };
  if (!me.bf.turn && Math.hypot(boatLocal.x - BRC.turn[0], boatLocal.z - BRC.turn[1]) < 6) { me.bf.turn = 1; toast("반환점 통과! 이제 선착장 쪽으로!"); if (audio.ready) audio.quack(); }
  if (me.bf.turn && boatLocal.z > BRC.startZ && Math.abs(boatLocal.x - DOCK.x) < BRC.half) { me.bf.f = now - r.bh.go; if (audio.ready) audio.ding(); showBubble(() => myAvatar, `도착! ${(me.bf.f / 1000).toFixed(1)}초`, 2.5, "me"); publish(true); }
  return true;
}

/* countdown, results, payouts */
let brShown = "", brPaid = 0;
function updateBoatRace(dt) {
  me.bpw = Math.max(0, (me.bpw || 0) * Math.exp(-dt * 1.1)); if (me.bpw < .02) me.bpw = 0; else me.bpw = Math.round(me.bpw * 20) / 20;
  BRC.turnBuoy.userData.flag.rotation.y = Math.sin(T * 2) * .4;
  // got off the boat before the start: the stake comes back
  if (!boarded && (me.bh || me.bj || me.bp)) { const o = me.bh || me.bj || me.bp; if (!(me.bh && me.bh.st === "go") && brPaid !== o.id) { wallet.money += o.bet || 0; saveWallet(); toast("오리배에서 내려서 경주에서 빠졌어요. 판돈을 돌려받았어요"); } me.bh = null; me.bj = null; me.bp = null; }
  const r = myBoatRace(), cd = $("countdown");
  if (!r) {
    const mine = me.bj || me.bp; if (mine && brPaid !== mine.id) { toast("경주가 취소됐어요. 판돈을 돌려받았어요"); wallet.money += mine.bet || 0; saveWallet(); }
    me.bj = null; me.bp = null; if (me.bh && !boarded) me.bh = null; return;
  }
  if (r.bh.st !== "go") return;
  if (touchy) $("raceBtns").hidden = !boarded;
  const now = Date.now(), left = r.bh.go - now;
  if (left > 0) { const n = String(Math.ceil(left / 1000)); if (brShown !== r.bh.id + n) { brShown = r.bh.id + n; cd.textContent = n; cd.hidden = false; cd.classList.remove("pop"); void cd.offsetWidth; cd.classList.add("pop"); if (audio.ready) audio.pop(); } return; }
  if (left > -900) { if (brShown !== r.bh.id + "go") { brShown = r.bh.id + "go"; cd.textContent = "출발!"; cd.hidden = false; cd.classList.remove("pop"); void cd.offsetWidth; cd.classList.add("pop"); if (audio.ready) audio.quack(); } return; }
  if (brShown === r.bh.id + "go") { cd.hidden = true; brShown = r.bh.id + "on"; }
  const allIn = r.teams.every(t => t.bf && t.bf.f), timeUp = now - r.bh.go > BRC.limit;
  if (!(allIn || timeUp) || brPaid === r.bh.id) return;
  brPaid = r.bh.id;
  const order = r.teams.slice().sort((a, b) => ((a.bf && a.bf.f) || 1e9) - ((b.bf && b.bf.f) || 1e9) || ((b.bf && b.bf.turn) || 0) - ((a.bf && a.bf.turn) || 0));
  const n = order.length, pot = r.bh.bet * 2 * n, share = BR_SHARE[Math.max(2, Math.min(3, n))];
  let given = 0; const teamPay = order.map((t, i) => { const p = i === n - 1 ? pot - given : Math.floor(pot * share[i] / 10) * 10; given += p; return p; });
  const mineIdx = order.findIndex(t => t.boat === (boarded ? boarded.id : -1)), amDriver = boarded && boarded.driver;
  let myPay = 0;
  if (mineIdx >= 0) { const tp = teamPay[mineIdx], half = Math.floor(tp / 20) * 10; myPay = amDriver ? tp - half : half; wallet.money += myPay; saveWallet(); }
  const box = $("raceResList"); box.textContent = "";
  order.forEach((t, i) => { const row = document.createElement("div"); row.className = "row" + (i === mineIdx ? " me" : ""); const a1 = document.createElement("span"); a1.textContent = `${i + 1}등 · ${t.names.join(" · ")} · ${t.bf && t.bf.f ? (t.bf.f / 1000).toFixed(1) + "초" : "완주 못 함"}`; const a2 = document.createElement("b"); a2.textContent = "팀 +" + won(teamPay[i]); row.append(a1, a2); box.appendChild(row); });
  $("raceResTitle").textContent = mineIdx === 0 ? "🏆 우리 팀 1등!" : mineIdx > 0 ? `우리 팀 ${mineIdx + 1}등` : "오리배 경주 결과";
  $("raceResPot").textContent = `총 상금 ${won(pot)} · 내 몫 +${won(myPay)}`; $("raceResModal").hidden = false; if (audio.ready && mineIdx === 0) audio.ding();
  setTimeout(() => { me.bh = null; me.bj = null; me.bp = null; me.bf = null; publish(true); actKey = ""; refreshActions(); }, 4000);
}
