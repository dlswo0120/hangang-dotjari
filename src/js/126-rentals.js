/* ================= 대여소: 한강 자전거 · 돗자리 ================= */
const BIKE_ST = { x: 11.5, z: 35.6, n: 6, x0: 8.5, step: 1.2 }, BIKE_FEE = 1000, BIKE_SLOT = 600000;
const MAT_ST = { x: 1.5, z: 24 }, MAT_FEE = 500;
const BIKE_COLOR = 0xf08a4b;

function signTex(lines, bg, fg, w = 512, h = 128) {
  return canvasTex(w, h, (x, W, H) => {
    x.fillStyle = bg; x.fillRect(0, 0, W, H); x.fillStyle = fg; x.textAlign = "center"; x.textBaseline = "middle";
    lines.forEach(([t, size, y]) => { x.font = `bold ${size}px 'Gowun Dodum', sans-serif`; x.fillText(t, W / 2, H * y); });
  }, 1, 1);
}
const signMat = tex => new THREE.MeshLambertMaterial({ map: tex, emissive: 0xffffff, emissiveIntensity: .25, emissiveMap: tex });

/* ---------- bike station: racks, bikes, kiosk ---------- */
const stationBikes = [];
{
  const S = BIKE_ST, add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; scene.add(o); return o; };
  const steel = mat(0x8b949c), dark = mat(0x2a2d31);
  add(new THREE.BoxGeometry(S.n * S.step + .6, .04, 2.2), mat(0x9aa3ab), S.x0 + (S.n - 1) * S.step / 2, .02, S.z);
  for (let i = 0; i < S.n; i++) {
    const x = S.x0 + i * S.step;
    add(new THREE.BoxGeometry(.12, .7, .12), steel, x + .35, .35, S.z - .55);
    add(new THREE.BoxGeometry(.06, .06, .5), steel, x + .35, .5, S.z - .55);
    const b = makeBike(BIKE_COLOR); b.position.set(x, 0, S.z); b.traverse(m => { if (m.isMesh) m.castShadow = true; }); scene.add(b); stationBikes.push(b);
  }
  // kiosk
  const kx = S.x0 - 1.6;
  add(new THREE.BoxGeometry(.7, 1.5, .45), mat(BIKE_COLOR), kx, .75, S.z - .2);
  const scr = add(new THREE.PlaneGeometry(.46, .34), new THREE.MeshBasicMaterial({ color: 0x9fe0ff }), kx, 1.18, S.z - .43); scr.rotation.y = Math.PI;
  add(new THREE.BoxGeometry(.1, 2.6, .1), dark, kx, 1.3, S.z + .1);
  const sign = add(new THREE.PlaneGeometry(2.2, .55), signMat(signTex([["한강 자전거 대여소", 46, .4], ["10분 1,000원 · 여기서 반납", 28, .78]], "#f08a4b", "#ffffff")), kx, 2.55, S.z + .1 - .06);
  sign.castShadow = false; sign.rotation.y = Math.PI;
  const sign2 = sign.clone(); sign2.rotation.y = 0; sign2.position.z = S.z + .16; scene.add(sign2);
  OBST.push({ x0: S.x0 - .55, x1: S.x0 + (S.n - 1) * S.step + .6, z0: S.z - .85, z1: S.z + .95 }, { x0: kx - .4, x1: kx + .4, z0: S.z - .45, z1: S.z + .2 });
}

/* ---------- mat rental booth ---------- */
{
  const S = MAT_ST, add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; scene.add(o); return o; };
  add(new THREE.BoxGeometry(3, .95, .7), mat(0xf4efe4), S.x, .475, S.z + .25);
  add(new THREE.BoxGeometry(3.1, .06, .8), mat(0x3f8f6b), S.x, .97, S.z + .25);
  [-1.45, 1.45].forEach(k => add(new THREE.BoxGeometry(.08, 2.4, .08), mat(0xdedad0), S.x + k, 1.2, S.z - .3));
  const roof = add(new THREE.BoxGeometry(3.4, .08, 1.6), mat(0x3f8f6b), S.x, 2.42, S.z);
  const stripe = new THREE.MeshLambertMaterial({ color: 0xffffff });
  for (let i = 0; i < 6; i++) add(new THREE.BoxGeometry(.28, .3, .04), i % 2 ? stripe : mat(0x3f8f6b), S.x - 1.4 + i * .56, 2.25, S.z + .8);
  const sign = add(new THREE.PlaneGeometry(2.6, .5), signMat(signTex([["돗자리 대여소", 48, .42], ["오늘 첫 대여 무료 · 그다음 500원", 26, .8]], "#3f8f6b", "#fffbe8")), S.x, 1.9, S.z + .82);
  sign.castShadow = false;
  // rolled mats on the counter and stacked behind
  MAT_STYLES.forEach((_, i) => {
    const mm = new THREE.MeshLambertMaterial({ map: matTex[i] });
    const r = add(new THREE.CylinderGeometry(.11, .11, .9, 12), mm, S.x - 1.1 + i * .55, 1.12, S.z + .2); r.rotation.x = Math.PI / 2;
    const s2 = add(new THREE.CylinderGeometry(.12, .12, 1.1, 12), mm, S.x - 1.1 + i * .55, .62, S.z - .35); s2.rotation.z = Math.PI / 2;
  });
  OBST.push({ x0: S.x - 1.6, x1: S.x + 1.6, z0: S.z - .5, z1: S.z + .65 });
}

/* ---------- state ---------- */
const nearBikeStation = () => me.level === "ground" && Math.abs(me.x - (BIKE_ST.x0 + (BIKE_ST.n - 1) * BIKE_ST.step / 2)) < BIKE_ST.n * BIKE_ST.step / 2 + 2 && me.z > 32.8 && me.z < BIKE_ST.z - .7;
const nearMatBooth = () => me.level === "ground" && me.st === "walk" && Math.abs(me.x - MAT_ST.x) < 2.2 && me.z > MAT_ST.z + .6 && me.z < MAT_ST.z + 2.6;
function bikesOut() { let n = me.st === "bike" ? 1 : 0; for (const o of others.values()) if (o.p.st === "bike") n++; return n; }
function todayKey() { const k = kst(); return k.getFullYear() + "-" + (k.getMonth() + 1) + "-" + k.getDate(); }
const matFee = () => wallet.matDay === todayKey() ? MAT_FEE : 0;

function rentalActions(acts, status) {
  if (!started || anim || boarded) return status;
  if (me.st === "bike") {
    acts.length = 0;
    if (nearBikeStation()) acts.push(["bikeret", "자전거 반납하기", "primary"]);
    acts.push(["bell", "따르릉", acts.length ? "" : "primary"]);
    const left = Math.max(0, me.bike.paid * BIKE_SLOT - (Date.now() - me.bike.at)) / 1000;
    return `자전거 타는 중 · 다음 요금까지 ${fmt(left)}` + (touchy ? "" : " · W 달리기 · A/D 방향 · S 멈추기");
  }
  if (me.st !== "walk" || me.q) return status;
  if (nearBikeStation()) {
    const free = BIKE_ST.n - bikesOut();
    if (free > 0) acts.unshift(["bikerent", "자전거 빌리기 · 1,000원", "primary"]);
    status = free > 0 ? `한강 자전거 · 10분에 1,000원 · 남은 자전거 ${free}대` : "지금은 남은 자전거가 없어요. 조금 뒤에 와 주세요";
  }
  if (nearMatBooth()) {
    if (me.mat) acts.unshift(["matret", "돗자리 반납하기", ""]);
    else acts.unshift(["matrent", matFee() ? "돗자리 빌리기 · 500원" : "돗자리 빌리기 · 오늘 무료", "primary"]);
    status = me.mat ? "돗자리를 들고 있어요. 잔디에서 앉으면 펼쳐져요" : "돗자리 대여소 · 오늘 첫 대여는 무료예요";
  }
  return status;
}
function rentalClick(a) {
  if (a === "bikerent") {
    if (me.hold) { toast("먹을 걸 든 채로는 자전거를 탈 수 없어요"); return true; }
    if (me.basket) { toast("장바구니를 든 채로는 자전거를 탈 수 없어요"); return true; }
    if (BIKE_ST.n - bikesOut() <= 0) { toast("남은 자전거가 없어요"); return true; }
    if (wallet.money < BIKE_FEE) { toast("돈이 모자라요. 자전거는 10분에 1,000원이에요"); return true; }
    wallet.money -= BIKE_FEE; saveWallet();
    me.bike = { at: Date.now(), paid: 1 }; me.st = "bike"; me.r = 0; me.speed = 0; me.crank = 0;
    me.x = clamp(me.x, BIKE_ST.x0 - 1, BIKE_ST.x0 + BIKE_ST.n * BIKE_ST.step); me.z = 33.6;
    rebuildMe(); cam.tPitch = .3; cam.tDist = 7.5;
    if (audio.ready) audio.bell(.8);
    toast("자전거를 빌렸어요! 10분마다 1,000원이 나가요. 여기로 돌아와 반납해 주세요");
    return true;
  }
  if (a === "bikeret") { returnBike("자전거를 반납했어요. 즐거운 라이딩이었어요!"); return true; }
  if (a === "bell") {
    me.bl = Date.now(); if (audio.ready) audio.bell(.9);
    showBubble(() => myAvatar, "따르릉~", 1.4, "bell-me"); return true;
  }
  if (a === "matrent") { openMatPicker(); return true; }
  if (a === "matret") { me.mat = false; rebuildMe(); toast("돗자리를 반납했어요"); return true; }
  return false;
}
function returnBike(msg) {
  if (me.st !== "bike") return;
  me.st = "walk"; me.bike = null; me.speed = 0; me.moving = false; me.z = Math.min(me.z, 34.0); rebuildMe(); cam.tPitch = .26; cam.tDist = 6.5;
  toast(msg); publish(true); actKey = "";
}

/* mat picker */
{
  const grid = $("matGrid");
  MAT_STYLES.forEach((_, i) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "matpick"; b.dataset.i = i; b.setAttribute("aria-label", "돗자리 무늬 " + (i + 1));
    try { b.style.backgroundImage = `url(${matTex[i].image.toDataURL()})`; } catch (e) { b.style.background = MAT_STYLES[i][0]; }
    grid.appendChild(b);
  });
}
function openMatPicker() {
  $("matFee").textContent = matFee() ? "500원이 나가요 · 내 돈 " + won(wallet.money) : "오늘 첫 대여라 무료예요";
  $("matModal").hidden = false;
}
$("matGrid").addEventListener("click", e => {
  const b = e.target.closest(".matpick"); if (!b) return;
  const fee = matFee();
  if (fee && wallet.money < fee) { toast("돈이 모자라요"); return; }
  wallet.money -= fee; wallet.matDay = todayKey(); saveWallet();
  me.m = +b.dataset.i; me.mat = true; $("matModal").hidden = true; rebuildMe(); publish(true); actKey = ""; refreshActions();
  toast("돗자리를 빌렸어요! 잔디에서 '앉기'를 누르면 펼쳐져요");
});
$("matClose").addEventListener("click", () => { $("matModal").hidden = true; });
$("matModal").addEventListener("click", e => { if (e.target === $("matModal")) $("matModal").hidden = true; });

/* ---------- riding ---------- */
function bikeStep(dt, inp) {
  // W/S: pedal and brake, A/D: steer (the camera follows the bike, so steering is relative to the bike)
  const want = inp.f > .05 ? (inp.run ? 10 : 7) * Math.min(1, inp.f) : 0;
  me.speed += (want - me.speed) * Math.min(1, dt * (inp.f < -.05 ? 4.5 : want > me.speed ? 1.6 : 1.2));
  me.r -= inp.r * dt * (1.1 + Math.min(me.speed, 7) * .12);
  me.moving = me.speed > .3;
  let nx = me.x - Math.sin(me.r) * me.speed * dt, nz = me.z - Math.cos(me.r) * me.speed * dt;
  if (nx < BOUND.x0 || nx > BOUND.x1 || nz > BOUND.landZ1 - .3) { hitBound(); me.speed *= .3; }
  nx = clamp(nx, BOUND.x0, BOUND.x1); nz = clamp(nz, BOUND.landZ0 + 1.2, BOUND.landZ1 - .3);
  if (nz < BOUND.landZ0 + 1.25 && Math.cos(me.r) > .3) { const n = performance.now(); if (n - (me.edgeToast || 0) > 5000) { me.edgeToast = n; toast("앗, 강이에요! 자전거로는 더 갈 수 없어요"); } }
  if (inStairs(nx, nz) || insideStore(nx, nz, -.6)) { nx = me.x; nz = me.z; me.speed *= .3; }
  [nx, nz] = pushOut(nx, nz, .5);
  me.crank = (me.crank || 0) + dt * me.speed * 1.3;
  me.x = nx; me.z = nz; me.y = 0;
}

/* ---------- visuals for every avatar: bike under them, rolled mat on their back ---------- */
function avatarRental(av, onBike, crank, speed, carryMat, dt) {
  const u = av.userData;
  if (onBike && !u.bikeM) { u.bikeM = makeBike(BIKE_COLOR); u.bikeM.position.set(0, -.84, -.08); u.bikeM.traverse(m => { if (m.isMesh) m.castShadow = true; }); av.add(u.bikeM); }
  if (u.bikeM) { u.bikeM.visible = onBike; if (onBike) u.bikeM.userData.wheels.forEach(w => w.rotation.x -= dt * speed / .32); }
  if (carryMat && !u.carry && u.roll) {
    u.carry = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .95, 12), u.roll.material); u.carry.rotation.z = Math.PI / 2; u.carry.position.set(0, .12, .2); u.carry.castShadow = true; u.torso.add(u.carry);
  }
  if (u.carry) u.carry.visible = carryMat;
}
const bikeOn = new Set(); // peers whose bell we already heard
function updateRentals(dt) {
  // per-slot billing
  if (me.st === "bike" && me.bike) {
    const slots = Math.floor((Date.now() - me.bike.at) / BIKE_SLOT) + 1;
    if (slots > me.bike.paid) {
      if (wallet.money >= BIKE_FEE) { wallet.money -= BIKE_FEE; me.bike.paid++; saveWallet(); toast("10분이 지나서 1,000원이 더 나갔어요"); }
      else returnBike("돈이 모자라 자전거를 대여소로 돌려보냈어요");
    }
  }
  // stations show fewer bikes while people ride
  const out = bikesOut(); stationBikes.forEach((b, i) => { b.visible = i >= out; });
  // bells from other riders
  for (const [peer, o] of others) {
    const bl = o.p.bl || 0;
    if (o.lastBell === undefined) { o.lastBell = bl; continue; }
    if (bl !== o.lastBell) {
      o.lastBell = bl; const id = peer; showBubble(() => (others.get(id) || {}).obj, "따르릉~", 1.4, "bell-" + id);
      if (audio.ready) { const d = Math.hypot(o.x - cam.tx, o.z - cam.tz); audio.bell(Math.pow(clamp(1 - d / 40, 0, 1), 2)); }
    }
  }
}
