/* ================= main loop ================= */
applyEnv(); setInterval(applyEnv, 30000);
const clock = new THREE.Clock(); let T = 0, actTimer = 0, plantTimer = 0;
const tmpV = new THREE.Vector3(), UP = UPV;
let stepPh = 0, stepSide = false;
const u_lastBite = {};
function eatTime(k) { return k === "ramen" || k === true ? EAT_TIME : (PRODUCTS[k] ? PRODUCTS[k].eat : 7); }
const EAT_WORDS = { ramen: ["후루릅~", "짭짭"], snack: ["바삭바삭", "와삭와삭"], drink: ["꿀꺽꿀꺽", "캬~"], ice: ["냠냠", "시원해~"], chicken: ["바삭!", "냠냠 쫄깃"] };
function eatingFx(av, key, e, dist, kind) {
  if (e < 0) { u_lastBite[key] = -1; return; }
  const bite = Math.floor(e * .9);
  if (bite === u_lastBite[key]) return; u_lastBite[key] = bite;
  const cat = kind === "ramen" || kind === true || !PRODUCTS[kind] ? "ramen" : PRODUCTS[kind].cat, first = bite % 2 === 0;
  showBubble(() => av, EAT_WORDS[cat][first ? 0 : 1], 1.1, "eat-" + key);
  if (audio.ready && dist < 14) {
    const v = clamp(1 - dist / 14, 0, 1);
    if (cat === "ramen") first ? audio.slurp(v) : audio.chomp(v);
    else if (cat === "drink") audio.gulp(v); else if (cat === "ice") audio.chomp(v * .6); else audio.crunch(v);
  }
}
function seatOf(boatIdx, peer) {
  const b = boats[boatIdx]; let idx = b.crew ? b.crew.indexOf(peer) : 0; if (idx < 0) idx = 0;
  tmpV.copy(SEATS[idx]); b.obj.localToWorld(tmpV);
  return { x: tmpV.x, z: tmpV.z, y: tmpV.y, r: b.r, idx };
}
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05); T += dt;
  waterU.t.value = T; skyU.t.value = T;
  streaks.forEach(s => { s.m.opacity = envStreak * (0.55 + 0.25 * Math.sin(T * 1.7 + s.ph) + 0.15 * Math.sin(T * 4.3 + s.ph * 2)); });

  if (started) stepPlayer(dt);

  // boats
  boats.forEach((b, i) => {
    const all = claimsFor(b.id), crew = all.length >= 2 ? all.slice(0, 3) : null; b.crew = crew;
    if (crew && crew.length >= 3 && !b.doomed) {
      b.doomed = true; b.sinkT = 0;
      if (boarded && boarded.id === i) { toast("세 명은 너무 무거워요! 오리배에 물이 차오릅니다"); if (audio.ready) audio.quack(); actKey = ""; }
    }
    if (b.doomed) { b.sinkT += dt; if (!all.length) b.doomed = false; }
    const sinkTo = b.doomed ? clamp(b.sinkT / SINK_TIME, 0, 1) : 0;
    b.sink += (sinkTo - b.sink) * Math.min(1, dt * (b.doomed ? 4 : 0.5));
    if (boarded && boarded.id === i && boarded.driver) { b.tx = boatLocal.x; b.tz = boatLocal.z; b.tr = boatLocal.r; }
    else if (crew) { const drv = others.get(crew[0]); if (drv && typeof drv.p.bx === "number") { b.tx = drv.p.bx; b.tz = drv.p.bz; b.tr = drv.p.br; } }
    else if (!b.doomed) { b.tx = b.home[0]; b.tz = b.home[1]; b.tr = 0; }
    const px = b.x, pz = b.z, k = Math.min(1, dt * (crew ? 8 : 1.2));
    b.x += (b.tx - b.x) * k; b.z += (b.tz - b.z) * k; b.r = lerpAngle(b.r, b.tr, k);
    const vel = Math.hypot(b.x - px, b.z - pz) / Math.max(dt, 1e-3);
    if (crew && vel > 0.05) b.crank += dt * (2 + vel * 2.2);
    const bob = Math.sin(T * 1.6 + i) * 0.05 * (1 - b.sink);
    b.obj.position.set(b.x, -0.6 - b.sink * 1.5 + bob, b.z);
    b.obj.rotation.set(Math.sin(T * 1.3 + i) * 0.03 + b.sink * 0.16, b.r, Math.sin(T * 1.1 + i * 2) * 0.03 + b.sink * 0.2);
    const ud = b.obj.userData; ud.crank.rotation.x = -b.crank; ud.wheel.rotation.x = -b.crank * 1.3;
    ud.fill.visible = b.sink > 0.02; ud.fill.position.y = 0.52 + b.sink * 0.36;
    b.obj.updateMatrixWorld();
  });
  if (boarded && boats[boarded.id].doomed && boats[boarded.id].sinkT > SINK_TIME + 0.3) leaveBoat(true);

  // me
  if (myAvatar) {
    let mySeat = -1;
    if (boarded) { const s = seatOf(boarded.id, myPeer); mySeat = s.idx; me.x = s.x; me.z = s.z; me.r = s.r; myAvatar.position.set(s.x, s.y, s.z); myAvatar.rotation.y = s.r; }
    else {
      const baseY = me.st === "swim" ? (me.tube ? -0.95 : -0.85) + Math.sin(T * 2) * 0.04 : me.st === "bike" ? me.y + .84 : me.y;
      tmpV.set(me.x, anim ? me.y : baseY, me.z);
      if (anim || tmpV.distanceTo(myAvatar.position) > 6) myAvatar.position.copy(tmpV); else myAvatar.position.lerp(tmpV, 1 - Math.exp(-dt * 16));
      const tr = me.st === "sit" || me.st === "lie" ? 0 : me.r;
      myAvatar.rotation.y = lerpAngle(myAvatar.rotation.y, tr, 1 - Math.exp(-dt * 14));
    }
    const myEat = me.eat ? (Date.now() - me.eat) / 1000 : -1;
    updateAvatar(myAvatar, dt, T, { moving: me.moving, speed: me.speed, crank: boarded ? boats[boarded.id].crank + (mySeat === 1 ? Math.PI / 2 : 0) : me.crank || 0, seat: mySeat, hold: me.hold, mat: !!me.mat, eatT: myEat, basket: me.basket ? me.basket.length : -1, cheer: cheerOf("me"), emote: activeEmote(me.em), lit: litOf(me.hold, me.lit), spin: me.hold === "sparkler" && me.lit ? spinOf(me.tw) : null });
    avatarRental(myAvatar, me.st === "bike", me.crank || 0, me.speed, !!me.mat && me.st !== "sit" && me.st !== "lie" && myAvatar.userData.cur.matP < .05, dt);
    eatingFx(myAvatar, "me", myEat, 0, me.hold);
    if (me.eat && myEat >= eatTime(me.hold)) { toast(me.hold === "ramen" ? "잘 먹었습니다! 국물까지 싹 비웠어요" : `${PRODUCTS[me.hold] ? PRODUCTS[me.hold].name : "간식"} 맛있게 먹었어요!`); me.hold = false; me.eat = 0; publish(true); actKey = ""; }
    const showGhost = me.st === "walk" && !anim && !me.moving && !me.bt && !!me.mat && canSpread();
    ghost.visible = showGhost;
    if (showGhost) { const sn = me.level === "ground" ? matSnap(me.x, me.z) : null, gx = sn ? sn[0] : me.x, gz = sn ? sn[1] : me.z; ghost.position.set(gx, me.y + 0.05, gz + POSES.sit.matZ); ghost.material.color.set(matConflict(gx, gz) ? 0xff8a7a : 0x9be3a0); }
    playerLight.position.set(me.x + 1.5, me.y + 4, me.z + 3);
    // footsteps and strokes
    if (!anim && me.moving && (me.st === "walk" || me.st === "swim")) {
      const rate = me.st === "swim" ? 3 : me.speed > 5 ? 11 : 7;
      stepPh += dt * rate;
      if (stepPh > Math.PI) {
        stepPh -= Math.PI; stepSide = !stepSide;
        if (audio.ready) {
          if (me.st === "swim") { if (stepSide) audio.paddle(); }
          else audio.step(me.level !== "ground" ? "deck" : onDock(me.x, me.z) ? "wood" : onPath(me.z) ? "path" : "grass", stepSide);
        }
      }
    } else stepPh = Math.PI * 0.75;
  }

  // others
  for (const [peer, o] of others) {
    const p = o.p; let tx = p.x, tz = p.z, tr = p.r, ty = 0, onBoat = false, seat = -1, crank = 0;
    if (p.st === "boat" && p.bt) { const b = boats[p.bt.id]; if (b.crew && b.crew.includes(peer)) { const s = seatOf(p.bt.id, peer); tx = s.x; tz = s.z; tr = s.r; ty = s.y; onBoat = true; seat = s.idx; crank = b.crank + (seat === 1 ? Math.PI / 2 : 0); } }
    if (p.st === "sit" || p.st === "lie") tr = 0;
    if (!onBoat) ty = p.y + (p.st === "bike" ? .84 : 0);
    if (p.st === "swim") ty = (p.tb ? -0.95 : -0.85) + Math.sin(T * 2 + p.x) * 0.04;
    const k = onBoat ? 1 : Math.min(1, dt * 10);
    const moving = Math.hypot(tx - o.x, tz - o.z) > 0.03, stepD = Math.hypot(tx - o.x, tz - o.z) * k;
    if (p.st === "bike") { o.crank = (o.crank || 0) + stepD * 1.3; crank = o.crank; }
    o.x += (tx - o.x) * k; o.z += (tz - o.z) * k; o.r = lerpAngle(o.r, tr, k);
    o.obj.position.set(o.x, ty, o.z); o.obj.rotation.y = o.r;
    const oEat = p.hi && p.ea ? (Date.now() - p.ea) / 1000 : -1, oE = oEat >= 0 && oEat < eatTime(p.hi) ? oEat : -1;
    updateAvatar(o.obj, dt, T, { moving, speed: 3.6, seat, crank, hold: p.hi, eatT: oE, basket: p.bk, cheer: cheerOf(peer), mat: !!p.mt, emote: activeEmote(p.em), lit: litOf(p.hi, p.lt), spin: litOf(p.hi, p.lt) ? spinOf(p.tw) : null });
    avatarRental(o.obj, p.st === "bike", crank, stepD / Math.max(dt, 1e-3), !!p.mt && p.st !== "sit" && p.st !== "lie" && o.obj.userData.cur.matP < .05, dt);
    eatingFx(o.obj, peer, oE, Math.hypot(o.x - cam.tx, o.z - cam.tz), p.hi);
  }

  // NPCs
  const camP = camera.position;
  npcs.forEach(n => {
    n.x += n.dir * n.speed * dt; if (n.x > 230) n.dir = -1; if (n.x < -160) n.dir = 1;
    if (T > n.offUntil) n.toff = 0; n.off += (n.toff - n.off) * Math.min(1, dt * 3);
    const z = n.lane + n.off;
    n.obj.position.set(n.x, 0, z); n.obj.rotation.y = n.dir > 0 ? -Math.PI / 2 : Math.PI / 2;
    if (n.kind === "bike") {
      n.bike.userData.wheels.forEach(w => w.rotation.x -= dt * n.speed / 0.32);
      n.crank += dt * n.speed * 1.3; updateAvatar(n.rider, dt, T, { crank: n.crank });
      // bell: when someone is ahead in the bike lane, or now and then
      const ahead = (ox, oz) => { const dx = (ox - n.x) * n.dir; return dx > 0 && dx < 11 && Math.abs(oz - z) < 1.6; };
      let ring = T > n.nextBell;
      if (!ring && T - n.bellAt > 6) ring = (started && me.level === "ground" && ahead(me.x, me.z)) || [...others.values()].some(o => ahead(o.x, o.z));
      if (ring) { n.bellAt = T; n.nextBell = T + 10 + Math.random() * 18; if (audio.ready) { const d = Math.hypot(n.x - camP.x, z - camP.z); audio.bell(Math.pow(clamp(1 - d / 45, 0, 1), 2)); } }
    } else updateAvatar(n.obj, dt, T, { moving: true, speed: n.kind === "run" ? 6.5 : n.speed + 1.2 });
    if (n.dog) {
      dog.position.set(n.x + n.dir * 1.7, 0, z - 0.7); dog.rotation.y = n.obj.rotation.y;
      const ds = Math.sin(T * 10) * 0.5; dog.userData.legs.forEach((l, i) => l.rotation.x = (i % 3 === 0 ? ds : -ds)); dog.userData.tail.rotation.z = Math.sin(T * 14) * 0.6;
    }
  });
  // runners: "지나갈게요~~" when about to bump into someone
  npcs.forEach(r => {
    if (r.kind !== "run" || T - r.sayAt < 7) return;
    const rz = r.lane + r.off, list = [];
    npcs.forEach(o => { if (o !== r && o.kind !== "bike") list.push([o.x, o.lane + o.off, o.dir * o.speed]); });
    if (started && me.level === "ground" && !anim) list.push([me.x, me.z, 0]);
    others.forEach(o => list.push([o.x, o.z, 0]));
    for (const [ox, oz, vx] of list) {
      const dx = (ox - r.x) * r.dir;
      if (dx > 0 && dx < 2.4 && Math.abs(oz - rz) < 0.9 && vx * r.dir < r.speed - 0.3) {
        r.sayAt = T; r.toff = oz > rz ? -0.95 : 0.95; r.offUntil = T + 1.8;
        showBubble(() => r.obj, "지나갈게요~!", 2.2, r);
        if (audio.ready) { const d = Math.hypot(r.x - camP.x, rz - camP.z); audio.speak("지나갈게요", 0.9 * clamp(1 - d / 28, 0, 1)); }
        break;
      }
    }
  });
  // ramen machines: bowls, LED countdown, boiling sounds, steam
  const owners = machineOwners();
  MACHINES.forEach((m, i) => {
    const own = owners[i];
    if (own) {
      const left = Math.max(0, RAMEN_TIME - (Date.now() - own.at) / 1000);
      if (!m.bowl) { m.bowl = makeBowl(); m.bowl.position.set(m.x, .645, m.z - .12); scene.add(m.bowl); }
      drawLed(m, left > 0 ? fmt(Math.ceil(left)) : (Math.floor(T * 2) % 2 ? "완 성" : "     "));
      tmpV.set(m.x, .79, m.z - .12); emitSteam(tmpV, clamp(1.15 - left / RAMEN_TIME, .25, 1.15), dt);
      const dc = Math.hypot(m.x - cam.tx, m.z - cam.tz);
      if (audio.ready && left > 0 && dc < 12 && Math.random() < dt * 7) audio.bubble(clamp(1 - dc / 12, 0, 1));
      if (isMine(own) && left <= 0 && !m.doneShown) { m.doneShown = true; toast("라면이 다 됐어요! 기계 앞에서 '라면 들기'를 눌러 주세요"); if (audio.ready) audio.ding(); actKey = ""; }
    } else {
      if (m.bowl) { scene.remove(m.bowl); m.bowl = null; }
      drawLed(m, "--:--");
    }
  });
  // lost the race for a machine?
  if (me.rm && myPeer && owners[me.rm.m] && !isMine(owners[me.rm.m])) { me.rm = null; toast("다른 분이 먼저 쓰고 있어요"); publish(true); }
  // steam from bowls people are holding
  const bowlSteam = av => { if (av && av.userData.bowl && av.userData.bowl.visible) { av.userData.bowl.getWorldPosition(tmpV); tmpV.y += .14; emitSteam(tmpV, .85, dt); } };
  bowlSteam(myAvatar); others.forEach(o => bowlSteam(o.obj));
  updateSteam(dt);
  if (started) {
    const chip = $("ramenChip");
    if (me.rm) { const left = ramenLeft(); chip.hidden = false; chip.textContent = left > 0 ? "라면 끓는 중 " + fmt(Math.ceil(left)) : "라면 완성! 기계로 가서 들어 주세요"; }
    else if (me.eat) { chip.hidden = false; chip.textContent = (me.hold === "ramen" ? "라면" : PRODUCTS[me.hold] ? PRODUCTS[me.hold].name : "간식") + (PRODUCTS[me.hold] && PRODUCTS[me.hold].cat === "drink" ? " 꿀꺽꿀꺽 마시는 중" : " 냠냠 먹는 중"); }
    else if (dvPhase()) { chip.hidden = false; chip.textContent = dvPhase(); }
    else chip.hidden = true;
  }

  updateStore(dt);
  updateExtras(dt);
  updateRentals(dt);
  updateDeliveries(dt);
  updateEmotes();
  updateFireShop(dt);
  updatePhoto();
  // bubbles follow their owners
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i], o = b.getObj();
    if (!o || T > b.until) { scene.remove(b.s); bubbles.splice(i, 1); continue; }
    b.s.position.set(o.position.x, o.position.y + (o.userData.h || 2) + 0.55, o.position.z);
    b.s.material.opacity = Math.min(1, (b.until - T) / 0.4, (T - (b.until - b.dur)) / 0.15);
  }

  // weather particles
  if (rain.visible) {
    const a = rainGeo.attributes.position.array;
    for (let i = 0; i < RAIN_N; i++) { const j = i * 6; a[j + 1] -= 32 * dt; a[j + 4] -= 32 * dt; if (a[j + 4] < -1) { const x = (Math.random() - .5) * 70, z = (Math.random() - .5) * 70, y = 26 + Math.random() * 6; a[j] = x; a[j + 1] = y; a[j + 2] = z; a[j + 3] = x; a[j + 4] = y - 0.7; a[j + 5] = z; } }
    rainGeo.attributes.position.needsUpdate = true; rain.position.set(camera.position.x, 0, camera.position.z);
  }
  if (snow.visible) {
    const a = snowGeo.attributes.position.array;
    for (let i = 0; i < SNOW_N; i++) { const j = i * 3; a[j + 1] -= 1.6 * dt; a[j] += Math.sin(T + i) * 0.4 * dt; if (a[j + 1] < -0.5) { a[j] = (Math.random() - .5) * 70; a[j + 1] = 28; a[j + 2] = (Math.random() - .5) * 70; } }
    snowGeo.attributes.position.needsUpdate = true; snow.position.set(camera.position.x, 0, camera.position.z);
  }
  if (splashT < 1.2) {
    splashT += dt; const a = splashGeo.attributes.position.array;
    for (let i = 0; i < splashN; i++) { const v = splashVel[i]; v[1] -= 14 * dt; a[i * 3] += v[0] * dt; a[i * 3 + 1] = Math.max(-0.6, a[i * 3 + 1] + v[1] * dt); a[i * 3 + 2] += v[2] * dt; }
    splashGeo.attributes.position.needsUpdate = true; splash.material.opacity = Math.max(0, 1 - splashT / 1.2);
  }

  // camera
  if (!started) {
    const x = -10 + Math.sin(T * 0.05) * 50;
    camera.position.set(x, 7 + Math.sin(T * 0.08) * 1.5, 34); camera.lookAt(x - 15, 6, -150);
  } else {
    const k = 1 - Math.exp(-dt * 6);
    if (me.st === "swim" && !anim) cam.tPitch = Math.max(cam.tPitch, 0.45); // stay above the embankment wall
    const idle = performance.now() - cam.dragAt > 900;
    if (boarded && idle) cam.tYaw = lerpAngle(cam.tYaw, boats[boarded.id].r, Math.min(1, dt * 1.5));
    if (me.st === "bike" && idle && me.speed > 1) cam.tYaw = lerpAngle(cam.tYaw, me.r, Math.min(1, dt * 1.2));
    cam.yaw = lerpAngle(cam.yaw, cam.tYaw, k); cam.pitch += (cam.tPitch - cam.pitch) * k; cam.dist += (cam.tDist - cam.dist) * k;
    const head = boarded ? 0.8 : me.st === "bike" ? 2.0 : me.st === "swim" ? -0.5 : me.st === "lie" ? 0.6 : me.st === "bench" ? 1.45 : me.st === "stool" ? 1.3 : 1.25;
    const fk = 1 - Math.exp(-dt * 10), fy = (boarded ? 0 : anim ? me.y : me.y) + head;
    cam.tx += (me.x - cam.tx) * fk; cam.ty += (fy - cam.ty) * fk; cam.tz += (me.z - cam.tz) * fk;
    const cp = Math.cos(cam.pitch);
    const px = cam.tx + Math.sin(cam.yaw) * cp * cam.dist, pz = cam.tz + Math.cos(cam.yaw) * cp * cam.dist;
    let py = cam.ty + Math.sin(cam.pitch) * cam.dist;
    const floor = (me.level === "bridge" && inDeck(px, pz) ? BR.y : pz > BOUND.landZ0 ? 0 : -0.6) + 0.4;
    if (py < floor) py = floor;
    camPos.set(...storeCam(px, py, pz));
    if (!cam.init) { camera.position.copy(camPos); cam.init = true; } else camera.position.lerp(camPos, 1 - Math.exp(-dt * 14));
    camera.lookAt(cam.tx - Math.sin(cam.yaw) * 2.5, cam.ty + 0.35, cam.tz - Math.cos(cam.yaw) * 2.5);
    publish(false);
    actTimer += dt; if (actTimer > 0.2) { actTimer = 0; refreshActions(); }
    plantTimer += dt;
    if (plantTimer > 0.5) {
      plantTimer = 0; const rects = [];
      const addAv = av => { if (av && av.userData.cur.matP > 0.05 && av.userData.matG && av.userData.matG.visible) { const r = av.rotation.y; rects.push({ x: av.position.x - Math.sin(r) * av.userData.cur.matZ, z: av.position.z + Math.cos(r) * av.userData.cur.matZ }); } };
      addAv(myAvatar); others.forEach(o => addAv(o.obj));
      hidePlantsUnderMats(rects);
    }
  }
  sunTarget.position.set(cam.tx, 0, cam.tz); sun.position.copy(skyU.sunDir.value).multiplyScalar(150).add(sunTarget.position);
  if (sun.position.y < sunTarget.position.y + 12) sun.position.y = sunTarget.position.y + 12;
  waterU.camPos.value.copy(camera.position); sky.position.copy(camera.position);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
