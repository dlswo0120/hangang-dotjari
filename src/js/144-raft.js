/* ================= 확률 게시판 뗏목: 낚시터 앞을 천천히 가로질러 떠다님 ================= */
// The odds come straight from FISH (the same weights rollFish uses), so the board never goes stale.
const RAFT = { z: -12.5, span: 34, period: 220 }; // just past where the floats land, clear of the bridge piers (z 14 / -16)
function fishOdds(night, far) {
  const wt = f => fishWeight(f, { night, far, bait: "worm", spot: "deck" });
  const total = FISH.reduce((s, f) => s + wt(f), 0);
  return [0, 1, 2, 5, 4, 3].map(t => ({ t, pct: FISH.filter(f => f.rare === t).reduce((s, f) => s + wt(f), 0) / total * 100, n: FISH.filter(f => f.rare === t).length }));
}
const raftTex = (() => {
  const W = 1024, H = 640, c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
  x.fillStyle = "#f6efdf"; x.fillRect(0, 0, W, H);
  x.strokeStyle = "#8a6a48"; x.lineWidth = 18; x.strokeRect(9, 9, W - 18, H - 18);
  x.fillStyle = "#2f6fb0"; x.fillRect(18, 18, W - 36, 104);
  x.fillStyle = "#fff"; x.font = "700 58px 'Pretendard', 'Noto Sans KR', sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("🎣 한강 낚시 확률표", W / 2, 72);
  const NAMES = { 0: "흔해요", 1: "가끔 잡혀요", 2: "아주 드물어요", 3: "강 청소", 4: "보물·전설", 5: "심해어" };
  const COLS = { 0: "#7fa7c9", 1: "#5cc58a", 2: "#f2b46b", 3: "#9aa0a8", 4: "#e0a53a", 5: "#6c5ce7" };
  const rows = fishOdds(false, false), max = Math.max(...rows.map(r => r.pct));
  rows.forEach((r, i) => {
    const y = 160 + i * 64;
    x.textAlign = "left"; x.fillStyle = "#2a2a2e"; x.font = "700 38px 'Pretendard', 'Noto Sans KR', sans-serif"; x.fillText(NAMES[r.t], 52, y + 20);
    x.font = "500 26px 'Pretendard', 'Noto Sans KR', sans-serif"; x.fillStyle = "#6a6a70"; x.fillText(`${r.n}종`, 342, y + 22);
    x.fillStyle = "#e6dcc8"; x.fillRect(420, y + 4, 390, 34); x.fillStyle = COLS[r.t]; x.fillRect(420, y + 4, Math.max(6, 390 * r.pct / max), 34);
    x.textAlign = "right"; x.fillStyle = "#2a2a2e"; x.font = "800 38px 'Pretendard', 'Noto Sans KR', sans-serif"; x.fillText(r.pct >= 10 ? r.pct.toFixed(0) + "%" : r.pct.toFixed(1) + "%", W - 52, y + 22);
  });
  const deepBest = fishOdds(true, true).find(r => r.t === 5).pct;
  x.textAlign = "center"; x.fillStyle = "#4a3a6a"; x.font = "600 27px 'Pretendard', 'Noto Sans KR', sans-serif";
  x.fillText(`🌙 밤에 멀리 던지면 심해어 ${deepBest.toFixed(1)}%까지 올라가요`, W / 2, H - 48);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
})();
const raft = (() => {
  const g = new THREE.Group(), wood = mat(0x9a7350), dark = mat(0x6b4f35);
  for (let i = 0; i < 7; i++) { const log = new THREE.Mesh(new THREE.CylinderGeometry(.26, .26, 9.4, 10), i % 2 ? wood : dark); log.rotation.z = Math.PI / 2; log.position.set(0, 0, -1.5 + i * .5); g.add(log); }
  [-1, 1].forEach(s => { const band = new THREE.Mesh(new THREE.BoxGeometry(.18, .08, 3.6), mat(0x4a3424)); band.position.set(s * 3.8, .24, 0); g.add(band); });
  [-3.9, 3.9].forEach(px => { const post = new THREE.Mesh(new THREE.CylinderGeometry(.1, .12, 5.6, 8), dark); post.position.set(px, 2.8, -.2); g.add(post); });
  const front = new THREE.Mesh(new THREE.PlaneGeometry(8, 5), new THREE.MeshBasicMaterial({ map: raftTex })); front.position.set(0, 3.2, -.1); g.add(front);
  const back = front.clone(); back.rotation.y = Math.PI; back.position.z = -.3; g.add(back); // readable from the far side too
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(.9, .55), new THREE.MeshLambertMaterial({ color: 0xe0433a, side: THREE.DoubleSide })); flag.position.set(-3.45, 5.4, -.2); g.add(flag); g.userData.flag = flag;
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(.16, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe4a0 })); lamp.position.set(3.9, 5.75, -.2); g.add(lamp);
  g.traverse(m => { if (m.isMesh) m.castShadow = true; });
  scene.add(g); return g;
})();
function updateRaft() {
  // the same place on every screen: driven by the clock, a slow glide from one end to the other and back
  const t = Date.now() / 1000, ph = (t % RAFT.period) / RAFT.period * Math.PI * 2;
  raft.position.set(FISH_DECK.x + Math.sin(ph) * RAFT.span, -.42 + Math.sin(T * 1.3) * .05, RAFT.z);
  raft.rotation.set(Math.sin(T * 1.1) * .02, 0, Math.sin(T * .9) * .025);
  raft.userData.flag.rotation.y = Math.sin(T * 3) * .3;
}
