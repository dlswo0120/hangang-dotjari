/* ================= 업데이트 공지 · 새 버전 안내 ================= */
// APP_VERSION and UPDATES are written in by tools/build.py from src/updates.json.
const SEEN_KEY = "hangang-seen-version";
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
  fillNews(fresh); $("newsTitle").textContent = "한강이 새로 단장했어요"; $("newsModal").hidden = false;
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
    $("updBanner").hidden = false;
  } catch (e) {}
}
setInterval(pollVersion, 180000);
addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") pollVersion(); });
setTimeout(pollVersion, 20000);
$("updReload").addEventListener("click", () => location.reload());
$("updLater").addEventListener("click", () => { $("updBanner").hidden = true; });
