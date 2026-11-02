/* ================= 사진 포즈: 혼자 · 둘이 · 단체 ================= */
const PHOTO_MODES = [["solo", "혼자"], ["duo", "둘이"], ["group", "단체"]];
const photoCam = new THREE.PerspectiveCamera(50, 1, .1, 3000);
let shoot = null, photoMode = "solo"; // shoot: { owner: "me" | peer, at, i, yaw, mode, done }
const fwdOf = yaw => [-Math.sin(yaw), -Math.cos(yaw)];

/* the menu (opens from the camera button) */
function renderPhotoMenu() {
  const tabs = $("photoTabs"), grid = $("photoGrid"); tabs.textContent = ""; grid.textContent = "";
  PHOTO_MODES.forEach(([m, label]) => { const b = document.createElement("button"); b.textContent = label; b.dataset.m = m; b.setAttribute("aria-pressed", String(m === photoMode)); tabs.appendChild(b); });
  EMOTES.forEach((E, i) => { if (E.photo !== photoMode) return; const b = document.createElement("button"); b.dataset.p = i; const s = document.createElement("span"); s.className = "emo"; s.textContent = E.icon; b.append(s, E.name); grid.appendChild(b); });
  $("photoHint").textContent = photoMode === "solo" ? "고르면 3초 뒤에 앞에서 찍어 줘요" : "고르면 근처 사람들에게 '같이 찍기'가 떠요. 6초 뒤 찰칵!";
}
$("camBtn").addEventListener("click", () => {
  const p = $("photoPanel"); p.hidden = !p.hidden; $("camBtn").setAttribute("aria-expanded", String(!p.hidden));
  $("chatPanel").hidden = true; $("settings").hidden = true; if (!p.hidden) renderPhotoMenu();
});
$("photoTabs").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; photoMode = b.dataset.m; renderPhotoMenu(); });
$("photoGrid").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; closePhotoMenu(); startShoot(+b.dataset.p); });
$("photoNow").addEventListener("click", () => { closePhotoMenu(); snapNow(); });
function closePhotoMenu() { $("photoPanel").hidden = true; $("camBtn").setAttribute("aria-expanded", "false"); }
addEventListener("pointerdown", e => { if (!e.target.closest("#photoPanel,#camBtn")) closePhotoMenu(); });

function poseReady(E) {
  const standing = me.st === "walk" && !me.moving && !anim && !boarded, seated = me.st === "sit" || me.st === "bench" || me.st === "stool";
  if (standing || (E.seat && seated)) return true;
  toast(E.seat ? "서 있거나 앉아 있을 때 찍을 수 있어요" : "이 포즈는 서 있을 때 찍을 수 있어요"); return false;
}
function startShoot(i) {
  const E = EMOTES[i]; if (!started || !myAvatar || !E) return;
  if (shoot && !shoot.done) { toast("지금 찍는 중이에요"); return; }
  if (!poseReady(E)) return;
  const now = Date.now(), yaw = me.st === "sit" || me.st === "lie" ? 0 : me.r;
  me.ph = { i, at: now, yaw: +yaw.toFixed(3) }; me.em = { i, at: now, s: 1 }; me.pj = null;
  shoot = { owner: "me", at: now, i, yaw, mode: E.photo, done: false };
  if (E.photo !== "solo") { showBubble(() => myAvatar, "📸 같이 찍어요!", 2.5, "me"); toast("근처 사람들이 '같이 찍기'를 누를 수 있게 잠깐 기다려요"); }
  publish(true); actKey = "";
}
function inviteOf() {
  if (shoot && !shoot.done) return null;
  const now = Date.now();
  for (const [peer, o] of others) {
    const ph = o.p.ph; if (!ph || !EMOTES[ph.i] || EMOTES[ph.i].photo === "solo") continue;
    const left = ph.at + PHOTO_SHOT_AT[EMOTES[ph.i].photo] * 1000 - now;
    if (left > 800 && left < 7000 && Math.hypot(o.x - me.x, o.z - me.z) < 7 && o.p.y < .5 === me.y < .5) return { peer, o, ph, left };
  }
  return null;
}
function photoActions(acts, status) {
  if (!started || anim || boarded) return status;
  const inv = inviteOf();
  if (inv) { acts.unshift(["photojoin", "📸 " + inv.o.p.n + "님과 같이 찍기", "primary"]); return `${EMOTES[inv.ph.i].name} · ${Math.ceil(inv.left / 1000)}초 뒤 찰칵`; }
  if (shoot && !shoot.done) { const left = Math.ceil((shoot.at + PHOTO_SHOT_AT[shoot.mode] * 1000 - Date.now()) / 1000); if (left > 0) return `📸 ${EMOTES[shoot.i].name} · ${left}초 뒤 찰칵`; }
  return status;
}
function photoClick(a) {
  if (a !== "photojoin") return false;
  const inv = inviteOf(); if (!inv) { toast("이미 찍었어요"); return true; }
  const E = EMOTES[inv.ph.i]; if (!poseReady(E)) return true;
  const [fx, fz] = fwdOf(inv.ph.yaw), cx = inv.o.x + fx * 3.5, cz = inv.o.z + fz * 3.5;
  const right = [-Math.cos(inv.ph.yaw), Math.sin(inv.ph.yaw)]; // the camera's right, looking back at the group
  const dot = (me.x - inv.o.x) * right[0] + (me.z - inv.o.z) * right[1];
  me.pj = { p: inv.peer, at: inv.ph.at }; me.em = { i: inv.ph.i, at: inv.ph.at, s: dot > 0 ? 1 : -1 };
  if (me.st === "walk") me.r = yawFrom(cx - me.x, cz - me.z);
  shoot = { owner: inv.peer, at: inv.ph.at, i: inv.ph.i, yaw: inv.ph.yaw, mode: E.photo, done: false };
  return true;
}

/* who is in the picture */
function shootMembers(s) {
  const list = [];
  if (s.owner === "me") { list.push({ av: myAvatar, n: me.name }); for (const o of others.values()) if (o.p.pj && o.p.pj.p === myPeer && o.p.pj.at === s.at) list.push({ av: o.obj, n: o.p.n, o }); }
  else {
    const ow = others.get(s.owner); if (ow) list.push({ av: ow.obj, n: ow.p.n, o: ow });
    list.push({ av: myAvatar, n: me.name });
    for (const [peer, o] of others) if (peer !== s.owner && o.p.pj && o.p.pj.p === s.owner && o.p.pj.at === s.at) list.push({ av: o.obj, n: o.p.n, o });
  }
  return list.filter(m => m.av);
}
const hv = new THREE.Vector3();
function frameShot(s, members) {
  let cx = 0, cz = 0, hy = 0;
  members.forEach(m => { m.av.userData.head.getWorldPosition(hv); cx += hv.x; cz += hv.z; hy += hv.y; });
  const n = members.length; cx /= n; cz /= n; hy /= n;
  let spread = 0; members.forEach(m => { spread = Math.max(spread, Math.hypot(m.av.position.x - cx, m.av.position.z - cz)); });
  let [fx, fz] = fwdOf(s.yaw); const E = EMOTES[s.i];
  // people lined up along the view would hide each other: turn the camera side-on to the line they form
  if (n > 1) {
    let a = members[0].av.position, b = a, far = 0;
    members.forEach(m => members.forEach(k => { const d = m.av.position.distanceTo(k.av.position); if (d > far) { far = d; a = m.av.position; b = k.av.position; } }));
    if (far > .4) { let ax = (b.x - a.x) / far, az = (b.z - a.z) / far; if (Math.abs(ax * fx + az * fz) > .45) { let px = -az, pz = ax; if (px * fx + pz * fz < 0) { px = -px; pz = -pz; } fx = px; fz = pz; } }
  }
  if (E.aerial) { photoCam.position.set(cx + fx * 1.1, hy + 3.6 + spread * 1.2, cz + fz * 1.1); photoCam.lookAt(cx, hy - .5, cz); }
  else { const d = n === 1 ? 2.7 : Math.max(3.3, spread * 2.3 + 2.4); photoCam.position.set(cx + fx * d, hy + .15, cz + fz * d); photoCam.lookAt(cx, hy - .45, cz); }
}
audio.shutter = function () {
  const t = this.ac.currentTime;
  [0, .07].forEach(d => { const s = this.ac.createBufferSource(); s.buffer = this.pink; const hp = this.ac.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 2500; const g = this.ac.createGain();
    g.gain.setValueAtTime(.0001, t + d); g.gain.exponentialRampToValueAtTime(.5, t + d + .003); g.gain.exponentialRampToValueAtTime(.0001, t + d + .05);
    s.connect(hp); hp.connect(g); g.connect(this.sfx); s.start(t + d, Math.random() * 3); s.stop(t + d + .06); });
};
function capturePhoto(s) {
  const members = shootMembers(s); if (!members.length) return;
  frameShot(s, members);
  photoCam.aspect = canvas.width / canvas.height; photoCam.updateProjectionMatrix();
  const hidden = []; bubbles.forEach(b => { if (b.s.visible) { b.s.visible = false; hidden.push(b.s); } }); const gv = ghost.visible; ghost.visible = false;
  renderer.render(scene, photoCam);
  const w = canvas.width, h = canvas.height, c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = c.getContext("2d"); x.drawImage(canvas, 0, 0);
  hidden.forEach(o => o.visible = true); ghost.visible = gv;
  const k = kst(), sc = Math.max(1, w / 900), names = members.map(m => m.n).join(" · ");
  x.font = `${Math.round(16 * sc)}px 'Gowun Batang', serif`; x.fillStyle = "rgba(255,255,255,.92)"; x.textAlign = "right"; x.textBaseline = "bottom";
  x.shadowColor = "rgba(0,0,0,.45)"; x.shadowBlur = 8 * sc;
  x.fillText(`한강 돗자리 · ${EMOTES[s.i].name} · ${names} · ${k.getMonth() + 1}월 ${k.getDate()}일 ${phase}`, w - 18 * sc, h - 16 * sc);
  if (audio.ready) audio.shutter();
  const f = $("flash"); f.hidden = false; f.classList.remove("go"); void f.offsetWidth; f.classList.add("go"); setTimeout(() => { f.hidden = true; }, 700);
  deliverShot(c);
}

/* per frame: countdown, heart between partners, the shutter, cleanup */
let heartMesh = null;
function makeHeartMesh() {
  const sh = new THREE.Shape(); sh.moveTo(0, -.18); sh.bezierCurveTo(-.32, .02, -.18, .26, 0, .1); sh.bezierCurveTo(.18, .26, .32, .02, 0, -.18);
  const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: .05, bevelEnabled: false }), new THREE.MeshBasicMaterial({ color: 0xff5c8a }));
  m.scale.setScalar(1.3); scene.add(m); return m;
}
const seenPh = new Map();
function updatePhoto() {
  const now = Date.now();
  // others announcing a group shot, and their shutter going off
  for (const [peer, o] of others) {
    const ph = o.p.ph; if (!ph || !EMOTES[ph.i]) continue; const E = EMOTES[ph.i], id = peer;
    const st = seenPh.get(peer) || {};
    if (st.at !== ph.at) { seenPh.set(peer, { at: ph.at, snap: false }); if (E.photo !== "solo" && now - ph.at < 3000) showBubble(() => (others.get(id) || {}).obj, "📸 같이 찍어요!", 2.5, id); }
    else if (!st.snap && now > ph.at + PHOTO_SHOT_AT[E.photo] * 1000) { st.snap = true; if (now - ph.at < PHOTO_SHOT_AT[E.photo] * 1000 + 1500) showBubble(() => (others.get(id) || {}).obj, "찰칵!", 1.4, id); }
  }
  // my shoot
  const cd = $("countdown");
  if (shoot && !shoot.done) {
    const shotAt = shoot.at + PHOTO_SHOT_AT[shoot.mode] * 1000, left = shotAt - now;
    const ownerGone = shoot.owner !== "me" && !(others.get(shoot.owner) && others.get(shoot.owner).p.ph && others.get(shoot.owner).p.ph.at === shoot.at);
    if (!activeEmote(me.em) || ownerGone) { shoot.done = true; cd.hidden = true; me.ph = null; me.pj = null; toast(ownerGone ? "사진 찍기가 취소됐어요" : "움직여서 사진 찍기를 멈췄어요"); publish(true); actKey = ""; }
    else if (left <= 0) { shoot.done = true; cd.hidden = true; capturePhoto(shoot); const s = shoot; setTimeout(() => { if (me.ph && me.ph.at === s.at) me.ph = null; me.pj = null; if (me.em && me.em.at === s.at) me.em = null; publish(true); actKey = ""; }, 1200); }
    else if (left <= 3000) { const n = String(Math.ceil(left / 1000)); if (cd.textContent !== n) { cd.textContent = n; cd.hidden = false; cd.classList.remove("pop"); void cd.offsetWidth; cd.classList.add("pop"); if (audio.ready) audio.pop(); } }
    // everyone standing turns to face where the camera will be
    if (me.st === "walk" && left > 0) { const mem = shootMembers(shoot); if (mem.length) { frameShot(shoot, mem); me.r = lerpAngle(me.r, yawFrom(photoCam.position.x - me.x, photoCam.position.z - me.z), .25); } }
    // which hand faces my partner (for the half-heart): worked out from where we actually stand
    if (me.em && shoot.mode === "duo" && myAvatar) {
      let best = null, bd = 1e9; shootMembers(shoot).forEach(m => { if (m.av === myAvatar) return; const d = m.av.position.distanceTo(myAvatar.position); if (d < bd) { bd = d; best = m.av; } });
      if (best) { const r = myAvatar.rotation.y, sd = (best.position.x - me.x) * Math.cos(r) - (best.position.z - me.z) * Math.sin(r), s = sd >= 0 ? 1 : -1; if (me.em.s !== s) { me.em.s = s; publish(true); } }
    }
  } else if (!cd.hidden) cd.hidden = true;
  // a heart between two people doing the half-heart
  const hearts = [];
  if (myAvatar && activeEmote(me.em) && EMOTES[me.em.i].id === "pheart") hearts.push(myAvatar);
  for (const o of others.values()) { const a = activeEmote(o.p.em); if (a && EMOTES[a.i].id === "pheart") hearts.push(o.obj); }
  let pair = null;
  for (let a = 0; a < hearts.length && !pair; a++) for (let b = a + 1; b < hearts.length; b++) if (hearts[a].position.distanceTo(hearts[b].position) < 2.6) { pair = [hearts[a], hearts[b]]; break; }
  if (pair) {
    if (!heartMesh) heartMesh = makeHeartMesh();
    pair[0].userData.head.getWorldPosition(hv); const y = hv.y + .55;
    heartMesh.visible = true; heartMesh.position.set((pair[0].position.x + pair[1].position.x) / 2, y, (pair[0].position.z + pair[1].position.z) / 2);
    heartMesh.lookAt(camera.position); heartMesh.scale.setScalar(1.2 + Math.sin(T * 6) * .08);
  } else if (heartMesh) heartMesh.visible = false;
}
