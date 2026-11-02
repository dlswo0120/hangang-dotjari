/* ================= 감정 표현 · 춤 ================= */
const EMOTES = [
  { id: "wave", name: "손 흔들기", icon: "👋", dur: 2.4, seat: true, say: "안녕~" },
  { id: "clap", name: "박수", icon: "👏", dur: 2.4, seat: true },
  { id: "hurray", name: "만세", icon: "🙌", dur: 2.0, seat: true, say: "만세!" },
  { id: "heart", name: "하트", icon: "💗", dur: 2.6, seat: true, say: "♥" },
  { id: "bow", name: "꾸벅 인사", icon: "🙇", dur: 1.8, seat: false },
  { id: "chest", name: "가슴 튕기기 춤", icon: "🕺", dur: 4.4, seat: false, dance: true, say: "♪" }
];
const CHEST_BPM = 2.25; // beats per second

// pose overrides, blended in and out over the emote's length
function emotePose(v, i, t, standing) {
  const E = EMOTES[i]; if (!E || t < 0 || t > E.dur) return;
  const env = clamp(Math.min(t / .2, (E.dur - t) / .25), 0, 1), to = (k, val) => { v[k] += (val - v[k]) * env; };
  // arms are short next to the big head, so raises go out to the side where they stay visible
  if (E.id === "wave") { to("arR", .35); to("azR", 2.05 + Math.sin(t * 11) * .35); v.nod += .06 * env; }
  else if (E.id === "clap") { const c = Math.abs(Math.sin(t * 8)); to("arL", 1.2); to("arR", 1.2); to("azL", .25 - .55 * c); to("azR", .25 - .55 * c); }
  else if (E.id === "hurray") { to("arL", .25); to("arR", .25); to("azL", 2.45); to("azR", 2.45); if (standing) v.lift += Math.abs(Math.sin(t * 7)) * .12 * env; }
  else if (E.id === "heart") { to("arL", 1.25); to("arR", 1.25); to("azL", -.42); to("azR", -.42); v.nod += .1 * env; }
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
}
function activeEmote(em) {
  if (!em || !EMOTES[em.i]) return null;
  const t = (Date.now() - em.at) / 1000; return t >= 0 && t <= EMOTES[em.i].dur ? { i: em.i, t } : null;
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
  else if (E.id === "clap") n = Math.floor((a.t * 8 - Math.PI / 2) / Math.PI);
  if (n < 0 || emoteTick[key] === n) return; emoteTick[key] = n;
  if (E.id === "chest") audio.beat(v, n % 2 === 0); else audio.clapHit(v);
}

/* menu inside the 말하기 panel */
{
  const mk = (E, i) => { const b = document.createElement("button"); b.dataset.e = i; const s = document.createElement("span"); s.textContent = E.icon; s.className = "emo"; b.append(s, E.name); return b; };
  EMOTES.forEach((E, i) => (E.dance ? $("danceGrid") : $("emoteGrid")).appendChild(mk(E, i)));
  [$("emoteGrid"), $("danceGrid")].forEach(g => g.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return; playEmote(+b.dataset.e);
    $("chatPanel").hidden = true; $("chatBtn").setAttribute("aria-expanded", "false");
  }));
}
function playEmote(i) {
  const E = EMOTES[i]; if (!started || !myAvatar || !E) return;
  const standing = me.st === "walk" && !me.moving && !anim && !boarded;
  const seated = me.st === "sit" || me.st === "bench" || me.st === "stool";
  if (!(standing || (E.seat && seated))) { toast(E.seat ? "서 있거나 앉아 있을 때 할 수 있어요" : "멈춰 서 있을 때 할 수 있어요"); return; }
  if (me.hold) { toast("손에 든 걸 먼저 다 먹어 주세요"); return; }
  me.em = { i, at: Date.now() };
  if (E.say) showBubble(() => myAvatar, E.say, Math.min(E.dur, 2.4), "me");
  if (audio.ready && (E.id === "hurray" || E.id === "heart" || E.id === "wave")) audio.pop();
  publish(true);
}
function updateEmotes() {
  if (me.em && (me.moving || anim || boarded || !activeEmote(me.em))) { if (me.moving || anim || boarded) { me.em = null; publish(true); } }
  emoteSfx("me", activeEmote(me.em), 0);
  for (const [peer, o] of others) {
    const em = o.p.em, a = activeEmote(em);
    if (em && o.lastEm !== em.at) { o.lastEm = em.at; const E = EMOTES[em.i]; if (a && E && E.say) { const id = peer; showBubble(() => (others.get(id) || {}).obj, E.say, Math.min(E.dur, 2.4), id); } }
    emoteSfx(peer, a, Math.hypot(o.x - cam.tx, o.z - cam.tz));
  }
}
