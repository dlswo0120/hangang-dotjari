/* ================= 표지판: 오리배 이용 안내 · 한강 소식판 ================= */
function wrapLines(x, text, maxW) {
  const out = []; let line = "";
  for (const ch of String(text)) { if (x.measureText(line + ch).width > maxW && line) { out.push(line); line = ch.trimStart(); } else line += ch; }
  if (line) out.push(line); return out;
}
const boardMat = tex => new THREE.MeshLambertMaterial({ map: tex, emissive: 0xffffff, emissiveIntensity: .22, emissiveMap: tex });

/* duck boat rules on the yellow sign by the dock */
{
  const tex = canvasTex(560, 390, (x, w, h) => {
    x.fillStyle = "#ffd54a"; x.fillRect(0, 0, w, h);
    x.fillStyle = "#2f6fd8"; x.fillRect(0, 0, w, 78);
    // a little duck
    x.fillStyle = "#ffe066"; x.beginPath(); x.ellipse(52, 46, 26, 17, 0, 0, 7); x.fill(); x.beginPath(); x.arc(70, 26, 13, 0, 7); x.fill();
    x.fillStyle = "#ff8a3d"; x.beginPath(); x.moveTo(81, 25); x.lineTo(95, 29); x.lineTo(81, 33); x.fill(); x.fillStyle = "#222"; x.beginPath(); x.arc(73, 22, 2.6, 0, 7); x.fill();
    x.fillStyle = "#fff"; x.font = "bold 36px 'Gowun Dodum', sans-serif"; x.textAlign = "left"; x.textBaseline = "middle"; x.fillText("한강 오리배 이용 안내", 112, 41);
    const lines = ["1. 두 명이 타면 출발해요", "2. 운전은 먼저 탄 분이 해요", "    (W 앞으로 · A/D 방향)", "3. 한 명이 내리면 함께 내려요"];
    x.fillStyle = "#3a2c10"; x.font = "bold 28px 'Gowun Dodum', sans-serif";
    lines.forEach((t, i) => x.fillText(t, 28, 112 + i * 44));
    x.fillStyle = "#d8322f"; rr(x, 20, 300, w - 40, 72, 14); x.fill();
    x.fillStyle = "#fff"; x.font = "bold 24px 'Gowun Dodum', sans-serif"; x.textAlign = "center";
    x.fillText("정원 2명! 그 이상 타면… 책임지지 않습니다", w / 2, 337);
  }, 1, 1);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 1.88), boardMat(tex)); p.position.set(DOCK.x - 6.5, 1.85, 1.87); scene.add(p);
}

/* 한강 소식판: the update notes on a notice board near the entrance */
const NEWS_BOARD = { x: -3.5, z: 35.5 };
{
  const S = NEWS_BOARD, wood = mat(0x8a6a48);
  [-1.25, 1.25].forEach(k => { const post = new THREE.Mesh(new THREE.BoxGeometry(.12, 2.5, .12), wood); post.position.set(S.x + k, 1.25, S.z); post.castShadow = true; scene.add(post); });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.7, 1.95, .1), wood); frame.position.set(S.x, 1.6, S.z + .03); frame.castShadow = true; scene.add(frame);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(3, .1, .5), mat(0x3f8f6b)); roof.position.set(S.x, 2.62, S.z); roof.castShadow = true; scene.add(roof);
  const tex = canvasTex(540, 390, (x, w, h) => {
    x.fillStyle = "#f7f1e1"; x.fillRect(0, 0, w, h);
    x.fillStyle = "#3f8f6b"; x.fillRect(0, 0, w, 66);
    x.fillStyle = "#fff"; x.font = "bold 34px 'Gowun Dodum', sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("한강 소식판", w / 2, 35);
    x.textAlign = "left"; x.fillStyle = "#3f8f6b"; x.font = "bold 22px 'Gowun Dodum', sans-serif";
    const u = UPDATES[0]; x.fillText((u ? u.date : "") + " 새 소식", 24, 92);
    x.fillStyle = "#3a3226"; x.font = "20px 'Gowun Dodum', sans-serif";
    let y = 126; const all = UPDATES.filter(v => v.date === (u && u.date)).flatMap(v => v.items);
    for (const item of all) {
      const ls = wrapLines(x, "· " + item, w - 48);
      if (y + ls.length * 26 > h - 40) { x.fillText("…", 24, y); break; }
      ls.forEach((l, i) => { x.fillText(i ? "  " + l : l, 24, y); y += 26; }); y += 4;
    }
    x.fillStyle = "#8a7a60"; x.font = "17px 'Gowun Dodum', sans-serif"; x.textAlign = "center"; x.fillText("가까이 와서 '소식판 보기'를 누르면 전부 볼 수 있어요", w / 2, h - 18);
  }, 1, 1);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(2.55, 1.84), boardMat(tex)); p.position.set(S.x, 1.6, S.z - .03); p.rotation.y = Math.PI; scene.add(p);
  const back = p.clone(); back.rotation.y = 0; back.position.z = S.z + .09; scene.add(back);
  OBST.push({ x0: S.x - 1.4, x1: S.x + 1.4, z0: S.z - .2, z1: S.z + .25 });
}
const nearNewsBoard = () => me.level === "ground" && me.st === "walk" && Math.abs(me.x - NEWS_BOARD.x) < 2 && me.z > NEWS_BOARD.z - 2.2 && me.z < NEWS_BOARD.z;
function boardActions(acts) { if (started && !anim && !boarded && !me.q && nearNewsBoard()) acts.unshift(["news", "소식판 보기", "primary"]); }
function boardClick(a) {
  if (a !== "news") return false;
  fillNews(UPDATES); $("newsTitle").textContent = "한강 소식판"; $("newsModal").hidden = false; return true;
}
