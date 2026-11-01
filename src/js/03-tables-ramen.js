/* ================= picnic tables, stools, ramen kiosk ================= */
const TABLES = [], SEAT_SPOTS = [];
{
  const topM = new THREE.MeshPhongMaterial({ color: 0x2f4fd8, shininess: 70, specular: 0x6677ff }), legM = mat(0xf4f4f2);
  const stoolCols = [0x2f5fd0, 0xe0442f, 0x8e939a];
  const stoolG = new THREE.CylinderGeometry(.15, .2, .4, 4, 1, true), seatG = new THREE.CylinderGeometry(.17, .17, .04, 16);
  for (let i = 0; i < 10; i++) {
    const tx = 16 + (i % 5) * 8, tz = i < 5 ? 13 : 19.5;
    TABLES.push({ x: tx, z: tz });
    const t = new THREE.Group();
    const top = new THREE.Mesh(new THREE.CylinderGeometry(.5, .48, .04, 28), topM); top.position.y = .52; t.add(top);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.5, .018, 6, 28), topM); rim.rotation.x = Math.PI / 2; rim.position.y = .51; t.add(rim);
    [0, 1].forEach(k => { const l = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, .72, 6), legM); l.position.y = .26; l.rotation.set(k ? .5 : -.5, k * Math.PI / 2, 0); t.add(l);
      const l2 = l.clone(); l2.rotation.set(k ? -.5 : .5, k * Math.PI / 2, 0); t.add(l2); });
    t.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    t.position.set(tx, 0, tz); scene.add(t);
    OBST.push({ x: tx, z: tz, r: .5 });
    [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([dx, dz], k) => {
      const sx = tx + dx * .88, sz = tz + dz * .88, col = stoolCols[(i + k) % 3];
      const st = new THREE.Group();
      const body = new THREE.Mesh(stoolG, mat(col, { side: THREE.DoubleSide })); body.position.y = .2; body.rotation.y = Math.PI / 4; st.add(body);
      const seat = new THREE.Mesh(seatG, mat(0x1e1f22)); seat.position.y = .42; st.add(seat);
      st.traverse(m => { if (m.isMesh) m.castShadow = true; });
      st.position.set(sx, 0, sz); scene.add(st);
      SEAT_SPOTS.push({ x: sx, z: sz, r: Math.atan2(-(tx - sx), -(tz - sz)), kind: "stool", tx, tz });
    });
  }
}
const RAMEN_TIME = 90, EAT_TIME = 12;
const MACHINES = [];
{
  const steelM = new THREE.MeshPhongMaterial({ color: 0xc9ced3, shininess: 90, specular: 0x9aa3ab }), blackM = mat(0x16181b);
  const kiosk = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.BoxGeometry(11, 2.3, .15), mat(0xece4d6)); wall.position.set(0, 1.15, .62); kiosk.add(wall);
  const awnTex = canvasTex(128, 16, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? "#ffffff" : "#d83b2e"; x.fillRect(i * 16, 0, 16, h); } }, 6, 1);
  const awn = new THREE.Mesh(new THREE.BoxGeometry(11.4, .1, 2.2), mat(0xffffff, { map: awnTex })); awn.position.set(0, 2.4, -.3); awn.rotation.x = -.08; kiosk.add(awn);
  [-5.4, 5.4].forEach(x => { const p = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 2.4, 8), mat(0xe8e8e8)); p.position.set(x, 1.2, -1.3); kiosk.add(p); });
  const signTex = canvasTex(512, 96, (x, w, h) => {
    x.fillStyle = "#d83b2e"; x.fillRect(0, 0, w, h); x.fillStyle = "#fff6e6"; x.font = "bold 58px 'Gowun Batang', serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("한강 라면", w / 2, h / 2 + 2);
    x.font = "22px 'Gowun Dodum', sans-serif"; x.textAlign = "left"; x.fillText("즉석 조리", 20, h / 2); x.textAlign = "right"; x.fillText("24시", w - 20, h / 2);
  }, 1, 1);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(4.2, .8, .08), [mat(0xd83b2e), mat(0xd83b2e), mat(0xd83b2e), mat(0xd83b2e), mat(0xd83b2e), mat(0xffffff, { map: signTex })]);
  sign.position.set(0, 2.85, -1.32); kiosk.add(sign);
  kiosk.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  kiosk.rotation.y = Math.PI; kiosk.position.set(30, 0, 23.6); scene.add(kiosk);
  OBST.push({ x0: 24.5, x1: 35.5, z0: 22.85, z1: 24.15 }, { x: 24.6, z: 24.9, r: .12 }, { x: 35.4, z: 24.9, r: .12 });
  const posterTex = canvasTex(256, 320, (x, w, h) => {
    x.fillStyle = "#fbfbf7"; x.fillRect(0, 0, w, h); x.strokeStyle = "#1e8a4c"; x.lineWidth = 10; x.strokeRect(5, 5, w - 10, h - 10);
    x.fillStyle = "#1e8a4c"; x.font = "bold 34px 'Gowun Dodum', sans-serif"; x.textAlign = "center"; x.fillText("즉석끓임", w / 2, 58);
    x.fillStyle = "#d83b2e"; x.font = "bold 66px 'Gowun Batang', serif"; x.fillText("라면", w / 2, 128);
    x.fillStyle = "#e3a52a"; x.beginPath(); x.ellipse(w / 2, 220, 82, 50, 0, 0, 7); x.fill();
    x.strokeStyle = "#f7d36a"; x.lineWidth = 4; for (let i = 0; i < 9; i++) { x.beginPath(); for (let k = 0; k <= 12; k++) x.lineTo(w / 2 - 70 + k * 12, 200 + i * 5 + Math.sin(k * 1.4 + i) * 5); x.stroke(); }
    x.fillStyle = "#fff"; x.beginPath(); x.arc(w / 2 + 30, 212, 18, 0, 7); x.fill(); x.fillStyle = "#f6b21b"; x.beginPath(); x.arc(w / 2 + 30, 212, 9, 0, 7); x.fill();
    x.fillStyle = "#3ba640"; for (let i = 0; i < 6; i++) x.fillRect(w / 2 - 50 + i * 14, 190 + (i % 2) * 20, 9, 5);
    x.fillStyle = "#555"; x.font = "18px 'Gowun Dodum', sans-serif"; x.fillText("그릇을 올리고 1분 30초", w / 2, 296);
  }, 1, 1);
  [-3, 0, 3].forEach((mx, i) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, .62, .66), steelM); body.position.set(0, .31, .2); g.add(body);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(.52, .02, .44), blackM); plate.position.set(0, .63, .12); g.add(plate);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.17, .012, 6, 24), mat(0xd83b2e)); ring.rotation.x = Math.PI / 2; ring.position.set(0, .645, .12); g.add(ring);
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, .16), steelM); back.position.set(0, 1.12, .45); g.add(back);
    const panelTex = canvasTex(256, 232, (x, w, h) => {
      x.fillStyle = "#3a4048"; x.fillRect(0, 0, w, h);
      x.fillStyle = "#e8e8e8"; x.font = "15px 'Gowun Dodum', sans-serif"; x.textAlign = "center";
      ["보통라면", "꼬들라면", "진한맛"].forEach((t, k) => { x.fillStyle = "#3fb4ef"; x.beginPath(); x.arc(52 + k * 76, 150, 15, 0, 7); x.fill(); x.fillStyle = "#e8e8e8"; x.fillText(t, 52 + k * 76, 186); });
      x.fillStyle = "#e8e8e8"; x.fillText("조리중", 52, 214); x.fillText("완성", 128, 214); x.fillText("끄기", 204, 214);
      x.fillStyle = "#111"; x.fillRect(40, 18, 176, 82);
    }, 1, 1);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(.62, .56), mat(0xffffff, { map: panelTex })); panel.rotation.y = Math.PI; panel.position.set(-.2, 1.08, .365); g.add(panel);
    const ledC = document.createElement("canvas"); ledC.width = 128; ledC.height = 48;
    const ledTex = new THREE.CanvasTexture(ledC);
    const led = new THREE.Mesh(new THREE.PlaneGeometry(.38, .14), new THREE.MeshBasicMaterial({ map: ledTex })); led.rotation.y = Math.PI; led.position.set(-.2, 1.24, .362); g.add(led);
    const poster = new THREE.Mesh(new THREE.PlaneGeometry(.36, .45), mat(0xffffff, { map: posterTex })); poster.rotation.y = Math.PI; poster.position.set(.32, 1.12, .365); g.add(poster);
    g.traverse(m => { if (m.isMesh && m !== led) { m.castShadow = true; m.receiveShadow = true; } });
    g.rotation.y = Math.PI; g.position.set(30 + mx, 0, 23.95); scene.add(g);
    const m = { i, x: 30 + mx, z: 23.95, g, ledC, ledTex, ledText: "", bowl: null, owner: null, at: 0, doneShown: false };
    drawLed(m, "--:--"); MACHINES.push(m);
  });
}
function drawLed(m, text) {
  if (m.ledText === text) return; m.ledText = text;
  const x = m.ledC.getContext("2d"); x.fillStyle = "#120707"; x.fillRect(0, 0, 128, 48);
  x.fillStyle = "#ff3b2a"; x.shadowColor = "#ff3b2a"; x.shadowBlur = 8; x.font = "bold 34px monospace"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, 64, 26);
  m.ledTex.needsUpdate = true;
}
// a red-banded paper ramen bowl with noodles, egg and green onion
const noodleTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d");
  x.fillStyle = "#d77a2b"; x.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 70; i++) { x.strokeStyle = i % 3 ? "#f3cf73" : "#e8b95a"; x.lineWidth = 3; x.beginPath(); const y0 = Math.random() * 128; for (let k = 0; k <= 16; k++) x.lineTo(k * 8, y0 + Math.sin(k * 1.3 + i) * 5); x.stroke(); }
  return new THREE.CanvasTexture(c); })();
const bowlLabelTex = (() => { const c = document.createElement("canvas"); c.width = 256; c.height = 48; const x = c.getContext("2d");
  x.fillStyle = "#c8262a"; x.fillRect(0, 0, 256, 48); x.fillStyle = "#fff"; x.font = "bold 26px 'Gowun Dodum', sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
  x.fillText("한강라면", 64, 25); x.fillText("한강라면", 192, 25); const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; return t; })();
function makeBowl() {
  const g = new THREE.Group(), whiteB = mat(0xfaf7f0, { side: THREE.DoubleSide });
  const outer = new THREE.Mesh(new THREE.CylinderGeometry(.17, .12, .14, 24, 1, true), whiteB); outer.position.y = .07; g.add(outer);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(.158, .124, .09, 24, 1, true), mat(0xffffff, { map: bowlLabelTex })); band.position.y = .05; g.add(band);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(.17, .008, 6, 24), whiteB); lip.rotation.x = Math.PI / 2; lip.position.y = .14; g.add(lip);
  const soup = new THREE.Mesh(new THREE.CircleGeometry(.162, 24), mat(0xffffff, { map: noodleTex })); soup.rotation.x = -Math.PI / 2; soup.position.y = .12; g.add(soup);
  const egg = new THREE.Mesh(new THREE.SphereGeometry(.045, 10, 8), mat(0xfffaf0)); egg.scale.y = .5; egg.position.set(.05, .125, .03); g.add(egg);
  const yolk = new THREE.Mesh(new THREE.SphereGeometry(.022, 8, 6), mat(0xf6b21b)); yolk.scale.y = .5; yolk.position.set(.05, .14, .03); g.add(yolk);
  for (let i = 0; i < 6; i++) { const o = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .03, 5), mat(0x3ba640)); o.rotation.z = Math.PI / 2; o.position.set(-.08 + i * .025, .126, -.04 + (i % 2) * .05); g.add(o); }
  g.traverse(m => { if (m.isMesh) m.castShadow = true; });
  g.userData.soup = soup;
  return g;
}
// steam: one pooled set of soft puffs fed by any number of emitters each frame
const steamTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"); const g = x.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, "rgba(255,255,255,.85)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const STEAM = [];
for (let i = 0; i < 140; i++) { const m = new THREE.SpriteMaterial({ map: steamTex, transparent: true, depthWrite: false, opacity: 0 }); const sp = new THREE.Sprite(m); sp.visible = false; scene.add(sp); STEAM.push({ sp, life: 0, max: 1, vx: 0, vz: 0 }); }
let steamIdx = 0;
function emitSteam(pos, strength, dt) {
  let n = strength * dt * 14; while (n > 0) {
    if (n < 1 && Math.random() > n) break; n -= 1;
    const s = STEAM[steamIdx = (steamIdx + 1) % STEAM.length];
    s.sp.position.set(pos.x + (Math.random() - .5) * .14, pos.y + .02, pos.z + (Math.random() - .5) * .14);
    s.life = 0; s.max = 1.3 + Math.random() * 1.1; s.vx = (Math.random() - .5) * .12; s.vz = (Math.random() - .5) * .12; s.sp.visible = true; s.k = .7 + strength * .5;
  }
}
function updateSteam(dt) {
  for (const s of STEAM) {
    if (!s.sp.visible) continue; s.life += dt; const u = s.life / s.max;
    if (u >= 1) { s.sp.visible = false; continue; }
    s.sp.position.x += s.vx * dt; s.sp.position.z += s.vz * dt; s.sp.position.y += dt * (.45 + .25 * (1 - u));
    const sc = (.08 + u * .42) * s.k; s.sp.scale.set(sc, sc, 1); s.sp.material.opacity = Math.sin(u * Math.PI) * .55;
  }
}

