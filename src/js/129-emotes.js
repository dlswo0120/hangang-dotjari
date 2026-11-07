/* ================= 감정 표현 · 춤 ================= */
const EMOTES = [
  { id: "wave", name: "손 흔들기", icon: "👋", dur: 2.4, seat: true, say: "안녕~" },
  { id: "clap", name: "박수", icon: "👏", dur: 2.4, seat: true },
  { id: "hurray", name: "만세", icon: "🙌", dur: 2.0, seat: true, say: "만세!" },
  { id: "heart", name: "하트", icon: "💗", dur: 2.6, seat: true, say: "♥" },
  { id: "bow", name: "꾸벅 인사", icon: "🙇", dur: 1.8, seat: false },
  { id: "beg", name: "용돈 구걸", icon: "🥺", dur: 600, seat: true, beg: true }, // only offered while broke (see 140-beg.js)
  { id: "chest", name: "가슴 튕기기 춤", icon: "🕺", dur: 4.4, seat: false, dance: true, say: "♪" },
  { id: "glide", name: "공중 미끄럼 걸음", icon: "🛼", dur: 6, seat: false, dance: true, bpm: 2.1, say: "슝~" },
  { id: "thumbs", name: "엄지 흔들기 응원", icon: "👍", dur: 4.8, seat: true, dance: true, bpm: 2.5, say: "♪" },
  { id: "stack", name: "손 탑 쌓기", icon: "✊", dur: 4.8, seat: true, dance: true, bpm: 2.5, say: "♪" },
  // photo poses (picked from the camera menu, held through the countdown)
  { id: "pv", name: "브이 볼콕", icon: "✌️", dur: 9, seat: true, photo: "solo" },
  { id: "pfist", name: "주먹 볼콕", icon: "🤜", dur: 9, seat: true, photo: "solo" },
  { id: "paerial", name: "항공샷", icon: "🛸", dur: 9, seat: true, photo: "solo", aerial: true },
  { id: "pheart", name: "하트 반쪽", icon: "🫶", dur: 9, seat: true, photo: "duo" },
  { id: "pstick", name: "찰싹 붙기", icon: "🤝", dur: 9, seat: true, photo: "duo" },
  { id: "pv2", name: "같이 브이", icon: "✌️", dur: 9, seat: true, photo: "duo" },
  { id: "pjump", name: "점프샷", icon: "🦘", dur: 9, seat: false, photo: "group" },
  { id: "paerial2", name: "단체 항공샷", icon: "🛸", dur: 9, seat: true, photo: "group", aerial: true },
  { id: "pfight", name: "다 같이 파이팅", icon: "✊", dur: 9, seat: true, photo: "group", say: "화이팅!" },
  // poses used by other features (not in the menu)
  { id: "rail", name: "난간에 기대기", dur: 900, hidden: true },
  { id: "dive", name: "다이빙", dur: 2.4, hidden: true },
  { id: "thanks", name: "감사 인사", dur: 2.2, seat: true, hidden: true, say: "감사합니다! 🙇" },
  // new entries go at the end: others' screens find poses by their place in this list
  { id: "love", name: "연애의 조건 춤", icon: "💸", dur: 8, seat: false, dance: true, bpm: 2, say: "♪", credit: "베스티 - 연애의 조건 챌린지" }
];
const PHOTO_SHOT_AT = { solo: 3.2, duo: 6.2, group: 6.2 }; // seconds from the start until the shutter
const CHEST_BPM = 2.25; // beats per second

// pose overrides, blended in and out over the emote's length
function vSign(u, on) {
  if (on && !u.vR) {
    const g = new THREE.Group(), sk = new THREE.MeshLambertMaterial({ color: 0xf2c9a0 });
    [-.32, .32].forEach(a => { const f = new THREE.Mesh(new THREE.CylinderGeometry(.018, .016, .13, 6), sk); f.position.set(Math.sin(a) * .06, -.06, 0); f.rotation.z = a; g.add(f); });
    g.position.set(0, -.33, 0); u.arms[1].add(g); u.vR = g;
  }
  if (u.vR) u.vR.visible = on;
}
// thumbs on both fists; the arm points along its local -y, and local -z is "up" when the arm is held forward
function thumbs(u, on) {
  if (on && !u.thumbs) {
    const sk = new THREE.MeshLambertMaterial({ color: 0xf2c9a0 });
    u.thumbs = [0, 1].map(k => { const f = new THREE.Mesh(new THREE.CylinderGeometry(.04, .035, .17, 8), sk); f.rotation.x = Math.PI / 2; f.position.set(0, -.3, -.11); u.arms[k].add(f); return f; });
  }
  if (u.thumbs) u.thumbs.forEach(f => { f.visible = on; });
}
// 팔꿈치·손목이 있는 춤용 팔: 춤추는 동안만 원래 팔 대신 보임 (평소 모델은 그대로)
function danceArms(u, on) {
  if (on && !u.dArms) {
    u.dArms = u.arms.map(ap => {
      const base = ap.userData.base || [], top = base[0] ? base[0].material : mat(0x888888), skin = base[base.length - 1] ? base[base.length - 1].material : top;
      const fore = base.length > 2 ? skin : top, g = new THREE.Group(); ap.add(g);
      const cyl = (p, r1, r2, h, m, y) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, 10), m); c.position.y = y; c.castShadow = true; p.add(c); return c; };
      cyl(g, .062, .058, .16, top, -.08);
      const elb = new THREE.Group(); elb.position.y = -.15; g.add(elb);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(.057, 10, 8), fore); elb.add(ball);
      cyl(elb, .056, .05, .13, fore, -.065);
      const wr = new THREE.Group(); wr.position.y = -.13; elb.add(wr);
      const palm = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), skin); palm.scale.set(.058, .062, .042); palm.position.y = -.045; wr.add(palm);
      // 펼친 손가락 셋 / 돈 모양: 엄지와 검지로 만든 동그라미 + 접은 손가락
      const fingers = new THREE.Group(); wr.add(fingers);
      [-.028, 0, .028].forEach(x => { const f = cyl(fingers, .014, .012, .065, skin, -.11); f.position.x = x; });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.044, .016, 8, 18), skin); ring.position.set(0, -.11, -.02); ring.rotation.x = -1.6; wr.add(ring); // 손을 가슴 앞에 세우면 동그라미가 정면을 봄
      const curl = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), skin); curl.scale.set(.05, .03, .035); curl.position.set(0, -.085, .02); wr.add(curl);
      return { g, elb, wr, fingers, ring, curl, base };
    });
  }
  if (!u.dArms) return;
  if (u.dArms.on !== on) { u.dArms.on = on; u.dArms.forEach(d => { d.g.visible = on; d.base.forEach(m => { m.visible = !on; }); }); }
}
function moneyShape(u, k) { if (!u || !u.dArms) return; u.dArms.forEach(d => { d.ring.visible = k; d.curl.visible = k; d.fingers.visible = !k; }); }
/* 연애의 조건 춤 (베스티 - 연애의 조건 챌린지 참고): 8박자를 두 번.
   순서: ① 왼발 교차 + 돈 모양 손 흔들고 뻗기 → ② '하나 앤 둘'에 상체 내리며 손 뻗기 → ③ 오른발 빼며 양팔 크게 →
         ④ 오른손 배, 왼손 허리, 시선·무게 왼쪽 → ⑤ '하나 둘' 골반 → ⑥ '오' 하며 앉기 → 처음 자세(반복)
   키 자세 사이는 부드럽게 잇고, 그 위에 박마다 무릎·상체 바운스와 손목 흔들기를 얹어 계속 움직이게 함 */
const LOVE_DEF = { arL: .3, arR: .3, azL: .15, azR: .15, elL: .45, elR: .45, ezL: 0, ezR: 0, wxL: 0, wxR: 0, lean: 0, nod: 0, hy: 0, hz: 0, tz: 0, hx: 0, hipY: 0, thL: 0, thR: 0, knL: 0, knR: 0, lzL: 0, lzR: 0 };
const M = { arL: .95, arR: .95, azL: .05, azR: .05, elL: 1.25, elR: 1.25, wxL: -.55, wxR: -.55 };  // 가슴 앞 돈 모양 손
const CROSS = { thL: .2, lzL: .2, knL: -.14, knR: -.1, hx: .02 };                               // 왼발을 오른발 앞으로
const BELLY = { arR: .55, azR: -.3, elR: 1.55, wxR: .1, arL: -.1, azL: .65, elL: .15, ezL: -1.35, wxL: .3 }; // 오른손 배, 왼손 허리
const LOVE_KEYS = [
  [0,    {}],
  [.5,   { ...M, thL: .1, lzL: .1, knL: -.08 }],
  [1,    { ...M, ...CROSS }],
  [1.5,  { ...M, ...CROSS }],
  [2,    { ...M, ...CROSS, arL: 1.25, arR: 1.25, azL: .35, azR: .35, elL: .25, elR: .25, wxL: -.25, wxR: -.25 }],             // 흔들던 손을 앞으로 뻗기
  [2.5,  { ...M, ...CROSS, arL: .8, arR: .8, elL: .95, elR: .95 }],
  [3,    { ...M, ...CROSS, arL: 1.15, arR: 1.15, azL: .4, azR: .4, elL: .15, elR: .15, wxL: -.2, wxR: -.2, lean: .26, knL: -.32, knR: -.3, thR: .12 }], // "하나"
  [3.5,  { ...M, ...CROSS, arL: .75, arR: .75, elL: .85, elR: .85, lean: .1, knL: -.16, knR: -.14 }],                           // "앤"
  [4,    { ...M, ...CROSS, arL: 1.05, arR: 1.05, azL: .45, azR: .45, elL: .1, elR: .1, wxL: -.2, wxR: -.2, lean: .34, knL: -.42, knR: -.4, thR: .18, thL: .3 }], // "둘"
  [4.5,  { arL: .55, arR: .55, azL: .5, azR: .5, elL: .6, elR: .6, lean: .12, lzL: .05, knL: -.12, knR: -.12 }],
  [5,    { arL: .2, arR: .2, azL: 1.35, azR: 1.35, elL: .2, elR: .2, wxL: .45, wxR: .45, lzL: -.07, lzR: .07, nod: -.04 }], // 오른발 빼며 양팔 크게
  [5.5,  { arL: .1, arR: .35, azL: .9, azR: .3, elL: .3, elR: 1, ezL: .5, lzL: -.07, lzR: .07 }],
  [6,    { ...BELLY, hx: -.05, tz: .07, hy: .32, hz: .05, knR: -.24, thR: .1, lzL: -.07, lzR: .07 }],   // 시선·무게 왼쪽
  [6.5,  { ...BELLY, hx: -.1, tz: .12, hy: .35, hz: .06, knR: -.38, thR: .16, lzL: -.07, lzR: .07 }],  // "하나"
  [6.75, { ...BELLY, hx: -.05, tz: .06, hy: .35, hz: .05, knR: -.2, thR: .08, lzL: -.07, lzR: .07 }],
  [7,    { ...BELLY, hx: -.1, tz: .12, hy: .35, hz: .06, knR: -.38, thR: .16, lzL: -.07, lzR: .07 }],  // "둘"
  [7.25, { ...BELLY, hx: -.06, tz: .07, hy: .3, hz: .04, knR: -.25, thR: .1, lzL: -.07, lzR: .07 }],
  [7.6,  { ...BELLY, hx: -.04, tz: .04, hy: .2, hipY: -.14, knL: -.78, knR: -.82, thL: .4, thR: .42, lean: .14, lzL: -.07, lzR: .07, nod: -.06 }], // "오" 앉기
  [8,    {}]
];
const loveKey = k => Object.assign({}, LOVE_DEF, k);
const smoother = x => x * x * x * (x * (x * 6 - 15) + 10);
function lovePose(beat) {
  const b = ((beat % 8) + 8) % 8; let i = 0; while (i < LOVE_KEYS.length - 2 && LOVE_KEYS[i + 1][0] <= b) i++;
  const [b0, k0] = LOVE_KEYS[i], [b1, k1] = LOVE_KEYS[i + 1], p0 = loveKey(k0), p1 = loveKey(k1), k = smoother(clamp((b - b0) / (b1 - b0), 0, 1)), o = {};
  for (const n in LOVE_DEF) o[n] = p0[n] + (p1[n] - p0[n]) * k;
  return o;
}
// an empty tin can in front of someone asking for pocket money
function begCan(u, on) {
  if (on && !u.can) {
    const g = new THREE.Group(), tin = new THREE.Mesh(new THREE.CylinderGeometry(.11, .1, .17, 14, 1, true), new THREE.MeshPhongMaterial({ color: 0xb8bec6, shininess: 80, side: THREE.DoubleSide }));
    tin.position.y = .085; g.add(tin);
    const bot = new THREE.Mesh(new THREE.CircleGeometry(.1, 14), mat(0x8a9099)); bot.rotation.x = -Math.PI / 2; bot.position.y = .01; g.add(bot);
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .012, 12), new THREE.MeshPhongMaterial({ color: 0xf2c14e, shininess: 90 })); coin.position.set(.02, .025, .01); coin.rotation.z = .3; g.add(coin);
    g.userData.coin = coin; g.position.set(0, 0, -.72); g.traverse(m => { if (m.isMesh) m.castShadow = true; });
    u.inner.parent.add(g); u.can = g;
  }
  if (u.can) u.can.visible = on;
}
function emotePose(v, i, t, standing, u, side) {
  if (u) { vSign(u, false); thumbs(u, false); begCan(u, false); danceArms(u, false); }
  const E = EMOTES[i]; if (!E || t < 0 || t > E.dur) return;
  const env = clamp(Math.min(t / .2, (E.dur - t) / .25), 0, 1), to = (k, val) => { v[k] += (val - v[k]) * env; };
  // arms are short next to the big head, so raises go out to the side where they stay visible
  if (E.id === "wave") { to("arR", .35); to("azR", 2.05 + Math.sin(t * 11) * .35); v.nod += .06 * env; }
  else if (E.id === "clap") { const c = Math.abs(Math.sin(t * 8)); to("arL", 1.2); to("arR", 1.2); to("azL", .25 - .55 * c); to("azR", .25 - .55 * c); }
  else if (E.id === "hurray") { to("arL", .25); to("arR", .25); to("azL", 2.45); to("azR", 2.45); if (standing) v.lift += Math.abs(Math.sin(t * 7)) * .12 * env; }
  else if (E.id === "heart") { to("arL", 1.25); to("arR", 1.25); to("azL", -.42); to("azR", -.42); v.nod += .1 * env; }
  else if (E.id === "beg") {
    // kneel (when standing), cupped hands held out, little pleading nods
    if (standing) { to("hipY", .3); to("thL", .25); to("thR", .25); to("knL", -1.75); to("knR", -1.75); }
    to("arL", 1.2 + Math.sin(t * 2.2) * .08); to("arR", 1.2 + Math.sin(t * 2.2) * .08); to("azL", -.38); to("azR", -.38);
    v.lean += (standing ? .35 : .15) * env; v.nod += (.12 + Math.sin(t * 2.2) * .1) * env; v.roll = (v.roll || 0) + Math.sin(t * 1.1) * .06 * env;
    if (u) begCan(u, env > .3);
  }
  else if (E.id === "thanks") { const b = Math.sin(Math.PI * clamp(t / E.dur, 0, 1)); v.lean += .5 * b; v.nod += .35 * b; to("arL", 1.0); to("arR", 1.0); to("azL", -.42); to("azR", -.42); }
  else if (E.id === "bow") { const b = Math.sin(Math.PI * clamp(t / E.dur, 0, 1)); v.lean += .8 * b; v.nod += .35 * b; to("arL", .12); to("arR", .12); to("azL", .05); to("azR", .05); }
  else if (E.id === "chest") {
    // right arm held flat across the front of the body like a shelf, the chest pops above it
    const beat = t * CHEST_BPM, pop = Math.exp(-(beat % 1) * 7) * env;
    v.lean -= .6 * pop; v.nod += .2 * pop; v.lift += .05 * pop;
    v.hipY -= .04 * pop; v.knL -= .3 * pop; v.knR -= .3 * pop; v.thL += .15 * pop; v.thR += .15 * pop;
    to("arR", 1.45); to("azR", -1.1); v.arR -= .6 * pop; // cancel the torso tilt so the arm stays level
    to("arL", .08); to("azL", .28);
    if (t > E.dur - 1) v.nod -= .15 * env; // finish looking up at the camera
  }
  else if (E.id === "glide") {
    // hovering a little off the ground; the feet scrape back one after the other while the body drifts forward and back
    const ph = t * E.bpm * Math.PI, sL = Math.sin(ph), drift = Math.sin(t * Math.PI * 2 / E.dur * 2);
    if (standing) { v.lift += (.16 + Math.abs(Math.cos(ph)) * .03) * env; v.glz += drift * .45 * env; }
    v.thL += (-.45 * Math.max(0, sL) + .12) * env; v.knL += (-.55 * Math.max(0, sL)) * env;
    v.thR += (-.45 * Math.max(0, -sL) + .12) * env; v.knR += (-.55 * Math.max(0, -sL)) * env;
    v.lean += .12 * env; v.nod -= .06 * env; v.roll = (v.roll || 0) + Math.sin(ph) * .05 * env;
    to("arL", .25 + Math.sin(ph) * .25); to("arR", .25 - Math.sin(ph) * .25); to("azL", .3); to("azR", .3);
  }
  else if (E.id === "thumbs") {
    // fists out front with thumbs up, swinging side to side together; shoulders bounce twice per swing
    const ph = t * E.bpm * Math.PI, s = Math.sin(ph), b = Math.abs(Math.sin(ph * 2));
    to("arL", 1.3 + b * .15); to("arR", 1.3 + b * .15); to("azR", .15 + s * .55); to("azL", .15 - s * .55);
    v.roll = (v.roll || 0) - s * .1 * env; v.nod += (.05 - b * .08) * env;
    if (standing) { v.lift += b * .05 * env; v.knL -= b * .15 * env; v.knR -= b * .15 * env; v.thL += b * .08 * env; v.thR += b * .08 * env; }
    if (u) thumbs(u, env > .4);
  }
  else if (E.id === "stack") {
    // fists stacked on top of each other, climbing: the lower hand jumps over the upper one on every beat
    const beat = t * E.bpm, n = Math.floor(beat), f = beat - n, k = ease(clamp(f / .35, 0, 1));
    // arms are short and would point at the viewer, so the fists climb up the sides of the face instead
    const lvl = m => .5 + (Math.max(0, m) % 4) * .6; // height of the m-th fist in the stack (starts over after four)
    const moving = lvl(n - 2) + (lvl(n) - lvl(n - 2)) * k, still = lvl(n - 1);
    if (n % 2 === 0) { to("azR", moving); to("azL", still); } else { to("azL", moving); to("azR", still); }
    to("arL", .35); to("arR", .35);
    const hit = Math.exp(-f * 9); v.nod += (.08 * hit - .04) * env;
    if (standing) { v.lift += hit * .04 * env; v.knL -= hit * .12 * env; v.knR -= hit * .12 * env; }
  }
  else if (E.id === "love") {
    const beat = t * E.bpm, b = ((beat % 8) + 8) % 8, P = lovePose(beat), env2 = env * env;
    // 박마다 바운스: 무릎이 살짝 굽었다 펴지고 상체가 따라 튕김 (앉기 직전엔 쉼)
    const fr = beat % 1, pulse = Math.exp(-fr * 6) * (b < 7.3 ? 1 : 0) * env, half = b >= 3 && b < 4.5 ? Math.exp(-((beat * 2) % 1) * 7) * .5 * env : 0;
    // 돈 모양 손 흔들기(손목 비틀기·까딱), 펼친 손은 손목만 살짝
    const shake = b > .4 && b < 2.6 ? Math.sin(t * Math.PI * 2 * 4) * env : 0;
    for (const n of ["arL", "arR", "azL", "azR", "elL", "elR", "ezL", "ezR", "wxL", "wxR"]) { const cur = v[n] ?? 0; v[n] = cur + (P[n] - cur) * env; }
    v.wyL = shake * .45; v.wyR = -shake * .45; v.wxL += shake * .12; v.wxR += shake * .12;
    v.lean += (P.lean + pulse * .05 + half * .05) * env; v.nod += (P.nod - P.lean * .55) * env; // 숙여도 얼굴은 앞을 봄
    v.hy = P.hy * env; v.hz = P.hz * env; v.tz = P.tz * env;
    if (standing) {
      v.hx = P.hx * env; v.hipY += (P.hipY - pulse * .02 - half * .02) * env;
      const keep = Math.asin(clamp(-v.hx / .44, -.5, .5)); // 골반이 옆으로 가도 발은 제자리
      v.lzL = (P.lzL + keep) * env; v.lzR = (P.lzR + keep) * env;
      v.thL += (P.thL + pulse * .06) * env; v.thR += (P.thR + pulse * .06) * env;
      v.knL += (P.knL - pulse * .14 - half * .1) * env; v.knR += (P.knR - pulse * .14 - half * .1) * env;
    }
    if (u) { danceArms(u, env > .02); moneyShape(u, b > .3 && b < 4.4); }
  }
  // photo poses (the arms are short, so hands go to the side of the big face)
  else if (E.id === "pv" || E.id === "pv2") { to("arR", .75); to("azR", 1.55); v.roll = (v.roll || 0) + .14 * env; v.nod += .05 * env; if (u) vSign(u, env > .5); }
  else if (E.id === "pfist") { to("arL", .95); to("arR", .95); to("azL", 1.35); to("azR", 1.35); v.roll = (v.roll || 0) - .1 * env; v.nod += .06 * env; }
  else if (E.id === "paerial" || E.id === "paerial2") { v.nod -= .55 * env; to("arR", .3); to("azR", 2.3); to("arL", .3); to("azL", 2.3); if (u) vSign(u, env > .5); }
  else if (E.id === "pheart") { const s = side || 1; v.roll = (v.roll || 0) - .2 * s * env; if (s > 0) { to("arR", .35); to("azR", 2.05); } else { to("arL", .35); to("azL", 2.05); } }
  else if (E.id === "pstick") { const s = side || 1; v.roll = (v.roll || 0) - .3 * s * env; to("arL", .1); to("arR", .1); to("azL", .2); to("azR", .2); v.nod -= .05 * env; }
  else if (E.id === "pjump") { to("arL", .25); to("arR", .25); to("azL", 2.45); to("azR", 2.45); const jt = t - (PHOTO_SHOT_AT.group - .45); if (standing && jt > 0 && jt < .9) v.lift += Math.sin(Math.PI * jt / .9) * .45; }
  else if (E.id === "rail") { v.lean += .5 * env; to("arL", 1.55); to("arR", 1.55); to("azL", -.05); to("azR", -.05); v.nod -= .12 * env; v.knL -= .1 * env; v.knR -= .1 * env; }
  else if (E.id === "dive") {
    if (t < .35) { const c = t / .35; v.knL -= .9 * c; v.knR -= .9 * c; v.thL += .5 * c; v.thR += .5 * c; v.hipY -= .12 * c; v.arL = -.6 * c; v.arR = -.6 * c; v.lean += .3 * c; }
    else { const s = t - .35; v.pitch = -Math.min(s, 1.5) * 4.2; v.arL = 2.9; v.arR = 2.9; v.azL = v.azR = .05; v.thL = v.thR = 0; v.knL = v.knR = 0; }
  }
  else if (E.id === "pfight") { to("arR", 2.0); to("azR", .15); to("arL", .2); to("azL", .2); v.lean -= .05 * env; }
}
function activeEmote(em) {
  if (!em || !EMOTES[em.i]) return null;
  const t = (Date.now() - em.at) / 1000; return t >= 0 && t <= EMOTES[em.i].dur ? { i: em.i, t, s: em.s || 1 } : null;
}

audio.beat = function (v, strong) {
  const t = this.ac.currentTime;
  this.tone(this.sfx, "sine", strong ? 150 : 120, 45, .2, (strong ? .5 : .35) * v + .001, t);
  const s = this.ac.createBufferSource(); s.buffer = this.pink; const hp = this.ac.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 6000; const g = this.ac.createGain();
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.18 * v + .001, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + .06);
  s.connect(hp); hp.connect(g); g.connect(this.sfx); s.start(t, Math.random() * 3); s.stop(t + .07);
};
audio.clapHit = function (v) {
  const t = this.ac.currentTime, s = this.ac.createBufferSource(); s.buffer = this.pink; const bp = this.ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1500; bp.Q.value = .9; const g = this.ac.createGain();
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.55 * v + .001, t + .003); g.gain.exponentialRampToValueAtTime(.0001, t + .09);
  s.connect(bp); bp.connect(g); g.connect(this.sfx); s.start(t, Math.random() * 3); s.stop(t + .1);
};
const emoteTick = {};
function emoteSfx(key, a, dist) {
  if (!audio.ready || !a || dist > 22) return; const v = clamp(1 - dist / 22, 0, 1), E = EMOTES[a.i];
  let n = -1;
  if (E.id === "chest") n = Math.floor(a.t * CHEST_BPM);
  else if (E.bpm) n = Math.floor(a.t * E.bpm);
  else if (E.id === "clap") n = Math.floor((a.t * 8 - Math.PI / 2) / Math.PI);
  if (n < 0 || emoteTick[key] === n) return; emoteTick[key] = n;
  if (E.id === "chest" || E.bpm) audio.beat(v, n % 2 === 0); else audio.clapHit(v);
}

/* menu inside the 말하기 panel */
{
  const mk = (E, i) => { const b = document.createElement("button"); b.dataset.e = i; const s = document.createElement("span"); s.textContent = E.icon; s.className = "emo"; b.append(s, E.name); return b; };
  EMOTES.forEach((E, i) => { if (E.photo || E.hidden) return; const b = mk(E, i); if (E.beg) { b.id = "begBtn"; b.hidden = true; } (E.dance ? $("danceGrid") : $("emoteGrid")).appendChild(b); });
  [$("emoteGrid"), $("danceGrid")].forEach(g => g.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return; playEmote(+b.dataset.e);
    $("chatPanel").hidden = true; $("chatBtn").setAttribute("aria-expanded", "false");
  }));
}
function playEmote(i) {
  const E = EMOTES[i]; if (!started || !myAvatar || !E) return;
  if (E.beg && !canBeg()) return;
  const standing = me.st === "walk" && !me.moving && !anim && !boarded;
  const seated = me.st === "sit" || me.st === "bench" || me.st === "stool";
  if (!(standing || (E.seat && seated))) { toast(E.seat ? "서 있거나 앉아 있을 때 할 수 있어요" : "멈춰 서 있을 때 할 수 있어요"); return; }
  me.em = { i, at: Date.now() };
  if (E.say) showBubble(() => myAvatar, E.say, Math.min(E.dur, 2.4), "me");
  if (audio.ready && (E.id === "hurray" || E.id === "heart" || E.id === "wave")) audio.pop();
  publish(true);
}
function updateEmotes() {
  const diving = me.em && EMOTES[me.em.i] && EMOTES[me.em.i].id === "dive";
  if (me.em && !diving && (me.moving || anim || boarded || !activeEmote(me.em))) { if (me.moving || anim || boarded) { me.em = null; publish(true); } }
  emoteSfx("me", activeEmote(me.em), 0);
  for (const [peer, o] of others) {
    const em = o.p.em, a = activeEmote(em);
    if (em && o.lastEm !== em.at) { o.lastEm = em.at; const E = EMOTES[em.i]; if (a && E && E.say) { const id = peer; showBubble(() => (others.get(id) || {}).obj, E.say, Math.min(E.dur, 2.4), id); } }
    emoteSfx(peer, a, Math.hypot(o.x - cam.tx, o.z - cam.tz));
  }
}
