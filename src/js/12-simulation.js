/* ================= simulation ================= */
let boundToastAt = 0;
function hitBound() { const n = performance.now(); if (n - boundToastAt > 6000) { boundToastAt = n; toast("여기까지만 갈 수 있습니다"); } }
function yawFrom(dx, dz) { return Math.atan2(-dx, -dz); }
function lerpAngle(a, b, t) { const d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * t; }
function pushOut(x, z, rad) {
  for (const o of OBST) {
    if (o.r) { const dx = x - o.x, dz = z - o.z, d = Math.hypot(dx, dz), m = o.r + rad; if (d < m && d > 1e-4) { x = o.x + dx / d * m; z = o.z + dz / d * m; } }
    else if (x > o.x0 - rad && x < o.x1 + rad && z > o.z0 - rad && z < o.z1 + rad) {
      const opts = [[o.x0 - rad - x, 0], [o.x1 + rad - x, 0], [0, o.z0 - rad - z], [0, o.z1 + rad - z]].sort((a, b) => Math.abs(a[0] + a[1]) - Math.abs(b[0] + b[1]));
      x += opts[0][0]; z += opts[0][1];
    }
  }
  return [x, z];
}
function onDock(x, z) { return (Math.abs(x - DOCK.x) < 8.5 && z > -2.2 && z < BOUND.landZ0 + 0.1) || onFishDeck(x, z) || onWaterFloor(x, z); }
function stepPlayer(dt) {
  if (anim) {
    anim.t += dt; const u = Math.min(1, anim.t / anim.dur);
    me.x = anim.from[0] + (anim.to[0] - anim.from[0]) * u; me.z = anim.from[1] + (anim.to[1] - anim.from[1]) * u;
    me.y = anim.from[2] + (anim.to[2] - anim.from[2]) * u + Math.sin(u * Math.PI) * anim.hop;
    if (u >= 1) { const then = anim.then; anim = null; then(); }
    return;
  }
  const inp = inputVec(); lastInput = inp;
  const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw);
  let dx = fx * inp.f + rx * inp.r, dz = fz * inp.f + rz * inp.r; const mag = Math.hypot(dx, dz);
  me.moving = mag > 0.05;
  if (boarded) {
    if (boarded.driver) {
      if (boatRaceDrive(dt)) return;
      boatLocal.r -= inp.r * dt * 1.4;
      const sp = inp.f * 3.2 * dt * (1 - boats[boarded.id].sink * 0.85); boatLocal.x += -Math.sin(boatLocal.r) * sp; boatLocal.z += -Math.cos(boatLocal.r) * sp;
      [boatLocal.x, boatLocal.z] = pushOut(boatLocal.x, boatLocal.z, 1.4);
      const bx = clamp(boatLocal.x, BOUND.x0 + 1, BOUND.x1 - 1), bz = clamp(boatLocal.z, BOUND.waterZ0 + 1, -3.4);
      if (bx !== boatLocal.x || bz !== boatLocal.z) { if (Math.abs(inp.f) > 0.2) hitBound(); boatLocal.x = bx; boatLocal.z = bz; }
    }
    return;
  }
  if ((me.ac || me.aj) && (me.st === "walk" || me.st === "ride") && circuitStep(dt, inp)) return;
  if (me.st === "sit" || me.st === "lie" || me.st === "bench" || me.st === "stool") { me.moving = false; return; }
  if ((me.rc || me.rj) && me.st === "walk" && raceStep(dt)) return;
  if (me.q && me.st === "walk") { queueWalk(dt); return; }
  if (me.st === "bike") { bikeStep(dt, inp); return; }
  if (!me.moving) { me.speed = 0; return; }
  dx /= Math.max(mag, 1); dz /= Math.max(mag, 1);
  const base = me.st === "swim" ? (me.tube ? 1.4 : 1.8) : inp.run ? 7 : 3.6;
  me.speed = base * Math.min(1, mag);
  let nx = me.x + dx * base * dt, nz = me.z + dz * base * dt;
  me.moveYaw = yawFrom(dx, dz);
  me.r = lerpAngle(me.r, me.moveYaw + (me.st === "swim" && !me.tube ? Math.PI : 0), Math.min(1, dt * 10));
  if (me.st === "walk" && me.level === "stairs") {
    nz = clamp(nz, STAIR.z0 + 0.15, STAIR.z1 - 0.15);
    if (nx > STAIR.bot) me.level = "ground";
    else if (nx < STAIR.top) { if (inDeck(nx, nz)) me.level = "bridge"; else nx = STAIR.top; }
    me.y = me.level === "bridge" ? BR.y : me.level === "stairs" ? stairY(nx) : 0;
  } else if (me.st === "walk" && me.level === "bridge") {
    const gap = nz > STAIR.z0 + 0.15 && nz < STAIR.z1 - 0.15;
    if (nx > BR.x + BR.half && gap) { me.level = "stairs"; me.y = stairY(nx); }
    else {
      const cx = clamp(nx, BR.x - BR.half, BR.x + BR.half), cz = clamp(nz, BR.z0, BR.z1);
      if (cz !== nz) hitBound();
      nx = cx; nz = cz; me.y = BR.y;
    }
  } else if (me.st === "walk" && me.level === "loft") { // the fishing range's upper floor
    [nx, nz] = loftStep(nx, nz); me.y = RANGE.y2;
  } else if (me.st === "walk" && inStairs(nx, nz)) {
    if (me.x >= STAIR.bot - 0.6) { me.level = "stairs"; me.y = stairY(nx); }
    else { nx = me.x; nz = me.z; }
  } else if (me.st === "walk") {
    if (nx < BOUND.x0 || nx > BOUND.x1 || nz > BOUND.landZ1) { hitBound(); nx = clamp(nx, BOUND.x0, BOUND.x1); nz = Math.min(nz, BOUND.landZ1); }
    [nx, nz] = pushOut(nx, nz, .35);
    [nx, nz] = storeGate(nx, nz);
    if (onRock(nx, nz) && !onRock(me.x, me.z) && rockFull()) { nx = me.x; nz = me.z; if (!me._rockToast || Date.now() - me._rockToast > 3000) { me._rockToast = Date.now(); toast("바위에 벌써 3명이 있어요. 조금 기다려 주세요"); } }
    if (nz < BOUND.landZ0 && !onDock(nx, nz)) {
      if (me.hold) dropRamen(me.hold === "ramen" ? "앗, 라면이 한강에 빠졌어요…" : "앗, 들고 있던 간식이 한강에 빠졌어요…");
      const dockSide = Math.abs(nx - DOCK.x) < 8.5;
      const tz = dockSide ? -4 : -2.2, tx = dockSide && Math.abs(nx - DOCK.x) < 8.5 ? nx : nx;
      anim = { t: 0, dur: 0.6, from: [me.x, me.z, me.y || 0], to: [tx, tz, -0.85], hop: 0.9, then: () => {
        me.st = "swim"; me.y = 0; rebuildMe(); doSplash(me.x, me.z); toast("풍덩! 한강에 빠졌습니다. 강가로 헤엄쳐 나오세요"); publish(true); actKey = ""; refreshActions();
      } };
      return;
    }
  } else if (me.st === "swim") {
    if (nx < BOUND.x0 || nx > BOUND.x1 || nz < BOUND.waterZ0) { hitBound(); nx = clamp(nx, BOUND.x0, BOUND.x1); nz = Math.max(nz, BOUND.waterZ0); }
    [nx, nz] = pushOut(nx, nz, .45);
    const underDock = Math.abs(nx - DOCK.x) < 9.5;
    const shore = underDock ? -2.8 : -0.9;
    if (nz > shore) {
      if (dz > 0.3 && !underDock) {
        anim = { t: 0, dur: 0.7, from: [me.x, me.z, -0.85], to: [nx, 2.6, 0], hop: 0.9, then: () => {
          me.st = "walk"; me.level = "ground"; me.tube = false; me.y = 0; rebuildMe(); toast("뭍으로 올라왔습니다"); publish(true); actKey = ""; refreshActions();
        } };
        me.st = "walk"; me.tube = false; rebuildMe(); return;
      }
      nz = shore;
    }
  }
  me.x = nx; me.z = nz;
}

