/* ================= player ================= */
const me = { name: "", g: "m", c: Math.floor(Math.random() * SHIRTS.length), m: Math.floor(Math.random() * MAT_STYLES.length),
  x: 6, z: 30.5, y: 0, r: 0, st: "walk", tube: false, bt: null, moving: false, speed: 0, level: "ground", moveYaw: 0,
  rm: null, hold: false, eat: 0, seat: null, basket: null, q: 0 };
let lastInput = { f: 0, r: 0 };
let myAvatar = null, started = false, anim = null;
const boatLocal = { x: 0, z: 0, r: 0 };
let boarded = null; // {id, driver}

function poseFor() { return me.st === "walk" ? "stand" : me.st === "swim" ? (me.tube ? "tube" : "swim") : me.st === "bench" ? "boat" : me.st; }
function rebuildMe() {
  const key = [me.name, me.g, me.c, me.m].join("|");
  if (!myAvatar || myAvatar.userData.key !== key) {
    if (myAvatar) scene.remove(myAvatar);
    myAvatar = makeAvatar({ g: me.g, c: me.c, name: me.name, mine: true, matStyle: me.m });
    myAvatar.userData.key = key; setAvatarState(myAvatar, me.st, me.tube, true);
    myAvatar.position.set(me.x, me.y, me.z); scene.add(myAvatar);
  } else setAvatarState(myAvatar, me.st, me.tube);
}

/* input */
const keys = new Set(); const joyV = { x: 0, y: 0 };
addEventListener("keydown", e => {
  if (e.target && e.target.closest && e.target.closest("input")) return;
  const k = e.key.toLowerCase();
  if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift"].includes(k)) { keys.add(k); if (k.startsWith("arrow")) e.preventDefault(); }
});
addEventListener("keyup", e => keys.delete(e.key.toLowerCase()));
addEventListener("blur", () => keys.clear());
function inputVec() {
  let f = 0, r = 0;
  if (keys.has("w") || keys.has("arrowup")) f += 1; if (keys.has("s") || keys.has("arrowdown")) f -= 1;
  if (keys.has("d") || keys.has("arrowright")) r += 1; if (keys.has("a") || keys.has("arrowleft")) r -= 1;
  f += joyV.y; r += joyV.x;
  const l = Math.hypot(f, r); if (l > 1) { f /= l; r /= l; }
  return { f, r, run: keys.has("shift") || Math.hypot(joyV.x, joyV.y) > 0.95 };
}
const touchy = matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
const joy = $("joy"), knob = $("knob"); let joyId = null;
function joyMove(e) {
  const r = joy.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, R0 = r.width / 2 - 14;
  let dx = e.clientX - cx, dy = e.clientY - cy; const l = Math.hypot(dx, dy); if (l > R0) { dx *= R0 / l; dy *= R0 / l; }
  knob.style.transform = `translate(${dx}px,${dy}px)`; joyV.x = dx / R0; joyV.y = -dy / R0;
}
joy.addEventListener("pointerdown", e => { joyId = e.pointerId; joy.setPointerCapture(e.pointerId); joyMove(e); e.stopPropagation(); });
joy.addEventListener("pointermove", e => { if (e.pointerId === joyId) joyMove(e); });
const joyEnd = e => { if (e.pointerId !== joyId) return; joyId = null; joyV.x = joyV.y = 0; knob.style.transform = ""; };
joy.addEventListener("pointerup", joyEnd); joy.addEventListener("pointercancel", joyEnd);

const cam = { yaw: 0, pitch: 0.26, dist: 6.5, tYaw: 0, tPitch: 0.26, tDist: 6.5, tx: 6, ty: 1.2, tz: 30, dragAt: 0, init: false };
const camPos = new THREE.Vector3();
const ptrs = new Map(); let pinch0 = 0;
canvas.addEventListener("pointerdown", e => { canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); } });
canvas.addEventListener("pointermove", e => {
  const p = ptrs.get(e.pointerId); if (!p || !started) return;
  cam.dragAt = performance.now();
  if (ptrs.size === 1) { cam.tYaw -= (e.clientX - p.x) * 0.005; cam.tPitch = clamp(cam.tPitch + (e.clientY - p.y) * 0.004, -0.75, 0.9); }
  else if (ptrs.size === 2) { p.x = e.clientX; p.y = e.clientY; const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch0) cam.tDist = clamp(cam.tDist * pinch0 / d, 2.8, 16); pinch0 = d; return; }
  p.x = e.clientX; p.y = e.clientY;
});
const ptrUp = e => { ptrs.delete(e.pointerId); pinch0 = 0; };
canvas.addEventListener("pointerup", ptrUp); canvas.addEventListener("pointercancel", ptrUp);
canvas.addEventListener("wheel", e => { if (!started) return; e.preventDefault(); cam.tDist = clamp(cam.tDist * (1 + Math.sign(e.deltaY) * 0.1), 2.8, 16); }, { passive: false });

