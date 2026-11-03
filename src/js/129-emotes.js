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
  { id: "thanks", name: "감사 인사", dur: 2.2, seat: true, hidden: true, say: "감사합니다! 🙇" }
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
  if (u) { vSign(u, false); thumbs(u, false); begCan(u, false); }
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
