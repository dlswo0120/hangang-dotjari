/* ================= 한강 편의점: building, shelves, clerk ================= */
// STORE is declared in 02-world.js so grass tufts can stay out of the building.
// Interior layout uses local coordinates (lx, lz) around STORE.x / STORE.z; the door faces the walking path (+z).
// fixture boxes in local coordinates, also used for "what am I standing next to"
const FIX = {
  gondolaA: { x0: -4.2, x1: 1.0, z0: -1.0, z1: -0.2 },
  gondolaB: { x0: -4.2, x1: 1.0, z0: -2.9, z1: -2.1 },
  fridge: { x0: -5.8, x1: 2.0, z0: -4.4, z1: -3.7 },
  freezer: { x0: 3.2, x1: 5.2, z0: -3.6, z1: -2.6 },
  counter: { x0: 0.9, x1: 5.8, z0: 2.2, z1: 2.9 },
  counterSide: { x0: 0.9, x1: 1.3, z0: 2.9, z1: 4.4 },
  hotcase: { x0: 4.5, x1: 5.6, z0: 2.2, z1: 2.9 },
  basket: { x: -5.3, z: 3.6 }
};
const STORE_DOOR = { lx: -3.5, half: 1.1 };
const storeObj = { doorL: null, doorR: null, clerk: null, open: 0 };
function makeBasket() {
  const g = new THREE.Group(), red = mat(0xd8322f), wall = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), red); m.position.set(x, y, z); m.castShadow = true; g.add(m); };
  wall(.34, .02, .22, 0, -.1, 0); wall(.34, .14, .015, 0, -.03, .11); wall(.34, .14, .015, 0, -.03, -.11); wall(.015, .14, .22, .17, -.03, 0); wall(.015, .14, .22, -.17, -.03, 0);
  const h = new THREE.Mesh(new THREE.TorusGeometry(.12, .012, 6, 16, Math.PI), red); h.position.y = .04; g.add(h);
  const items = new THREE.Group(); g.add(items); g.userData.items = items; g.userData.count = -1;
  return g;
}
function setBasketCount(b, n) {
  if (b.userData.count === n) return; b.userData.count = n;
  const it = b.userData.items; while (it.children.length) it.remove(it.children[0]);
  const cols = [0xf2c230, 0x4fbf6a, 0xe94d8a, 0x7cc4ef, 0xe8613c, 0xf6dc5c];
  for (let i = 0; i < Math.min(n, 6); i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(.09, .09 + (i % 3) * .03, .07), mat(cols[i % cols.length])); m.position.set(-.1 + (i % 3) * .1, -.03 + Math.floor(i / 3) * .05, (i % 2 ? .04 : -.04)); it.add(m); }
}
// what someone holds while eating: the ramen bowl, or a snack from the store
function makeHeld(kind) {
  if (kind === "ramen") return makeBowl();
  if (kind === "sparkler") { // a wire stick; the glowing tip lights up while it burns
    const g = new THREE.Group(), wire = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .46, 5), mat(0x9aa0a8)); wire.position.y = .25; g.add(wire);
    const coat = new THREE.Mesh(new THREE.CylinderGeometry(.013, .013, .2, 6), mat(0x55585e)); coat.position.y = .36; g.add(coat);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), new THREE.MeshBasicMaterial({ color: 0xfff1b0 })); tip.position.y = .47; tip.visible = false; g.add(tip);
    g.userData.tip = tip; return g;
  }
  const P = PRODUCTS[kind] || PRODUCTS.chips, g = new THREE.Group(), col = new THREE.Color(P.color);
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  const art = new THREE.MeshLambertMaterial({ map: PRODUCT_TEX[kind] }), side = mat(col);
  if (P.cat === "snack") { const b = add(new THREE.BoxGeometry(.16, .2, .05), [side, side, side, side, art, art], 0, .12, 0); b.rotation.y = Math.PI; }
  else if (P.cat === "drink") {
    if (kind === "banana") { const b = add(new THREE.BoxGeometry(.1, .14, .1), [art, art, side, side, art, art], 0, .09, 0); b.rotation.y = Math.PI; add(new THREE.CylinderGeometry(.015, .015, .04, 8), mat(0xffffff), .02, .18, 0); }
    else { const c = add(new THREE.CylinderGeometry(.045, .045, .18, 16), [art, side, side], 0, .1, 0); c.rotation.y = Math.PI / 2; add(new THREE.CylinderGeometry(.02, .02, .03, 8), mat(kind === "coffee" ? 0xd8d8d8 : 0x2f6fd8), 0, .205, 0); }
  } else if (P.cat === "ice") {
    if (kind === "cone") { const c = add(new THREE.ConeGeometry(.055, .16, 12), mat(0xd9a35e), 0, .1, 0); c.rotation.x = Math.PI; add(new THREE.SphereGeometry(.065, 12, 8), mat(0xfff4f8), 0, .2, 0); add(new THREE.SphereGeometry(.02, 8, 6), mat(0xe94d8a), .03, .25, -.02); }
    else if (kind === "mochi") { add(new THREE.SphereGeometry(.06, 12, 8), mat(0xffffff), -.04, .12, 0); add(new THREE.SphereGeometry(.06, 12, 8), mat(0xffffff), .04, .12, 0); }
    else { add(new THREE.BoxGeometry(.07, .15, .03), mat(0xd9f3ff), 0, .16, 0); add(new THREE.BoxGeometry(.015, .08, .01), mat(0xe6cfa3), 0, .05, 0); }
  } else {
    add(new THREE.CylinderGeometry(.11, .085, .14, 16, 1, true), mat(0xffffff, { side: THREE.DoubleSide }), 0, .08, 0);
    add(new THREE.CylinderGeometry(.112, .112, .03, 16, 1, true), mat(0xd8322f, { side: THREE.DoubleSide }), 0, .12, 0);
    for (let i = 0; i < 6; i++) add(new THREE.SphereGeometry(.035, 8, 6), mat(col), Math.cos(i) * .05, .15 + (i % 2) * .02, Math.sin(i) * .05);
  }
  return g;
}
{
  const S = STORE, G = new THREE.Group(); G.position.set(S.x, 0, S.z); scene.add(G);
  const add = (geo, m, x, y, z, parent = G) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); parent.add(o); return o; };
  const box = (w, h, d, m, x, y, z, parent) => add(new THREE.BoxGeometry(w, h, d), m, x, y, z, parent);
  const lit = (c, map) => new THREE.MeshLambertMaterial({ color: c, map: map || null, emissive: 0xffffff, emissiveIntensity: .18, emissiveMap: map || null });
  // floor, walls, roof
  const tileTex = canvasTex(128, 128, (x, w, h) => { x.fillStyle = "#f4f4f1"; x.fillRect(0, 0, w, h); x.strokeStyle = "#d6d6d0"; x.lineWidth = 4; x.strokeRect(0, 0, w, h); for (let i = 0; i < 80; i++) { x.fillStyle = "rgba(190,190,185,.25)"; x.fillRect(R() * w, R() * h, 2, 2); } }, 12, 9);
  const floor = add(new THREE.PlaneGeometry(S.hw * 2, S.hd * 2), lit(0xffffff, tileTex), 0, .03, 0); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  const wallM = mat(0xf1efe9), trimM = mat(0x1f6f63);
  box(12, 3.2, .2, wallM, 0, 1.6, -4.5); box(.2, 3.2, 9, wallM, -6, 1.6, 0); box(.2, 3.2, 9, wallM, 6, 1.6, 0);
  box(5, 3.2, .2, wallM, 3.5, 1.6, 4.5);
  const glassM = new THREE.MeshPhongMaterial({ color: 0xcfe8f0, transparent: true, opacity: .22, shininess: 90, depthWrite: false, side: THREE.DoubleSide });
  add(new THREE.PlaneGeometry(1.4, 2.55), glassM, -5.3, 1.3, 4.5); add(new THREE.PlaneGeometry(3.4, 2.55), glassM, -.7, 1.3, 4.5);
  box(2.2, .6, .2, wallM, STORE_DOOR.lx, 2.9, 4.5);
  [-6, -4.6, -2.4, 1.0].forEach(x => box(.08, 2.6, .12, trimM, x, 1.3, 4.52)); box(7, .08, .12, trimM, -2.5, 2.6, 4.52); box(7, .1, .14, trimM, -2.5, .05, 4.52);
  const doorM = new THREE.MeshPhongMaterial({ color: 0xd8f0f6, transparent: true, opacity: .3, depthWrite: false, side: THREE.DoubleSide });
  const mkDoor = () => { const d = new THREE.Group(); add(new THREE.PlaneGeometry(1.1, 2.5), doorM, 0, 1.27, 0, d); box(1.1, .06, .06, trimM, 0, 2.5, 0, d); box(.06, 2.5, .06, trimM, .52, 1.27, 0, d); box(.06, 2.5, .06, trimM, -.52, 1.27, 0, d); G.add(d); d.position.set(0, 0, 4.58); return d; };
  storeObj.doorL = mkDoor(); storeObj.doorR = mkDoor();
  const roof = box(12.6, .25, 9.6, mat(0xdcdad4), 0, 3.32, 0); roof.receiveShadow = false;
  const ceil = add(new THREE.PlaneGeometry(12, 9), lit(0xfafaf8), 0, 3.18, 0); ceil.rotation.x = Math.PI / 2;
  const panelM = new THREE.MeshBasicMaterial({ color: 0xffffff });
  [[-3.5, -2], [-3.5, 1.5], [1, -2], [1, 1.5], [4, -1]].forEach(([x, z]) => { const p = add(new THREE.PlaneGeometry(1.4, .4), panelM, x, 3.16, z); p.rotation.x = Math.PI / 2; });
  // sign band across the front, our own colours
  const signTex = canvasTex(1024, 64, (x, w, h) => {
    x.fillStyle = "#1fae96"; x.fillRect(0, 0, w, h); x.fillStyle = "#ff7a59"; x.fillRect(0, h - 12, w, 12); x.fillStyle = "#ffd25e"; x.fillRect(0, h - 16, w, 4);
    x.fillStyle = "#ffffff"; x.font = "bold 40px 'Gowun Dodum', sans-serif"; x.textBaseline = "middle"; x.textAlign = "left"; x.fillText("한강 편의점", 330, 27);
    x.beginPath(); x.arc(880, 27, 22, 0, 7); x.fill(); x.fillStyle = "#1fae96"; x.font = "bold 20px 'Gowun Dodum', sans-serif"; x.textAlign = "center"; x.fillText("24시", 880, 28);
  }, 1, 1);
  const bandM = mat(0x1fae96);
  box(12.6, .7, .26, [bandM, bandM, bandM, bandM, lit(0xffffff, signTex), bandM], 0, 3.0, 4.88);
  const sideTex = canvasTex(256, 64, (x, w, h) => { x.fillStyle = "#1fae96"; x.fillRect(0, 0, w, h); x.fillStyle = "#fff"; x.font = "bold 30px 'Gowun Dodum', sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("한강 편의점", w / 2, h / 2 - 3); x.fillStyle = "#ff7a59"; x.fillRect(0, h - 8, w, 8); }, 1, 1);
  const side = add(new THREE.PlaneGeometry(2.6, .65), lit(0xffffff, sideTex), 6.12, 2.75, 3.2); side.rotation.y = Math.PI / 2;
  // shelves packed with colourful packages
  const shelfTex = (seed, rows) => canvasTex(512, 256, (x, w, h) => {
    const rr = rand(seed); x.fillStyle = "#e9ecef"; x.fillRect(0, 0, w, h);
    const rh = h / rows;
    for (let r = 0; r < rows; r++) {
      let px = 4; while (px < w - 10) { const pw = 18 + rr() * 26, ph = rh * (.5 + rr() * .35); x.fillStyle = `hsl(${rr() * 360 | 0},${60 + rr() * 30 | 0}%,${45 + rr() * 20 | 0}%)`; x.fillRect(px, r * rh + rh - 8 - ph, pw, ph); x.fillStyle = "rgba(255,255,255,.35)"; x.fillRect(px + 3, r * rh + rh - 6 - ph, pw - 6, 4); px += pw + 3; }
      x.fillStyle = "#ffe066"; x.fillRect(0, r * rh + rh - 8, w, 6); x.fillStyle = "#c9ced4"; x.fillRect(0, r * rh + rh - 2, w, 2);
    }
  }, 1, 1);
  const gondolaM = mat(0xf7f7f5);
  [["gondolaA", 11], ["gondolaB", 23]].forEach(([k, seed]) => {
    const f = FIX[k], w = f.x1 - f.x0, d = f.z1 - f.z0, cx = (f.x0 + f.x1) / 2, cz = (f.z0 + f.z1) / 2;
    box(w, 1.45, d, gondolaM, cx, .725, cz);
    [1, -1].forEach(sd => { const p = add(new THREE.PlaneGeometry(w - .1, 1.3), lit(0xffffff, packShelf(CATS.snack.items, 1024, 256, 4, seed + sd, { tags: true })), cx, .75, cz + sd * (d / 2 + .005)); if (sd < 0) p.rotation.y = Math.PI; });
    const head = add(new THREE.PlaneGeometry(1.4, .3), lit(0xffffff, canvasTex(256, 56, (x, w2, h2) => { x.fillStyle = "#ff7a59"; x.fillRect(0, 0, w2, h2); x.fillStyle = "#fff"; x.font = "bold 30px 'Gowun Dodum', sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("과자 · 스낵", w2 / 2, h2 / 2); }, 1, 1)), cx, 1.75, cz + d / 2 + .01);
  });
  // drink fridges along the back wall
  const fridgeTex = canvasTex(1024, 256, (x, w, h) => {
    const rr = rand(77); x.fillStyle = "#1d2228"; x.fillRect(0, 0, w, h);
    for (let r = 0; r < 4; r++) for (let px = 10; px < w - 20; px += 22) { const c = ["#7cc4ef", "#f6dc5c", "#4fbf6a", "#6b4a3a", "#e8613c", "#f7f7f7"][rr() * 6 | 0]; x.fillStyle = c; x.fillRect(px, 20 + r * 60, 14, 40); x.fillRect(px + 4, 12 + r * 60, 6, 8); }
    x.strokeStyle = "#8a959f"; x.lineWidth = 6; for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(i * w / 8, 0); x.lineTo(i * w / 8, h); x.stroke(); } x.strokeRect(0, 0, w, h);
  }, 1, 1);
  { const f = FIX.fridge, w = f.x1 - f.x0, cx = (f.x0 + f.x1) / 2, cz = (f.z0 + f.z1) / 2;
    box(w, 2.2, f.z1 - f.z0, mat(0x3a4048), cx, 1.1, cz);
    add(new THREE.PlaneGeometry(w - .1, 1.9), lit(0xffffff, packShelf(CATS.drink.items, 1536, 384, 5, 77, { bg: "#1d2228", rail: "#8a959f", frames: 8, tags: true })), cx, 1.1, f.z1 + .005);
    add(new THREE.PlaneGeometry(1.6, .32), lit(0xffffff, canvasTex(256, 52, (x, w2, h2) => { x.fillStyle = "#2f7fd8"; x.fillRect(0, 0, w2, h2); x.fillStyle = "#fff"; x.font = "bold 30px 'Gowun Dodum', sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("시원한 음료", w2 / 2, h2 / 2); }, 1, 1)), cx, 2.5, f.z1 - .3); }
  // ice cream chest freezer
  { const f = FIX.freezer, w = f.x1 - f.x0, d = f.z1 - f.z0, cx = (f.x0 + f.x1) / 2, cz = (f.z0 + f.z1) / 2;
    box(w, .85, d, mat(0xffffff), cx, .425, cz);
    const top = add(new THREE.PlaneGeometry(w - .12, d - .12), lit(0xffffff, packShelf(CATS.ice.items, 512, 256, 2, 5, { bg: "#cfe8f6", rail: "#b9dcef" })), cx, .86, cz); top.rotation.x = -Math.PI / 2;
    const sign = add(new THREE.PlaneGeometry(1.5, .32), lit(0xffffff, canvasTex(256, 52, (x, w2, h2) => { x.fillStyle = "#ff8fb1"; x.fillRect(0, 0, w2, h2); x.fillStyle = "#fff"; x.font = "bold 30px 'Gowun Dodum', sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("아이스크림", w2 / 2, h2 / 2); }, 1, 1)), cx, 1.9, -4.38); }
  // counter, POS, hot case, shelf behind the clerk
  { const c = FIX.counter, cs = FIX.counterSide;
    box(c.x1 - c.x0, .95, c.z1 - c.z0, mat(0xe4ddd0), (c.x0 + c.x1) / 2, .475, (c.z0 + c.z1) / 2);
    box(c.x1 - c.x0 + .06, .05, c.z1 - c.z0 + .06, mat(0x2a9d8f), (c.x0 + c.x1) / 2, .97, (c.z0 + c.z1) / 2);
    box(cs.x1 - cs.x0, .95, cs.z1 - cs.z0, mat(0xe4ddd0), (cs.x0 + cs.x1) / 2, .475, (cs.z0 + cs.z1) / 2);
    const pos = box(.42, .3, .06, mat(0x22262b), 3.1, 1.25, 2.75); pos.rotation.x = -.35;
    add(new THREE.PlaneGeometry(.36, .24), new THREE.MeshBasicMaterial({ color: 0x7fd3ff }), 3.1, 1.25, 2.715).rotation.set(-.35, Math.PI, 0);
    box(.18, .05, .12, mat(0x22262b), 2.5, 1.02, 2.45);
    const hc = FIX.hotcase, hcx = (hc.x0 + hc.x1) / 2, hcz = (hc.z0 + hc.z1) / 2;
    box(hc.x1 - hc.x0, .5, .5, new THREE.MeshPhongMaterial({ color: 0xffd8a0, transparent: true, opacity: .35, depthWrite: false }), hcx, 1.25, hcz);
    [["gangjeong", -.25], ["chicken", .25]].forEach(([k, ox]) => { const pic = add(new THREE.PlaneGeometry(.26, .32), lit(0xffffff, PRODUCT_TEX[k]), hcx + ox, 1.2, hcz + .05); pic.rotation.y = Math.PI; });
    for (let i = 0; i < 8; i++) { const ch = add(new THREE.SphereGeometry(.07, 8, 6), new THREE.MeshLambertMaterial({ color: 0xc4632a, emissive: 0x7a2e08, emissiveIntensity: .5 }), hcx - .35 + (i % 4) * .23, 1.06, hcz - .1 + Math.floor(i / 4) * .2); ch.scale.y = .7; }
    add(new THREE.PlaneGeometry(.9, .18), lit(0xffffff, canvasTex(192, 40, (x, w2, h2) => { x.fillStyle = "#d8322f"; x.fillRect(0, 0, w2, h2); x.fillStyle = "#fff"; x.font = "bold 24px 'Gowun Dodum', sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("따끈한 치킨", w2 / 2, h2 / 2); }, 1, 1)), hcx, 1.6, hc.z0 - .01).rotation.y = Math.PI;
    box(4.8, 2.2, .32, mat(0xf7f7f5), 3.5, 1.4, 4.24);
    add(new THREE.PlaneGeometry(4.6, 2.0), lit(0xffffff, cigWall()), 3.5, 1.4, 4.075).rotation.y = Math.PI;
  }
  // stack of red baskets by the door
  for (let i = 0; i < 4; i++) { const b = makeBasket(); b.position.set(FIX.basket.x, .12 + i * .06, FIX.basket.z); b.children.forEach(m => m.castShadow = false); G.add(b); }
  // a parasol table outside
  { const t = new THREE.Group(), pole = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 2.4, 8), mat(0xeeeeee)); pole.position.y = 1.2; t.add(pole);
    const um = new THREE.Mesh(new THREE.ConeGeometry(1.3, .45, 12, 1, true), mat(0x1fae96, { side: THREE.DoubleSide })); um.position.y = 2.35; t.add(um);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .04, 20), mat(0xf4f4f4)); top.position.y = .55; t.add(top);
    t.traverse(m => { if (m.isMesh) m.castShadow = true; }); t.position.set(S.x + 4.5, 0, S.z + 6.2); scene.add(t);
    OBST.push({ x: S.x + 4.5, z: S.z + 6.2, r: .5 }); }
  // the clerk: blue vest, mask and glasses, scanner in hand
  const clerk = makeAvatar({ g: "m", c: 1, name: "점원" }); setAvatarState(clerk, "walk", false, true);
  const u = clerk.userData;
  add(new THREE.SphereGeometry(1, 14, 10), mat(0xf4f6f8), 0, -.16, -.3, u.head).scale.set(.2, .13, .14);
  [-1, 1].forEach(k => { const r = add(new THREE.TorusGeometry(.065, .012, 6, 16), mat(0x222222), k * .15, -.03, -.43, u.head); });
  add(new THREE.BoxGeometry(.06, .12, .1), mat(0x3a3d42), 0, -.33, -.06, u.arms[1]);
  clerk.position.set(S.x + 3.1, 0, S.z + 3.55); scene.add(clerk); storeObj.clerk = clerk;
  G.traverse(m => { if (m.isMesh && m.castShadow === false && m.geometry && m.geometry.type === "BoxGeometry") m.receiveShadow = true; });
  // walls and fixtures block walking (world coordinates)
  const wb = (x0, x1, z0, z1) => OBST.push({ x0: S.x + x0, x1: S.x + x1, z0: S.z + z0, z1: S.z + z1 });
  wb(-6.1, 6.1, -4.6, -4.4); wb(-6.1, -5.9, -4.6, 4.6); wb(5.9, 6.1, -4.6, 4.6);
  wb(-6.1, STORE_DOOR.lx - STORE_DOOR.half, 4.4, 4.6); wb(STORE_DOOR.lx + STORE_DOOR.half, 6.1, 4.4, 4.6);
  ["gondolaA", "gondolaB", "fridge", "freezer", "counter", "counterSide"].forEach(k => { const f = FIX[k]; wb(f.x0, f.x1, f.z0, f.z1); });
  wb(1.1, 5.9, 3.9, 4.4);
  OBST.push({ x: S.x + FIX.basket.x, z: S.z + FIX.basket.z, r: .25 });
}
