/* ================= actions UI ================= */
function onGrass(x, z) { return (z > 3.1 && z < 26.8) || (z > 34.2 && z <= BOUND.landZ1); }
function onPath(z) { return z >= 26.8 && z <= 34.2; }
function matConflict(x, z) {
  for (const o of others.values()) if ((o.p.st === "sit" || o.p.st === "lie") && o.p.mt && Math.hypot(o.p.x - x, o.p.z - z) < 3.2) return o.p.n;
  return null;
}
function canSpread() { return (me.level === "ground" && onGrass(me.x, me.z) && !underRoof(me.x, me.z)) || me.level === "bridge"; }
BENCHES.forEach(b => { if (b.x > BOUND.x0 && b.x < BOUND.x1) [-0.6, 0.6].forEach(k => SEAT_SPOTS.push({ x: b.x + k, z: b.z - 0.05, r: 0, kind: "bench" })); });
function nearBench() {
  if (me.level !== "ground") return null;
  let best = null, bd = 1e9;
  SEAT_SPOTS.forEach(s => {
    const reach = s.kind === "bench" ? 2.4 : 1.5, d = Math.hypot(s.x - me.x, s.z - me.z); if (d > reach) return;
    const taken = [...others.values()].some(o => (o.p.st === "bench" || o.p.st === "stool") && Math.abs(o.p.x - s.x) < 0.35 && Math.abs(o.p.z - s.z) < 0.5);
    if (!taken && d < bd) { bd = d; best = s; }
  });
  return best;
}
function boatOptions() {
  const out = { join: null, squeeze: null };
  if (me.st !== "walk" && me.st !== "swim") return out;
  const range = me.st === "walk" ? (Math.abs(me.x - DOCK.x) < 9 && me.z < 6 ? 14 : 0) : 3.8;
  if (!range) return out;
  let jd = 1e9, sd = 1e9;
  boats.forEach(b => {
    if (b.doomed) return;
    const c = claimsFor(b.id).length, d = Math.hypot(b.x - me.x, b.z - me.z); if (d > range) return;
    if (c <= 1) { const s = d - (c === 1 ? 50 : 0); if (s < jd) { jd = s; out.join = b.id; } }
    else if (c === 2 && d < sd) { sd = d; out.squeeze = b.id; }
  });
  return out;
}
function machineOwners() {
  // earliest claim on each machine wins
  const best = [null, null, null];
  const consider = (peer, rm) => { if (!rm) return; const b = best[rm.m]; if (!b || rm.at < b.at || (rm.at === b.at && peer < b.peer)) best[rm.m] = { peer, at: rm.at }; };
  for (const [peer, o] of others) consider(peer, o.p.rm);
  if (me.rm) consider(myPeer || "~me", me.rm);
  return best;
}
const isMine = own => own && (own.peer === myPeer || own.peer === "~me");
function nearMachine() {
  if (me.level !== "ground" || me.st !== "walk") return null;
  let best = null, bd = 1.5;
  MACHINES.forEach(m => { const d = Math.hypot(m.x - me.x, (m.z + .6) - me.z); if (d < bd) { bd = d; best = m; } });
  return best;
}
function ramenLeft() { return me.rm ? Math.max(0, RAMEN_TIME - (Date.now() - me.rm.at) / 1000) : 0; }
const fmt = s => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
function dropRamen(reason) {
  if (!me.hold) return; me.hold = false; me.eat = 0; toast(reason); publish(true);
}
let actKey = "", matHinted = false;
function eatLabel() { return PRODUCTS[me.hold] && PRODUCTS[me.hold].cat === "drink" ? "마시기" : "먹기"; }
function refreshActions() {
  if (!started) return;
  const acts = []; let status = "";
  if (anim) { /* mid-animation */ }
  else if (boarded) {
    const names = crewNames(boarded.id), drv = claimsFor(boarded.id)[0], dn = drv && drv !== myPeer && others.get(drv) ? others.get(drv).p.n : "";
    status = boarded.driver ? "오리배 운전 중 · " + names.join(", ") + "님과 함께" : (dn ? dn + "님이 운전 중" : "오리배 탑승 중");
    if (boats[boarded.id].doomed) status = "세 명이라 물이 차오르는 중! 꼬르륵…";
    acts.push(["leave", "내리기", "duck"]);
  } else if (me.bt) {
    status = "같이 탈 사람을 기다리는 중… 한 명이 더 오면 출발합니다";
    acts.push(["cancel", "그만 기다리기", ""]);
  } else if (me.st === "walk") {
    const nm = nearMachine(), owners = machineOwners();
    if (nm && !me.hold) {
      const own = owners[nm.i];
      if (me.rm && me.rm.m === nm.i && ramenLeft() <= 0) acts.push(["pickup", "라면 들기", "primary"]);
      else if (!me.rm && !own && wallet.bag.includes("rpack")) acts.push(["cook", "라면 끓이기", "primary"]);
      else if (!me.rm && !own) status = "편의점에서 봉지라면을 사 오면 끓일 수 있어요";
      else if (!me.rm && own) status = "다른 분이 라면을 끓이는 중이에요";
    }
    if (me.hold && !me.eat) acts.push(["eat", eatLabel(), "primary"]);
    if (nearRiver()) acts.push(["paper", "종이배 띄우기", acts.length ? "" : "primary"]);
    const nb = nearBench();
    if (nb) acts.push(["bench", nb.kind === "stool" ? "의자에 앉기" : "벤치에 앉기", acts.length ? "" : "primary"]);
    if (canSpread()) { acts.push(["sit", "앉기", acts.length ? "" : "primary"]); if (!me.hold) acts.push(["lie", "눕기", ""]); }
    else if (me.level === "stairs") status = "대교로 올라가는 계단";
    else if (onPath(me.z) && !nearBench()) status = "길 위에는 돗자리를 펼 수 없습니다";
    const bo = boatOptions();
    if (!me.hold && bo.join != null) acts.push(["boat", "오리배 타기", "duck"]);
    if (!me.hold && bo.squeeze != null) acts.push(["squeeze", "끼어 타기 (3명)", "duck"]);
  } else if (me.st === "bench" || me.st === "stool") {
    cheersAction(acts);
    if (me.hold && !me.eat) acts.push(["eat", eatLabel(), acts.length ? "" : "primary"]);
    acts.push(["stand", "일어나기", acts.length ? "" : "primary"]);
    acts.push(["mung", "물멍", ""]);
  } else if (me.st === "sit" || me.st === "lie") {
    if (me.st === "sit") cheersAction(acts);
    if (me.hold && !me.eat && me.st === "sit") acts.push(["eat", eatLabel(), acts.length ? "" : "primary"]);
    acts.push(["stand", "일어나기", acts.length ? "" : "primary"]);
    if (!me.hold) acts.push([me.st === "sit" ? "lie" : "sit", me.st === "sit" ? "눕기" : "앉기", ""]);
    acts.push(["mung", "물멍", ""]);
  } else if (me.st === "swim") {
    status = me.tube ? "튜브 타고 둥둥 · 강가 쪽으로 가면 올라갑니다" : "배영 중 · 강가 쪽으로 헤엄치면 올라갑니다";
    acts.push(["tube", me.tube ? "튜브 빼기" : "튜브 끼기", ""]);
    const bo = boatOptions();
    if (bo.join != null) acts.push(["boat", "오리배 타기", "duck"]);
    if (bo.squeeze != null) acts.push(["squeeze", "끼어 타기 (3명)", "duck"]);
  }
  status = storeActions(acts, status);
  status = rentalActions(acts, status);
  if ($("status").textContent !== status) { $("status").textContent = status; $("status").hidden = !status; }
  // rebuild the buttons only when they change, so a running timer in the status line never eats a tap
  const key = JSON.stringify(acts); if (key === actKey) return; actKey = key;
  const row = $("actRow"); row.textContent = "";
  acts.forEach(([id, label, cls]) => { const b = document.createElement("button"); b.className = "act " + cls; b.textContent = label; b.dataset.act = id; row.appendChild(b); });
}
$("actRow").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return; const a = b.dataset.act;
  if (storeClick(a) || rentalClick(a)) { publish(true); actKey = ""; refreshActions(); return; }
  if (a === "sit" || a === "lie") {
    if (me.st === "walk") {
      if (!canSpread()) { toast("잔디나 대교 위에서만 돗자리를 펼 수 있습니다"); return; }
      const who = me.mat && matConflict(me.x, me.z);
      if (who) { toast(who + "님 돗자리와 너무 가깝습니다. 조금만 떨어져 주세요"); return; }
      if (!me.mat && !matHinted && me.level === "ground") { matHinted = true; toast("잔디에 그냥 앉았어요. 돗자리는 돗자리 대여소에서 빌릴 수 있어요"); }
      me.r = 0;
    }
    me.st = a; rebuildMe(); cam.tPitch = a === "lie" ? 0.42 : 0.22; cam.tDist = a === "lie" ? 7.5 : 6.5;
  } else if (a === "bench") {
    const seat = nearBench(); if (!seat) { toast("빈자리가 없습니다"); return; }
    me.st = seat.kind; me.seat = seat; me.x = seat.x; me.z = seat.z; me.y = 0; me.r = seat.r; rebuildMe(); cam.tPitch = 0.24; cam.tDist = 6;
  } else if (a === "stand") {
    if (me.st === "bench") { me.z = 24.8; me.y = 0; }
    if (me.st === "stool" && me.seat) { const dx = me.seat.x - me.seat.tx, dz = me.seat.z - me.seat.tz, d = Math.hypot(dx, dz) || 1; me.x += dx / d * .55; me.z += dz / d * .55; }
    me.seat = null; me.st = "walk"; rebuildMe(); cam.tPitch = 0.26; cam.tDist = 6.5;
  }
  else if (a === "cook") {
    const nm = nearMachine(); if (!nm || machineOwners()[nm.i]) { toast("다른 분이 먼저 쓰고 있어요"); return; }
    const pi = wallet.bag.indexOf("rpack"); if (pi < 0) { toast("편의점에서 봉지라면을 먼저 사 와 주세요"); return; }
    wallet.bag.splice(pi, 1); saveWallet();
    me.rm = { m: nm.i, at: Date.now() }; MACHINES[nm.i].doneShown = false; if (audio.ready) audio.click();
    toast("봉지라면을 뜯어 기계에 올렸어요. 1분 30초 뒤에 완성됩니다");
  } else if (a === "pickup") {
    me.rm = null; me.hold = "ramen"; me.eat = 0; toast("뜨끈한 라면을 들었어요! 앉거나 서서 먹어 보세요");
  } else if (a === "eat") {
    if (!me.hold) return; me.eat = Date.now(); u_lastBite.me = -1;
  }
  else if (a === "cheers") { me.ch = Date.now(); if (audio.ready) audio.pop(); }
  else if (a === "mung") { enterMung(); return; }
  else if (a === "paper") { openPaper(); return; }
  else if (a === "tube") { me.tube = !me.tube; rebuildMe(); }
  else if (a === "boat") { if (me.hold) { toast("먹을 걸 든 채로는 오리배를 탈 수 없어요"); return; } const id = boatOptions().join; if (id == null) toast("남은 오리배가 없습니다"); else claimBoat(id, false); }
  else if (a === "squeeze") { const id = boatOptions().squeeze; if (id == null) toast("끼어 탈 오리배가 없습니다"); else claimBoat(id, true); }
  else if (a === "cancel") { me.bt = null; }
  else if (a === "leave") { leaveBoat(false); return; }
  publish(true); actKey = ""; refreshActions();
});

/* mat preview */
const ghost = new THREE.Mesh(new THREE.PlaneGeometry(MAT_W, MAT_L), new THREE.MeshBasicMaterial({ color: 0x9be3a0, transparent: true, opacity: 0.32, depthWrite: false }));
ghost.rotation.x = -Math.PI / 2; ghost.visible = false; scene.add(ghost);

/* ================= admin weather (db + user) ================= */
let weatherRef = null, isAdmin = false;
(async () => {
  try {
    if (!window.claude || typeof window.claude.use !== "function") return;
    const [db, user] = await Promise.all([window.claude.use("db"), window.claude.use("user")]);
    if (user) { try { isAdmin = await user.canEdit(); } catch (e) { isAdmin = false; } }
    if (!db) return;
    if (isAdmin) { $("weatherSeg").hidden = false; $("adminBadge").hidden = false; $("fwTest").hidden = false; $("weatherNote").textContent = "관리자만 날씨를 바꿀 수 있습니다. 바꾸면 접속한 모두에게 바로 적용됩니다. 시간대는 한국 시간에 맞춰 자동입니다."; }
    weatherRef = db.doc("live/weather");
    weatherRef.onSnapshot(snap => {
      const d = snap.exists ? snap.data() : null; const w = d && typeof d.w === "string" && WEATHER[d.w] ? d.w : "clear";
      if (w !== weather) { weather = w; applyEnv(); if (started) toast("날씨가 " + WEATHER[w] + "(으)로 바뀌었습니다"); }
    }, () => {});
  } catch (e) {}
})();
$("weatherSeg").addEventListener("click", async e => {
  const b = e.target.closest("button"); if (!b || !isAdmin || !weatherRef) return;
  const w = b.dataset.w, prev = weather; weather = w; applyEnv();
  try { await weatherRef.set({ w, at: Date.now() }); } catch (err) { weather = prev; applyEnv(); toast("날씨를 바꾸지 못했습니다. 편집 권한이 있는지 확인해 주세요"); }
});

