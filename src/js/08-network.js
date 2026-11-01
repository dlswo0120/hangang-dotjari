/* ================= room / peers ================= */
let room = null, myPeer = null;
const others = new Map(); // peer -> {p, key, obj, x, z, r}
const seen = new Set();
const num = (v, lo, hi, d) => (typeof v === "number" && isFinite(v) ? clamp(v, lo, hi) : d);
function cleanPresence(p) {
  if (!p || typeof p !== "object" || typeof p.n !== "string") return null;
  const st = ["walk", "sit", "lie", "swim", "boat", "bench", "stool"].includes(p.st) ? p.st : "walk";
  const o = {
    n: p.n.replace(/[\u0000-\u001f\u200b-\u200f\u202a-\u202e]/g, "").slice(0, 10) || "손님",
    g: p.g === "f" ? "f" : "m", c: Number.isInteger(p.c) ? Math.abs(p.c) % SHIRTS.length : 0, m: Number.isInteger(p.m) ? Math.abs(p.m) % MAT_STYLES.length : 0,
    x: num(p.x, WORLD.x0, WORLD.x1, 0), z: num(p.z, WORLD.z0, WORLD.z1, 30), r: num(p.r, -100, 100, 0),
    y: num(p.y, -2, 14, 0), st, tb: p.tb === true, bt: null, say: null,
    rm: null, hr: p.hr === 1, ea: num(p.ea, 0, 1e15, 0),
    hi: typeof p.hi === "string" && (p.hi === "ramen" || PRODUCTS[p.hi]) ? p.hi : (p.hr === 1 ? "ramen" : null),
    q: num(p.q, 0, 1e15, 0), bk: Number.isInteger(p.bk) ? clamp(p.bk, -1, 30) : -1
  };
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
  const o = { n: me.name, g: me.g, c: me.c, m: me.m, x: +me.x.toFixed(2), z: +me.z.toFixed(2), y: +me.y.toFixed(2), r: +me.r.toFixed(2), st: me.st, tb: me.tube, bt: me.bt ? { id: me.bt.id, at: me.bt.at } : null, say: mySay, rm: me.rm, hr: me.hold ? 1 : 0, hi: me.hold || null, ea: me.eat || 0, q: me.q || 0, bk: me.basket ? me.basket.length : -1 };
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

