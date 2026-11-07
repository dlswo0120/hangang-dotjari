/* ================= 업데이트 공지 · 새 버전 안내 ================= */
// APP_VERSION and UPDATES are written in by tools/build.py from src/updates.json.
const SEEN_KEY = "hangang-seen-version";
$("verLabel").textContent = "버전 " + APP_VERSION;
const RETURNING = (() => { try { return !!localStorage.getItem("hangang-wallet"); } catch (e) { return false; } })();
function fillNews(list) {
  const box = $("newsList"); box.textContent = "";
  let lastDate = null, ul = null;
  list.forEach(u => {
    if (u.date !== lastDate) { lastDate = u.date; const h = document.createElement("h3"); h.textContent = u.date + " 업데이트"; box.appendChild(h); ul = document.createElement("ul"); box.appendChild(ul); }
    u.items.forEach(t => { const li = document.createElement("li"); li.textContent = t; ul.appendChild(li); });
  });
}
function checkNews() {
  let seen = null; try { seen = localStorage.getItem(SEEN_KEY); } catch (e) {}
  try { localStorage.setItem(SEEN_KEY, APP_VERSION); } catch (e) {}
  if (seen === APP_VERSION || (!seen && !RETURNING)) return; // first visit: nothing to announce
  const idx = UPDATES.findIndex(u => u.v === seen), fresh = UPDATES.slice(0, idx < 0 ? 2 : Math.min(idx, 3));
  if (!fresh.length) return;
  fillNews(fresh); $("newsTitle").textContent = "한강이 새로 단장했어요";
  const big = fresh.find(u => u.big), card = $("newsModal").querySelector(".card"), hero = $("newsHero");
  card.classList.toggle("big", !!big); hero.hidden = !big; hero.textContent = "";
  if (big) { // 대규모 업데이트: 큰 제목과 한눈에 보는 카드 몇 장, 자세한 목록은 아래에
    $("newsTitle").textContent = big.big.title;
    const sub = document.createElement("p"); sub.className = "news-sub"; sub.textContent = big.big.sub || ""; hero.appendChild(sub);
    (big.big.hl || []).forEach(([ic, t, d]) => { const c = document.createElement("div"); c.className = "news-hl"; const i = document.createElement("span"); i.className = "ic"; i.textContent = ic; const b = document.createElement("b"); b.textContent = t; const s = document.createElement("small"); s.textContent = d; const w = document.createElement("div"); w.append(b, s); c.append(i, w); hero.appendChild(c); });
    $("newsList").classList.add("fold");
    if (audio.ready) audio.ding();
  } else $("newsList").classList.remove("fold");
  $("newsModal").hidden = false;
}
$("newsOk").addEventListener("click", () => { $("newsModal").hidden = true; });
$("newsModal").addEventListener("click", e => { if (e.target === $("newsModal")) $("newsModal").hidden = true; });

// a newer version went live while this page was open
let newerShown = "";
async function pollVersion() {
  if (!/^https?:$/.test(location.protocol) || /claude\.ai|claudeusercontent/.test(location.hostname)) return;
  try {
    const r = await fetch("version.json?t=" + Date.now(), { cache: "no-store" }); if (!r.ok) return;
    const j = await r.json(); if (!j || typeof j.v !== "string" || j.v === APP_VERSION || j.v === newerShown) return;
    newerShown = j.v;
    $("updText").textContent = Array.isArray(j.items) && j.items[0] ? "한강이 새로 단장했어요 · " + String(j.items[0]).slice(0, 60) : "한강이 새로 단장했어요";
    $("updBanner").classList.toggle("big", !!j.big); if (j.big) $("updText").textContent = "🎉 대규모 업데이트가 나왔어요! 새로고침하면 새 한강으로 바뀌어요";
    $("updBanner").hidden = false;
  } catch (e) {}
}
setInterval(pollVersion, 180000);
addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") pollVersion(); });
setTimeout(pollVersion, 20000);
$("updReload").addEventListener("click", () => location.reload());
$("updLater").addEventListener("click", () => { $("updBanner").hidden = true; });
