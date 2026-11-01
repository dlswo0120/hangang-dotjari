/* ================= duck boat logic ================= */
function claimsFor(id) {
  const list = [];
  for (const [peer, o] of others) if (o.p.bt && o.p.bt.id === id) list.push([o.p.bt.at || 0, peer]);
  if (me.bt && me.bt.id === id && myPeer) list.push([me.bt.at || 0, myPeer]);
  list.sort((a, b) => a[0] - b[0] || (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0));
  return list.map(x => x[1]);
}
function crewNames(id) { return claimsFor(id).filter(p => p !== myPeer).map(p => (others.get(p) || { p: { n: "누군가" } }).p.n); }
function evaluateBoat() {
  if (!started) return;
  if (!me.bt) { boarded = null; return; }
  if (!myPeer) return;
  const claims = claimsFor(me.bt.id), idx = claims.indexOf(myPeer);
  if (idx < 0) return;
  if (idx >= 3) { me.bt = null; toast("이미 세 명이 탄 오리배입니다"); publish(true); refreshActions(); return; }
  if (claims.length >= 2) {
    const driver = idx === 0;
    if (!boarded) {
      const b = boats[me.bt.id]; boatLocal.x = b.x; boatLocal.z = b.z; boatLocal.r = b.r;
      boarded = { id: me.bt.id, driver };
      me.st = "boat"; me.tube = false; rebuildMe(); if (audio.ready) audio.quack();
      const names = crewNames(me.bt.id);
      toast((names.length ? names.join(", ") + "님과 " : "") + "오리배에 탔습니다!" + (driver ? " 내가 운전합니다" : ""));
      cam.tDist = 9; cam.tPitch = 0.3;
    } else boarded.driver = driver;
  } else if (boarded) { leaveBoat(true); return; }
  publish(true); refreshActions();
}
function claimBoat(id, squeeze) {
  if (!room || !myPeer) { toast("오리배는 두 명이 모여야 탈 수 있습니다. 지금은 같이 탈 사람이 없어요."); return; }
  me.bt = { id, at: Date.now() };
  toast(squeeze ? "세 명이 타면 오리배가 버틸 수 있을까요…?" : "오리배 앞에서 같이 탈 사람을 기다립니다");
  publish(true); evaluateBoat(); refreshActions();
}
function leaveBoat(forced) {
  const id = boarded ? boarded.id : null, sunk = id != null && boats[id].doomed;
  me.bt = null; boarded = null;
  if (id != null) {
    const b = boats[id], dHome = Math.hypot(b.x - b.home[0], b.z - b.home[1]);
    me.level = "ground"; me.y = 0;
    if (!sunk && dHome < 7) { me.x = b.home[0] + (Math.random() - 0.5) * 3; me.z = 2.4; me.st = "walk"; me.tube = false; rebuildMe(); toast(forced ? "짝꿍이 내려서 나도 선착장에 내렸습니다" : "선착장에 내렸습니다"); }
    else {
      me.x = clamp(b.x + (Math.random() < 0.5 ? -1.8 : 1.8), BOUND.x0, BOUND.x1); me.z = clamp(b.z + (Math.random() - .5) * 2, BOUND.waterZ0, -3); me.st = "swim"; me.tube = false; rebuildMe(); doSplash(me.x, me.z);
      toast(sunk ? "꼬르륵… 오리배가 가라앉아 다 같이 풍덩!" : forced ? "짝꿍이 내리는 바람에 같이 풍덩! 헤엄쳐서 나오세요" : "풍덩! 강 한가운데서 내렸습니다");
    }
    cam.tDist = 7; cam.tPitch = 0.22;
  }
  publish(true); actKey = ""; refreshActions();
}

