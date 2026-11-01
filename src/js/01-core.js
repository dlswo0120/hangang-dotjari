"use strict";
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ================= renderer ================= */
const canvas = $("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const LOW_END = matchMedia("(pointer: coarse)").matches;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 2000);
scene.fog = new THREE.Fog(0x1a2236, 80, 760);
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w < h ? 68 : 55; camera.updateProjectionMatrix();
}
addEventListener("resize", resize); resize();

/* ================= time of day (KST) ================= */
const P = {
  night:     { top:0x060b18, mid:0x14203a, hor:0x2b3550, sun:0x9fb6ff, sunI:.45, sunDir:[.35,.55,-.75], hemiS:0x7f93c8, hemiG:0x2a3326, hemiI:.95, fog:0x1a2236, deep:0x070d1a, shallow:0x16233a, glow:.8, lamps:1, stars:1, streak:1, disk:.5 },
  dawn:      { top:0x26335c, mid:0x7b7aa0, hor:0xe8a98e, sun:0xffb48a, sunI:.6, sunDir:[.6,.08,-1], hemiS:0xb0a8c8, hemiG:0x3a4436, hemiI:.8, fog:0x9c95aa, deep:0x22304a, shallow:0x6a6a86, glow:.45, lamps:.5, stars:.25, streak:.5, disk:1 },
  morning:   { top:0x5d9ad4, mid:0xb2d4ea, hor:0xf4e7d4, sun:0xfff0d6, sunI:1.1, sunDir:[.5,.45,-.75], hemiS:0xd4e6f6, hemiG:0x5d7a45, hemiI:.9, fog:0xd6e2e8, deep:0x2c5c74, shallow:0x5590a8, glow:.06, lamps:0, stars:0, streak:0, disk:1 },
  day:       { top:0x5b9fd8, mid:0xa9d3ee, hor:0xe8f1f2, sun:0xfff4dc, sunI:1.25, sunDir:[.3,.75,-.6], hemiS:0xcfe8ff, hemiG:0x5d7a45, hemiI:.85, fog:0xcfe1ea, deep:0x2b5d72, shallow:0x4f8ea3, glow:.06, lamps:0, stars:0, streak:0, disk:1 },
  afternoon: { top:0x5a90c8, mid:0xb8cfdc, hor:0xf2dcbc, sun:0xffe4b8, sunI:1.15, sunDir:[-.1,.45,-.9], hemiS:0xe0e4e0, hemiG:0x5d7a45, hemiI:.85, fog:0xd8d8d0, deep:0x2b5670, shallow:0x5c8a9a, glow:.1, lamps:0, stars:0, streak:.05, disk:1 },
  sunset:    { top:0x334a7a, mid:0xd98a6a, hor:0xf6c27f, sun:0xffb070, sunI:1.05, sunDir:[-.15,.10,-1], hemiS:0xf0b590, hemiG:0x3e4a35, hemiI:.7, fog:0xd9a07a, deep:0x2a3a55, shallow:0x7a6170, glow:.55, lamps:.6, stars:0, streak:.55, disk:1 },
  dusk:      { top:0x16203e, mid:0x403e64, hor:0xb06a62, sun:0xff9a6a, sunI:.5, sunDir:[-.25,.02,-1], hemiS:0x8a7aa0, hemiG:0x232a22, hemiI:.8, fog:0x4a4058, deep:0x121a30, shallow:0x3a3a58, glow:.85, lamps:1, stars:.4, streak:.9, disk:.6 }
};
const KEYS = [[0,"night"],[4.3,"night"],[5.6,"dawn"],[7.2,"morning"],[11,"day"],[14.5,"day"],[16.5,"afternoon"],[18.3,"sunset"],[19.4,"dusk"],[20.3,"night"],[24,"night"]];
const SCALARS = ["sunI", "hemiI", "glow", "lamps", "stars", "streak", "disk"];
function kst() { const d = new Date(); return new Date(d.getTime() + d.getTimezoneOffset() * 60000 + 9 * 3600000); }
function phaseLabel(h) { return h >= 4 && h < 7 ? "새벽" : h >= 7 && h < 11 ? "아침" : h >= 11 && h < 14 ? "점심" : h >= 14 && h < 17.5 ? "오후" : h >= 17.5 && h < 19.5 ? "노을" : "밤"; }
const cA = new THREE.Color(), cB = new THREE.Color();
function blend(h) {
  let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] <= h) i++;
  const [h0, k0] = KEYS[i], [h1, k1] = KEYS[i + 1], t = h1 > h0 ? clamp((h - h0) / (h1 - h0), 0, 1) : 0;
  const a = P[k0], b = P[k1], o = {};
  for (const k in a) {
    if (Array.isArray(a[k])) o[k] = a[k].map((v, j) => v + (b[k][j] - v) * t);
    else if (SCALARS.includes(k)) o[k] = a[k] + (b[k] - a[k]) * t;
    else o[k] = cA.set(a[k]).lerp(cB.set(b[k]), t).getHex();
  }
  return o;
}
let hourNow = 0, phase = "밤";

/* ================= weather ================= */
const WEATHER = { clear: "맑음", cloudy: "흐림", rain: "비", snow: "눈", fog: "안개" };
let weather = "clear";

/* ================= lights / sky / water ================= */
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, .7); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1); scene.add(sun);
sun.castShadow = true; sun.shadow.mapSize.set(LOW_END ? 1024 : 2048, LOW_END ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 420 });
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
const sunTarget = new THREE.Object3D(); scene.add(sunTarget); sun.target = sunTarget;
const playerLight = new THREE.PointLight(0xffe2b8, 0, 16, 1.5); scene.add(playerLight);
const lampLights = [];
[[-30,6,24],[10,6,24],[50,6,24],[90,6,24]].forEach(p => { const l = new THREE.PointLight(0xffc98a, 0, 34, 1.6); l.position.set(...p); scene.add(l); lampLights.push(l); });

const skyU = { top:{value:new THREE.Color()}, mid:{value:new THREE.Color()}, hor:{value:new THREE.Color()}, sunCol:{value:new THREE.Color()}, sunDir:{value:new THREE.Vector3()}, stars:{value:0}, disk:{value:1}, t:{value:0} };
const sky = new THREE.Mesh(new THREE.SphereGeometry(1200, 32, 16), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false,
  vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `
    uniform vec3 top, mid, hor, sunCol, sunDir; uniform float stars, disk, t; varying vec3 vD;
    float hash(vec3 p){ p=fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
    void main(){
      float y = max(vD.y, 0.0);
      vec3 c = mix(hor, mid, smoothstep(0.0, 0.18, y));
      c = mix(c, top, smoothstep(0.15, 0.7, y));
      if (vD.y < 0.0) c = hor;
      float s = max(dot(normalize(vD), normalize(sunDir)), 0.0);
      c += sunCol * (pow(s, 900.0) * 1.6 * disk + pow(s, 12.0) * 0.28);
      if (stars > 0.0 && vD.y > 0.08) {
        float h = hash(floor(vD * 260.0));
        c += vec3(step(0.9985, h) * (0.6 + 0.4 * sin(t * 2.0 + h * 40.0)) * stars * smoothstep(0.08, 0.3, vD.y));
      }
      gl_FragColor = vec4(c, 1.0);
    }`
}));
scene.add(sky);

const waterU = { t:{value:0}, deep:{value:new THREE.Color()}, shallow:{value:new THREE.Color()}, skyC:{value:new THREE.Color()}, sunCol:{value:new THREE.Color()}, sunDir:{value:new THREE.Vector3()}, fogCol:{value:new THREE.Color()}, camPos:{value:new THREE.Vector3()}, fogNear:{value:80}, fogFar:{value:760}, rough:{value:0.9} };
const water = new THREE.Mesh(new THREE.PlaneGeometry(2400, 300, 1, 1), new THREE.ShaderMaterial({
  uniforms: waterU,
  vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `
    uniform float t, fogNear, fogFar, rough; uniform vec3 deep, shallow, skyC, sunCol, sunDir, fogCol, camPos; varying vec3 vW;
    float h(vec2 p){ return sin(p.x*.09+t*.55)*.5 + sin(p.y*.13-t*.8)*.4 + sin((p.x+p.y)*.27+t*1.3)*.22 + sin((p.x*.7-p.y)*.61-t*1.9)*.1 + sin((p.x*1.3+p.y*.4)*1.1+t*2.4)*.05; }
    void main(){
      vec2 p = vW.xz; float e = .4;
      float dx = (h(p-vec2(e,0.))-h(p+vec2(e,0.)))/(2.*e);
      float dz = (h(p-vec2(0.,e))-h(p+vec2(0.,e)))/(2.*e);
      vec3 n = normalize(vec3(dx*rough, 1., dz*rough));
      vec3 v = normalize(camPos - vW);
      float fres = pow(1. - max(dot(n, v), 0.), 4.);
      vec3 c = mix(deep, shallow, smoothstep(-260., 0., vW.z) * .5 + .2);
      c = mix(c, skyC, clamp(fres * 1.4 + .12, 0., 1.));
      float sp = pow(max(dot(reflect(-v, n), normalize(sunDir)), 0.), 140.);
      c += sunCol * sp * 2.2;
      c = mix(c, fogCol, smoothstep(fogNear, fogFar, length(camPos - vW)));
      gl_FragColor = vec4(c, 1.);
    }`
}));
water.rotation.x = -Math.PI / 2; water.position.set(0, -0.6, -130); scene.add(water);

