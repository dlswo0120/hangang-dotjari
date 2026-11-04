/* ================= 점프 ================= */
// A jump only lifts the avatar for a moment; x/z keep going through the usual walking limits,
// so jumping next to the bridge rail (or any edge) can never drop anyone off.
const JUMP_T = .62, JUMP_H = .85;
function jumpPhase(at) { if (!at) return -1; const u = (Date.now() - at) / 1000 / JUMP_T; return u >= 0 && u < 1 ? u : -1; }
const jumpH = at => { const u = jumpPhase(at); return u < 0 ? 0 : JUMP_H * 4 * u * (1 - u); };
function canJump() {
  return started && !anim && !boarded && me.st === "walk" && !me.q && jumpPhase(me.jp) < 0
    && !(me.fs && me.fs.s !== "idle") && !inRaceNow() && !circLive() && !(me.em && EMOTES[me.em.i] && EMOTES[me.em.i].id === "dive");
}
let jumpLanded = 0;
function doJump() {
  if (!canJump()) return;
  me.jp = Date.now(); if (me.em) me.em = null;
  if (audio.ready) audio.tone(audio.sfx, "sine", 320, 640, .12, .07);
  publish(true);
}
addEventListener("keydown", e => {
  if (e.key !== " " || e.repeat || (e.target && e.target.closest && e.target.closest("input,textarea"))) return;
  if (circLive()) return; // Space is the carrot during the animal race
  e.preventDefault(); doJump();
});
$("jumpBtn").addEventListener("pointerdown", e => { e.preventDefault(); doJump(); });
if (touchy) document.body.classList.add("touchy");
function updateJump() {
  // a soft thud on landing
  if (me.jp && jumpLanded !== me.jp && jumpPhase(me.jp) < 0 && Date.now() - me.jp > JUMP_T * 1000) { jumpLanded = me.jp; if (audio.ready) audio.step(me.level !== "ground" ? "deck" : "grass", true); }
  const btn = $("jumpBtn"), show = touchy && started && me.st === "walk" && !boarded && !inRaceNow() && !circLive();
  if (btn.hidden === show) btn.hidden = !show;
}
