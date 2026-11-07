/* ================= 가리기 · 이름 숨기기 (보안 1단계) ================= */
// 가린 사람: 이번 접속에서는 id로, 다음에 와도 이름으로 계속 가림 (내 기기에만 저장)
const HIDE_KEY = "hangang-hide", hiddenIds = new Set();
let hiddenNames = (() => { try { const a = JSON.parse(localStorage.getItem(HIDE_KEY) || "[]"); return Array.isArray(a) ? a.filter(s => typeof s === "string").slice(0, 50) : []; } catch (e) { return []; } })();
function isHidden(id, name) { return hiddenIds.has(id) || hiddenNames.includes(name); }
function setHidden(id, name, on) {
  if (on) { hiddenIds.add(id); if (name && name !== "손님" && !hiddenNames.includes(name)) hiddenNames.push(name); }
  else { hiddenIds.delete(id); hiddenNames = hiddenNames.filter(n => n !== name); }
  hiddenNames = hiddenNames.slice(-50);
  try { localStorage.setItem(HIDE_KEY, JSON.stringify(hiddenNames)); } catch (e) {}
  toast(on ? `${name}님을 가렸어요. 말풍선·종이배·선물이 내 화면에 안 보여요` : `${name}님 가리기를 풀었어요`);
  peopleKey = ""; // redraw
}
const lobbyNameOn = () => { try { return localStorage.getItem("hangang-lobbyname") !== "0"; } catch (e) { return true; } };
let peopleKey = "";
function drawPeople() {
  const box = $("peopleList"); if (!box || $("settings").hidden) return;
  const list = [...others].map(([id, o]) => ({ id, name: o.p.hidName || o.p.n, hid: !!o.p.hidName }));
  const key = JSON.stringify(list); if (key === peopleKey) return; peopleKey = key;
  box.textContent = "";
  if (!list.length) { const e = document.createElement("p"); e.textContent = "지금은 나 혼자예요."; box.appendChild(e); return; }
  list.forEach(({ id, name, hid }) => {
    const row = document.createElement("div"); row.className = "person" + (hid ? " hid" : "");
    const nm = document.createElement("span"); nm.textContent = hid ? `${name} (가림)` : name;
    const b = document.createElement("button"); b.type = "button"; b.className = "hide-btn"; b.textContent = hid ? "풀기" : "가리기";
    b.onclick = () => { setHidden(id, name, !hid); const o = others.get(id); if (o) o.key = ""; drawPeople(); };
    row.append(nm, b); box.appendChild(row);
  });
}
(() => {
  const cb = $("lobbyNameChk"); if (!cb) return;
  cb.checked = lobbyNameOn();
  cb.onchange = () => { try { localStorage.setItem("hangang-lobbyname", cb.checked ? "1" : "0"); } catch (e) {} toast(cb.checked ? "다음에 들어올 때부터 공원 목록에 내 이름이 보여요" : "다음에 들어올 때부터 공원 목록에 내 이름이 안 보여요"); };
  $("setBtn").addEventListener("click", () => { peopleKey = ""; drawPeople(); });
  // 사람 수를 누르면 설정의 '같이 있는 사람'으로 바로
  const cnt = document.querySelector(".pill.tools .count");
  if (cnt) { cnt.style.cursor = "pointer"; cnt.setAttribute("role", "button"); cnt.addEventListener("click", e => { e.stopPropagation(); $("settings").hidden = false; $("setBtn").setAttribute("aria-expanded", "true"); peopleKey = ""; drawPeople(); $("peopleBox").scrollIntoView({ block: "nearest" }); }); }
})();
