/* ================= 한강 낚시: 데크 · 대여 · 던지기 · 챔질 · 도감 ================= */
const FISH_DECK = { x: 120, half: 6, z0: -2.6 }, ROD_FEE = 1000, ROD_TIME = 30 * 60000, FISH_DAY_CAP = 4000;
const FISH = [
  { k: "bung", name: "붕어", rare: 0, w: 20, cm: [15, 32], col: 0x8a7a4a, pay: 200 },
  { k: "ing", name: "잉어", rare: 0, w: 20, cm: [30, 72], col: 0xb08a40, pay: 200 },
  { k: "nuchi", name: "누치", rare: 0, w: 20, cm: [25, 48], col: 0x9aa0a8, pay: 200 },
  { k: "megi", name: "메기", rare: 1, w: 8, cm: [30, 75], col: 0x55504a, pay: 600 },
  { k: "junchi", name: "강준치", rare: 1, w: 8, cm: [40, 85], col: 0xc8d0d8, pay: 600 },
  { k: "sogari", name: "쏘가리", rare: 1, w: 8, cm: [20, 42], col: 0xb89040, pay: 600 },
  { k: "gold", name: "황금 잉어", rare: 2, w: 2, cm: [55, 95], col: 0xffcf3a, pay: 3000 },
  { k: "boot", name: "장화", rare: 3, w: 7, cm: [0, 0], col: 0x3a4a3a, pay: 100 },
  { k: "can", name: "깡통", rare: 3, w: 7, cm: [0, 0], col: 0xb0b6bc, pay: 100 }
];
const FISH_BY = Object.fromEntries(FISH.map(f => [f.k, f]));
const RARE_LABEL = ["흔해요", "가끔 잡혀요", "아주 드물어요", "강 청소"];
const onFishDeck = (x, z) => Math.abs(x - FISH_DECK.x) < FISH_DECK.half && z > FISH_DECK.z0 && z < BOUND.landZ0 + .1;

/* the deck and the rod rental box */
{
  const D = FISH_DECK, wood = mat(0x8a6a48);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(D.half * 2, .3, 3.4), wood); deck.position.set(D.x, -.15, -1.1); deck.receiveShadow = true; scene.add(deck);
  for (let x = -D.half + .5; x <= D.half - .5; x += 2.5) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, 1.6, 6), wood); p.position.set(D.x + x, -.6, -2.6); scene.add(p); }
  [-1, 1].forEach(s => { const r = new THREE.Mesh(new THREE.BoxGeometry(.08, .5, 3.2), mat(0x6b4f35)); r.position.set(D.x + s * (D.half - .05), .25, -1.1); r.castShadow = true; scene.add(r); });
  const bx = D.x - D.half - 1.4, bz = 2.4;
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.3, .6), mat(0x2f6fb0)); box.position.set(bx, .65, bz); box.castShadow = true; scene.add(box);
  for (let i = 0; i < 4; i++) { const rod = new THREE.Mesh(new THREE.CylinderGeometry(.012, .02, 1.7, 5), mat(0x3a2a1a)); rod.position.set(bx - .35 + i * .23, 1.3, bz + .32); rod.rotation.x = .12; scene.add(rod); }
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.9, .55), signMat(signTex([["낚싯대 대여", 44, .38], ["30분 1,000원 · 낚시 데크에서", 24, .78]], "#2f6fb0", "#ffffff"))); sign.position.set(bx, 2.35, bz + .31); scene.add(sign);
  const post = new THREE.Mesh(new THREE.BoxGeometry(.08, 1.1, .08), mat(0x3a3d44)); post.position.set(bx, 1.75, bz + .25); scene.add(post);
  OBST.push({ x0: bx - .6, x1: bx + .6, z0: bz - .35, z1: bz + .35 });
  FISH_DECK.box = [bx, bz];
}
const nearRodBox = () => me.level === "ground" && me.st === "walk" && Math.hypot(me.x - FISH_DECK.box[0], me.z - (FISH_DECK.box[1] + 1.1)) < 1.4;

/* dex and daily rewards (this browser) */
const DEX_KEY = "hangang-fishdex";
const dex = (() => { try { return JSON.parse(localStorage.getItem(DEX_KEY) || "{}") || {}; } catch (e) { return {}; } })();
function saveDex() { try { localStorage.setItem(DEX_KEY, JSON.stringify(dex)); } catch (e) {} }
function fishEarnedToday() { return wallet.fishDay === todayKey() ? (wallet.fishEarn || 0) : 0; }

/* rod rental */
function fishActions(acts, status) {
  if (!started || anim || boarded) return status;
  if (me.rod && Date.now() - me.rod.at > ROD_TIME) { endRod("30분이 지나 낚싯대를 반납했어요"); }
  if (nearRodBox()) {
    if (!me.rod) { acts.unshift(["rodrent", "낚싯대 빌리기 · 1,000원", "primary"]); status = "낚싯대 대여 · 30분 1,000원 · 데크 끝에서 던져 보세요"; }
    else acts.unshift(["rodret", "낚싯대 반납하기", ""]);
  }
  if (me.rod && me.st === "walk") {
    if (onFishDeck(me.x, me.z)) acts.unshift(["fish", "낚시하기", "primary"]);
    else if (!status) status = `낚싯대 대여 중 · ${fmt(Math.max(0, (ROD_TIME - (Date.now() - me.rod.at)) / 1000))} 남음 · 낚시 데크로 가 보세요`;
  }
  return status;
}
function fishClick(a) {
  if (a === "rodrent") {
    if (me.hold) { toast("손에 든 걸 먼저 다 먹어 주세요"); return true; }
    if (me.basket) { toast("장바구니를 든 채로는 빌릴 수 없어요"); return true; }
    if (wallet.money < ROD_FEE) { toast("돈이 모자라요. 낚싯대는 30분에 1,000원이에요"); return true; }
    wallet.money -= ROD_FEE; saveWallet(); me.rod = { at: Date.now() }; me.fs = null;
    toast("낚싯대를 빌렸어요! 낚시 데크 끝으로 가서 '낚시하기'를 눌러 보세요"); return true;
  }
  if (a === "rodret") { endRod("낚싯대를 반납했어요"); return true; }
  if (a === "fish") { openFish(); return true; }
  return false;
}
function endRod(msg) { me.rod = null; me.fs = null; closeFish(); toast(msg); publish(true); actKey = ""; }

/* the fishing panel: hold to cast, wait, strike, release */
const fishing = { st: "ready", power: 0, pDir: 1, castAt: 0, biteAt: 0, catch: null, raf: 0 };
function openFish() {
  if (!me.rod) return; me.r = 0; fishing.st = "ready"; fishing.catch = null;
  $("fishModal").hidden = false; $("dexBox").hidden = true; drawFish(); fishLoop();
}
function closeFish() {
  $("fishModal").hidden = true; fishing.st = "ready"; cancelAnimationFrame(fishing.raf);
  if (me.fs && me.fs.s !== "catch") { me.fs = null; publish(true); }
}
function setFs(s, extra) { me.fs = Object.assign({ s, at: Date.now() }, extra || {}); publish(true); }
function drawFish() {
  const st = fishing.st, btn = $("fishBtn"), msg = $("fishMsg"), card = $("fishCard");
  card.hidden = st !== "caught"; $("fishPower").hidden = st !== "charge" && st !== "ready";
  $("fishPowerBar").style.width = Math.round(fishing.power * 100) + "%";
  btn.className = "fish-btn" + (st === "bite" ? " bite" : ""); $("reel").hidden = st !== "bite";
  btn.hidden = st === "caught"; $("fishRelease").hidden = st !== "caught";
  if (st === "ready") { msg.textContent = "버튼을 꾹 눌렀다가 떼면 찌를 던져요"; btn.textContent = "꾹 눌러 던지기"; }
  else if (st === "charge") { msg.textContent = "적당할 때 손을 떼세요!"; btn.textContent = "던질 힘 모으는 중…"; }
  else if (st === "wait") { msg.textContent = "찌를 보고 있어요… 입질이 오면 바로 눌러요"; btn.textContent = "기다리는 중 (누르면 걷어 올려요)"; }
  else if (st === "bite") { const R = fishing.reel; msg.textContent = `걸렸다! 바늘이 초록 칸에 왔을 때 눌러요 (${R.hits}/2 · 헛손질 ${R.miss}/3)`; btn.textContent = "지금 눌러 감기!"; }
  else if (st === "caught" && fishing.catch) {
    const F = FISH_BY[fishing.catch.k], earned = fishEarnedToday(), pay = Math.min(F.pay, Math.max(0, FISH_DAY_CAP - earned));
    msg.textContent = F.rare === 3 ? "물고기가 아니라…" : F.rare === 2 ? "✨ 대박! 황금 잉어예요!" : "잡았어요!";
    $("fishName").textContent = F.name + (F.rare === 3 ? "" : ` ${fishing.catch.cm}cm`);
    $("fishRare").textContent = RARE_LABEL[F.rare] + (fishing.catch.isNew ? " · 도감에 새로 기록!" : "");
    $("fishIcon").style.background = "#" + F.col.toString(16).padStart(6, "0");
    $("fishRelease").textContent = (F.rare === 3 ? "쓰레기 버리기" : "방생하기") + (fishing.catch.duel ? ` (대결 점수 +${fishing.catch.pts}점)` : pay > 0 ? ` (+${won(pay)})` : " (오늘 보상은 다 받았어요)");
  }
}
function fishLoop() {
  cancelAnimationFrame(fishing.raf);
  let last = performance.now();
  const tick = () => {
    if ($("fishModal").hidden) return;
    const now = Date.now(), pn = performance.now(), dt = Math.min(.25, (pn - last) / 1000); last = pn;
    { const dl = $("fishDuel"), d = myDuel(); if (d && d.fd.st === "go") { const other = d.h.key === "me" ? d.opp : d.h, left = d.fd.go + FD_TIME - now; dl.hidden = false; dl.textContent = left > FD_TIME ? "대결 준비…" : left > 0 ? `🎣 대결 ${fmt(left / 1000)} · 나 ${scoreOf("me").s}점 · ${other ? other.n : "상대"} ${other ? scoreOf(other.key).s : 0}점` : "대결 끝!"; } else dl.hidden = true; }
    if (fishing.st === "charge") { fishing.power += fishing.pDir * dt * 1.1; if (fishing.power >= 1) { fishing.power = 1; fishing.pDir = -1; } if (fishing.power <= 0) { fishing.power = 0; fishing.pDir = 1; } $("fishPowerBar").style.width = Math.round(fishing.power * 100) + "%"; }
    if (fishing.st === "wait" && now >= fishing.biteAt) { const F = rollFish(); fishing.st = "bite"; fishing.reel = { F, hits: 0, miss: 0, pos: 0, dir: 1, speed: [1, 1.35, 1.8, .75][F.rare], zone: .2 + Math.random() * .55, end: now + 7000 }; placeReel(); setFs("bite", { bx: me.fs.bx, bz: me.fs.bz }); if (audio.ready) { audio.tone(audio.sfx, "sine", 520, 260, .18, .3); if (navigator.vibrate) try { navigator.vibrate(120); } catch (e) {} } drawFish(); }
    if (fishing.st === "bite") {
      const R = fishing.reel; R.pos += R.dir * R.speed * dt; if (R.pos >= 1) { R.pos = 1; R.dir = -1; } if (R.pos <= 0) { R.pos = 0; R.dir = 1; }
      $("reelNeedle").style.left = (R.pos * 100) + "%";
      if (now > R.end) { fishing.st = "ready"; toast("힘이 빠져서 놓쳤어요… 다시 던져 보세요"); setFs("idle"); drawFish(); }
    }
    if ((fishing.st === "wait" || fishing.st === "bite") && (me.moving || me.st !== "walk" || !onFishDeck(me.x, me.z))) { fishing.st = "ready"; setFs("idle"); closeFish(); toast("움직여서 낚싯줄을 걷었어요"); return; }
    fishing.raf = requestAnimationFrame(tick);
  };
  fishing.raf = requestAnimationFrame(tick);
}
$("fishBtn").addEventListener("pointerdown", e => {
  e.preventDefault();
  if (fishing.st === "ready") { fishing.st = "charge"; fishing.power = 0; fishing.pDir = 1; drawFish(); }
  else if (fishing.st === "wait") { fishing.st = "ready"; setFs("idle"); toast("낚싯줄을 걷어 올렸어요"); drawFish(); }
  else if (fishing.st === "bite") reelTap();
});
const REEL_W = .2;
function placeReel() { const z = $("reelZone"); z.style.left = (fishing.reel.zone * 100) + "%"; z.style.width = (REEL_W * 100) + "%"; }
function reelTap() {
  const R = fishing.reel, inZone = R.pos >= R.zone && R.pos <= R.zone + REEL_W, box = $("reel");
  box.classList.remove("hit", "miss"); void box.offsetWidth;
  if (inZone) {
    R.hits++; box.classList.add("hit"); if (audio.ready) audio.tone(audio.sfx, "sine", 700 + R.hits * 200, 900 + R.hits * 200, .12, .12);
    if (R.hits >= 2) { strike(R.F); return; }
    R.zone = .05 + Math.random() * .7; R.speed *= 1.15; placeReel();
  } else {
    R.miss++; box.classList.add("miss"); if (audio.ready) audio.tone(audio.sfx, "square", 220, 160, .1, .05);
    if (R.miss >= 3) { fishing.st = "ready"; toast(`${R.F.rare === 3 ? "뭔가" : "물고기"}가 줄을 끊고 도망갔어요…`); setFs("idle"); drawFish(); return; }
  }
  drawFish();
}
const castRelease = () => {
  if (fishing.st !== "charge") return;
  const d = 3 + fishing.power * 9; me.r = 0;
  const bx = clamp(me.x - Math.sin(me.r) * d, BOUND.x0, BOUND.x1), bz = Math.min(FISH_DECK.z0 - 1, me.z - Math.cos(me.r) * d);
  fishing.st = "wait"; fishing.castAt = Date.now(); fishing.biteAt = fishing.castAt + 5000 + Math.random() * 17000;
  setFs("cast", { bx: +bx.toFixed(2), bz: +bz.toFixed(2) }); if (audio.ready) audio.tone(audio.sfx, "sine", 900, 300, .25, .08);
  setTimeout(() => { if (audio.ready) audio.paddle(); }, 600);
  drawFish();
};
["pointerup", "pointerleave", "pointercancel"].forEach(ev => $("fishBtn").addEventListener(ev, castRelease));
function rollFish() {
  const total = FISH.reduce((s, f) => s + f.w, 0); let r = Math.random() * total;
  for (const f of FISH) { r -= f.w; if (r <= 0) return f; } return FISH[0];
}
function strike(pre) {
  const F = pre || rollFish(), cm = F.cm[1] ? Math.round(F.cm[0] + Math.pow(Math.random(), 1.6) * (F.cm[1] - F.cm[0])) : 0;
  const prev = dex[F.k], isNew = !prev;
  dex[F.k] = { n: (prev ? prev.n : 0) + 1, best: Math.max(prev ? prev.best : 0, cm) }; saveDex();
  const duel = inFishDuel(), pts = duelCatch(F, cm);
  fishing.catch = { k: F.k, cm, isNew, duel, pts }; fishing.st = "caught";
  setFs("catch", { k: F.k, cm });
  showBubble(() => myAvatar, F.rare === 3 ? `${F.name}…?` : `${F.name} ${cm}cm!`, 3, "me");
  if (audio.ready) (F.rare === 2 ? audio.ding() : audio.pop());
  drawFish();
}
$("fishRelease").addEventListener("click", () => {
  if (!fishing.catch) return; const F = FISH_BY[fishing.catch.k];
  const pay = fishing.catch.duel ? 0 : Math.min(F.pay, Math.max(0, FISH_DAY_CAP - fishEarnedToday()));
  if (pay > 0) { if (wallet.fishDay !== todayKey()) { wallet.fishDay = todayKey(); wallet.fishEarn = 0; } wallet.fishEarn += pay; wallet.money += pay; saveWallet(); }
  toast(F.rare === 3 ? `강이 조금 더 깨끗해졌어요${pay ? " · +" + won(pay) : ""}` : `${F.name}를 강으로 돌려보냈어요${pay ? " · +" + won(pay) : ""}`);
  if (audio.ready) audio.paddle();
  fishing.catch = null; fishing.st = "ready"; fishing.power = 0; setFs("idle"); drawFish();
});
$("fishDexBtn").addEventListener("click", () => {
  const box = $("dexBox"); box.hidden = !box.hidden; if (box.hidden) return; box.textContent = "";
  FISH.forEach(F => {
    const d = dex[F.k], cell = document.createElement("div"); cell.className = "dex" + (d ? "" : " unknown");
    const dot = document.createElement("i"); dot.style.background = d ? "#" + F.col.toString(16).padStart(6, "0") : "#555";
    const t = document.createElement("span"); t.textContent = d ? `${F.name}${F.cm[1] ? " · 최고 " + d.best + "cm" : ""} · ${d.n}번` : "??? · " + RARE_LABEL[F.rare];
    cell.append(dot, t); box.appendChild(cell);
  });
});
$("fishClose").addEventListener("click", closeFish);

/* everyone's rods, lines, bobbers and catches */
function makeFishMesh(k) {
  const F = FISH_BY[k] || FISH[0], g = new THREE.Group(), m = F.rare === 2 ? new THREE.MeshLambertMaterial({ color: F.col, emissive: 0x8a5a00, emissiveIntensity: .6 }) : mat(F.col);
  if (F.rare === 3) {
    if (k === "boot") { const a = new THREE.Mesh(new THREE.BoxGeometry(.14, .3, .14), m); a.position.y = .15; g.add(a); const b = new THREE.Mesh(new THREE.BoxGeometry(.14, .1, .26), m); b.position.set(0, .05, -.06); g.add(b); }
    else { const c = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .2, 12), m); c.position.y = .1; g.add(c); }
    return g;
  }
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), m); body.scale.set(.09, .1, .3); g.add(body);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(.09, .16, 4), m); tail.rotation.x = Math.PI / 2; tail.position.z = .34; tail.scale.set(.25, 1, 1); g.add(tail);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(.018, 6, 4), new THREE.MeshBasicMaterial({ color: 0x111111 })); eye.position.set(.07, .03, -.2); g.add(eye);
  g.rotation.x = -Math.PI / 2.3; return g;
}
function rodFor(av) {
  const u = av.userData;
  if (!u.rodG) {
    const g = new THREE.Group(), rod = new THREE.Mesh(new THREE.CylinderGeometry(.015, .03, 1.9, 6), mat(0x2a2e3a)); rod.position.y = .95; g.add(rod);
    const tip = new THREE.Object3D(); tip.position.y = 1.9; g.add(tip);
    g.position.set(.2, .15, -.32); g.rotation.x = -.85; u.torso.add(g); u.rodG = g; u.rodTip = tip;
    const lineGeo = new THREE.BufferGeometry(); lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
    u.line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xeeeeee, transparent: true, opacity: .7 })); u.line.frustumCulled = false; scene.add(u.line);
    u.bobber = new THREE.Mesh(new THREE.SphereGeometry(.11, 12, 8), new THREE.MeshLambertMaterial({ color: 0xff3b30, emissive: 0xff3b30, emissiveIntensity: .5 })); scene.add(u.bobber);
  }
  return u;
}
const tipW = new THREE.Vector3();
function showRod(av, has, fs) {
  const u = av.userData;
  if (!has) { if (u.rodG) { u.rodG.visible = false; u.line.visible = false; u.bobber.visible = false; if (u.fishM) u.fishM.visible = false; } return; }
  rodFor(av); u.rodG.visible = true;
  const s = fs && fs.s, inWater = s === "cast" || s === "bite";
  u.line.visible = u.bobber.visible = inWater;
  if (inWater) {
    const fly = clamp((Date.now() - fs.at) / 600, 0, 1), dip = s === "bite" ? .12 + Math.sin(T * 30) * .03 : 0;
    u.rodTip.getWorldPosition(tipW);
    const by = -.58 + Math.sin(T * 2.2 + av.id) * .02 - dip;
    const bx = s === "cast" ? tipW.x + (fs.bx - tipW.x) * fly : fs.bx, bz = s === "cast" ? tipW.z + (fs.bz - tipW.z) * fly : fs.bz, byy = s === "cast" ? tipW.y + (by - tipW.y) * fly + Math.sin(fly * Math.PI) * 1.5 : by;
    u.bobber.position.set(bx, byy, bz);
    const a = u.line.geometry.attributes.position.array; a[0] = tipW.x; a[1] = tipW.y; a[2] = tipW.z; a[3] = bx; a[4] = byy + .06; a[5] = bz; u.line.geometry.attributes.position.needsUpdate = true;
  }
  // the catch, held up for a few seconds
  const showing = s === "catch" && Date.now() - fs.at < 6000;
  if (showing && (!u.fishM || u.fishK !== fs.k)) { if (u.fishM) u.torso.remove(u.fishM); u.fishM = makeFishMesh(fs.k); u.fishK = fs.k; u.fishM.position.set(0, .55, -.38); u.torso.add(u.fishM); }
  if (u.fishM) { u.fishM.visible = showing; if (showing) { const sc = clamp((fs.cm || 30) / 45, .6, 1.8); u.fishM.scale.setScalar(FISH_BY[fs.k] && FISH_BY[fs.k].rare === 3 ? 1 : sc); u.fishM.rotation.z = Math.sin(T * 9) * .2; } }
}
const seenCatch = new Map();
function updateFishing() {
  if (myAvatar) showRod(myAvatar, !!me.rod, me.fs);
  for (const [peer, o] of others) {
    showRod(o.obj, !!o.p.fr, o.p.fs);
    const fs = o.p.fs; if (fs && fs.s === "catch" && seenCatch.get(peer) !== fs.at) {
      seenCatch.set(peer, fs.at); const F = FISH_BY[fs.k];
      if (F && Date.now() - fs.at < 4000) { const id = peer; showBubble(() => (others.get(id) || {}).obj, F.rare === 3 ? `${F.name}…?` : `${F.name} ${fs.cm}cm!`, 3, id); }
    }
  }
}
// rod pose: both hands forward on the grip
function rodPose(v, fs) { v.arR = 1.15; v.azR = -.25; v.arL = 1.0; v.azL = -.35; if (fs && fs.s === "catch" && Date.now() - fs.at < 6000) { v.arL = v.arR = 2.2; v.azL = v.azR = .1; } }
