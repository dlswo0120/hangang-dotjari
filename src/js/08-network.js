/* ================= room / peers ================= */
let room = null, myPeer = null;
const others = new Map(); // peer -> {p, key, obj, x, z, r}
const seen = new Set();
const num = (v, lo, hi, d) => (typeof v === "number" && isFinite(v) ? clamp(v, lo, hi) : d);
function cleanPresence(p) {
  if (!p || typeof p !== "object" || typeof p.n !== "string") return null;
  const st = ["walk", "sit", "lie", "swim", "boat", "bench", "stool", "bike"].includes(p.st) ? p.st : "walk";
  const o = {
    n: p.n.replace(/[\u0000-\u001f\u200b-\u200f\u202a-\u202e]/g, "").slice(0, 10) || "손님",
    g: p.g === "f" ? "f" : "m", c: Number.isInteger(p.c) ? Math.abs(p.c) % SHIRTS.length : 0, m: Number.isInteger(p.m) ? Math.abs(p.m) % MAT_STYLES.length : 0,
    x: num(p.x, WORLD.x0, WORLD.x1, 0), z: num(p.z, WORLD.z0, WORLD.z1, 30), r: num(p.r, -100, 100, 0),
    y: num(p.y, -2, 14, 0), st, tb: p.tb === true, bt: null, say: null,
    rm: null, hr: p.hr === 1, ea: num(p.ea, 0, 1e15, 0),
    hi: typeof p.hi === "string" && (p.hi === "ramen" || PRODUCTS[p.hi]) ? p.hi : (p.hr === 1 ? "ramen" : null),
    q: num(p.q, 0, 1e15, 0), bk: Number.isInteger(p.bk) ? clamp(p.bk, -1, 30) : -1,
    ch: num(p.ch, 0, 1e15, 0), pb: null, mt: p.mt === 1, bl: num(p.bl, 0, 1e15, 0)
  };
  o.fr = p.fr === 1;
  if (p.fs && typeof p.fs === "object" && ["idle", "cast", "bite", "catch"].includes(p.fs.s) && typeof p.fs.at === "number") o.fs = { s: p.fs.s, at: p.fs.at, bx: num(p.fs.bx, WORLD.x0, WORLD.x1, 0), bz: num(p.fs.bz, -40, 1, -4), k: FISH_BY[p.fs.k] ? p.fs.k : null, cm: num(p.fs.cm, 0, 200, 0) };
  o.rd = Number.isInteger(p.rd) ? clamp(p.rd, 0, 3) : 0;
  if (p.bq && typeof p.bq === "object" && typeof p.bq.at === "number") o.bq = { at: p.bq.at, q: p.bq.q === 2 ? 2 : p.bq.q === 0 ? 0 : 1 };
  o.lt = num(p.lt, 0, 1e15, 0); o.tw = num(p.tw, 0, 1e15, 0);
  if (p.gf && typeof p.gf === "object" && (p.gf.k === "fountain" || p.gf.k === "rocket") && typeof p.gf.at === "number") o.gf = { k: p.gf.k, at: p.gf.at, x: num(p.gf.x, WORLD.x0, WORLD.x1, 0), z: num(p.gf.z, 0, WORLD.z1, 10) };
  if (p.em && typeof p.em === "object" && Number.isInteger(p.em.i) && p.em.i >= 0 && p.em.i < EMOTES.length && typeof p.em.at === "number") o.em = { i: p.em.i, at: p.em.at, s: p.em.s === -1 ? -1 : 1 };
  if (p.ph && typeof p.ph === "object" && Number.isInteger(p.ph.i) && EMOTES[p.ph.i] && EMOTES[p.ph.i].photo && typeof p.ph.at === "number") o.ph = { i: p.ph.i, at: p.ph.at, yaw: num(p.ph.yaw, -10, 10, 0) };
  if (p.pj && typeof p.pj === "object" && typeof p.pj.p === "string" && typeof p.pj.at === "number") o.pj = { p: p.pj.p.slice(0, 80), at: p.pj.at };
  if (p.dv && typeof p.dv === "object" && typeof p.dv.k === "string" && PRODUCTS[p.dv.k] && typeof p.dv.at === "number") o.dv = { k: p.dv.k, at: p.dv.at };
  if (p.pb && typeof p.pb === "object" && typeof p.pb.t === "string" && typeof p.pb.at === "number") o.pb = { t: cleanWords(p.pb.t), at: p.pb.at, x: num(p.pb.x, WORLD.x0, WORLD.x1, 0) };
  if (p.rm && typeof p.rm === "object" && Number.isInteger(p.rm.m) && p.rm.m >= 0 && p.rm.m < 3) o.rm = { m: p.rm.m, at: num(p.rm.at, 0, 1e15, 0) };
  if (p.say && typeof p.say === "object" && Number.isInteger(p.say.i) && p.say.i >= 0 && p.say.i < MACROS.length && typeof p.say.at === "number") o.say = { i: p.say.i, at: p.say.at };
  if (p.bt && typeof p.bt === "object" && Number.isInteger(p.bt.id) && p.bt.id >= 0 && p.bt.id < boats.length) o.bt = { id: p.bt.id, at: num(p.bt.at, 0, 1e15, 0) };
  if (typeof p.bx === "number" && typeof p.bz === "number") { o.bx = num(p.bx, WORLD.x0, WORLD.x1, 0); o.bz = num(p.bz, BOUND.waterZ0 - 5, 0, -5); o.br = num(p.br, -1000, 1000, 0); }
  return o;
}
function poseOf(p) { return p.st === "walk" ? "stand" : p.st === "swim" ? (p.tb ? "tube" : "swim") : p.st === "bench" ? "boat" : p.st; }
const MACROS = ["자리요", "가세요", "나와주세요", "안녕하세요", "반갑습니다", "감사합니다"];
const MAX_PEOPLE = 30;
function syncPeers(peers) {
  const live = new Set();
  for (const peer of peers) {
    if (peer.sameTab) { myPeer = peer.peer; continue; }
    if (peer.kind !== "viewer") continue;
    const p = cleanPresence(peer.presence); if (!p) continue;
    live.add(peer.peer);
    const key = [p.n, p.g, p.c, p.m].join("|"); let cur = others.get(peer.peer);
    if (!cur || cur.key !== key) {
      if (cur) scene.remove(cur.obj);
      const obj = makeAvatar({ g: p.g, c: p.c, name: p.n, matStyle: p.m });
      setAvatarState(obj, p.st, p.tb, true);
      obj.position.set(p.x, 0, p.z); scene.add(obj);
      cur = Object.assign(cur || { x: p.x, z: p.z, r: p.r }, { key, obj });
      others.set(peer.peer, cur);
    } else setAvatarState(cur.obj, p.st, p.tb);
    cur.p = p;
    const sayAt = p.say ? p.say.at : 0;
    if (cur.lastSay === undefined) cur.lastSay = sayAt;
    else if (sayAt !== cur.lastSay) { cur.lastSay = sayAt; if (p.say) { const id = peer.peer; showBubble(() => (others.get(id) || {}).obj, MACROS[p.say.i], 4, id); if (audio.ready) audio.pop(); } }
    if (!seen.has(peer.peer)) { seen.add(peer.peer); if (started) toast(p.n + "님이 한강에 왔습니다"); }
  }
  for (const [peer, o] of others) if (!live.has(peer)) { scene.remove(o.obj); others.delete(peer); seen.delete(peer); }
  evaluateBoat();
  $("count").textContent = String(others.size + (started ? 1 : 0) || 1);
  if (!started) { $("capLine").hidden = false; $("capLine").textContent = others.size >= MAX_PEOPLE ? `지금 ${MAX_PEOPLE}명이 모두 와 있어서 자리가 없습니다` : `지금 ${others.size}명이 강가에 있습니다 · 최대 ${MAX_PEOPLE}명`; }
}
(async () => {
  try {
    if (!window.claude || typeof window.claude.use !== "function") return;
    room = await window.claude.use("room"); if (!room) return;
    room.onPeers(ch => syncPeers(ch.peers), () => { room = null; });
  } catch (e) { room = null; }
})();
let lastPub = 0, lastPubKey = "", mySay = null;
function presenceObj() {
  const o = { n: me.name, g: me.g, c: me.c, m: me.m, x: +me.x.toFixed(2), z: +me.z.toFixed(2), y: +me.y.toFixed(2), r: +me.r.toFixed(2), st: me.st, tb: me.tube, bt: me.bt ? { id: me.bt.id, at: me.bt.at } : null, say: mySay, rm: me.rm, hr: me.hold ? 1 : 0, hi: me.hold || null, ea: me.eat || 0, q: me.q || 0, bk: me.basket ? me.basket.length : -1, ch: me.ch || 0, pb: me.pb || null, mt: me.mat ? 1 : 0, bl: me.bl || 0, dv: me.dv ? { k: me.dv.k, at: me.dv.at } : null, em: me.em || null, lt: me.lit || 0, tw: me.tw || 0, gf: me.gf || null, ph: me.ph || null, pj: me.pj || null, rd: redness(), bq: me.bq || null, fr: me.rod ? 1 : 0, fs: me.fs || null };
  if (boarded && boarded.driver) { o.bx = +boatLocal.x.toFixed(2); o.bz = +boatLocal.z.toFixed(2); o.br = +boatLocal.r.toFixed(2); }
  else { o.bx = null; o.bz = null; o.br = null; }
  return o;
}
function publish(force) {
  if (!room || !started) return;
  const now = performance.now(); if (!force && now - lastPub < 110) return;
  const o = presenceObj(), key = JSON.stringify(o); if (!force && key === lastPubKey) return;
  lastPub = now; lastPubKey = key; room.presence(o).catch(() => {});
}

