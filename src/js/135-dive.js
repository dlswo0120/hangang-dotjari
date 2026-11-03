/* ================= 대교 난간: 기대기 · 다이빙 ================= */
const EM_RAIL = EMOTES.findIndex(E => E.id === "rail"), EM_DIVE = EMOTES.findIndex(E => E.id === "dive");
function railSide() {
  if (me.level !== "bridge" || me.st !== "walk" || anim) return 0;
  if (me.x - (BR.x - BR.half) < .9) return -1;
  if ((BR.x + BR.half) - me.x < .9) return 1;
  return 0;
}
const overWater = () => me.z < -3 && me.z > BOUND.waterZ0 + 3;
const leaning = () => me.em && me.em.i === EM_RAIL && activeEmote(me.em);
function diveActions(acts, status) {
  if (!started || boarded) return status;
  if (leaning()) {
    acts.length = 0;
    if (overWater()) acts.push(["dive", "다이빙하기", "primary"]);
    acts.push(["unlean", "그만 기대기", acts.length ? "" : "primary"]);
    return overWater() ? "강바람이 시원해요… 뛰어들어 볼까요?" : "여기는 강가가 너무 멀어서 뛰어들 수 없어요";
  }
  const s = railSide(); if (s) acts.unshift(["lean", "난간에 기대기", ""]);
  return status;
}
function diveClick(a) {
  if (a === "lean") {
    const s = railSide(); if (!s) return true;
    me.x = s < 0 ? BR.x - BR.half + .45 : BR.x + BR.half - .45; me.r = s < 0 ? Math.PI / 2 : -Math.PI / 2; me.railSide = s;
    me.em = { i: EM_RAIL, at: Date.now() }; cam.tYaw = me.r + Math.PI * 0; return true;
  }
  if (a === "unlean") { me.em = null; return true; }
  if (a === "dive") {
    if (!overWater()) return true;
    const s = me.railSide || (me.x < BR.x ? -1 : 1);
    if (me.hold) dropRamen(me.hold === "ramen" ? "앗, 라면이 강으로 같이 떨어졌어요…" : "앗, 들고 있던 걸 놓쳤어요…");
    me.em = { i: EM_DIVE, at: Date.now() }; me.level = "ground";
    // swing the camera out over the water so the bridge deck does not hide the jump
    cam.tYaw = s * Math.PI / 2; cam.yaw = cam.tYaw; cam.tPitch = .35; cam.tDist = 8;
    showBubble(() => myAvatar, "야호~!", 1.6, "me");
    const tx = me.x + s * 3.4, tz = me.z - .4;
    anim = { t: 0, dur: 2.0, from: [me.x, me.z, BR.y], to: [tx, tz, -0.85], hop: 2.4, then: () => {
      me.st = "swim"; me.y = 0; me.em = null; rebuildMe(); doSplash(me.x, me.z); setTimeout(() => doSplash(me.x + .6, me.z - .4), 120);
      toast("풍덩! 다이빙 성공! 강가로 헤엄쳐 나오세요"); publish(true); actKey = ""; refreshActions();
    } };
    publish(true); return true;
  }
  return false;
}
