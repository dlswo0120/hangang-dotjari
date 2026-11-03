/* ================= UI glue ================= */
function toast(text) {
  const t = document.createElement("div"); t.className = "pill toast"; t.textContent = text;
  $("toasts").appendChild(t); setTimeout(() => t.remove(), 4300);
  while ($("toasts").children.length > 3) $("toasts").firstChild.remove();
}
function pressG() { document.querySelectorAll("#genderChoices .choice").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.g === me.g))); }
$("enterBtn").addEventListener("click", () => {
  try { audio.init(); } catch (e) {}
  $("gate1").hidden = true; $("gate2").hidden = false;
  try { const n = localStorage.getItem("hangang-name"); if (n) $("nameInput").value = n; const g = localStorage.getItem("hangang-g"); if (g === "f" || g === "m") { me.g = g; pressG(); } } catch (e) {}
  if (!touchy) setTimeout(() => $("nameInput").focus(), 50);
});
$("genderChoices").addEventListener("click", e => { const b = e.target.closest(".choice"); if (!b) return; me.g = b.dataset.g; pressG(); });
$("joinForm").addEventListener("submit", e => {
  e.preventDefault();
  const n = $("nameInput").value.replace(/[\u0000-\u001f\u200b-\u200f\u202a-\u202e]/g, "").trim();
  if (!n) { $("err").textContent = "이름을 한 글자 이상 적어주세요."; $("nameInput").focus(); return; }
  if (others.size >= MAX_PEOPLE) { $("err").textContent = `지금 ${MAX_PEOPLE}명이 모두 와 있습니다. 조금 뒤에 다시 와 주세요.`; return; }
  me.name = n.slice(0, 10);
  try { localStorage.setItem("hangang-name", me.name); localStorage.setItem("hangang-g", me.g); } catch (e) {}
  me.x = 4 + (Math.random() - 0.5) * 16; me.z = 30.5; me.r = 0; me.st = "walk"; me.level = "ground"; me.y = 0;
  rebuildMe(); started = true; $("nameInput").blur();
  cam.tx = me.x; cam.tz = me.z; cam.yaw = cam.tYaw = 0; cam.tPitch = 0.26; cam.tDist = 6.5; cam.init = false;
  $("gate2").hidden = true; $("hudLeft").hidden = false; $("hudRight").hidden = false; $("actions").hidden = false;
  if (touchy) $("joy").hidden = false; else { $("keys").hidden = false; setTimeout(() => { $("keys").hidden = true; }, 15000); }
  publish(true); refreshActions(); $("count").textContent = String(others.size + 1); storeOnJoin(); checkNews();
  toast(touchy ? "패드로 걸어가서 마음에 드는 잔디에 돗자리를 펴세요" : "WASD로 걸어가서 마음에 드는 잔디에 돗자리를 펴세요");
});
$("exitBtn").addEventListener("click", () => { $("leaveModal").hidden = false; $("stayBtn").focus(); });
$("stayBtn").addEventListener("click", () => { $("leaveModal").hidden = true; });
$("leaveModal").addEventListener("click", e => { if (e.target === $("leaveModal")) $("leaveModal").hidden = true; });
addEventListener("keydown", e => { if (e.key === "Escape" && !$("leaveModal").hidden) $("leaveModal").hidden = true; });
$("leaveBtn").addEventListener("click", async () => {
  $("leaveModal").hidden = true;
  started = false; me.bt = null; boarded = null; me.rm = null; me.hold = false; me.eat = 0; me.basket = null; me.q = 0; payState = null; me.ch = 0; me.pb = null; me.mat = false; me.bike = null; me.em = null; me.lit = 0; me.tw = 0; me.gf = null; me.ph = null; me.pj = null; if (shoot) shoot.done = true; me.rod = null; me.fs = null; if ((me.rc && me.rc.st !== "go") || (me.rj && !inRaceNow())) { const rr = myRace(); if (rr) { wallet.money += rr.rc.bet; saveWallet(); } } me.rc = null; me.rj = null; me.rp = null; { const dd = myDuel(); if (dd && dd.fd.st !== "go") { wallet.money += dd.fd.bet; saveWallet(); } } me.fd = null; me.fj = null; me.fsc = null; $("fishModal").hidden = true; if (me.dv && !me.dv.got && Date.now() - me.dv.at < DV_RIDE_IN * 1000) { wallet.money += PRODUCTS[me.dv.k].price + DV_FEE; saveWallet(); } me.dv = null; if (me.st === "bike") me.st = "walk"; exitMung();
  try { if (room) { await room.presence({ n: null, st: null, bt: null, rm: null }); if (typeof room.leave === "function") await room.leave(); } } catch (e) {}
  room = null;
  if (myAvatar) { scene.remove(myAvatar); myAvatar = null; }
  ["hudLeft", "hudRight", "actions", "joy", "keys", "settings", "chatPanel", "photoPanel", "bagBtn", "shopModal", "bagModal"].forEach(id => $(id).hidden = true);
  try { if (audio.ready) { audio.setMuted(true); audio.ac.suspend(); } } catch (e) {}
  try { window.close(); } catch (e) {}
  setTimeout(() => { $("byeGate").hidden = false; }, 250);
});
$("backBtn").addEventListener("click", () => { location.reload(); });
$("soundBtn").addEventListener("click", () => {
  if (!audio.ready) { try { audio.init(); } catch (e) {} }
  audio.setMuted(!audio.muted);
  $("soundBtn").setAttribute("aria-label", audio.muted ? "소리 켜기" : "소리 끄기");
  $("soundIcon").innerHTML = audio.muted ? '<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>' : '<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>';
});
MACROS.forEach((m, i) => { const b = document.createElement("button"); b.dataset.i = i; const k = document.createElement("kbd"); k.textContent = i + 1; b.append(k, m); $("chatGrid").appendChild(b); });
let lastSayAt = 0;
function sayMacro(i) {
  if (!started || !myAvatar) return; const now = Date.now(); if (now - lastSayAt < 1200) return; lastSayAt = now;
  mySay = { i, at: now }; showBubble(() => myAvatar, MACROS[i], 4, "me"); if (audio.ready) audio.pop(); publish(true);
}
$("chatGrid").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; sayMacro(+b.dataset.i); $("chatPanel").hidden = true; $("chatBtn").setAttribute("aria-expanded", "false"); });
$("chatBtn").addEventListener("click", () => { const s = $("chatPanel"); s.hidden = !s.hidden; $("chatBtn").setAttribute("aria-expanded", String(!s.hidden)); $("settings").hidden = true; $("photoPanel").hidden = true; });
addEventListener("keydown", e => { if (e.target && e.target.closest && e.target.closest("input")) return; if (/^[1-6]$/.test(e.key)) sayMacro(+e.key - 1); });
$("setBtn").addEventListener("click", () => { const s = $("settings"); s.hidden = !s.hidden; $("setBtn").setAttribute("aria-expanded", String(!s.hidden)); });
[["volWater", "water"], ["volNature", "nature"], ["volAnimal", "animal"], ["volStep", "sfx"]].forEach(([id, k]) => {
  $(id).addEventListener("input", e => { if (audio.ready) audio[k].gain.setTargetAtTime(e.target.value / 100, audio.ac.currentTime, 0.1); });
});
document.addEventListener("pointerdown", e => {
  if (!e.target.closest("#settings,#setBtn")) { $("settings").hidden = true; $("setBtn").setAttribute("aria-expanded", "false"); }
  if (!e.target.closest("#chatPanel,#chatBtn")) { $("chatPanel").hidden = true; $("chatBtn").setAttribute("aria-expanded", "false"); }
});

/* photo */
let shotBlob = null, downloads = null;
(async () => { try { if (window.claude && typeof window.claude.use === "function") downloads = await window.claude.use("downloads"); } catch (e) { downloads = null; } })();
function snapNow() {
  renderer.render(scene, camera);
  const w = canvas.width, h = canvas.height, c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = c.getContext("2d"); x.drawImage(canvas, 0, 0);
  const k = kst(), s = Math.max(1, w / 900);
  x.font = `${Math.round(16 * s)}px 'Gowun Batang', serif`; x.fillStyle = "rgba(255,255,255,.9)"; x.textAlign = "right"; x.textBaseline = "bottom";
  x.shadowColor = "rgba(0,0,0,.45)"; x.shadowBlur = 8 * s;
  x.fillText(`한강 돗자리 · ${me.name} · ${k.getMonth() + 1}월 ${k.getDate()}일 ${phase}`, w - 18 * s, h - 16 * s);
  deliverShot(c);
}
function deliverShot(c) {
  c.toBlob(b => {
    if (!b) return; shotBlob = b; const img = $("shotImg"); if (img.src) URL.revokeObjectURL(img.src); img.src = URL.createObjectURL(b);
    $("shotSave").hidden = !downloads; $("shotTip").textContent = !downloads ? "이미지를 길게 누르거나 우클릭해서 저장할 수 있습니다." : touchy && navigator.canShare ? "저장을 누른 뒤 '이미지 저장'을 고르면 사진 앱에 들어가요" : "";
    $("shot").hidden = false;
  }, "image/png");
}
$("shotClose").addEventListener("click", () => { $("shot").hidden = true; });
$("shotSave").addEventListener("click", async () => {
  if (!downloads || !shotBlob) return; const k = kst(), pad = n => String(n).padStart(2, "0");
  try { await downloads.save({ filename: `hangang-${k.getFullYear()}${pad(k.getMonth() + 1)}${pad(k.getDate())}-${pad(k.getHours())}${pad(k.getMinutes())}.png`, data: shotBlob }); toast("사진을 저장했습니다"); $("shot").hidden = true; }
  catch (e) { if (e && e.code !== "declined" && e.code !== "cancelled") $("shotTip").textContent = "저장하지 못했습니다. 이미지를 길게 눌러 저장해 주세요."; }
});

