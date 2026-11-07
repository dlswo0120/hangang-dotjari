/* ================= 공원(방) 고르기 · 화질 자동 조절 ================= */
/* parks (public build only: the Supabase glue gives room.info / lobby / join) */
let parkSel = 0, parkData = null, parkAt = 0, lobbyLine = "";
const hasLobby = () => room && typeof room.lobby === "function";
function parkStatus(n, cap) { return n >= cap ? ["꽉 찼어요", "#8a8f98"] : n >= cap * .7 ? ["붐벼요", "#f29a4b"] : n > 0 ? ["여유", "#5cc58a"] : ["조용해요", "#7fa7c9"]; }
function pickRecommended(list, cap, asked) {
  if (asked) { const a = list.find(p => p.no === asked); if (a && a.n < cap) return a.no; }
  const open = list.filter(p => p.n > 0 && p.n < cap - 2); // some company, still room to spare
  if (open.length) return open.sort((a, b) => b.n - a.n)[0].no;
  const any = list.filter(p => p.n < cap).sort((a, b) => b.n - a.n)[0];
  return any ? any.no : 0;
}
async function loadParks(force) {
  if (!hasLobby()) { $("parkField").hidden = true; return; }
  $("parkField").hidden = false;
  if (!parkData || force || Date.now() - parkAt > 10000) {
    if (!parkData) $("parkList").textContent = "공원마다 몇 명 있는지 보는 중…";
    parkData = await room.lobby(); parkAt = Date.now();
  }
  const info = room.info(), cap = info.cap, list = parkData;
  const rec = pickRecommended(list, cap, info.asked);
  if (!parkSel || (list.find(p => p.no === parkSel) || { n: cap }).n >= cap) parkSel = rec;
  // parks with people, plus one quiet one (so nobody spreads out into ten empty rooms)
  const shown = list.filter(p => p.n > 0); const quiet = list.find(p => p.n === 0); if (quiet) shown.push(quiet);
  if (info.asked && !shown.some(p => p.no === info.asked)) shown.push(list[info.asked - 1]);
  shown.sort((a, b) => a.no - b.no);
  const box = $("parkList"); box.textContent = "";
  shown.forEach(p => {
    const [label, col] = parkStatus(p.n, cap), b = document.createElement("button");
    b.type = "button"; b.className = "park"; b.dataset.no = p.no; b.disabled = p.n >= cap; b.setAttribute("aria-pressed", String(p.no === parkSel));
    const nm = document.createElement("b"); nm.textContent = p.name; if (p.no === rec) { const t = document.createElement("span"); t.className = "tag"; t.textContent = "추천"; nm.appendChild(t); }
    const bar = document.createElement("span"); bar.className = "bar"; const fill = document.createElement("i"); fill.style.width = Math.max(3, p.n / cap * 100) + "%"; fill.style.background = col; bar.appendChild(fill);
    const cnt = document.createElement("span"); cnt.className = "cnt"; cnt.textContent = `${p.n}/${cap} · ${label}`;
    b.append(nm, bar, cnt);
    p.names = p.names.map(cleanName).filter(Boolean);
    if (p.names.length) { const who = document.createElement("span"); who.className = "who"; who.textContent = p.names.slice(0, 3).join(", ") + (p.names.length > 3 ? ` 외 ${p.names.length - 3}명` : ""); b.appendChild(who); }
    box.appendChild(b);
  });
  const total = list.reduce((s, p) => s + p.n, 0);
  lobbyLine = total ? `지금 한강 전체에 ${total}명 · ` + list.filter(p => p.n).map(p => `${p.name} ${p.n}`).join(", ") : "지금은 한강이 조용해요. 첫 손님이 되어 보세요";
  if (!started) { $("capLine").hidden = false; $("capLine").textContent = lobbyLine; }
}
$("parkList").addEventListener("click", e => {
  const b = e.target.closest(".park"); if (!b || b.disabled) return; parkSel = +b.dataset.no;
  [...$("parkList").children].forEach(x => x.setAttribute("aria-pressed", String(x === b)));
});
$("parkRefresh").addEventListener("click", () => loadParks(true));
setInterval(() => { if (!started && !$("gate2").hidden) loadParks(true); }, 15000);
// the front page shows how many people are out, without taking a spot anywhere
setTimeout(() => { if (hasLobby() && !started) loadParks(); }, 600);

/* in-game: which park, invite link, moving to another park */
function updateRoomBox() {
  const info = room && typeof room.info === "function" ? room.info() : null;
  if (!info || !info.no) { $("roomBox").hidden = true; return; }
  $("roomBox").hidden = false;
  const n = others.size + 1;
  $("roomLine").textContent = `지금 ${info.name} 한강에 있어요 · ${n}/${info.cap}명. 친구와 같은 곳에서 만나려면 초대 링크를 보내 주세요.`;
  $("countOf").textContent = "/" + info.cap;
  const pick = $("roomPick");
  if (pick.options.length !== info.max + 1) {
    pick.textContent = ""; const head = document.createElement("option"); head.value = ""; head.textContent = "다른 공원으로 이동"; pick.appendChild(head);
    info.parks.forEach((nm, i) => { const o = document.createElement("option"); o.value = String(i + 1); o.textContent = nm + (i + 1 === info.no ? " (지금)" : ""); pick.appendChild(o); });
  }
}
$("roomPick").addEventListener("change", e => {
  const n = +e.target.value, info = room && room.info ? room.info() : null; e.target.value = "";
  if (!info || !n || n === info.no) return;
  location.href = info.link(n); // a fresh page with that park picked in the list
});
$("roomInvite").addEventListener("click", async () => {
  const info = room && room.info ? room.info() : null; if (!info) return;
  const url = info.link(info.no);
  try { await navigator.clipboard.writeText(url); toast(`${info.name} 한강 초대 링크를 복사했어요. 친구에게 보내 주세요!`); }
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
