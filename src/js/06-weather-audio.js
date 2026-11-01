/* ================= weather particles ================= */
const RAIN_N = 1400, rainPos = new Float32Array(RAIN_N * 6);
for (let i = 0; i < RAIN_N; i++) { const x = (Math.random() - .5) * 70, y = Math.random() * 30, z = (Math.random() - .5) * 70; rainPos.set([x, y, z, x, y - 0.7, z], i * 6); }
const rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xbfd3e6, transparent: true, opacity: 0.45 })); rain.frustumCulled = false; rain.visible = false; scene.add(rain);
const SNOW_N = 1200, snowPos = new Float32Array(SNOW_N * 3);
for (let i = 0; i < SNOW_N; i++) snowPos.set([(Math.random() - .5) * 70, Math.random() * 30, (Math.random() - .5) * 70], i * 3);
const snowGeo = new THREE.BufferGeometry(); snowGeo.setAttribute("position", new THREE.BufferAttribute(snowPos, 3));
const snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.16, transparent: true, opacity: 0.9 })); snow.frustumCulled = false; snow.visible = false; scene.add(snow);
const splashN = 40, splashPos = new Float32Array(splashN * 3), splashVel = [];
const splashGeo = new THREE.BufferGeometry(); splashGeo.setAttribute("position", new THREE.BufferAttribute(splashPos, 3));
const splash = new THREE.Points(splashGeo, new THREE.PointsMaterial({ color: 0xdff1ff, size: 0.22, transparent: true, opacity: 0 })); splash.frustumCulled = false; scene.add(splash);
let splashT = 9;
function doSplash(x, z) {
  for (let i = 0; i < splashN; i++) { splashPos.set([x, -0.5, z], i * 3); const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 2.5; splashVel[i] = [Math.cos(a) * s, 3 + Math.random() * 4, Math.sin(a) * s]; }
  splashGeo.attributes.position.needsUpdate = true; splashT = 0; if (audio.ready) audio.splash();
}

/* ================= audio ================= */
const audio = { ready: false, muted: false };
audio.init = function () {
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  const ac = this.ac = new AC();
  this.master = ac.createGain(); this.master.gain.value = 0.9; this.master.connect(ac.destination);
  const bus = v => { const g = ac.createGain(); g.gain.value = v; g.connect(this.master); return g; };
  this.water = bus(0.7); this.nature = bus(0.55); this.animal = bus(0.45); this.sfx = bus(0.6);
  const len = ac.sampleRate * 4;
  const mk = type => {
    const b = ac.createBuffer(2, len, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch); let last = 0, b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        if (type === "brown") { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; }
        else { b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0526; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.12; }
      }
    }
    return b;
  };
  this.brown = mk("brown"); this.pink = mk("pink");
  const loop = (buf, nodes, dest) => { const s = ac.createBufferSource(); s.buffer = buf; s.loop = true; let n = s; nodes.forEach(x => { n.connect(x); n = x; }); n.connect(dest); s.start(); };
  const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 520;
  const wg = ac.createGain(); wg.gain.value = 0.55;
  const lfo = ac.createOscillator(), lfoG = ac.createGain(); lfo.frequency.value = 0.07; lfoG.gain.value = 0.18; lfo.connect(lfoG); lfoG.connect(wg.gain); lfo.start();
  loop(this.brown, [lp, wg], this.water);
  const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 850; bp.Q.value = 0.8;
  this.lap = ac.createGain(); this.lap.gain.value = 0; loop(this.pink, [bp, this.lap], this.water);
  const hp = ac.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1400;
  this.wind = ac.createGain(); this.wind.gain.value = 0.05;
  const wl = ac.createOscillator(), wlg = ac.createGain(); wl.frequency.value = 0.045; wlg.gain.value = 0.035; wl.connect(wlg); wlg.connect(this.wind.gain); wl.start();
  loop(this.pink, [hp, this.wind], this.nature);
  const rh = ac.createBiquadFilter(); rh.type = "highpass"; rh.frequency.value = 700;
  this.rainG = ac.createGain(); this.rainG.gain.value = 0; loop(this.pink, [rh, this.rainG], this.nature);
  this.ready = true; this.onEnv(); this.schedule();
};
audio.pan = function (p) { const n = this.ac.createStereoPanner ? this.ac.createStereoPanner() : this.ac.createGain(); if (n.pan) n.pan.value = p; return n; };
audio.lapOnce = function () { const t = this.ac.currentTime, g = this.lap.gain, d = 0.8 + Math.random() * 1.2; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0.12 + Math.random() * 0.14, t + d * 0.35); g.linearRampToValueAtTime(0.0001, t + d); };
audio.tone = function (dest, type, f0, f1, dur, vol, t0) {
  const ac = this.ac, t = t0 || ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.8);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.02, dur * 0.2)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.02);
};
audio.bird = function () {
  const out = this.pan(Math.random() * 1.6 - 0.8); out.connect(this.nature);
  const n = 2 + Math.floor(Math.random() * 5), base = 2600 + Math.random() * 1800, up = Math.random() < 0.5;
  for (let i = 0; i < n; i++) { const f = base * (0.9 + Math.random() * 0.3); this.tone(out, "sine", up ? f : f * 1.35, up ? f * 1.4 : f * 0.8, 0.1, 0.09, this.ac.currentTime + i * (0.11 + Math.random() * 0.08)); }
};
audio.cricket = function () {
  const out = this.pan(Math.random() * 1.4 - 0.7); out.connect(this.nature); const f = 4300 + Math.random() * 500;
  for (let r = 0; r < 3; r++) for (let i = 0; i < 3; i++) this.tone(out, "sine", f, f, 0.035, 0.035, this.ac.currentTime + r * 0.55 + i * 0.045);
};
audio.voice = function (dest, p, d, f0, f1, f2, form) {
  const ac = this.ac, t = ac.currentTime, o = ac.createOscillator(), bp = ac.createBiquadFilter(), lp = ac.createBiquadFilter(), g = ac.createGain();
  o.type = "sawtooth"; bp.type = "bandpass"; bp.Q.value = 3.5; lp.type = "lowpass"; lp.frequency.value = 2600;
  o.frequency.setValueAtTime(f0 * p, t); o.frequency.linearRampToValueAtTime(f1 * p, t + d * 0.35); o.frequency.linearRampToValueAtTime(f2 * p, t + d);
  bp.frequency.setValueAtTime(form[0], t); bp.frequency.linearRampToValueAtTime(form[1], t + d * 0.3); bp.frequency.linearRampToValueAtTime(form[2], t + d);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.2, t + 0.05); g.gain.setValueAtTime(0.2, t + d * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(bp); bp.connect(lp); lp.connect(g); g.connect(dest); o.start(t); o.stop(t + d + 0.05);
};
audio.meow = function () { const out = this.pan(Math.random() * 1.6 - 0.8); out.connect(this.animal); this.voice(out, 0.9 + Math.random() * 0.3, 0.7 + Math.random() * 0.3, 400, 640, 430, [800, 1500, 700]); };
audio.quack = function () { [0, 220].forEach(ms => setTimeout(() => { if (this.ready) this.voice(this.animal, 1, 0.18, 300, 260, 220, [1100, 900, 700]); }, ms)); };
audio.bark = function () {
  const ac = this.ac, out = this.pan(Math.random() * 1.2 - 0.6); out.connect(this.animal);
  const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1700; lp.connect(out);
  const n = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < n; i++) {
    const t = ac.currentTime + i * 0.28; this.tone(lp, "sawtooth", 330, 170, 0.17, 0.3, t);
    const s = ac.createBufferSource(); s.buffer = this.pink; const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 900; bp.Q.value = 1.2; const ng = ac.createGain();
    ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(0.5, t + 0.008); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    s.connect(bp); bp.connect(ng); ng.connect(lp); s.start(t, Math.random() * 3); s.stop(t + 0.15);
  }
};
audio.splash = function () {
  const ac = this.ac, t = ac.currentTime, s = ac.createBufferSource(); s.buffer = this.pink;
  const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.setValueAtTime(1800, t); bp.frequency.exponentialRampToValueAtTime(400, t + 0.7); bp.Q.value = 0.7;
  const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1.6, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
  s.connect(bp); bp.connect(g); g.connect(this.water); s.start(t, Math.random()); s.stop(t + 1);
  this.tone(this.water, "sine", 520, 140, 0.25, 0.3, t);
};
audio.step = function (surf, side) {
  const p = side ? 1 : 1.07, t = this.ac.currentTime;
  if (surf === "grass") { this.tone(this.sfx, "sine", 430 * p, 300 * p, 0.07, 0.07, t); }
  else if (surf === "path") { this.tone(this.sfx, "triangle", 640 * p, 470 * p, 0.06, 0.07, t); }
  else if (surf === "deck") { this.tone(this.sfx, "sine", 920 * p, 700 * p, 0.07, 0.08, t); this.tone(this.sfx, "sine", 1840 * p, 1400 * p, 0.05, 0.02, t); }
  else { this.tone(this.sfx, "triangle", 520 * p, 380 * p, 0.09, 0.1, t); }
};
audio.paddle = function () {
  const ac = this.ac, t = ac.currentTime, s = ac.createBufferSource(); s.buffer = this.pink;
  const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1200; bp.Q.value = 1;
  const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
  s.connect(bp); bp.connect(g); g.connect(this.sfx); s.start(t, Math.random() * 3); s.stop(t + 0.4);
};
audio.bell = function (vol) {
  if (vol <= 0.01) return; const t = this.ac.currentTime;
  [0, 0.13].forEach(d => { this.tone(this.sfx, "sine", 2950, 2900, 0.7, 0.12 * vol, t + d); this.tone(this.sfx, "sine", 4400, 4350, 0.4, 0.05 * vol, t + d); });
};
audio.pop = function () { this.tone(this.sfx, "sine", 620, 940, 0.09, 0.08); };
audio.speak = function (text, vol) {
  try {
    if (this.muted || vol <= 0.05 || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(String(text).replace(/[~!?.,\u223C\uFF5E]/g, "").trim()); u.lang = "ko-KR"; u.pitch = 1.3; u.rate = 1.2; u.volume = clamp(vol, 0, 1);
    const v = speechSynthesis.getVoices().find(v => /^ko/i.test(v.lang)); if (v) u.voice = v;
    speechSynthesis.speak(u);
  } catch (e) {}
};
audio.click = function () { this.tone(this.sfx, "square", 1400, 1300, .04, .05); };
audio.ding = function () { const t = this.ac.currentTime; this.tone(this.sfx, "sine", 1320, 1320, .5, .14, t); this.tone(this.sfx, "sine", 1760, 1760, .7, .12, t + .16); };
audio.bubble = function (v) { this.tone(this.sfx, "sine", 260 + Math.random() * 380, 600 + Math.random() * 500, .05, .05 * v); };
audio.slurp = function (v) {
  const ac = this.ac, t = ac.currentTime, s = ac.createBufferSource(); s.buffer = this.pink;
  const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 4; bp.frequency.setValueAtTime(500, t); bp.frequency.exponentialRampToValueAtTime(2600, t + .45);
  const g = ac.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.9 * v + .001, t + .08); g.gain.exponentialRampToValueAtTime(.0001, t + .5);
  s.connect(bp); bp.connect(g); g.connect(this.sfx); s.start(t, Math.random() * 3); s.stop(t + .55);
};
audio.chomp = function (v) { const t = this.ac.currentTime; [0, .17].forEach(d => this.tone(this.sfx, "triangle", 210, 120, .07, .16 * v + .001, t + d)); };
audio.chime = function () { const t = this.ac.currentTime; this.tone(this.sfx, "sine", 1046, 1046, .5, .12, t); this.tone(this.sfx, "sine", 784, 784, .7, .12, t + .28); };
audio.beep = function () { this.tone(this.sfx, "square", 2400, 2400, .07, .05); };
audio.alarm = function () { const t = this.ac.currentTime; for (let i = 0; i < 4; i++) this.tone(this.sfx, "square", 1800, 1800, .12, .06, t + i * .18); };
audio.crunch = function (v) {
  const ac = this.ac, t = ac.currentTime;
  for (let i = 0; i < 3; i++) { const s = ac.createBufferSource(); s.buffer = this.pink; const hp = ac.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 2200; const g = ac.createGain(), t0 = t + i * .07;
    g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(.7 * v + .001, t0 + .005); g.gain.exponentialRampToValueAtTime(.0001, t0 + .05);
    s.connect(hp); hp.connect(g); g.connect(this.sfx); s.start(t0, Math.random() * 3); s.stop(t0 + .06); }
};
audio.gulp = function (v) { const t = this.ac.currentTime; [0, .22].forEach(d => this.tone(this.sfx, "sine", 180, 420, .12, .2 * v + .001, t + d)); };
audio.clink = function (v) {
  const t = this.ac.currentTime;
  [[2380, .5], [3170, .38], [4460, .22], [5820, .12]].forEach(([f, a]) => { this.tone(this.sfx, "sine", f, f * .996, 1.1, a * .3 * v + .001, t); this.tone(this.sfx, "sine", f * 1.013, f * 1.01, .8, a * .2 * v + .001, t + .09); });
};
audio.boom = function (v, delay) {
  const ac = this.ac, t = ac.currentTime + (delay || 0);
  const s = ac.createBufferSource(); s.buffer = this.brown; const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(90, t + 1.2);
  const g = ac.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.9 * v + .001, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + 1.6);
  s.connect(lp); lp.connect(g); g.connect(this.nature); s.start(t, Math.random() * 2); s.stop(t + 1.7);
  for (let i = 0; i < 14; i++) { const c = ac.createBufferSource(); c.buffer = this.pink; const hp = ac.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 3000; const cg = ac.createGain(), t0 = t + .35 + Math.random() * 1.1;
    cg.gain.setValueAtTime(.0001, t0); cg.gain.exponentialRampToValueAtTime(.25 * v + .001, t0 + .004); cg.gain.exponentialRampToValueAtTime(.0001, t0 + .04);
    c.connect(hp); hp.connect(cg); cg.connect(this.nature); c.start(t0, Math.random() * 3); c.stop(t0 + .05); }
};
audio.schedule = function () {
  const every = (fn, lo, hi) => { const go = () => { try { fn(); } catch (e) {} setTimeout(go, (lo + Math.random() * (hi - lo)) * 1000); }; setTimeout(go, (lo * 0.4 + Math.random() * lo) * 1000); };
  every(() => this.lapOnce(), 1.2, 3.6);
  every(() => { if (phase !== "밤" && weather !== "rain") this.bird(); }, 2.5, 9);
  every(() => { if (phase === "밤" && weather !== "rain" && weather !== "snow") this.cricket(); }, 1.4, 4.2);
  every(() => this.meow(), 28, 70);
  every(() => this.bark(), 22, 60);
};
audio.onEnv = function () {
  const t = this.ac.currentTime;
  this.rainG.gain.setTargetAtTime(weather === "rain" ? 0.5 : 0, t, 0.8);
  this.wind.gain.setTargetAtTime(weather === "snow" || weather === "rain" ? 0.09 : phase === "밤" ? 0.03 : 0.05, t, 0.8);
};
audio.setMuted = function (m) { this.muted = m; if (this.ready) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ac.currentTime, 0.15); };

/* ================= apply environment ================= */
let envStreak = 0;
function applyEnv() {
  const k = kst(); hourNow = k.getHours() + k.getMinutes() / 60; phase = phaseLabel(hourNow);
  const T = blend(hourNow), w = weather;
  const overcast = w === "cloudy" ? 0.6 : w === "rain" ? 0.8 : w === "snow" ? 0.65 : w === "fog" ? 0.5 : 0;
  const grey = new THREE.Color(0x8e959d).multiplyScalar(0.25 + 0.75 * Math.min(1, T.hemiI));
  const mix = (hex, amt) => new THREE.Color(hex).lerp(grey, amt);
  skyU.top.value.copy(mix(T.top, overcast)); skyU.mid.value.copy(mix(T.mid, overcast)); skyU.hor.value.copy(mix(T.hor, overcast * 0.9));
  skyU.sunCol.value.set(T.sun).multiplyScalar(1 - overcast * 0.85); skyU.sunDir.value.set(...T.sunDir).normalize();
  skyU.stars.value = T.stars * (1 - overcast); skyU.disk.value = T.disk * (1 - overcast);
  sun.color.set(T.sun); sun.intensity = T.sunI * (1 - overcast * 0.6); sun.position.copy(skyU.sunDir.value).multiplyScalar(200);
  hemi.color.set(T.hemiS).lerp(grey, overcast * 0.5); hemi.groundColor.set(T.hemiG); hemi.intensity = T.hemiI * (1 - overcast * 0.15);
  const fogC = mix(T.fog, overcast * 0.8); scene.fog.color.copy(fogC);
  const near = w === "fog" ? 6 : w === "rain" || w === "snow" ? 30 : 80, farD = w === "fog" ? 150 : w === "rain" ? 380 : w === "snow" ? 420 : 760;
  scene.fog.near = near; scene.fog.far = farD; waterU.fogNear.value = near; waterU.fogFar.value = farD;
  waterU.deep.value.copy(mix(T.deep, overcast * 0.4)); waterU.shallow.value.copy(mix(T.shallow, overcast * 0.4));
  waterU.skyC.value.copy(skyU.mid.value).lerp(skyU.hor.value, 0.5);
  waterU.sunCol.value.copy(skyU.sunCol.value).multiplyScalar(phase === "밤" ? 0.5 : 1); waterU.sunDir.value.copy(skyU.sunDir.value); waterU.fogCol.value.copy(fogC);
  waterU.rough.value = w === "rain" ? 1.6 : 0.9;
  cityM.emissiveIntensity = T.glow; cityM.color.set(T.glow > 0.6 ? 0x3a3f4a : 0x8a909c);
  lampHeadM.color.set(T.lamps > 0.3 ? 0xffd7a0 : 0xbfb9ad);
  const lampsOn = Math.max(T.lamps, overcast > 0.5 ? 0.4 : 0);
  lampLights.forEach(l => l.intensity = lampsOn * 1.4); playerLight.intensity = lampsOn * 0.9;
  bridgeLights.forEach(b => b.m.color.copy(b.base).multiplyScalar(0.35 + T.glow * 0.65));
  envStreak = T.streak * (1 - overcast * 0.3);
  const cloudCol = new THREE.Color(T.hor).lerp(new THREE.Color(0xffffff), 0.5);
  clouds.forEach((c, i) => { c.material.color.copy(cloudCol); c.material.opacity = (0.15 + 0.7 * (1 - T.stars)) * (w === "clear" ? 0.75 : 1) * (w === "fog" ? 0.3 : 1); });
  towerGlow.color.set(T.glow > 0.5 ? 0xffe6b0 : 0xd8d4cc);
  rain.visible = w === "rain"; snow.visible = w === "snow";
  $("timeLabel").textContent = phase; $("clock").textContent = String(k.getHours()).padStart(2, "0") + ":" + String(k.getMinutes()).padStart(2, "0");
  $("weatherLabel").textContent = WEATHER[w];
  document.querySelectorAll("#weatherSeg button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.w === w)));
  if (audio.ready) audio.onEnv();
}

