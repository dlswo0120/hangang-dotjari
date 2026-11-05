/* ================= 방 정보 · 화질 자동 조절 ================= */
/* rooms (public build only: the Supabase glue gives room.info) */
let roomToldMove = false;
function updateRoomBox() {
  const info = room && typeof room.info === "function" ? room.info() : null;
  if (!info || !info.no) { $("roomBox").hidden = true; return; }
  $("roomBox").hidden = false;
  const n = others.size + 1;
  $("roomLine").textContent = `지금 ${info.no}번 방이에요 · ${n}/${info.cap}명. 친구와 같은 방에서 만나려면 초대 링크를 보내 주세요.`;
  $("countOf").textContent = "/" + info.cap;
  const pick = $("roomPick");
  if (pick.options.length !== info.max + 1) {
    pick.textContent = ""; const head = document.createElement("option"); head.value = ""; head.textContent = "다른 방으로 이동"; pick.appendChild(head);
    for (let i = 1; i <= info.max; i++) { const o = document.createElement("option"); o.value = String(i); o.textContent = `${i}번 방${i === info.no ? " (지금)" : ""}`; pick.appendChild(o); }
  }
  if (started && info.movedFrom && !roomToldMove) { roomToldMove = true; toast(`${info.movedFrom}번 방이 꽉 차서 ${info.no}번 방으로 왔어요`); }
}
$("roomPick").addEventListener("change", e => {
  const n = +e.target.value, info = room && room.info ? room.info() : null; e.target.value = "";
  if (!info || !n || n === info.no) return;
  location.href = info.link(n); // a fresh page joins that room (it falls back to another one if it is full)
});
$("roomInvite").addEventListener("click", async () => {
  const info = room && room.info ? room.info() : null; if (!info) return;
  const url = info.link(info.no);
  try { await navigator.clipboard.writeText(url); toast("초대 링크를 복사했어요. 친구에게 보내 주세요!"); }
  catch (e) { prompt("이 주소를 복사해서 보내 주세요", url); }
});
setInterval(updateRoomBox, 2000);

/* quality: measure the frame rate and step the picture down (or back up) to keep things smooth */
const Q_KEY = "hangang-quality", Q_NAMES = ["높음", "중간", "낮음", "아주 낮음"];
let qMode = (() => { try { return localStorage.getItem(Q_KEY) || "auto"; } catch (e) { return "auto"; } })();
let qLevel = -1, qAcc = 0, qFrames = 0, qChangedAt = 0, qGood = 0, qWarm = 0;
function applyQuality(level) {
  level = clamp(level, 0, 3); if (level === qLevel) return; qLevel = level;
  const dpr = devicePixelRatio || 1, pr = [Math.min(dpr, 2), Math.min(dpr, 1.5), 1, .8][level];
  renderer.setPixelRatio(pr); resize();
  sun.castShadow = level < 2; // the shadow pass is the heaviest single cost
  qChangedAt = performance.now(); showQuality();
}
function showQuality() {
  [...$("qualitySeg").children].forEach(b => b.setAttribute("aria-pressed", String(b.dataset.q === qMode)));
  $("qualityNote").textContent = qMode === "auto" ? `휴대폰 성능에 맞춰 자동으로 바꿔요 · 지금 '${Q_NAMES[qLevel]}'` : qMode === "high" ? "가장 선명하게 보여요. 끊기면 '자동'을 골라 주세요" : "그림자를 끄고 해상도를 낮춰서 가볍게 돌아가요";
}
$("qualitySeg").addEventListener("click", e => {
  const b = e.target.closest("button[data-q]"); if (!b) return; qMode = b.dataset.q;
  try { localStorage.setItem(Q_KEY, qMode); } catch (err) {}
  qGood = 0; applyQuality(qMode === "high" ? 0 : qMode === "low" ? 2 : LOW_END ? 1 : 0); showQuality();
});
applyQuality(qMode === "high" ? 0 : qMode === "low" ? 2 : LOW_END ? 1 : 0);
function qualityTick(dt) {
  if (qMode !== "auto" || document.hidden || !started) { qAcc = 0; qFrames = 0; qWarm = 0; return; }
  if ((qWarm += dt) < 6) return; // loading and the first look around are always a bit heavy
  qAcc += dt; qFrames++;
  if (qAcc < 3) return;
  const fps = qFrames / qAcc; qAcc = 0; qFrames = 0;
  const since = performance.now() - qChangedAt;
  if (fps < 40 && qLevel < 3 && since > 4000) { qGood = 0; applyQuality(qLevel + 1); }
  else if (fps > 57) { if (++qGood >= 10 && qLevel > 0 && since > 60000) { qGood = 0; applyQuality(qLevel - 1); } } // 30 smooth seconds before trying one step up
  else qGood = 0;
}
