/* ================= 물멍 · 종이배 · 불꽃놀이 · 별똥별 · 건배 ================= */

/* ---------- 물멍 모드: sit still for a while and the screen clears, camera drifts toward the river ---------- */
const MUNG_IDLE = 30000;
const mung = { on: false, last: performance.now(), saved: null };
const SEATED = ["sit", "lie", "bench", "stool"];
function enterMung() {
  if (mung.on || !started || !SEATED.includes(me.st)) return;
  mung.on = true; mung.saved = { yaw: cam.tYaw, pitch: cam.tPitch, dist: cam.tDist };
  document.body.classList.add("mung");
  const h = $("mungHint"); h.hidden = false; h.classList.remove("show"); void h.offsetWidth; h.classList.add("show");
}
function exitMung() {
  mung.last = performance.now();
  if (!mung.on) return;
  mung.on = false; document.body.classList.remove("mung"); $("mungHint").hidden = true;
  if (mung.saved) { cam.tYaw = mung.saved.yaw; cam.tPitch = mung.saved.pitch; cam.tDist = mung.saved.dist; }
}
["pointerdown", "keydown", "wheel", "touchstart"].forEach(ev => addEventListener(ev, () => exitMung(), { capture: true, passive: true }));
function updateMung(dt) {
  if (!started) return;
  const seated = SEATED.includes(me.st) && !anim;
  if (!seated) { if (mung.on) exitMung(); mung.last = performance.now(); return; }
  if (!mung.on && performance.now() - mung.last > MUNG_IDLE) enterMung();
  if (mung.on) {
    const k = Math.min(1, dt * .35);
    cam.tYaw = lerpAngle(cam.tYaw, Math.sin(T * .03) * .5, k);
    cam.tPitch += ((me.st === "lie" ? .2 : .1) - cam.tPitch) * k;
    cam.tDist += (9 - cam.tDist) * k;
    cam.dragAt = 0;
  }
}

/* ---------- 종이배: write a line, float it down the river; everyone sees it for a while ---------- */
const BOAT_LIFE = 90, PAPER_GAP = 20000;
const BAD_WORDS = /(씨\s*발|시\s*발|ㅅ\s*ㅂ|ㅆ\s*ㅂ|병\s*신|ㅂ\s*ㅅ|좆|존\s*나|ㅈ\s*ㄴ|개\s*새\s*끼|새\s*끼|지\s*랄|미\s*친\s*놈|미\s*친\s*년|닥\s*쳐|fuck|shit|bitch)/gi;
function cleanWords(t) { return String(t).replace(/[\u0000-\u001f\u200b-\u200f\u202a-\u202e]/g, "").replace(BAD_WORDS, "♡").trim().slice(0, 30); }
function nearRiver() { return me.level === "ground" && me.st === "walk" && !me.hold && me.z < 4.2 && me.x > BOUND.x0 + 2 && me.x < BOUND.x1 - 2; }
const paperBoats = [], seenPb = new Map();
const paperM = new THREE.MeshLambertMaterial({ color: 0xf8f4ea, emissive: 0x3a352c, side: THREE.DoubleSide });
function paperLabel(text) {
  const c = document.createElement("canvas"), x = c.getContext("2d"), fs = 30;
  x.font = `bold ${fs}px 'Gowun Dodum', sans-serif`;
  const w = Math.min(900, Math.ceil(x.measureText(text).width) + 44), h = 58; c.width = w; c.height = h;
  x.fillStyle = "rgba(255,252,242,.88)"; rr(x, 2, 2, w - 4, h - 4, 26); x.fill();
  x.font = `bold ${fs}px 'Gowun Dodum', sans-serif`; x.fillStyle = "#4a3f33"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, w / 2, h / 2 + 1);
  const t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearFilter;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, fog: false }));
  s.scale.set(w / h * .6, .6, 1); return s;
}
const recentPapers = [];
function spawnPaper(pb) {
  if (pb.t && !recentPapers.includes(pb.t)) { recentPapers.push(pb.t); if (recentPapers.length > 30) recentPapers.shift(); }
  const g = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(.34, .18, .15, 4, 1), paperM); hull.rotation.y = Math.PI / 4; hull.scale.set(1, 1, .42); hull.position.y = .07; g.add(hull);
  const sail = new THREE.Mesh(new THREE.ConeGeometry(.17, .3, 4), paperM); sail.rotation.y = Math.PI / 4; sail.scale.set(1, 1, .22); sail.position.y = .29; g.add(sail);
  g.scale.setScalar(2); scene.add(g);
  const spr = paperLabel(pb.t); scene.add(spr);
  paperBoats.push({ g, spr, x0: pb.x, at: pb.at, ph: Math.random() * 6 });
  while (paperBoats.length > 24) { const b = paperBoats.shift(); scene.remove(b.g); scene.remove(b.spr); }
}
function openPaper() { $("paperText").value = ""; $("paperModal").hidden = false; setTimeout(() => $("paperText").focus(), 50); }
$("paperCancel").addEventListener("click", () => { $("paperModal").hidden = true; });
$("paperModal").addEventListener("click", e => { if (e.target === $("paperModal")) $("paperModal").hidden = true; });
$("paperForm").addEventListener("submit", e => {
  e.preventDefault();
  const t = cleanWords($("paperText").value);
  if (!t) { toast("종이배에 적을 말을 써 주세요"); return; }
  if (me.pb && Date.now() - me.pb.at < PAPER_GAP) { toast("종이배는 잠시 뒤에 또 띄울 수 있어요"); return; }
  me.pb = { t, at: Date.now(), x: +me.x.toFixed(1) }; seenPb.set("me", me.pb.at); spawnPaper(me.pb);
  $("paperModal").hidden = true; publish(true);
  toast("종이배가 강물을 따라 천천히 흘러갑니다"); if (audio.ready) audio.lapOnce();
});
function updatePaper() {
  const now = Date.now();
  for (const [peer, o] of others) {
    const pb = o.p.pb; if (!pb || seenPb.get(peer) === pb.at) continue;
    seenPb.set(peer, pb.at);
    if (pb.t && pb.at < now + 5000 && now - pb.at < BOAT_LIFE * 1000) spawnPaper(pb);
  }
  for (let i = paperBoats.length - 1; i >= 0; i--) {
    const b = paperBoats[i], age = Math.max(0, (now - b.at) / 1000);
    if (age > BOAT_LIFE) { scene.remove(b.g); scene.remove(b.spr); paperBoats.splice(i, 1); continue; }
    const x = b.x0 - age * .42, z = -.9 - Math.min(age * .28, 10) - Math.sin(age * .2 + b.ph) * .4, y = -.62 + Math.sin(T * 1.8 + b.ph) * .03;
    b.g.position.set(x, y, z); b.g.rotation.set(Math.sin(T * 1.3 + b.ph) * .08, Math.sin(age * .15 + b.ph) * .5, Math.sin(T * 1.1 + b.ph) * .06);
    b.spr.position.set(x, y + 1.3, z);
    b.spr.material.opacity = Math.min(1, age / 1.5, (BOAT_LIFE - age) / 10);
  }
}

/* ---------- 한강 불꽃놀이: every night 21:00 KST for 4 minutes (everyone sees the same show) ---------- */
const FW_HOUR = 21, FW_DUR = 240000, FW_STEP = 1100;
const FW_N = 4000, fwPos = new Float32Array(FW_N * 3), fwCol = new Float32Array(FW_N * 3), fwBase = new Float32Array(FW_N * 3), fwVel = new Float32Array(FW_N * 3), fwLife = new Float32Array(FW_N), fwMax = new Float32Array(FW_N), fwGrav = new Float32Array(FW_N);
for (let i = 0; i < FW_N; i++) fwPos[i * 3 + 1] = -9999;
const fwGeo = new THREE.BufferGeometry();
fwGeo.setAttribute("position", new THREE.BufferAttribute(fwPos, 3)); fwGeo.setAttribute("color", new THREE.BufferAttribute(fwCol, 3));
const fwDot = canvasTex(32, 32, (x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(.35, "rgba(255,255,255,.75)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h); }, 1, 1);
const fwPts = new THREE.Points(fwGeo, new THREE.PointsMaterial({ size: 2.4, map: fwDot, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
fwPts.frustumCulled = false; scene.add(fwPts);
const FW_COLS = [0xff5a5a, 0xffd25a, 0x5ad1ff, 0xb07dff, 0x7dffa8, 0xff8ad8, 0xffffff, 0xffb35a].map(h => new THREE.Color(h));
const fw = { next: 0, shells: [], alive: 0, show: -1, k: 0, warned: -1, preview: /[?&#]fw\b/.test(location.search + location.hash) ? 0 : -1 };
function fwRand(k, s) { const v = Math.sin(k * 127.1 + s * 311.7 + fw.show / 86400000 * 74.7) * 43758.5453; return v - Math.floor(v); }
function fwParticle(x, y, z, vx, vy, vz, col, life, grav) {
  const i = fw.next; fw.next = (fw.next + 1) % FW_N; const j = i * 3;
  fwPos[j] = x; fwPos[j + 1] = y; fwPos[j + 2] = z; fwVel[j] = vx; fwVel[j + 1] = vy; fwVel[j + 2] = vz;
  fwBase[j] = col.r; fwBase[j + 1] = col.g; fwBase[j + 2] = col.b; fwLife[i] = fwMax[i] = life; fwGrav[i] = grav;
}
function fwBurst(s) {
  const willow = s.type === 1, ring = s.type === 2, n = willow ? 170 : 140;
  for (let i = 0; i < n; i++) {
    let dx, dy, dz;
    if (ring) { const a = i / n * Math.PI * 2; dx = Math.cos(a); dy = Math.sin(a) * .35 + .1; dz = Math.sin(a); }
    else { const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u); dx = r * Math.cos(a); dy = u; dz = r * Math.sin(a); }
    const sp = (willow ? 8 : 12) * (.85 + Math.random() * .3), col = Math.random() < .2 ? FW_COLS[6] : s.col;
    fwParticle(s.x, s.y, s.z, dx * sp, dy * sp, dz * sp, col, willow ? 3.4 : 2.1 + Math.random() * .4, willow ? 2.6 : 4.5);
  }
  fw.alive = 4;
  if (audio.ready) { const d = Math.hypot(s.x - camera.position.x, s.y - camera.position.y, s.z - camera.position.z); audio.boom(clamp(1.3 - d / 220, .15, 1), Math.min(.6, d / 340)); }
}
function fwLaunch(k) {
  const x = -40 + fwRand(k, 1) * 150, z = -78 - fwRand(k, 2) * 40, top = 32 + fwRand(k, 3) * 22;
  const type = fwRand(k, 4) < .22 ? 1 : fwRand(k, 4) < .35 ? 2 : 0;
  fw.shells.push({ x, y: -.5, z, top, vy: top / 1.4, col: type === 1 ? FW_COLS[7] : FW_COLS[Math.floor(fwRand(k, 5) * 7)], type });
}
function todayShowStart() {
  const k = kst(), since = ((k.getHours() * 60 + k.getMinutes()) * 60 + k.getSeconds()) * 1000 + k.getMilliseconds();
  return Date.now() - since + FW_HOUR * 3600000;
}
$("fwTest").addEventListener("click", () => { fw.preview = 0; toast("불꽃놀이 미리보기를 시작합니다 (나만 보여요)"); });
function updateFireworks(dt) {
  const now = Date.now();
  if (fw.preview === 0 && started) fw.preview = now + 3000;
  const daily = todayShowStart(), useDaily = now >= daily && now < daily + FW_DUR;
  const start = useDaily ? daily : fw.preview > 0 && now < fw.preview + FW_DUR ? fw.preview : -1;
  if (started && fw.warned !== daily && now > daily - 300000 && now < daily - 240000) { fw.warned = daily; toast("5분 뒤 밤 9시에 한강 불꽃놀이가 시작돼요"); }
  if (start !== fw.show) {
    if (start > 0) { fw.k = Math.max(0, Math.floor((now - start) / FW_STEP) - 1); if (started) toast("한강 불꽃놀이가 시작됐어요! 강 건너 하늘을 보세요"); }
    else if (fw.show > 0 && started) toast("오늘 불꽃놀이는 여기까지예요. 내일 밤 9시에 또 만나요");
    fw.show = start;
  }
  if (start > 0) {
    for (;;) {
      const tk = start + fw.k * FW_STEP + fwRand(fw.k, 0) * 700;
      if (tk > now || tk > start + FW_DUR) break;
      if (now - tk < 2500) { fwLaunch(fw.k); if (tk > start + FW_DUR - 30000) fwLaunch(fw.k + 5000); }
      fw.k++;
    }
  }
  for (let i = fw.shells.length - 1; i >= 0; i--) {
    const s = fw.shells[i]; s.y += s.vy * dt; s.vy = Math.max(6, s.vy - 9 * dt);
    fwParticle(s.x + (Math.random() - .5) * .2, s.y, s.z, 0, -1, 0, FW_COLS[7], .45, 0); fw.alive = Math.max(fw.alive, .5);
    if (s.y >= s.top) { fwBurst(s); fw.shells.splice(i, 1); }
  }
  if (fw.alive <= 0) return;
  fw.alive -= dt;
  for (let i = 0; i < FW_N; i++) {
    const j = i * 3;
    if (fwLife[i] <= 0) { if (fwPos[j + 1] > -9000) { fwPos[j + 1] = -9999; fwCol[j] = fwCol[j + 1] = fwCol[j + 2] = 0; } continue; }
    fwLife[i] -= dt; const drag = 1 - Math.min(1, dt * 1.2);
    fwVel[j] *= drag; fwVel[j + 1] = fwVel[j + 1] * drag - fwGrav[i] * dt; fwVel[j + 2] *= drag;
    fwPos[j] += fwVel[j] * dt; fwPos[j + 1] += fwVel[j + 1] * dt; fwPos[j + 2] += fwVel[j + 2] * dt;
    const l = Math.max(0, fwLife[i] / fwMax[i]), f = Math.pow(l, 1.2) * (l < .3 ? .6 + .4 * Math.sin(i + T * 40) : 1);
    fwCol[j] = fwBase[j] * f; fwCol[j + 1] = fwBase[j + 1] * f; fwCol[j + 2] = fwBase[j + 2] * f;
  }
  fwGeo.attributes.position.needsUpdate = true; fwGeo.attributes.color.needsUpdate = true;
}

/* ---------- 별똥별: now and then on clear nights ---------- */
const starTex = canvasTex(256, 16, (x, w, h) => {
  const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(.85, "rgba(220,235,255,.7)"); g.addColorStop(1, "rgba(255,255,255,1)");
  x.fillStyle = g; x.beginPath(); x.moveTo(0, h / 2); x.lineTo(w - 6, h / 2 - 4); x.arc(w - 6, h / 2, 4, -Math.PI / 2, Math.PI / 2); x.lineTo(0, h / 2); x.fill();
}, 1, 1);
const star = { spr: new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending })), t: -1, next: 12, pos: new THREE.Vector3(), dir: new THREE.Vector3() };
star.spr.scale.set(34, 2.1, 1); star.spr.visible = false; scene.add(star.spr);
const sA = new THREE.Vector3(), sB = new THREE.Vector3();
function updateStars(dt) {
  if (star.t < 0) {
    if (phase !== "밤" || weather !== "clear" || fw.show > 0) return;
    star.next -= dt; if (star.next > 0) return;
    star.next = 18 + Math.random() * 35; star.t = 0;
    const yaw = cam.yaw + (Math.random() - .5) * 1.1, side = Math.random() < .5 ? -1 : 1;
    star.pos.set(camera.position.x - Math.sin(yaw) * 280 - side * 60, 110 + Math.random() * 50, camera.position.z - Math.cos(yaw) * 280);
    star.dir.set(Math.cos(yaw) * side, -.38, -Math.sin(yaw) * side).normalize();
    star.spr.visible = true;
    if (mung.on && Math.random() < .7) toast("별똥별이에요! 소원을 빌어 보세요");
  }
  star.t += dt; const life = .95;
  if (star.t > life) { star.t = -1; star.spr.visible = false; return; }
  star.pos.addScaledVector(star.dir, 170 * dt); star.spr.position.copy(star.pos);
  sA.copy(star.pos).project(camera); sB.copy(star.pos).addScaledVector(star.dir, 10).project(camera);
  star.spr.material.rotation = Math.atan2((sB.y - sA.y) * innerHeight, (sB.x - sA.x) * innerWidth);
  star.spr.material.opacity = Math.min(1, star.t / .15, (life - star.t) / .3);
}

/* ---------- 짠: two people sitting close, both holding a drink ---------- */
const CHEERS_NEAR = 4.2, CHEERS_WIN = 10000;
const cheerSm = {}, cheerClink = {}, clinked = new Set(), cheerAsked = {};
let drinkAfter = 0;
function cheerParts() {
  const out = [];
  if (myAvatar) out.push({ key: "me", ch: me.ch || 0, hold: me.hold, st: me.st, x: me.x, z: me.z, av: myAvatar });
  for (const [peer, o] of others) out.push({ key: peer, ch: o.p.ch || 0, hold: o.p.hi, st: o.p.st, x: o.x, z: o.z, av: o.obj });
  return out.filter(e => PRODUCTS[e.hold] && PRODUCTS[e.hold].cat === "drink" && (e.st === "sit" || e.st === "bench" || e.st === "stool"));
}
function cheersAction(acts) {
  if (!PRODUCTS[me.hold] || PRODUCTS[me.hold].cat !== "drink" || me.eat) return;
  const now = Date.now(), parts = cheerParts(), mine = parts.find(e => e.key === "me"); if (!mine) return;
  const mates = parts.filter(e => e.key !== "me" && Math.hypot(e.x - me.x, e.z - me.z) < CHEERS_NEAR);
  if (!mates.length || now - (me.ch || 0) < CHEERS_WIN) return;
  const asking = mates.some(e => now - e.ch < CHEERS_WIN);
  acts.push(["cheers", asking ? "짠 받기" : "짠 하기", "primary"]);
}
function cheerOf(key) { return cheerSm[key] || 0; }
function updateCheers(dt) {
  const now = Date.now(), parts = cheerParts(), want = {};
  parts.forEach(e => {
    if (e.ch && now - e.ch < CHEERS_WIN) {
      want[e.key] = .55;
      if (cheerAsked[e.key] !== e.ch) { cheerAsked[e.key] = e.ch; const av = e.av; showBubble(() => av, "짠 할까요?", 2.4, "chq-" + e.key); }
    }
  });
  for (let a = 0; a < parts.length; a++) for (let b = a + 1; b < parts.length; b++) {
    const A = parts[a], B = parts[b];
    if (!A.ch || !B.ch || Math.abs(A.ch - B.ch) > CHEERS_WIN || now - Math.max(A.ch, B.ch) > 14000) continue;
    if (Math.hypot(A.x - B.x, A.z - B.z) > CHEERS_NEAR) continue;
    const id = [A.key, B.key].sort().join("|") + ":" + Math.max(A.ch, B.ch); if (clinked.has(id)) continue;
    clinked.add(id); cheerClink[A.key] = cheerClink[B.key] = now;
    [A, B].forEach(e => { const av = e.av; showBubble(() => av, "짠!", 1.8, "chq-" + e.key); });
    if (audio.ready) { const d = Math.hypot((A.x + B.x) / 2 - cam.tx, (A.z + B.z) / 2 - cam.tz); audio.clink(clamp(1.1 - d / 18, 0, 1)); }
    if (A.key === "me" || B.key === "me") { toast("짠! 시원하게 한 모금 마셔요"); drinkAfter = now + 1100; }
  }
  if (drinkAfter && now > drinkAfter) {
    drinkAfter = 0;
    if (me.hold && !me.eat) { me.eat = Date.now(); u_lastBite.me = -1; publish(true); actKey = ""; }
  }
  const keys = new Set([...Object.keys(cheerSm), ...parts.map(e => e.key)]);
  keys.forEach(k => {
    let t = want[k] || 0; if (cheerClink[k] && now - cheerClink[k] < 1300) t = 1;
    cheerSm[k] = (cheerSm[k] || 0) + (t - (cheerSm[k] || 0)) * Math.min(1, dt * 9);
    if (cheerSm[k] < .002 && !t) delete cheerSm[k];
  });
}

function updateExtras(dt) {
  updateMung(dt); updatePaper(); updateFireworks(dt); updateStars(dt); updateCheers(dt);
}
