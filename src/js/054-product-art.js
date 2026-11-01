/* ================= 한강 편의점 product packages (our own brands, drawn in code) ================= */
// Each product gets a small package illustration. The same picture is used on shelves,
// in the shop panel and on the item a character is holding.
const PRODUCTS = {
  chips: { name: "감자칩", price: 1500, cat: "snack", color: "#f2c230", eat: 7 },
  shrimp: { name: "새우맛 과자", price: 1700, cat: "snack", color: "#e8613c", eat: 7 },
  choco: { name: "초코쿠키", price: 1200, cat: "snack", color: "#7a4a2d", eat: 6 },
  jelly: { name: "곰젤리", price: 1000, cat: "snack", color: "#e94d8a", eat: 6 },
  water: { name: "생수", price: 900, cat: "drink", color: "#7cc4ef", eat: 5 },
  banana: { name: "바나나우유", price: 1700, cat: "drink", color: "#f6dc5c", eat: 5 },
  cider: { name: "사이다", price: 1500, cat: "drink", color: "#4fbf6a", eat: 5 },
  coffee: { name: "캔커피", price: 1400, cat: "drink", color: "#6b4a3a", eat: 5 },
  icebar: { name: "아이스바", price: 2500, cat: "ice", color: "#8fd3ff", eat: 7 },
  cone: { name: "콘 아이스크림", price: 3000, cat: "ice", color: "#f7c6d9", eat: 8 },
  mochi: { name: "찹쌀떡 아이스", price: 3500, cat: "ice", color: "#f3efe4", eat: 7 },
  gangjeong: { name: "닭강정 컵", price: 6500, cat: "chicken", color: "#c4632a", eat: 10 },
  chicken: { name: "순살치킨", price: 8000, cat: "chicken", color: "#d9893a", eat: 11 }
};
const CATS = {
  snack: { title: "과자 진열대", verb: "과자 고르기", items: ["chips", "shrimp", "choco", "jelly"] },
  drink: { title: "음료 냉장고", verb: "음료 고르기", items: ["water", "banana", "cider", "coffee"] },
  ice: { title: "아이스크림 냉동고", verb: "아이스크림 고르기", items: ["icebar", "cone", "mochi"] },
  chicken: { title: "따끈한 치킨", verb: "치킨 고르기", items: ["gangjeong", "chicken"] }
};
const won = n => n.toLocaleString("ko-KR") + "원";
const PRODUCT_IMG = {}, PRODUCT_TEX = {}, PRODUCT_URL = {};
function rr(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
function label(x, text, cx, cy, size, col, weight = "bold", font = "'Gowun Dodum', sans-serif") { x.font = `${weight} ${size}px ${font}`; x.fillStyle = col; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, cx, cy); }
function shine(x, a, b, w, h) { const g = x.createLinearGradient(a, 0, a + w, 0); g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(.35, "rgba(255,255,255,.28)"); g.addColorStop(.5, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(a, b, w, h); }
function bag(x, w, h, c1, c2) { // crimped snack bag
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, c1); g.addColorStop(1, c2); x.fillStyle = g; rr(x, 8, 10, w - 16, h - 20, 14); x.fill();
  x.fillStyle = "rgba(0,0,0,.12)"; for (let i = 12; i < w - 12; i += 6) { x.fillRect(i, 10, 3, 9); x.fillRect(i, h - 19, 3, 9); }
}
const ART = {
  chips(x, w, h) {
    bag(x, w, h, "#ffd23f", "#f2a81d");
    label(x, "한강칩", w / 2, 36, 22, "#c0262d"); label(x, "오리지널", w / 2, 56, 12, "#7a3b10");
    for (let i = 0; i < 6; i++) { x.save(); x.translate(30 + (i % 3) * 34, 92 + Math.floor(i / 3) * 26); x.rotate(i * .7); x.fillStyle = "#fff0b8"; x.beginPath(); x.ellipse(0, 0, 17, 11, 0, 0, 7); x.fill(); x.strokeStyle = "#e6b84a"; x.lineWidth = 2; x.stroke(); x.fillStyle = "#d9a441"; x.fillRect(-4, -2, 3, 3); x.restore(); }
    label(x, "감자칩", w / 2, h - 32, 15, "#7a3b10");
  },
  shrimp(x, w, h) {
    bag(x, w, h, "#ff6b3d", "#d83b1f");
    label(x, "새우랑", w / 2, 36, 22, "#fff6d6");
    x.strokeStyle = "#ffcf9e"; x.lineCap = "round";
    for (let i = 0; i < 5; i++) { x.lineWidth = 9; x.beginPath(); x.moveTo(26 + i * 18, 70 + (i % 2) * 8); x.lineTo(34 + i * 18, 112 - (i % 2) * 6); x.stroke(); }
    x.save(); x.translate(w / 2, 96); x.strokeStyle = "#ff9a5c"; x.lineWidth = 12; x.beginPath(); x.arc(0, 0, 20, Math.PI * .2, Math.PI * 1.4); x.stroke(); x.fillStyle = "#3a1a0a"; x.beginPath(); x.arc(13, -12, 3, 0, 7); x.fill(); x.restore();
    label(x, "새우맛 과자", w / 2, h - 32, 14, "#fff6d6");
  },
  choco(x, w, h) {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#7a4a2d"); g.addColorStop(1, "#4b2a17"); x.fillStyle = g; rr(x, 10, 14, w - 20, h - 26, 6); x.fill();
    x.fillStyle = "#f4e3c8"; x.fillRect(10, 26, w - 20, 26); label(x, "초코쿠키", w / 2, 40, 18, "#5a3018");
    for (let i = 0; i < 3; i++) { const cx = 34 + i * 30, cy = 92 + (i % 2) * 14; x.fillStyle = "#c8915a"; x.beginPath(); x.arc(cx, cy, 16, 0, 7); x.fill(); x.fillStyle = "#3a1d0f"; for (let k = 0; k < 5; k++) x.fillRect(cx - 9 + (k * 7) % 16, cy - 8 + (k * 5) % 14, 4, 4); }
    label(x, "바삭 초코칩", w / 2, h - 28, 13, "#f4e3c8");
  },
  jelly(x, w, h) {
    bag(x, w, h, "#ff8cc0", "#e94d8a");
    label(x, "곰젤리", w / 2, 36, 22, "#ffffff");
    const cols = ["#ff4d4d", "#ffd23f", "#59c46b", "#ff9a3d", "#8a6cf0"];
    for (let i = 0; i < 5; i++) { const cx = 28 + (i % 3) * 36, cy = 84 + Math.floor(i / 3) * 34; x.fillStyle = cols[i]; x.beginPath(); x.arc(cx, cy, 11, 0, 7); x.arc(cx - 8, cy - 10, 5, 0, 7); x.arc(cx + 8, cy - 10, 5, 0, 7); x.fill(); x.beginPath(); x.ellipse(cx, cy + 14, 11, 9, 0, 0, 7); x.fill(); }
    label(x, "새콤달콤", w / 2, h - 32, 13, "#ffffff");
  },
  water(x, w, h) {
    x.fillStyle = "rgba(200,232,248,.9)"; rr(x, 34, 22, w - 68, h - 34, 16); x.fill(); x.fillStyle = "#2f6fd8"; x.fillRect(48, 6, w - 96, 18);
    x.fillStyle = "#ffffff"; x.fillRect(34, 70, w - 68, 44); label(x, "한강수", w / 2, 84, 17, "#2f6fd8"); label(x, "생수 500ml", w / 2, 104, 11, "#2f6fd8");
    x.fillStyle = "#7cc4ef"; x.beginPath(); x.moveTo(w / 2, 40); x.quadraticCurveTo(w / 2 + 12, 58, w / 2, 62); x.quadraticCurveTo(w / 2 - 12, 58, w / 2, 40); x.fill();
    shine(x, 34, 22, w - 68, h - 34);
  },
  banana(x, w, h) {
    x.fillStyle = "#f6dc5c"; rr(x, 22, 30, w - 44, h - 40, 8); x.fill(); x.fillStyle = "#e9c63a"; x.beginPath(); x.moveTo(22, 34); x.lineTo(w / 2, 8); x.lineTo(w - 22, 34); x.fill();
    x.fillStyle = "#ffffff"; x.fillRect(22, 52, w - 44, 30); label(x, "바나나", w / 2, 62, 16, "#c58b00"); label(x, "우유", w / 2, 76, 12, "#c58b00");
    x.strokeStyle = "#ffcf1f"; x.lineWidth = 12; x.lineCap = "round"; x.beginPath(); x.arc(w / 2, 92, 22, Math.PI * .15, Math.PI * .85); x.stroke(); x.fillStyle = "#6b4a1a"; x.fillRect(w / 2 + 18, 100, 5, 5);
  },
  cider(x, w, h) {
    x.fillStyle = "rgba(80,200,110,.85)"; rr(x, 36, 30, w - 72, h - 40, 14); x.fill(); x.fillRect(52, 12, w - 104, 22); x.fillStyle = "#1e8a4c"; x.fillRect(48, 4, w - 96, 10);
    x.fillStyle = "#ffffff"; x.fillRect(36, 70, w - 72, 40); label(x, "시원 사이다", w / 2, 90, 13, "#1e8a4c");
    x.fillStyle = "rgba(255,255,255,.7)"; for (let i = 0; i < 9; i++) { x.beginPath(); x.arc(44 + (i * 13) % 40, 120 + (i * 7) % 24, 2 + i % 3, 0, 7); x.fill(); }
    shine(x, 36, 30, w - 72, h - 40);
  },
  coffee(x, w, h) {
    const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, "#5a3d2e"); g.addColorStop(.5, "#8a6450"); g.addColorStop(1, "#4a3022"); x.fillStyle = g; rr(x, 34, 18, w - 68, h - 28, 10); x.fill();
    x.fillStyle = "#d8d8d8"; x.fillRect(34, 18, w - 68, 10); x.fillRect(34, h - 20, w - 68, 8);
    label(x, "한강", w / 2, 52, 14, "#f4e3c8"); label(x, "캔커피", w / 2, 72, 16, "#ffffff");
    x.fillStyle = "#2b170e"; x.beginPath(); x.ellipse(w / 2, 108, 12, 17, .3, 0, 7); x.fill(); x.strokeStyle = "#8a6450"; x.lineWidth = 2; x.beginPath(); x.moveTo(w / 2 - 4, 94); x.quadraticCurveTo(w / 2 + 4, 108, w / 2 - 2, 122); x.stroke();
  },
  icebar(x, w, h) {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#8fd3ff"); g.addColorStop(1, "#3b8fd8"); x.fillStyle = g; rr(x, 14, 30, w - 28, h - 60, 10); x.fill();
    x.fillStyle = "rgba(255,255,255,.9)"; for (let i = 18; i < w - 18; i += 8) { x.beginPath(); x.arc(i, 30, 4, 0, 7); x.arc(i, h - 30, 4, 0, 7); x.fill(); }
    label(x, "쿨바", w / 2, 52, 22, "#ffffff");
    x.fillStyle = "#d9f3ff"; rr(x, w / 2 - 16, 68, 32, 46, 12); x.fill(); x.fillStyle = "#e6cfa3"; x.fillRect(w / 2 - 4, 112, 8, 16);
    label(x, "소다맛", w / 2, h - 44, 12, "#ffffff");
  },
  cone(x, w, h) {
    x.fillStyle = "#f7c6d9"; x.beginPath(); x.moveTo(18, 12); x.lineTo(w - 18, 12); x.lineTo(w / 2 + 14, h - 8); x.lineTo(w / 2 - 14, h - 8); x.fill();
    label(x, "콘콘", w / 2, 32, 20, "#c0265a");
    x.fillStyle = "#d9a35e"; x.beginPath(); x.moveTo(w / 2 - 18, 80); x.lineTo(w / 2 + 18, 80); x.lineTo(w / 2, 126); x.fill();
    x.strokeStyle = "#b07a3a"; x.lineWidth = 2; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(w / 2 - 16 + i * 6, 82); x.lineTo(w / 2 + 2 + i * 4, 112); x.stroke(); }
    x.fillStyle = "#fff4f8"; x.beginPath(); x.arc(w / 2, 72, 20, 0, 7); x.fill(); x.fillStyle = "#e94d8a"; x.beginPath(); x.arc(w / 2 + 6, 64, 5, 0, 7); x.fill();
  },
  mochi(x, w, h) {
    x.fillStyle = "#fbf6ea"; rr(x, 10, 22, w - 20, h - 34, 8); x.fill(); x.fillStyle = "#c0262d"; x.fillRect(10, 22, w - 20, 26);
    label(x, "찹쌀떡 아이스", w / 2, 36, 14, "#ffffff");
    [[w / 2 - 20, 92], [w / 2 + 20, 92]].forEach(([cx, cy]) => { x.fillStyle = "#ffffff"; x.beginPath(); x.ellipse(cx, cy, 19, 16, 0, 0, 7); x.fill(); x.strokeStyle = "#e7e0cf"; x.lineWidth = 2; x.stroke(); x.fillStyle = "#f2d6dd"; x.beginPath(); x.ellipse(cx - 5, cy - 4, 6, 4, 0, 0, 7); x.fill(); });
    label(x, "2개입", w / 2, h - 26, 12, "#c0262d");
  },
  gangjeong(x, w, h) {
    x.fillStyle = "#ffffff"; x.beginPath(); x.moveTo(18, 40); x.lineTo(w - 18, 40); x.lineTo(w - 30, h - 8); x.lineTo(30, h - 8); x.fill();
    x.fillStyle = "#d8322f"; x.fillRect(22, 92, w - 44, 22); label(x, "닭강정", w / 2, 103, 14, "#ffffff");
    for (let i = 0; i < 7; i++) { const cx = 28 + (i * 17) % 76, cy = 24 + (i % 3) * 9; const g = x.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, 12); g.addColorStop(0, "#f0a24a"); g.addColorStop(1, "#a8401a"); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, 11, 0, 7); x.fill(); }
    x.fillStyle = "#f7e7c0"; for (let i = 0; i < 10; i++) x.fillRect(26 + (i * 11) % 78, 18 + (i * 7) % 26, 2, 2);
  },
  chicken(x, w, h) {
    x.fillStyle = "#ffffff"; rr(x, 12, 44, w - 24, h - 52, 6); x.fill(); x.fillStyle = "#d8322f"; for (let i = 12; i < w - 12; i += 16) x.fillRect(i, 44, 8, h - 52);
    x.fillStyle = "#ffffff"; x.fillRect(20, 96, w - 40, 26); label(x, "순살치킨", w / 2, 109, 15, "#d8322f");
    for (let i = 0; i < 6; i++) { const cx = 26 + (i * 19) % 80, cy = 30 + (i % 2) * 12; const g = x.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, 15); g.addColorStop(0, "#f3c27a"); g.addColorStop(1, "#b9682a"); x.fillStyle = g; x.beginPath(); x.ellipse(cx, cy, 15, 12, i, 0, 7); x.fill(); }
  }
};
for (const k in PRODUCTS) {
  const c = document.createElement("canvas"); c.width = 128; c.height = 160; const x = c.getContext("2d");
  (ART[k] || ART.chips)(x, 128, 160);
  PRODUCT_IMG[k] = c;
  try { PRODUCT_URL[k] = c.toDataURL("image/png"); } catch (e) { PRODUCT_URL[k] = ""; }
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; PRODUCT_TEX[k] = t;
}
// shelf faces, fridge doors and freezer tops filled with these packages
function packShelf(keys, w, h, rows, seed, opts = {}) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d"), r = rand(seed);
  x.fillStyle = opts.bg || "#e9ecef"; x.fillRect(0, 0, w, h);
  const rh = h / rows;
  for (let row = 0; row < rows; row++) {
    const ih = rh * .78, iw = ih * .8; let px = 6, kk = Math.floor(r() * keys.length);
    while (px + iw < w - 4) {
      const k = keys[kk % keys.length]; kk++;
      const facings = 2 + Math.floor(r() * 2);
      for (let f = 0; f < facings && px + iw < w - 4; f++) { x.drawImage(PRODUCT_IMG[k], px, row * rh + rh - 10 - ih, iw, ih); px += iw - 2; }
      if (opts.tags) { x.fillStyle = "#fffbe6"; x.fillRect(px - iw * facings + iw * .3, row * rh + rh - 9, iw * .7, 7); x.fillStyle = "#d8322f"; x.font = "bold 7px sans-serif"; x.textAlign = "left"; x.fillText(won(PRODUCTS[k].price), px - iw * facings + iw * .32, row * rh + rh - 3.5); }
      px += 6;
    }
    x.fillStyle = opts.rail || "#ffe066"; x.fillRect(0, row * rh + rh - 10, w, 3); x.fillStyle = "#c9ced4"; x.fillRect(0, row * rh + rh - 3, w, 3);
  }
  if (opts.frames) { x.strokeStyle = "#8a959f"; x.lineWidth = 6; for (let i = 0; i <= opts.frames; i++) { x.beginPath(); x.moveTo(i * w / opts.frames, 0); x.lineTo(i * w / opts.frames, h); x.stroke(); } x.strokeRect(0, 0, w, h); x.fillStyle = "rgba(200,230,255,.12)"; x.fillRect(0, 0, w, h); }
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
}
