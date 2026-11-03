/* ================= 한강 달리기 경주: 2~4명, 판돈, A·D 번갈아 ================= */
const RACE = { x0: -138, len: 40, lanes: [6.5, 8.6, 10.7, 12.8], gate: [-141.5, 9.6] };
const RACE_BETS = [500, 1000, 2000], RACE_SHARE = { 2: [.7, .3], 3: [.55, .3, .15], 4: [.5, .25, .15, .1] };
const RACE_COUNT = 3000, RACE_LIMIT = 30000, TAP_MIN = 1000 / 12; // at most 12 steps a second

/* the track */
{
  const L = RACE, cx = L.x0 + L.len / 2, cz = (L.lanes[0] + L.lanes[3]) / 2, w = L.len + 6, d = 9.4;
  const tex = canvasTex(1024, 220, (x, W, H) => {
    x.fillStyle = "#c1543f"; x.fillRect(0, 0, W, H);
    x.strokeStyle = "rgba(255,255,255,.85)"; x.lineWidth = 4;
    for (let i = 0; i <= 4; i++) { const y = 10 + i * (H - 20) / 4; x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }
    const sx = W * 3 / (L.len + 6), fx = W * (3 + L.len) / (L.len + 6);
    x.fillStyle = "#fff"; x.fillRect(sx - 3, 10, 6, H - 20);
    for (let r = 0; r < 8; r++) for (let c = 0; c < 2; c++) { x.fillStyle = (r + c) % 2 ? "#fff" : "#222"; x.fillRect(fx - 10 + c * 10, 10 + r * (H - 20) / 8, 10, (H - 20) / 8); }
    x.fillStyle = "rgba(255,255,255,.75)"; x.font = "bold 26px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
    for (let i = 0; i < 4; i++) x.fillText(String(i + 1), sx - 24, 10 + (i + .5) * (H - 20) / 4);
  }, 1, 1);
  const track = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ map: tex })); track.rotation.x = -Math.PI / 2; track.position.set(cx, .04, cz); track.receiveShadow = true; scene.add(track);
  // finish arch
  const fx = L.x0 + L.len;
  [-1, 1].forEach(s => { const p = new THREE.Mesh(new THREE.BoxGeometry(.18, 3, .18), mat(0xf2f2f2)); p.position.set(fx, 1.5, cz + s * 4.9); p.castShadow = true; scene.add(p); });
  const ban = new THREE.Mesh(new THREE.PlaneGeometry(9.8, .7), signMat(signTex([["결승선 · FINISH", 46, .55]], "#1fae96", "#ffffff", 512, 64)));
  ban.position.set(fx, 2.8, cz); ban.rotation.y = -Math.PI / 2; scene.add(ban); const ban2 = ban.clone(); ban2.rotation.y = Math.PI / 2; scene.add(ban2);
  // start gate with a board
  const [gx, gz] = L.gate;
  const post = new THREE.Mesh(new THREE.BoxGeometry(.12, 2.4, .12), mat(0x3a3d44)); post.position.set(gx, 1.2, gz); scene.add(post);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.1), signMat(signTex([["한강 달리기 대회", 44, .26], ["2~4명 · 판돈 500~2,000원", 26, .56], ["A·D(왼발·오른발)를 번갈아!", 26, .82]], "#c1543f", "#ffffff", 512, 256)));
  sign.position.set(gx, 2.0, gz + .07); scene.add(sign); const s2 = sign.clone(); s2.rotation.y = Math.PI; s2.position.z = gz - .07; scene.add(s2);
}
const nearRaceGate = () => me.level === "ground" && me.st === "walk" && Math.hypot(me.x - RACE.gate[0], me.z - RACE.gate[1]) < 6;

/* who is in which race (everything rides in presence) */
// host: me.rc = { id, bet, st: "open" | "go" | "cancel", go }   joiner: me.rj = { h: hostPeer, id, at }   progress: me.rp = { id, d, f }
function raceOf(hostKey) {
  const host = hostKey === "me" ? { key: "me", peer: myPeer, rc: me.rc, n: me.name } : (() => { const o = others.get(hostKey); return o && o.p.rc ? { key: hostKey, peer: hostKey, rc: o.p.rc, n: o.p.n } : null; })();
  if (!host || !host.rc) return null;
  const list = [{ key: host.key, n: host.n, at: host.rc.id }];
  if (host.key !== "me" && me.rj && me.rj.h === host.peer && me.rj.id === host.rc.id) list.push({ key: "me", n: me.name, at: me.rj.at });
  for (const [peer, o] of others) if (peer !== host.key && o.p.rj && o.p.rj.h === host.peer && o.p.rj.id === host.rc.id) list.push({ key: peer, n: o.p.n, at: o.p.rj.at });
  list.sort((a, b) => a.at - b.at || (a.key < b.key ? -1 : 1));
  return { host, list: list.slice(0, 4), rc: host.rc };
}
function myRace() { if (me.rc) return raceOf("me"); if (me.rj) return raceOf(me.rj.h === myPeer ? "me" : me.rj.h); return null; }
const progOf = key => key === "me" ? me.rp : (others.get(key) || { p: {} }).p.rp;

/* actions */
function openRaces() {
  const out = [];
  for (const [peer, o] of others) { const rc = o.p.rc; if (rc && rc.st === "open" && Date.now() - rc.id < 180000) { const r = raceOf(peer); if (r && r.list.length < 4) out.push(r); } }
  return out;
}
function raceActions(acts, status) {
  if (!started || anim || boarded) return status;
  const r = myRace();
  if (r) {
    acts.length = 0;
    const live = r.rc.st === "go";
    if (!live) {
      if (me.rc) { if (r.list.length >= 2) acts.push(["racego", `출발! (${r.list.length}명)`, "primary"]); acts.push(["racecancel", "경주 취소", ""]); }
      else acts.push(["raceleave", "참가 취소", ""]);
      return `한강 달리기 · 판돈 ${won(r.rc.bet)} · ${r.list.map(m => m.n).join(", ")} · ${r.list.length}/4명` + (me.rc && r.list.length < 2 ? " · 한 명 더 오면 출발할 수 있어요" : "");
    }
    return "";
  }
  if (me.st !== "walk" || !nearRaceGate()) return status;
  const open = openRaces();
  open.forEach(o => acts.unshift(["racejoin:" + o.host.key, `🏃 ${o.host.n}님 경주 참가 · ${won(o.rc.bet)}`, "primary"]));
  if (!open.length) { acts.unshift(["raceopen", "경주 열기", "primary"]); status = "한강 달리기 대회 · 2~4명이 판돈을 걸고 달려요"; }
  return status;
}
function raceClick(a) {
  if (a === "raceopen") { if (me.hold || me.basket) { toast("손을 비우고 와 주세요"); return true; } openBet("race"); return true; }
  if (a.startsWith("racejoin:")) {
    const r = raceOf(a.slice(9)); if (!r || r.rc.st !== "open" || r.list.length >= 4) { toast("이미 출발했거나 자리가 없어요"); return true; }
    if (me.hold || me.basket) { toast("손을 비우고 와 주세요"); return true; }
    if (wallet.money < r.rc.bet) { toast("판돈이 모자라요"); return true; }
    wallet.money -= r.rc.bet; saveWallet(); me.rj = { h: r.host.peer, id: r.rc.id, at: Date.now() }; me.rp = null; standAtLane(r.list.length);
    toast(`${won(r.rc.bet)}을 걸고 참가했어요! 출발을 기다려요`); return true;
  }
  if (a === "racego") { const r = myRace(); if (!r || r.list.length < 2) return true; me.rc.st = "go"; me.rc.go = Date.now() + RACE_COUNT; return true; }
  if (a === "racecancel") { refundRace("경주를 취소했어요. 판돈을 돌려받았어요"); me.rc = null; return true; }
  if (a === "raceleave") { refundRace("참가를 취소했어요. 판돈을 돌려받았어요"); me.rj = null; return true; }
  return false;
}
function refundRace(msg) { const r = myRace(); if (r && r.rc.st !== "go") { wallet.money += r.rc.bet; saveWallet(); toast(msg); } }
// the same stake picker serves every contest: openBet(kind) sets who gets the chosen amount
let betFor = "race";
const BET_INFO = {
  race: ["판돈을 골라 주세요", "참가하는 사람 모두 같은 금액을 걸어요. 1등이 가장 많이 가져가고, 꼴찌도 조금은 돌려받아요.", "2명 70·30% · 3명 55·30·15% · 4명 50·25·15·10%"],
  fish: ["낚시 대결 판돈", "3분 동안 잡은 물고기 점수(크기 × 희귀도)로 겨뤄요. 2~4명이 같은 금액을 걸어요.", "2명 80·20% · 3명 55·30·15% · 4명 50·25·15·10% · 같은 점수는 나눠 가져요"],
  boat: ["오리배 경주 판돈", "한 팀(두 명) 모두 같은 금액을 걸어요. 부표를 돌아 먼저 선착장에 오는 팀이 이겨요.", "2팀 70·30% · 3팀 55·30·15% · 팀 안에서 반씩"]
};
const BET_FN = {};
function openBet(kind) { betFor = kind; const [t, p, tb] = BET_INFO[kind]; $("raceBetTitle").textContent = t; $("raceBetDesc").textContent = p; $("raceBetTable").textContent = tb; $("raceBetModal").hidden = false; }
$("raceBetGrid").addEventListener("click", e => {
  const b = e.target.closest("button[data-bet]"); if (!b) return; const bet = +b.dataset.bet;
  if (wallet.money < bet) { toast("판돈이 모자라요"); return; }
  if (betFor !== "race") { $("raceBetModal").hidden = true; BET_FN[betFor](bet); return; }
  wallet.money -= bet; saveWallet(); me.rc = { id: Date.now(), bet, st: "open" }; me.rj = null; me.rp = null; $("raceBetModal").hidden = true; standAtLane(0);
  toast(`${won(bet)}을 걸고 경주를 열었어요. 근처 사람들이 참가할 수 있어요`); publish(true); actKey = ""; refreshActions();
});
$("raceBetClose").addEventListener("click", () => { $("raceBetModal").hidden = true; });
function standAtLane(i) { me.x = RACE.x0 - .6; me.z = RACE.lanes[Math.min(3, i)]; me.r = -Math.PI / 2; cam.tYaw = -Math.PI / 2; cam.tPitch = .22; }

/* running */
const run = { v: 0, d: 0, last: "", lastAt: 0, stumble: 0, id: 0, lane: 0, paid: 0 };
const racing = () => { const r = myRace(); return r && r.rc.st === "go" && Date.now() >= r.rc.go && !(me.rp && me.rp.f) ? r : null; };
const inRaceNow = () => { const r = myRace(); return !!(r && r.rc.st === "go"); };
function raceTap(foot) {
  const r = racing(); if (!r) return; const now = performance.now();
  if (now - run.lastAt < TAP_MIN) return;
  if (foot === run.last) { run.stumble = .45; run.v *= .3; run.last = ""; showBubble(() => myAvatar, "휘청!", .8, "me"); return; }
  run.last = foot; run.lastAt = now; if (run.stumble > 0) return;
  run.v = Math.min(7.5, run.v + .62); if (audio.ready) audio.step("path", foot === "R");
}
addEventListener("keydown", e => {
  if (e.repeat) return; const k = e.key.toLowerCase();
  if (boatRaceLive()) { if (k === "a") boatPedal("L"); else if (k === "d") boatPedal("R"); return; }
  if (!inRaceNow()) return;
  if (k === "a" || k === "arrowleft") raceTap("L"); else if (k === "d" || k === "arrowright") raceTap("R");
});
[["raceL", "L"], ["raceR", "R"]].forEach(([id, f]) => $(id).addEventListener("pointerdown", e => { e.preventDefault(); if (boatRaceLive()) boatPedal(f); else raceTap(f); }));
function raceStep(dt) {
  // called from stepPlayer while in a race: the race moves you, not the joystick
  const r = myRace(); if (!r) return false;
  if (r.rc.st !== "go") { me.moving = false; me.speed = 0; return true; }
  const lane = Math.max(0, r.list.findIndex(m => m.key === "me"));
  if (run.id !== r.rc.id) { Object.assign(run, { v: 0, d: 0, last: "", lastAt: 0, stumble: 0, id: r.rc.id, lane, paid: 0, t: 0 }); me.rp = { id: r.rc.id, d: 0, f: 0 }; }
  me.z = RACE.lanes[lane]; me.r = -Math.PI / 2;
  if (Date.now() < r.rc.go || (me.rp && me.rp.f)) { me.moving = false; me.speed = 0; if (!me.rp.f) me.x = RACE.x0 - .6; return true; }
  // wall-clock time, so a slow phone runs as fast as a quick one
  const pn = performance.now(); dt = Math.min(.25, run.t ? (pn - run.t) / 1000 : dt); run.t = pn;
  run.stumble = Math.max(0, run.stumble - dt); run.v *= Math.exp(-dt * 1.9);
  run.d = Math.min(RACE.len, run.d + run.v * dt); me.x = RACE.x0 + run.d; me.moving = run.v > .4; me.speed = run.v;
  me.rp = { id: r.rc.id, d: +run.d.toFixed(2), f: 0 };
  if (run.d >= RACE.len) { me.rp.f = Date.now() - r.rc.go; if (audio.ready) audio.ding(); showBubble(() => myAvatar, `도착! ${(me.rp.f / 1000).toFixed(2)}초`, 2.5, "me"); publish(true); }
  return true;
}

/* countdown, results, payouts */
let raceCdShown = "";
function updateRace() {
  const r = myRace(), cd = $("countdown"), btns = $("raceBtns");
  if (!r) { if (btns && !btns.hidden) btns.hidden = true; if (me.rj && run.paid !== me.rj.id && !raceOf(me.rj.h === myPeer ? "me" : me.rj.h)) { toast("경주가 취소됐어요. 판돈을 돌려받았어요"); wallet.money += me.rj.bet || 0; saveWallet(); me.rj = null; } return; }
  if (me.rj) me.rj.bet = r.rc.bet;
  btns.hidden = !(r.rc.st === "go" && touchy && !(me.rp && me.rp.f));
  if (r.rc.st !== "go") return;
  const now = Date.now(), left = r.rc.go - now;
  if (left > 0) { const n = String(Math.ceil(left / 1000)); if (raceCdShown !== r.rc.id + n) { raceCdShown = r.rc.id + n; cd.textContent = n; cd.hidden = false; cd.classList.remove("pop"); void cd.offsetWidth; cd.classList.add("pop"); if (audio.ready) audio.pop(); } }
  else if (left > -900) { if (raceCdShown !== r.rc.id + "go") { raceCdShown = r.rc.id + "go"; cd.textContent = "출발!"; cd.hidden = false; cd.classList.remove("pop"); void cd.offsetWidth; cd.classList.add("pop"); if (audio.ready) audio.ding(); } }
  else if (raceCdShown === r.rc.id + "go") { cd.hidden = true; raceCdShown = r.rc.id + "run"; }
  // finished? everyone in, or time is up
  const prog = r.list.map(m => ({ m, p: progOf(m.key) || { d: 0, f: 0 } }));
  const allIn = prog.every(x => x.p.f > 0), timeUp = now - r.rc.go > RACE_LIMIT;
  if (!(allIn || timeUp) || run.paid === r.rc.id) return;
  run.paid = r.rc.id;
  const order = prog.slice().sort((a, b) => (a.p.f || 1e9) - (b.p.f || 1e9) || (b.p.d || 0) - (a.p.d || 0));
  const n = order.length, pot = r.rc.bet * n, share = RACE_SHARE[Math.max(2, Math.min(4, n))];
  let given = 0; const pays = order.map((x, i) => { const p = i === n - 1 ? pot - given : Math.floor(pot * share[i] / 10) * 10; given += p; return p; });
  const mine = order.findIndex(x => x.m.key === "me");
  if (mine >= 0) { wallet.money += pays[mine]; saveWallet(); }
  showRaceResult(order, pays, mine, pot);
  setTimeout(() => { me.rc = null; me.rj = null; me.rp = null; publish(true); actKey = ""; refreshActions(); }, 4000);
}
function showRaceResult(order, pays, mine, pot) {
  const box = $("raceResList"); box.textContent = "";
  order.forEach((x, i) => {
    const row = document.createElement("div"); row.className = "row" + (i === mine ? " me" : "");
    const t = x.p.f ? (x.p.f / 1000).toFixed(2) + "초" : "완주 못 함";
    const a = document.createElement("span"); a.textContent = `${i + 1}등 · ${x.m.n} · ${t}`; const b = document.createElement("b"); b.textContent = "+" + won(pays[i]);
    row.append(a, b); box.appendChild(row);
  });
  $("raceResTitle").textContent = mine === 0 ? "🏆 1등이에요!" : mine > 0 ? `${mine + 1}등으로 들어왔어요` : "경주 결과";
  $("raceResPot").textContent = `총 상금 ${won(pot)}`;
  $("raceResModal").hidden = false; if (audio.ready && mine === 0) audio.ding();
}
$("raceResOk").addEventListener("click", () => { $("raceResModal").hidden = true; });
