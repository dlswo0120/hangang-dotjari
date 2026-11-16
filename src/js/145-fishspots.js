/* ================= 낚시 자리 늘리기: 징검다리 바위 · 2층 선상 낚시터 · 강태공 미끼 가게 ================= */
// Spots: where fishing is allowed, how far a cast reaches, and where the water starts in front.
const ROCK = { x: 150, z: -7, r: 2.4, cap: 3, stones: [[150, -.2], [150.4, -1.6], [149.7, -3], [150.2, -4.3]] }; // each overlaps the next a little: walk straight and you stay dry
const RANGE = { x0: 168, x1: 196, z0: -6.3, z1: -2, walk: [180.5, 183.5], y2: 3.4, bays: 7 };
RANGE.lift = { x: RANGE.x0 - 1.35, z: (RANGE.z0 + RANGE.z1) / 2 + .3 }; // 건물 왼쪽 옆면에 붙은 엘리베이터
const SPOT_DEFS = [
  { id: "deck", name: "낚시 데크", reach: 1, edge: FISH_DECK.z0, test: (x, z, lv) => lv !== "loft" && onFishDeck(x, z) },
  { id: "rock", name: "바위 포인트", reach: 1.1, edge: ROCK.z - ROCK.r, test: (x, z, lv) => lv !== "loft" && onRock(x, z) },
  { id: "range1", name: "선상 낚시터 1층", reach: 1.1, edge: RANGE.z0, test: (x, z, lv) => lv !== "loft" && x > RANGE.x0 && x < RANGE.x1 && z > RANGE.z0 - .1 && z < RANGE.z1 + .1 },
  { id: "range2", name: "선상 낚시터 2층", reach: 1.45, edge: RANGE.z0, test: (x, z, lv) => lv === "loft" }
];
function fishSpot(x, z, lv) { for (const s of SPOT_DEFS) if (s.test(x, z, lv || me.level)) return s; return null; }
const onRock = (x, z) => Math.hypot(x - ROCK.x, z - ROCK.z) < ROCK.r;
// stepping stones: the whole line from the bank, over every stone, to the rock is walkable (a 1m-wide path), not just each stone's circle
const STONE_PATH = [[150, BOUND.landZ0 + .6], ...ROCK.stones, [ROCK.x, ROCK.z]];
function stoneNearest(x, z) { // closest point on the stepping-stone line, and how far away it is
  let best = null;
  for (let i = 0; i < STONE_PATH.length - 1; i++) {
    const [ax, az] = STONE_PATH[i], [bx, bz] = STONE_PATH[i + 1], dx = bx - ax, dz = bz - az;
    const k = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1), px = ax + dx * k, pz = az + dz * k, d = Math.hypot(x - px, z - pz);
    if (!best || d < best.d) best = { x: px, z: pz, d };
  }
  return best;
}
const onStone = (x, z) => stoneNearest(x, z).d < 1;
// pull a step back inside the path: walking at an angle you glide along the stones instead of stopping or falling
function stoneClamp(x, z) { const n = stoneNearest(x, z); if (n.d < .95) return [x, z]; const k = .95 / n.d; return [n.x + (x - n.x) * k, n.z + (z - n.z) * k]; }
// the ground floor of the fishing range (and the boardwalk out to it) is walkable like the deck
const onRange1 = (x, z) => (x > RANGE.x0 && x < RANGE.x1 && z > RANGE.z0 && z < RANGE.z1) || (x > RANGE.walk[0] && x < RANGE.walk[1] && z >= RANGE.z1 - .1 && z < BOUND.landZ0 + .1);
const onWaterFloor = (x, z) => onRock(x, z) || onStone(x, z) || onRange1(x, z);
// the rock holds three anglers at most
function rockFull() { let n = 0; for (const o of others.values()) if (o.p.lv !== "loft" && onRock(o.x, o.z)) n++; return n >= ROCK.cap; }
// upstairs: walk anywhere on the upper floor
function loftStep(nx, nz) { return [clamp(nx, RANGE.x0 + .3, RANGE.x1 - .3), clamp(nz, RANGE.z0 + .2, RANGE.z1 - .6)]; }

/* ---------- the rock and its stepping stones ---------- */
{
  const stoneM = mat(0x6c7078), rockM = mat(0x5f646b), moss = mat(0x5a8a4a);
  ROCK.stones.forEach(([x, z], i) => { const s = new THREE.Mesh(new THREE.CylinderGeometry(.62, .75, .7, 10), stoneM); s.position.set(x, -.3, z); s.rotation.y = i; s.scale.set(1, 1, .85); s.castShadow = s.receiveShadow = true; scene.add(s); });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), rockM); body.scale.set(ROCK.r + .5, 1.1, ROCK.r + .3); body.position.set(ROCK.x, -1.05, ROCK.z); body.castShadow = body.receiveShadow = true; scene.add(body);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(ROCK.r - .1, ROCK.r + .2, .12, 9), mat(0x6e737a)); top.position.set(ROCK.x, -.04, ROCK.z); top.rotation.y = .3; top.receiveShadow = true; scene.add(top);
  // rough boulders around the rim (mostly on the river side, so the way in stays open)
  [[2.3, 0, .55], [1.7, -1.6, .7], [0, -2.5, .8], [-1.8, -1.5, .65], [-2.4, .4, .45], [2.1, 1.3, .35], [-1.6, 1.6, .3]].forEach(([dx, dz, h], i) => {
    const b = new THREE.Mesh(new THREE.DodecahedronGeometry(.7, 0), rockM); b.scale.set(1.1, h * 1.4, .9); b.rotation.set(i, i * 2, 0); b.position.set(ROCK.x + dx, h * .35 - .1, ROCK.z + dz); b.castShadow = b.receiveShadow = true; scene.add(b);
  });
  [[-1, .3], [.8, -.9], [1.2, 1]].forEach(([dx, dz]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.45, 8, 6), moss); m.scale.set(1.3, .25, .9); m.position.set(ROCK.x + dx, .03, ROCK.z + dz); scene.add(m); });
  const post = new THREE.Mesh(new THREE.BoxGeometry(.08, 1.2, .08), mat(0x6b4f35)); post.position.set(ROCK.x - 2.2, .6, 1.4); scene.add(post);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.9, .7), signMat(signTex([["징검다리 바위 포인트", 34, .38], ["최대 3명 · 바위 전용 꺽지 · 발 조심!", 22, .78]], "#2f6fb0", "#ffffff", 512, 190)));
  sign.position.set(ROCK.x - 2.2, 1.45, 1.44); scene.add(sign); const s2 = sign.clone(); s2.rotation.y = Math.PI; s2.position.z = 1.36; scene.add(s2);
}

/* ---------- the floating fishing range: two floors of numbered bays under a long canopy ---------- */
{
  const R = RANGE, W = R.x1 - R.x0, D = R.z1 - R.z0, cx = (R.x0 + R.x1) / 2, cz = (R.z0 + R.z1) / 2;
  const wood = mat(0x9a7350), dark = mat(0x5b4430), steel = mat(0xe9ece8), green = mat(0x3f9a54), wall = new THREE.MeshLambertMaterial({ color: 0xcfeaf6, transparent: true, opacity: .28, depthWrite: false }), rail = mat(0xf2f2ee);
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; scene.add(o); return o; };
  // piles in the water
  for (let i = 0; i <= R.bays; i++) [R.z0 + .2, R.z1 - .2].forEach(z => add(new THREE.CylinderGeometry(.18, .2, 2, 8), dark, R.x0 + i * W / R.bays, -.9, z));
  // ground floor and the boardwalk to the bank
  add(new THREE.BoxGeometry(W, .3, D), wood, cx, -.15, cz);
  add(new THREE.BoxGeometry(R.walk[1] - R.walk[0], .3, BOUND.landZ0 - R.z1 + .4), wood, (R.walk[0] + R.walk[1]) / 2, -.15, (R.z1 + BOUND.landZ0) / 2);
  // the upper floor slab, back wall with windows, and the long canopy roof (sloping down toward the river)
  add(new THREE.BoxGeometry(W, .3, D + .4), mat(0xbfc3be), cx, R.y2 - .15, cz - .2);
  // 1층 뒷벽은 입구 자리를 크게 뚫음 (나무 다리가 닿는 곳): 왼쪽 벽 · 입구 위 벽 · 오른쪽 벽
  const gx0 = R.walk[0] - .9, gx1 = R.walk[1] + .9, gh = R.y2 - .2, doorH = 2.5;
  const backs = [
    add(new THREE.BoxGeometry(gx0 - R.x0, gh, .15), wall, (R.x0 + gx0) / 2, gh / 2, R.z1 + .1),
    add(new THREE.BoxGeometry(R.x1 - gx1, gh, .15), wall, (gx1 + R.x1) / 2, gh / 2, R.z1 + .1),
    add(new THREE.BoxGeometry(gx1 - gx0, gh - doorH, .15), wall, (gx0 + gx1) / 2, doorH + (gh - doorH) / 2, R.z1 + .1),
    add(new THREE.BoxGeometry(W, 3.2, .15), wall, cx, R.y2 + 1.6, R.z1 + .1)
  ];
  backs.forEach(m => { m.castShadow = false; }); // 통유리: 그림자 없이 비쳐 보임
  // 유리 사이 얇은 창틀(기둥 칸마다 세로, 층마다 가로)
  for (let i = 0; i <= R.bays; i++) { const x = R.x0 + i * W / R.bays; if (x > gx0 - .1 && x < gx1 + .1) continue; backs.push(add(new THREE.BoxGeometry(.08, R.y2 + 3.2, .2), steel, x, (R.y2 + 3.2) / 2, R.z1 + .1)); }
  [R.y2, R.y2 + 3.2].forEach(y => backs.push(add(new THREE.BoxGeometry(W, .08, .2), steel, cx, y, R.z1 + .1)));
  // 입구: 초록 문틀 + 위에 "입구" 간판 + 바닥 매트 (강가에서 보면 바로 들어가는 곳이 보임)
  const frame = mat(0x1f5f3a);
  [gx0, gx1].forEach(x => backs.push(add(new THREE.BoxGeometry(.22, doorH + .15, .32), frame, x, (doorH + .15) / 2, R.z1 + .12)));
  backs.push(add(new THREE.BoxGeometry(gx1 - gx0 + .22, .22, .32), frame, (gx0 + gx1) / 2, doorH + .1, R.z1 + .12));
  const door = add(new THREE.PlaneGeometry(gx1 - gx0 - .3, .5), signMat(signTex([["🎣 입구 · 어서 오세요", 44, .56]], "#1f5f3a", "#ffffff", 640, 72)), (gx0 + gx1) / 2, doorH + .5, R.z1 + .3); door.castShadow = false; backs.push(door);
  add(new THREE.BoxGeometry(gx1 - gx0 - .4, .02, 1.2), mat(0x2f6fb0), (gx0 + gx1) / 2, .02, R.z1 + .7);
  // posters on the back wall, facing the bank: you can tell what the building is from the path
  const poster = (lines, bg, fg, w, h, tw, th, y) => { const p = add(new THREE.PlaneGeometry(w, h), signMat(signTex(lines, bg, fg, tw, th)), cx, y, R.z1 + .19); p.castShadow = false; backs.push(p); return p; };
  poster([["🎣 한강 선상 낚시터", 66, .56]], "#1f5f3a", "#ffffff", 13, 1.05, 1024, 84, R.y2 + 2.72);
  poster([["낚시 전용 공간 · 2층은 왼쪽 옆 엘리베이터로 · 2층은 더 멀리 던져요", 34, .55]], "#f6efdf", "#2a2a2e", 15, .6, 1280, 52, R.y2 - .65);
  RANGE.backs = backs;
  [[R.y2 - .45, 1.2]].forEach(([y, over]) => { // 1층 앞 차양만 (2층은 지붕 없이 하늘이 열린 낚시터)
    const c = add(new THREE.BoxGeometry(W + .6, .12, D + over), steel, cx, y, cz - over / 2); c.rotation.x = -.08;
    for (let i = 0; i <= R.bays * 2; i++) add(new THREE.BoxGeometry(.08, .1, D + over), mat(0xc8ccc6), R.x0 + i * W / (R.bays * 2), y - .1, cz - over / 2).rotation.x = -.08;
    add(new THREE.BoxGeometry(W + .6, .08, .08), mat(0xfff1c0), cx, y - .18, R.z0 - over + .25); // a light strip under the lip
  });
  // bays: pillars, green mats, stools, bay numbers, railings on both floors
  const numTex = n => signTex([[String(n), 70, .55]], "#2f6fb0", "#ffffff", 128, 128);
  for (let f = 0; f < 2; f++) {
    const y = f ? R.y2 : 0;
    for (let i = 0; i <= R.bays; i++) add(new THREE.BoxGeometry(.18, f ? 3.2 : R.y2 - .3, .18), steel, R.x0 + i * W / R.bays, y + (f ? 1.6 : (R.y2 - .3) / 2), R.z0 + .15);
    for (let i = 0; i < R.bays; i++) {
      const x = R.x0 + (i + .5) * W / R.bays;
      {
        add(new THREE.BoxGeometry(W / R.bays - .5, .03, 1.8), green, x, y + .02, R.z0 + 1.2);
        add(new THREE.CylinderGeometry(.22, .2, .45, 10), mat(0x2f6fb0), x + .9, y + .23, R.z0 + 1.9);
        const tag = add(new THREE.PlaneGeometry(.45, .45), signMat(numTex(f * R.bays + i + 1)), x - W / R.bays / 2 + .12, y + 1.6, R.z0 + .26); tag.castShadow = false;
      }
    }
    add(new THREE.BoxGeometry(W, .06, .06), rail, cx, y + .95, R.z0 + .08); add(new THREE.BoxGeometry(W, .05, .05), rail, cx, y + .5, R.z0 + .08);
  }
  // 2층 옆 난간 (지붕이 없어진 대신 양 끝을 막음)
  [R.x0 + .05, R.x1 - .05].forEach(x => add(new THREE.BoxGeometry(.06, .06, D), rail, x, R.y2 + .95, cz));
  // 엘리베이터: 건물 왼쪽 옆면에 붙은 유리 승강로 + 오르내리는 칸
  const L = RANGE.lift, glass = new THREE.MeshLambertMaterial({ color: 0xbfe1f2, transparent: true, opacity: .35 }), ltop = R.y2 + 3.1;
  add(new THREE.BoxGeometry(2.3, .3, 2.3), wood, L.x, -.15, L.z);                                          // 바닥 받침(물 위)
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => add(new THREE.BoxGeometry(.14, ltop, .14), steel, L.x + a * 1.08, ltop / 2, L.z + b * 1.08));
  [-1, 1].forEach(b => add(new THREE.BoxGeometry(2.3, ltop, .04), glass, L.x, ltop / 2, L.z + b * 1.1));    // 앞뒤 유리
  add(new THREE.BoxGeometry(.04, ltop, 2.3), glass, L.x - 1.1, ltop / 2, L.z);                               // 바깥쪽 유리
  add(new THREE.BoxGeometry(2.4, .2, 2.4), steel, L.x, ltop + .1, L.z);
  const cab = new THREE.Group(); cab.position.set(L.x, 0, L.z); scene.add(cab);
  const cabFloor = new THREE.Mesh(new THREE.BoxGeometry(1.9, .12, 1.9), mat(0x6b7a86)); cabFloor.position.y = .06; cab.add(cabFloor);
  const cabTop = new THREE.Mesh(new THREE.BoxGeometry(1.9, .08, 1.9), mat(0xe9ece8)); cabTop.position.y = 2.35; cab.add(cabTop);
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(.9, .03, .3), new THREE.MeshBasicMaterial({ color: 0xfff1c0 })); lamp.position.y = 2.3; cab.add(lamp);
  cab.traverse(m => { if (m.isMesh) m.castShadow = true; });
  RANGE.cab = cab;
  const liftSign = add(new THREE.PlaneGeometry(1.6, .55), signMat(signTex([["🛗 엘리베이터 1F ⇄ 2F", 30, .56]], "#2f6fb0", "#ffffff", 384, 132)), L.x, 2.75, L.z + 1.16); liftSign.castShadow = false;
  // 지붕 대신 2층 뒷벽 위에 강 쪽을 보는 이름 간판
  const sign = add(new THREE.PlaneGeometry(7, 1.1), signMat(signTex([["한강 선상 낚시터", 60, .55]], "#1f5f3a", "#ffffff", 768, 120)), cx, R.y2 + 3.8, R.z1 + .02);
  sign.rotation.y = Math.PI; sign.castShadow = false;
  const info = add(new THREE.PlaneGeometry(1.8, .9), signMat(signTex([["선상 낚시터", 38, .3], ["2층은 더 멀리 던져져요", 24, .62], ["→ 심해어가 잘 나와요", 24, .86]], "#1f5f3a", "#ffffff", 384, 192)), R.walk[0] - .6, 1.4, BOUND.landZ0 + .2);
  info.rotation.y = 0;
}

/* ---------- 강태공 미끼 가게: an old angler in a straw hat beside a bait cart ---------- */
const BAITS = [
  { k: "worm", name: "지렁이", icon: "🪱", price: 0, desc: "무료 · 모든 어종이 고르게" },
  { k: "paste", name: "떡밥", icon: "🍙", price: 300, desc: "붕어·잉어 같은 순한 물고기 ↑ · 황금 잉어 ×2" },
  { k: "lure", name: "루어", icon: "🎏", price: 500, desc: "배스·쏘가리·가물치 같은 사냥꾼 물고기 ↑" },
  { k: "shrimp", name: "새우", icon: "🦐", price: 800, desc: "메기·장어·문어 같은 바닥 물고기 ↑ · 심해어 ×1.5" }
];
const BAIT_PACK = 5, BAIT_BY = Object.fromEntries(BAITS.map(b => [b.k, b]));
const BAIT_NPC = { x: FISH_DECK.box[0] - 3.4, z: FISH_DECK.box[1] + .4 };
const baitCount = k => k === "worm" ? Infinity : ((wallet.bait || {})[k] || 0);
function useBait() {
  const k = fishing.bait || "worm"; if (k === "worm") return "worm";
  if (baitCount(k) <= 0) { fishing.bait = "worm"; drawBaitRow(); return "worm"; }
  wallet.bait[k]--; saveWallet(); if (wallet.bait[k] <= 0) { toast(`${BAIT_BY[k].name}를 다 썼어요. 다음부터는 지렁이로 낚아요`); fishing.bait = "worm"; }
  drawBaitRow(); return k;
}
const baitNpc = (() => {
  const g = new THREE.Group(); g.position.set(BAIT_NPC.x, 0, BAIT_NPC.z); scene.add(g);
  // the cart: a wooden stall with bait tubs and a little roof
  const wood = mat(0x8a6a48), cart = new THREE.Mesh(new THREE.BoxGeometry(1.6, .8, .8), wood); cart.position.set(1.1, .55, 0); cart.castShadow = true; g.add(cart);
  [[.55, -.3], [1.65, -.3], [.55, .3], [1.65, .3]].forEach(([x, z]) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .08, 12), mat(0x3a3330)); w.rotation.x = Math.PI / 2; w.position.set(x, .16, z * 1.4); g.add(w); });
  [0x8a5a3a, 0xe8d8a8, 0x6fa8dc, 0xf28c8c].forEach((c, i) => { const tub = new THREE.Mesh(new THREE.CylinderGeometry(.15, .13, .16, 12), mat(c)); tub.position.set(.6 + i * .33, 1.03, .05); g.add(tub); });
  [.35, 1.85].forEach(x => { const p = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 1.4, 6), wood); p.position.set(x, 1.6, .3); g.add(p); });
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.9, .08, 1.1), mat(0x2f6fb0)); roof.position.set(1.1, 2.3, .05); roof.rotation.x = .15; g.add(roof);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.7, .5), signMat(signTex([["강태공 미끼", 42, .55]], "#6b4f35", "#fff6e0", 512, 150))); sign.position.set(1.1, 2.05, -.47); sign.rotation.y = Math.PI; g.add(sign);
  const sign2 = sign.clone(); sign2.rotation.y = 0; sign2.position.z = .58; g.add(sign2);
  // the old angler on a stool: straw hat, white beard, a rod leaning on the cart
  const av = makeAvatar({ g: "m", c: 4, name: "강태공" }); setAvatarState(av, "stool", false, true); av.position.set(-.2, 0, .1); av.rotation.y = Math.PI; g.add(av);
  const stool = new THREE.Mesh(new THREE.CylinderGeometry(.24, .22, .45, 10), wood); stool.position.set(-.2, .22, .1); g.add(stool);
  const head = av.userData.head, straw = mat(0xe8c870);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(.85, .85, .04, 24), straw); brim.position.y = .33; head.add(brim);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(.42, .5, .3, 20), straw); crown.position.y = .5; head.add(crown);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(.505, .505, .07, 20), mat(0x8a2a2a)); band.position.y = .4; head.add(band);
  const beard = new THREE.Mesh(new THREE.SphereGeometry(.26, 12, 10), mat(0xf4f1ea)); beard.scale.set(1.1, .9, .6); beard.position.set(0, -.36, -.33); head.add(beard);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.015, .03, 2.6, 6), mat(0x3a2a1a)); rod.position.set(.3, 1.3, .55); rod.rotation.z = -.35; g.add(rod);
  g.traverse(m => { if (m.isMesh) m.castShadow = true; });
  OBST.push({ x0: BAIT_NPC.x - .6, x1: BAIT_NPC.x + 2, z0: BAIT_NPC.z - .55, z1: BAIT_NPC.z + .55 });
  updateAvatar(av, .016, 0, {});
  return { g, av };
})();
// 수레 둘레 어느 쪽에서든 1.6m 안이면 말을 걸 수 있음
const nearBaitNpc = () => { if (me.level !== "ground" || me.st !== "walk") return false; const x0 = BAIT_NPC.x - .6, x1 = BAIT_NPC.x + 2, z0 = BAIT_NPC.z - .55, z1 = BAIT_NPC.z + .55; return Math.hypot(Math.max(x0 - me.x, 0, me.x - x1), Math.max(z0 - me.z, 0, me.z - z1)) < 1.6; };
const NPC_LINES = ["허허, 오늘은 물이 좋구먼", "떡밥엔 붕어, 루어엔 쏘가리지", "새우를 쓰면 바닥 녀석들이 올라온다네", "바위에 가면 꺽지가 산다던데…", "낚시는 기다림이야, 기다림"];
let npcSaid = 0;

/* ---------- actions: bait shop, stairs, a full rock ---------- */
function spotActions(acts, status) {
  if (!started || anim || boarded || me.st !== "walk") return status;
  if (nearBaitNpc()) { acts.unshift(["baitshop", "🪱 강태공에게 미끼 사기", "primary"]); status = "강태공 미끼 가게 · 미끼마다 잘 무는 물고기가 달라요"; }
  if (me.level !== "loft" && onRange1(me.x, me.z) && me.x < RANGE.x0 + 3 && me.z > RANGE.z0) acts.unshift(["loftup", "🛗 엘리베이터 타고 2층으로", "primary"]);
  if (me.level === "loft" && me.x < RANGE.x0 + 3) acts.unshift(["loftdown", "🛗 엘리베이터 타고 1층으로", "primary"]);
  if (me.level === "loft" && !status) status = "선상 낚시터 2층 · 여기선 더 멀리 던져져요";
  return status;
}
function spotClick(a) {
  if (a === "baitshop") { openBaitShop(); return true; }
  if (a === "loftup" || a === "loftdown") {
    const up = a === "loftup";
    // 엘리베이터: 칸으로 걸어 들어가 → 오르내리고 → 반대 층으로 걸어 나옴
    const L = RANGE.lift, y0 = up ? 0 : RANGE.y2, y1 = up ? RANGE.y2 : 0, out = [RANGE.x0 + 1.2, L.z];
    liftRide = { t0: performance.now(), y0, y1 };
    anim = { t: 0, dur: .6, from: [me.x, me.z, y0], to: [L.x, L.z, y0], hop: 0, then: () => {
      anim = { t: 0, dur: 2.2, from: [L.x, L.z, y0], to: [L.x, L.z, y1], hop: 0, then: () => {
        me.level = up ? "loft" : "ground";
        anim = { t: 0, dur: .6, from: [L.x, L.z, y1], to: [out[0], out[1], y1], hop: 0, then: () => { me.y = y1; liftRide = null; publish(true); actKey = ""; refreshActions(); } };
      } };
      if (audio.ready) audio.ding();
    } };
    if (audio.ready) audio.step("deck", true); return true;
  }
  return false;
}
function openBaitShop() {
  const grid = $("baitGrid"); grid.textContent = "";
  BAITS.filter(b => b.price).forEach(B => {
    const cell = document.createElement("div"); cell.className = "item";
    const ic = document.createElement("div"); ic.className = "bait-ic"; ic.textContent = B.icon;
    const nm = document.createElement("b"); nm.textContent = `${B.name} ${BAIT_PACK}개`;
    const ds = document.createElement("span"); ds.className = "bait-desc"; ds.textContent = B.desc;
    const pr = document.createElement("span"); pr.className = "price"; pr.textContent = `${won(B.price)} · 가진 것 ${baitCount(B.k)}개`;
    const btn = document.createElement("button"); btn.textContent = "사기"; btn.dataset.k = B.k; btn.disabled = wallet.money < B.price;
    cell.append(ic, nm, ds, pr, btn); grid.appendChild(cell);
  });
  $("baitWallet").textContent = "내 돈 " + won(wallet.money); $("baitModal").hidden = false;
  showBubble(() => baitNpc.av, NPC_LINES[Math.floor(Math.random() * NPC_LINES.length)], 2.6, "npc-bait");
}
$("baitGrid").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return; const B = BAIT_BY[b.dataset.k];
  if (wallet.money < B.price) { toast("돈이 모자라요"); return; }
  wallet.money -= B.price; wallet.bait = wallet.bait || {}; wallet.bait[B.k] = (wallet.bait[B.k] || 0) + BAIT_PACK; saveWallet();
  toast(`${B.icon} ${B.name} ${BAIT_PACK}개를 샀어요. 낚시 창에서 골라 쓰세요`); if (audio.ready) audio.click(); openBaitShop();
});
$("baitClose").addEventListener("click", () => { $("baitModal").hidden = true; });
$("baitModal").addEventListener("click", e => { if (e.target === $("baitModal")) $("baitModal").hidden = true; });

/* ---------- bait chips in the fishing panel ---------- */
function drawBaitRow() {
  const row = $("baitRow"); row.textContent = "";
  BAITS.forEach(B => {
    const n = baitCount(B.k), b = document.createElement("button"); b.type = "button"; b.dataset.k = B.k;
    b.className = "bait-chip" + ((fishing.bait || "worm") === B.k ? " on" : ""); b.disabled = n <= 0;
    b.textContent = `${B.icon} ${B.name} ${n === Infinity ? "∞" : n}`; row.appendChild(b);
  });
}
$("baitRow").addEventListener("click", e => {
  const b = e.target.closest(".bait-chip"); if (!b || b.disabled) return;
  if (fishing.st !== "ready") { toast("줄을 걷은 다음에 미끼를 바꿀 수 있어요"); return; }
  fishing.bait = b.dataset.k; drawBaitRow(); toast(`${BAIT_BY[fishing.bait].icon} ${BAIT_BY[fishing.bait].name}를 끼웠어요 · ${BAIT_BY[fishing.bait].desc}`);
});

let liftRide = null;
function updateSpots() {
  if (!started) return;
  // 엘리베이터 칸: 내가 타고 있으면 나를 따라, 아니면 칸 안에 있는 다른 사람 높이로, 아무도 없으면 그 자리에 머묾
  { const L = RANGE.lift, cab = RANGE.cab; let ty = null;
    if (liftRide) ty = me.y || 0;
    else for (const [, o] of others) if (Math.hypot(o.x - L.x, o.z - L.z) < 1.1) { ty = o.obj ? o.obj.position.y : 0; break; }
    if (ty !== null) cab.position.y = ty; }
  // the old angler greets people walking by now and then
  const d = Math.hypot(me.x - BAIT_NPC.x, me.z - BAIT_NPC.z);
  if (d < 6 && Date.now() - npcSaid > 25000) { npcSaid = Date.now(); showBubble(() => baitNpc.av, NPC_LINES[Math.floor(Math.random() * NPC_LINES.length)], 3, "npc-bait"); }
  baitNpc.av.userData.head.rotation.x = Math.sin(T * .6) * .05;
  // inside the range the camera sits behind you, i.e. inside the back wall: hide it on this screen only
  const inside = me.level === "loft" || (onRange1(me.x, me.z) && me.z < RANGE.z1 + .5);
  if (RANGE.backs[0].visible === inside) RANGE.backs.forEach(m => { m.visible = !inside; });
  if (!$("fishModal").hidden && $("baitRow").dataset.sig !== JSON.stringify(wallet.bait || {}) + fishing.bait) { $("baitRow").dataset.sig = JSON.stringify(wallet.bait || {}) + fishing.bait; drawBaitRow(); }
}
