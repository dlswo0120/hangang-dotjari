/* ================= 한강 낚시: 데크 · 대여 · 던지기 · 챔질 · 도감 ================= */
const FISH_DECK = { x: 120, half: 6, z0: -2.6 }, ROD_FEE = 1000, ROD_TIME = 30 * 60000, FISH_DAY_CAP = 4000;
const FISH = [
  { k: "bung", name: "붕어", rare: 0, w: 20, cm: [15, 32], col: 0x8a7a4a, pay: 200 },
  { k: "ing", name: "잉어", rare: 0, w: 20, cm: [30, 72], col: 0xb08a40, pay: 200 },
  { k: "nuchi", name: "누치", rare: 0, w: 20, cm: [25, 48], col: 0x9aa0a8, pay: 200 },
  { k: "megi", name: "메기", rare: 1, w: 8, cm: [30, 75], col: 0x55504a, pay: 600 },
  { k: "junchi", name: "강준치", rare: 1, w: 8, cm: [40, 85], col: 0xc8d0d8, pay: 600 },
  { k: "sogari", name: "쏘가리", rare: 1, w: 8, cm: [20, 42], col: 0xb89040, pay: 600 },
  { k: "pirami", name: "피라미", rare: 0, w: 14, cm: [8, 16], col: 0xb8c4cc, pay: 150, desc: "작지만 반짝반짝 빛나요" },
  { k: "bluegill", name: "블루길", rare: 0, w: 10, cm: [12, 24], col: 0x4f7a8a, pay: 300, alien: true, desc: "외래종이라 강에 돌려보내지 않고 수거해요" },
  { k: "bass", name: "배스", rare: 0, w: 9, cm: [25, 55], col: 0x5f7a3a, pay: 300, alien: true, desc: "외래종이라 강에 돌려보내지 않고 수거해요" },
  { k: "kkeuri", name: "끄리", rare: 0, w: 5, cm: [20, 40], col: 0x9aa8b8, pay: 200, body: [.08, .1, .32], desc: "입이 커서 먹이를 덥석 물어요" },
  { k: "moraemuji", name: "모래무지", rare: 0, w: 5, cm: [12, 25], col: 0xc8b48a, pay: 200, body: [.07, .07, .3], desc: "모래 속에 숨어 있다가 걸렸어요" },
  { k: "chammaja", name: "참마자", rare: 0, w: 5, cm: [15, 30], col: 0xa8a090, pay: 200, body: [.07, .08, .3], desc: "몸에 점무늬가 콕콕" },
  { k: "napjaru", name: "납자루", rare: 0, w: 5, cm: [6, 10], col: 0x8a7ad0, pay: 150, body: [.05, .09, .18], desc: "무지갯빛이 도는 작은 물고기예요" },
  { k: "bbaga", name: "동자개", rare: 0, w: 5, cm: [15, 30], col: 0xc89a3a, pay: 200, body: [.09, .08, .28], desc: "빠가빠가 소리를 내서 '빠가사리'라고도 불러요" },
  { k: "sungeo", name: "숭어", rare: 0, w: 5, cm: [30, 70], col: 0x8a96a4, pay: 200, body: [.09, .1, .34], desc: "한강 숭어는 물 위로 점프를 잘해요" },
  { k: "eel", name: "뱀장어", rare: 1, w: 2.5, cm: [40, 90], col: 0x3a4a3a, pay: 600, desc: "미끌미끌… 손에서 자꾸 빠져나가요" },
  { k: "chamge", name: "참게", rare: 1, w: 2.5, cm: [6, 10], col: 0x5a4a34, pay: 600, shape: "up", desc: "털 난 집게발로 낚싯줄을 꽉 잡았어요" },
  { k: "saeu", name: "징거미새우", rare: 1, w: 2.5, cm: [8, 15], col: 0x8a9a7a, pay: 500, shape: "up", desc: "팔이 몸보다 길어요" },
  { k: "jara", name: "자라", rare: 1, w: 2, cm: [20, 35], col: 0x6a7a4a, pay: 700, shape: "up", desc: "놀라서 목을 쏙 집어넣었어요" },
  { k: "gamulchi", name: "가물치", rare: 1, w: 2, cm: [40, 85], col: 0x3f4a3a, pay: 700, body: [.1, .11, .38], desc: "힘이 엄청 세서 팔이 저려요" },
  { k: "ungeo", name: "웅어", rare: 1, w: 2, cm: [20, 30], col: 0xd8dce2, pay: 600, body: [.05, .08, .32], desc: "옛날 한강의 명물이었던 물고기예요" },
  { k: "jjukku", name: "쭈꾸미", rare: 1, w: 4, cm: [12, 24], col: 0x9a6a7a, pay: 600, shape: "up", desc: "민물에 웬 쭈꾸미…? 누가 놓쳤나 봐요" },
  { k: "gold", name: "황금 잉어", rare: 2, w: 2, cm: [55, 95], col: 0xffcf3a, pay: 3000, icon: "✨", ann: true },
  { k: "octo", name: "문어", rare: 2, w: 1.4, cm: [40, 90], col: 0xd2553a, pay: 2000, icon: "🐙", ann: true, shape: "up", desc: "여덟 다리로 낚싯줄을 꽉 붙잡고 버텼어요!" },
  { k: "hwangso", name: "황쏘가리", rare: 2, w: 1, cm: [20, 45], col: 0xf2c230, pay: 2500, icon: "🟡", ann: true, body: [.08, .1, .3], desc: "천연기념물이에요! 사진만 찍고 바로 놓아줘요" },
  { k: "puffer", name: "복어", rare: 2, w: .9, cm: [15, 30], col: 0xd8c27a, pay: 2000, icon: "🐡", ann: true, shape: "up", desc: "화가 나서 빵빵하게 부풀었어요" },
  { k: "sturgeon", name: "철갑상어", rare: 2, w: .7, cm: [80, 160], col: 0x6a7480, pay: 2500, icon: "🦈", ann: true, desc: "공룡 시대부터 살아온 갑옷 물고기예요" },
  { k: "boot", name: "장화", rare: 3, w: 7, cm: [0, 0], col: 0x3a4a3a, pay: 100 },
  { k: "can", name: "깡통", rare: 3, w: 7, cm: [0, 0], col: 0xb0b6bc, pay: 100 },
  { k: "cupra", name: "컵라면 용기", rare: 3, w: 5, cm: [0, 0], col: 0xf4f1ea, pay: 100, desc: "누가 라면 먹고 버렸어요… 분리수거!" },
  { k: "bag", name: "비닐봉지", rare: 3, w: 4, cm: [0, 0], col: 0xdfe8ef, pay: 100, desc: "물고기 같았는데 비닐봉지였어요" },
  { k: "slipper", name: "슬리퍼 한 짝", rare: 3, w: 3, cm: [0, 0], col: 0x3f7fd0, pay: 100, desc: "나머지 한 짝은 어디 갔을까요" },
  { k: "ball", name: "축구공", rare: 3, w: 3, cm: [0, 0], col: 0xffffff, pay: 100, desc: "누가 한강에서 공 차다가 빠뜨렸나 봐요" },
  { k: "umbrella", name: "우산", rare: 3, w: 3, cm: [0, 0], col: 0x3a6fd0, pay: 100, desc: "비 오는 날 날아간 우산이에요" },
  { k: "wheel", name: "자전거 바퀴", rare: 3, w: 2, cm: [0, 0], col: 0x2a2a2a, pay: 100, desc: "자전거는 어디 있을까요…" },
  // deep sea: rare, more likely on a long cast and at night
  { k: "angler", name: "초롱아귀", rare: 5, w: .8, cm: [20, 45], col: 0x3a3f4a, pay: 1500, icon: "🏮", ann: true, deep: true, desc: "심해에서 초롱을 켜고 올라왔어요" },
  { k: "oar", name: "산갈치", rare: 5, w: .5, cm: [180, 420], col: 0xd8dde4, pay: 1500, icon: "🎏", ann: true, deep: true, desc: "길고 은빛인 전설의 심해어예요" },
  { k: "coela", name: "실러캔스", rare: 5, w: .35, cm: [120, 190], col: 0x2f4a7a, pay: 1500, icon: "🦴", ann: true, deep: true, desc: "4억 년 전 모습 그대로인 살아 있는 화석이에요" },
  { k: "jelly", name: "심해 해파리", rare: 5, w: .5, cm: [15, 40], col: 0xb48cff, pay: 1500, icon: "🪼", ann: true, deep: true, shape: "up", desc: "깜깜한 바닷속에서 스스로 빛을 내요" },
  { k: "blob", name: "블롭피쉬", rare: 5, w: .6, cm: [20, 35], col: 0xf0b0b8, pay: 1500, icon: "🫠", ann: true, deep: true, shape: "up", desc: "올라오자마자 시무룩해졌어요" },
  // treasures: very rare, announced to everyone, money ones pay once a day each
  { k: "letter", name: "유리병 편지", rare: 4, w: 1, ann: true, cm: [0, 0], col: 0x9fe0d0, pay: 0, pts: 50, speed: 1.1, icon: "🍾" },
  { ann: true, k: "wallet", name: "지갑", rare: 4, w: .6, cm: [0, 0], col: 0x6b4a33, pay: 1000, pts: 100, speed: 1.2, icon: "👛" },
  { ann: true, k: "ring", name: "금반지", rare: 4, w: .3, cm: [0, 0], col: 0xffcf3a, pay: 2000, pts: 200, speed: 1.5, icon: "💍" },
  { ann: true, k: "chest", name: "보물상자", rare: 4, w: .3, cm: [0, 0], col: 0x8a5a2b, pay: 0, pts: 300, speed: 1.7, icon: "🧰" },
  { ann: true, k: "whale", name: "아기 고래", rare: 4, w: .05, cm: [480, 560], col: 0x3d5a80, pay: 5000, pts: 1000, speed: 2.1, icon: "🐋" }
];
const LETTERS = ["오늘도 고생 많았어요. 한강 바람이 당신 편이에요", "천천히 가도 괜찮아요. 다들 각자의 속도가 있거든요", "누군가 이 편지를 읽고 웃었으면 좋겠어요", "내일은 오늘보다 조금 더 맑을 거예요", "지금 그 자리에 있어 줘서 고마워요"];
const FISH_BY = Object.fromEntries(FISH.map(f => [f.k, f]));
const RARE_LABEL = ["흔해요", "가끔 잡혀요", "아주 드물어요", "강 청소", "보물·전설", "심해어"];
const TENSE = F => F.rare === 2 || F.rare === 4 || F.rare === 5; // the ones that fight back
const onFishDeck = (x, z) => Math.abs(x - FISH_DECK.x) < FISH_DECK.half && z > FISH_DECK.z0 && z < BOUND.landZ0 + .1;

/* the deck and the rod rental box */
{
  const D = FISH_DECK, wood = mat(0x8a6a48);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(D.half * 2, .3, 3.4), wood); deck.position.set(D.x, -.15, -1.1); deck.receiveShadow = true; scene.add(deck);
  for (let x = -D.half + .5; x <= D.half - .5; x += 2.5) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, 1.6, 6), wood); p.position.set(D.x + x, -.6, -2.6); scene.add(p); }
  [-1, 1].forEach(s => { const r = new THREE.Mesh(new THREE.BoxGeometry(.08, .5, 3.2), mat(0x6b4f35)); r.position.set(D.x + s * (D.half - .05), .25, -1.1); r.castShadow = true; scene.add(r); });
  const bx = D.x - D.half - 1.4, bz = 2.4;
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.3, .6), mat(0x2f6fb0)); box.position.set(bx, .65, bz); box.castShadow = true; scene.add(box);
  for (let i = 0; i < 4; i++) { const rod = new THREE.Mesh(new THREE.CylinderGeometry(.012, .02, 1.7, 5), mat(0x3a2a1a)); rod.position.set(bx - .35 + i * .23, 1.3, bz + .32); rod.rotation.x = .12; scene.add(rod); }
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.9, .55), signMat(signTex([["낚싯대 대여", 44, .38], ["30분 1,000원 · 낚시 데크에서", 24, .78]], "#2f6fb0", "#ffffff"))); sign.position.set(bx, 2.35, bz + .31); scene.add(sign);
  const post = new THREE.Mesh(new THREE.BoxGeometry(.08, 1.1, .08), mat(0x3a3d44)); post.position.set(bx, 1.75, bz + .25); scene.add(post);
  OBST.push({ x0: bx - .6, x1: bx + .6, z0: bz - .35, z1: bz + .35 });
  FISH_DECK.box = [bx, bz];
}
const nearRodBox = () => me.level === "ground" && me.st === "walk" && Math.hypot(me.x - FISH_DECK.box[0], me.z - (FISH_DECK.box[1] + 1.1)) < 1.4;

/* dex and daily rewards (this browser) */
const DEX_KEY = "hangang-fishdex";
const dex = (() => { try { return JSON.parse(localStorage.getItem(DEX_KEY) || "{}") || {}; } catch (e) { return {}; } })();
function saveDex() { try { localStorage.setItem(DEX_KEY, JSON.stringify(dex)); } catch (e) {} }
function fishEarnedToday() { return wallet.fishDay === todayKey() ? (wallet.fishEarn || 0) : 0; }

/* rod rental */
function fishActions(acts, status) {
  if (!started || anim || boarded) return status;
  if (me.rod && Date.now() - me.rod.at > ROD_TIME) { endRod("30분이 지나 낚싯대를 반납했어요"); }
  if (nearRodBox()) {
    if (!me.rod) { acts.unshift(["rodrent", "낚싯대 빌리기 · 1,000원", "primary"]); status = "낚싯대 대여 · 30분 1,000원 · 데크 끝에서 던져 보세요"; }
    else acts.unshift(["rodret", "낚싯대 반납하기", ""]);
  }
  if (me.rod && me.st === "walk") {
    if (onFishDeck(me.x, me.z)) acts.unshift(["fish", "낚시하기", "primary"]);
    else if (!status) status = `낚싯대 대여 중 · ${fmt(Math.max(0, (ROD_TIME - (Date.now() - me.rod.at)) / 1000))} 남음 · 낚시 데크로 가 보세요`;
  }
  return status;
}
function fishClick(a) {
  if (a === "rodrent") {
    if (me.hold) { toast("손에 든 걸 먼저 다 먹어 주세요"); return true; }
    if (me.basket) { toast("장바구니를 든 채로는 빌릴 수 없어요"); return true; }
    if (wallet.money < ROD_FEE) { toast("돈이 모자라요. 낚싯대는 30분에 1,000원이에요"); return true; }
    wallet.money -= ROD_FEE; saveWallet(); me.rod = { at: Date.now() }; me.fs = null;
    toast("낚싯대를 빌렸어요! 낚시 데크 끝으로 가서 '낚시하기'를 눌러 보세요"); return true;
  }
  if (a === "rodret") { endRod("낚싯대를 반납했어요"); return true; }
  if (a === "fish") { if (me.hold) { toast("손에 든 걸 먼저 다 먹거나 내려놓아 주세요"); return true; } openFish(); return true; }
  return false;
}
function endRod(msg) { me.rod = null; me.fs = null; closeFish(); toast(msg); publish(true); actKey = ""; }

/* the fishing panel: hold to cast, wait, strike, release */
const fishing = { st: "ready", power: 0, pDir: 1, castAt: 0, biteAt: 0, catch: null, raf: 0 };
function openFish() {
  if (!me.rod) return; me.r = 0; fishing.st = "ready"; fishing.catch = null;
  $("fishModal").hidden = false; $("dexBox").hidden = true; drawFish(); fishLoop();
}
function closeFish() {
  $("fishModal").hidden = true; fishing.st = "ready"; cancelAnimationFrame(fishing.raf);
  if (me.fs && me.fs.s !== "catch") { me.fs = null; publish(true); }
}
function setFs(s, extra) { me.fs = Object.assign({ s, at: Date.now() }, extra || {}); publish(true); }
function drawFish() {
  const st = fishing.st, btn = $("fishBtn"), msg = $("fishMsg"), card = $("fishCard");
  card.hidden = st !== "caught"; $("fishPower").hidden = st !== "charge" && st !== "ready";
  $("fishPowerBar").style.width = Math.round(fishing.power * 100) + "%";
  btn.className = "fish-btn" + (st === "bite" ? " bite" : ""); $("reel").hidden = st !== "bite";
  btn.hidden = st === "caught"; $("fishRelease").hidden = st !== "caught";
  if (st === "ready") { msg.textContent = "버튼을 꾹 눌렀다가 떼면 찌를 던져요"; btn.textContent = "꾹 눌러 던지기"; }
  else if (st === "charge") { msg.textContent = "적당할 때 손을 떼세요!"; btn.textContent = "던질 힘 모으는 중…"; }
  else if (st === "wait") { msg.textContent = "찌를 보고 있어요… 입질이 오면 바로 눌러요"; btn.textContent = "기다리는 중 (누르면 걷어 올려요)"; }
  else if (st === "bite") { const R = fishing.reel; msg.textContent = R.tense && R.alert && Date.now() < R.alert ? "찌가 쑥 빨려 들어가요… 뭔가 커요!" : `걸렸다! 바늘이 초록 칸에 왔을 때 눌러요 (${R.hits}/${R.need} · 헛손질 ${R.miss}/3)`; btn.textContent = "지금 눌러 감기!"; }
  else if (st === "caught" && fishing.catch) {
    const F = FISH_BY[fishing.catch.k], earned = fishEarnedToday(), pay = Math.min(F.pay, Math.max(0, FISH_DAY_CAP - earned));
    msg.textContent = F.rare === 4 ? `${F.icon} 이게 뭐지…?!` : F.rare === 5 ? `${F.icon} 심해에서 뭔가 올라왔어요…!` : F.rare === 3 ? "물고기가 아니라…" : F.rare === 2 ? `${F.icon} 대박! ${F.name}예요!` : "잡았어요!";
    $("fishName").textContent = F.rare === 4 ? `${F.icon} ${F.name}` + (F.k === "whale" ? ` ${fishing.catch.cm}cm` : "") : F.name + (F.rare === 3 ? "" : ` ${fishing.catch.cm}cm`);
    $("fishRare").textContent = RARE_LABEL[F.rare] + (fishing.catch.isNew ? " · 도감에 새로 기록!" : "") + (F.desc ? ` · ${F.desc}` : "");
    if (F.k === "letter") $("fishRare").textContent = `“${fishing.catch.note || LETTERS[0]}”`;
    $("fishIcon").style.background = "#" + F.col.toString(16).padStart(6, "0");
    if (F.rare === 4) $("fishRelease").textContent = fishing.catch.duel ? `대결 점수 +${fishing.catch.pts}점` : ({ letter: "쪽지 간직하기", wallet: "주인에게 돌려주기", ring: "주머니에 넣기", chest: "상자 열기", whale: "고래에게 손 흔들기" })[F.k];
    else $("fishRelease").textContent = (F.rare === 3 ? "쓰레기 버리기" : F.alien ? "외래종 수거하기" : F.rare === 5 ? "심해로 돌려보내기" : "방생하기") + (fishing.catch.duel ? ` (대결 점수 +${fishing.catch.pts}점)` : pay > 0 ? ` (+${won(pay)})` : " (오늘 보상은 다 받았어요)");
  }
}
function fishLoop() {
  cancelAnimationFrame(fishing.raf);
  let last = performance.now();
  const tick = () => {
    if ($("fishModal").hidden) return;
    const now = Date.now(), pn = performance.now(), dt = Math.min(.25, (pn - last) / 1000); last = pn;
    { const dl = $("fishDuel"), d = myDuel(); if (d && d.fd.st === "go") { const left = d.fd.go + FD_TIME - now; dl.hidden = false; dl.textContent = left > FD_TIME ? "대결 준비…" : left > 0 ? `🎣 대결 ${fmt(left / 1000)} · ${fdBoardText(d)}` : "대결 끝!"; } else dl.hidden = true; }
    if (fishing.st === "charge") { fishing.power += fishing.pDir * dt * 1.1; if (fishing.power >= 1) { fishing.power = 1; fishing.pDir = -1; } if (fishing.power <= 0) { fishing.power = 0; fishing.pDir = 1; } $("fishPowerBar").style.width = Math.round(fishing.power * 100) + "%"; }
    if (fishing.st === "wait" && now >= fishing.biteAt) {
      const F = rollFish(), tense = TENSE(F);
      fishing.st = "bite";
      fishing.reel = { F, tense, hits: 0, miss: 0, pos: 0, dir: 1, speed: (F.speed || [1, 1.35, 1.8, .75, 1.7, 2][F.rare]) * (tense ? 1.1 : 1), w: tense ? .14 : REEL_W, need: tense ? 3 : 2, zone: .2 + Math.random() * .55, alert: tense ? now + 1100 : 0, end: now + (tense ? 10000 : 7000), ph: Math.random() * 6 };
      placeReel(); setFs("bite", { bx: me.fs.bx, bz: me.fs.bz, x: tense ? 1 : 0 });
      if (tense) showBubble(() => myAvatar, "…!", 1.4, "me");
      if (audio.ready) { if (tense) { audio.tone(audio.sfx, "square", 180, 140, .3, .12); setTimeout(() => audio.ready && audio.tone(audio.sfx, "sine", 880, 440, .25, .25), 350); } else audio.tone(audio.sfx, "sine", 520, 260, .18, .3); if (navigator.vibrate) try { navigator.vibrate(tense ? [80, 60, 80, 60, 200] : 120); } catch (e) {} }
      drawFish();
    }
    if (fishing.st === "bite") {
      const R = fishing.reel, alerting = R.alert && now < R.alert;
      $("biteAlert").hidden = !R.tense; $("biteAlert").textContent = alerting ? "…!" : "‼ 엄청난 힘이다!";
      $("biteAlert").classList.toggle("now", !!alerting);
      if (R.alert && !alerting && !R.told) { R.told = true; drawFish(); } // switch the hint from "…!" to the reel instructions
      if (!alerting) {
        R.pos += R.dir * R.speed * dt; if (R.pos >= 1) { R.pos = 1; R.dir = -1; } if (R.pos <= 0) { R.pos = 0; R.dir = 1; }
        if (R.tense) { R.ph += dt; R.zone = clamp(R.zone + Math.sin(R.ph * 1.9) * dt * .16, .02, .98 - R.w); placeReel(); } // the fish pulls the target around
      }
      $("reelNeedle").style.left = (R.pos * 100) + "%";
      if (now > R.end) { fishing.st = "ready"; $("biteAlert").hidden = true; toast(R.tense ? "버티다 버티다 놓쳤어요… 엄청 큰 녀석이었는데!" : "힘이 빠져서 놓쳤어요… 다시 던져 보세요"); setFs("idle"); drawFish(); }
    }
    if ((fishing.st === "wait" || fishing.st === "bite") && (me.moving || me.st !== "walk" || !onFishDeck(me.x, me.z))) { fishing.st = "ready"; setFs("idle"); closeFish(); toast("움직여서 낚싯줄을 걷었어요"); return; }
    fishing.raf = requestAnimationFrame(tick);
  };
  fishing.raf = requestAnimationFrame(tick);
}
$("fishBtn").addEventListener("pointerdown", e => {
  e.preventDefault();
  if (fishing.st === "ready") { fishing.st = "charge"; fishing.power = 0; fishing.pDir = 1; drawFish(); }
  else if (fishing.st === "wait") { fishing.st = "ready"; setFs("idle"); toast("낚싯줄을 걷어 올렸어요"); drawFish(); }
  else if (fishing.st === "bite") reelTap();
});
const REEL_W = .2;
function placeReel() { const z = $("reelZone"), R = fishing.reel; z.style.left = (R.zone * 100) + "%"; z.style.width = ((R.w || REEL_W) * 100) + "%"; }
function reelTap() {
  const R = fishing.reel; if (R.alert && Date.now() < R.alert) return; // wait for it…
  const inZone = R.pos >= R.zone && R.pos <= R.zone + (R.w || REEL_W), box = $("reel");
  box.classList.remove("hit", "miss"); void box.offsetWidth;
  if (inZone) {
    R.hits++; box.classList.add("hit"); if (audio.ready) audio.tone(audio.sfx, "sine", 700 + R.hits * 200, 900 + R.hits * 200, .12, .12);
    if (R.hits >= R.need) { $("biteAlert").hidden = true; strike(R.F); return; }
    R.zone = .05 + Math.random() * (.9 - R.w); R.speed *= 1.15; placeReel();
  } else {
    R.miss++; box.classList.add("miss"); if (audio.ready) audio.tone(audio.sfx, "square", 220, 160, .1, .05);
    if (R.miss >= 3) { fishing.st = "ready"; $("biteAlert").hidden = true; toast(R.tense ? "엄청난 녀석이 줄을 끊고 사라졌어요… 다음엔 꼭!" : `${R.F.rare === 3 ? "뭔가" : "물고기"}가 줄을 끊고 도망갔어요…`); setFs("idle"); drawFish(); return; }
  }
  drawFish();
}
const castRelease = () => {
  if (fishing.st !== "charge") return;
  // every cast lands a little differently: wobble in distance and direction, a high or a flat arc
  const d = (3 + fishing.power * 9) * (.75 + Math.random() * .5), ang = (Math.random() - .5) * .9; me.r = 0;
  const bx = clamp(me.x - Math.sin(ang) * d, BOUND.x0, BOUND.x1), bz = Math.min(FISH_DECK.z0 - 1, me.z - Math.cos(ang) * d);
  const ah = +(1 + Math.random() * 2.4).toFixed(2), ft = +(.45 + d / 16).toFixed(2);
  fishing.st = "wait"; fishing.castAt = Date.now(); fishing.biteAt = fishing.castAt + 5000 + Math.random() * 17000;
  setFs("cast", { bx: +bx.toFixed(2), bz: +bz.toFixed(2), ah, ft }); if (audio.ready) audio.tone(audio.sfx, "sine", 900, 300, .25, .08);
  setTimeout(() => { if (audio.ready) audio.paddle(); }, (ft + .25) * 1000);
  drawFish();
};
["pointerup", "pointerleave", "pointercancel"].forEach(ev => $("fishBtn").addEventListener(ev, castRelease));
const RARE_BOOST = 1.35; // more kinds of common fish shouldn't make the rare ones rarer
function rollFish() {
  const h = kst().getHours(), night = h >= 20 || h < 5, far = fishing.power > .7;
  const wt = f => f.w * (f.rare === 2 || f.rare >= 4 ? RARE_BOOST : 1) * (f.deep ? (far ? 2.2 : 1) * (night ? 1.6 : 1) : 1);
  const total = FISH.reduce((s, f) => s + wt(f), 0); let r = Math.random() * total;
  for (const f of FISH) { r -= wt(f); if (r <= 0) return f; } return FISH[0];
}
function strike(pre) {
  const F = pre || rollFish(), cm = F.cm[1] ? Math.round(F.cm[0] + Math.pow(Math.random(), 1.6) * (F.cm[1] - F.cm[0])) : 0;
  const prev = dex[F.k], isNew = !prev;
  dex[F.k] = { n: (prev ? prev.n : 0) + 1, best: Math.max(prev ? prev.best : 0, cm) }; saveDex();
  const duel = inFishDuel(), pts = duelCatch(F, cm);
  fishing.catch = { k: F.k, cm, isNew, duel, pts }; fishing.st = "caught";
  if (F.k === "letter") { const pool = recentPapers.length ? recentPapers.concat(LETTERS) : LETTERS; fishing.catch.note = pool[Math.floor(Math.random() * pool.length)]; }
  if (F.ann) announceRare(me.name, F, cm);
  setFs("catch", { k: F.k, cm, bx: me.fs && me.fs.bx != null ? me.fs.bx : +me.x.toFixed(2), bz: me.fs && me.fs.bz != null ? me.fs.bz : +(me.z - 7).toFixed(2) });
  showBubble(() => myAvatar, F.rare === 4 ? `${F.icon} ${F.name}!` : F.rare === 3 ? `${F.name}…?` : `${F.icon ? F.icon + " " : ""}${F.name} ${cm}cm!`, 3, "me");
  const sheet = $("fishModal"); sheet.classList.add("peek"); setTimeout(() => sheet.classList.remove("peek"), F.k === "whale" ? 6500 : 2300);
  if (audio.ready) (F.rare === 2 || F.rare === 5 ? audio.ding() : audio.pop());
  drawFish();
}
function rareReward(k) {
  // each paying treasure pays once a day
  wallet.rare = wallet.rare || {}; if (wallet.rare[k] === todayKey()) return 0;
  wallet.rare[k] = todayKey(); const F = FISH_BY[k];
  return k === "chest" ? 1000 + Math.floor(Math.random() * 9) * 500 : F.pay;
}
$("fishRelease").addEventListener("click", () => {
  if (!fishing.catch) return; const F = FISH_BY[fishing.catch.k];
  if (F.rare === 4) {
    const k = F.k, duel = fishing.catch.duel; let msg = "", pay = 0;
    if (k === "letter") msg = "쪽지를 소중히 간직했어요";
    else { pay = duel ? 0 : rareReward(k); }
    if (k === "chest" && !duel) { const extra = []; if (Math.random() < .3 && wallet.bag.length < BAG_MAX) { wallet.bag.push("sparkler"); extra.push("스파클러"); } if (Math.random() < .15 && wallet.bag.length < BAG_MAX) { wallet.bag.push("fountain"); extra.push("분수 폭죽"); } msg = pay ? `상자 안에 ${won(pay)}${extra.length ? "과 " + extra.join("·") : ""}이 들어 있었어요!` : "오늘은 이미 보물을 받았어요. 상자는 텅 비어 있네요"; if (pay) sparkBurst(myAvatar); }
    else if (k === "wallet") msg = pay ? `지갑을 주인에게 돌려줬어요. 사례금 ${won(pay)}을 받았어요` : "지갑을 주인에게 돌려줬어요. (사례금은 하루 한 번)";
    else if (k === "ring") msg = pay ? `금반지를 팔아 ${won(pay)}을 받았어요` : "반짝이는 금반지예요. (보상은 하루 한 번)";
    else if (k === "whale") msg = pay ? `아기 고래와 인사했어요! ${won(pay)}` : "아기 고래와 또 만났어요! (보상은 하루 한 번)";
    if (duel) msg = `대결 점수 +${fishing.catch.pts}점!`;
    if (pay) { wallet.money += pay; } saveWallet(); toast(msg); if (audio.ready) audio.ding();
    fishing.catch = null; fishing.st = "ready"; fishing.power = 0; setFs("idle"); drawFish(); return;
  }
  const pay = fishing.catch.duel ? 0 : Math.min(F.pay, Math.max(0, FISH_DAY_CAP - fishEarnedToday()));
  if (pay > 0) { if (wallet.fishDay !== todayKey()) { wallet.fishDay = todayKey(); wallet.fishEarn = 0; } wallet.fishEarn += pay; wallet.money += pay; saveWallet(); }
  toast(F.rare === 3 ? `강이 조금 더 깨끗해졌어요${pay ? " · +" + won(pay) : ""}` : F.alien ? `${F.name}를 수거했어요. 한강 생태계가 고마워해요${pay ? " · +" + won(pay) : ""}` : F.rare === 5 ? `${F.name}가 깊은 곳으로 돌아갔어요${pay ? " · +" + won(pay) : ""}` : `${F.name}를 강으로 돌려보냈어요${pay ? " · +" + won(pay) : ""}`);
  if (audio.ready) audio.paddle();
  fishing.catch = null; fishing.st = "ready"; fishing.power = 0; setFs("idle"); drawFish();
});
$("fishDexBtn").addEventListener("click", () => {
  const box = $("dexBox"); box.hidden = !box.hidden; if (box.hidden) return; box.textContent = "";
  FISH.forEach(F => {
    const d = dex[F.k], cell = document.createElement("div"); cell.className = "dex" + (d ? "" : " unknown");
    const dot = document.createElement("i"); dot.style.background = d ? "#" + F.col.toString(16).padStart(6, "0") : "#555";
    const t = document.createElement("span"); t.textContent = d ? `${F.icon && F.rare !== 4 ? F.icon + " " : ""}${F.name}${F.cm[1] ? " · 최고 " + d.best + "cm" : ""} · ${d.n}번` : "??? · " + RARE_LABEL[F.rare];
    if (d && F.desc) t.title = F.desc;
    cell.append(dot, t); box.appendChild(cell);
  });
});
$("fishClose").addEventListener("click", closeFish);

/* everyone's rods, lines, bobbers and catches */
function makeFishMesh(k) {
  const F = FISH_BY[k] || FISH[0], g = new THREE.Group(), m = F.rare === 2 ? new THREE.MeshLambertMaterial({ color: F.col, emissive: 0x8a5a00, emissiveIntensity: .6 }) : mat(F.col);
  if (F.rare === 4) {
    const gold = new THREE.MeshLambertMaterial({ color: 0xffcf3a, emissive: 0x8a5a00, emissiveIntensity: .5 });
    if (k === "letter") { const gl = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .26, 12), new THREE.MeshPhongMaterial({ color: 0x9fe0d0, transparent: true, opacity: .55 })); gl.position.y = .13; g.add(gl); const neck = new THREE.Mesh(new THREE.CylinderGeometry(.025, .05, .08, 10), gl.material); neck.position.y = .3; g.add(neck); const paper = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .18, 8), mat(0xf6efd8)); paper.position.y = .13; g.add(paper); }
    else if (k === "wallet") { const w = new THREE.Mesh(new THREE.BoxGeometry(.22, .14, .04), m); w.position.y = .07; g.add(w); const strap = new THREE.Mesh(new THREE.BoxGeometry(.06, .14, .045), mat(0x4a3222)); strap.position.set(.06, .07, 0); g.add(strap); }
    else if (k === "ring") { const r = new THREE.Mesh(new THREE.TorusGeometry(.09, .022, 8, 20), gold); r.position.y = .1; g.add(r); const gem = new THREE.Mesh(new THREE.OctahedronGeometry(.045), new THREE.MeshBasicMaterial({ color: 0xbfe9ff })); gem.position.y = .21; g.add(gem); }
    else if (k === "chest") { const b = new THREE.Mesh(new THREE.BoxGeometry(.36, .22, .24), m); b.position.y = .11; g.add(b); const lid = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .36, 12, 1, false, 0, Math.PI), m); lid.rotation.z = Math.PI / 2; lid.position.y = .22; g.add(lid); const band = new THREE.Mesh(new THREE.BoxGeometry(.06, .36, .25), gold); band.position.y = .17; g.add(band); }
    return g;
  }
  const add = (geo, mm, x, y, z) => { const o = new THREE.Mesh(geo, mm); o.position.set(x, y, z); g.add(o); return o; };
  if (k === "jjukku" || k === "octo") { // a round head with eight curly arms hanging below
    const big = k === "octo", hr = big ? .17 : .09, mm = mat(F.col);
    add(new THREE.SphereGeometry(hr, 14, 10), mm, 0, hr * 1.1, 0).scale.set(1, 1.25, 1);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, arm = add(new THREE.CylinderGeometry(hr * .16, hr * .08, hr * 2.4, 6), mm, Math.cos(a) * hr * .55, -hr * .9, Math.sin(a) * hr * .55); arm.rotation.set(Math.sin(a) * .5, 0, -Math.cos(a) * .5); }
    [-1, 1].forEach(s => add(new THREE.SphereGeometry(hr * .2, 8, 6), new THREE.MeshBasicMaterial({ color: 0x111111 }), s * hr * .4, hr * .7, -hr * .85));
    return g;
  }
  if (k === "blob") { // the saddest face in the sea
    const pink = mat(F.col); add(new THREE.SphereGeometry(.16, 16, 12), pink, 0, .14, 0).scale.set(1.15, .9, 1);
    add(new THREE.SphereGeometry(.07, 10, 8), pink, 0, .1, -.15).scale.set(1.3, .8, 1); // droopy nose
    [-1, 1].forEach(s => add(new THREE.SphereGeometry(.018, 6, 4), new THREE.MeshBasicMaterial({ color: 0x222222 }), s * .07, .2, -.14));
    add(new THREE.TorusGeometry(.05, .008, 6, 12, Math.PI), mat(0x8a3d4a), 0, .03, -.13);
    return g;
  }
  if (k === "angler") { // dark round fish, a toothy grin and a glowing lantern
    const dk = mat(F.col); add(new THREE.SphereGeometry(1, 14, 10), dk, 0, 0, 0).scale.set(.16, .14, .2);
    add(new THREE.SphereGeometry(1, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(0x1a1c22), 0, -.01, -.15).scale.set(.12, .08, .08);
    for (let i = 0; i < 5; i++) add(new THREE.ConeGeometry(.012, .04, 4), mat(0xf4f1ea), -.08 + i * .04, .0, -.2).rotation.x = Math.PI;
    add(new THREE.CylinderGeometry(.008, .008, .2, 4), dk, 0, .2, -.12).rotation.x = -.6;
    add(new THREE.SphereGeometry(.04, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff1a0 }), 0, .27, -.22);
    const tail = add(new THREE.ConeGeometry(.08, .14, 4), dk, 0, 0, .25); tail.rotation.x = Math.PI / 2; tail.scale.set(.3, 1, 1);
    return g;
  }
  if (k === "oar") { // a long silver ribbon with a red crest
    add(new THREE.BoxGeometry(.035, .16, 1.4), new THREE.MeshPhongMaterial({ color: F.col, shininess: 90, specular: 0xffffff }), 0, 0, .3);
    for (let i = 0; i < 12; i++) add(new THREE.BoxGeometry(.02, .05, .1), mat(0xe0433a), 0, .1, -.3 + i * .12);
    add(new THREE.BoxGeometry(.02, .22, .04), mat(0xe0433a), 0, .2, -.36);
    add(new THREE.SphereGeometry(.018, 6, 4), new THREE.MeshBasicMaterial({ color: 0x111111 }), .025, .02, -.36);
    return g;
  }
  if (k === "eel") { const mm = mat(F.col); for (let i = 0; i < 9; i++) { const sgm = add(new THREE.SphereGeometry(.045, 8, 6), mm, Math.sin(i * .9) * .05, 0, -.4 + i * .1); sgm.scale.set(1, 1, 1.6); } add(new THREE.SphereGeometry(.012, 6, 4), new THREE.MeshBasicMaterial({ color: 0x111111 }), .03, .02, -.44); return g; }
  if (k === "chamge") { const mm = mat(F.col); add(new THREE.SphereGeometry(.12, 12, 8), mm, 0, .06, 0).scale.set(1.2, .5, 1);
    [-1, 1].forEach(s => { for (let i = 0; i < 3; i++) add(new THREE.CylinderGeometry(.012, .008, .16, 5), mm, s * .14, .02, -.05 + i * .06).rotation.z = s * 1.1;
      const cl = add(new THREE.SphereGeometry(.05, 8, 6), mm, s * .12, .07, -.14); cl.scale.set(1, .7, 1.2); add(new THREE.SphereGeometry(.03, 6, 4), mat(0x2a2218), s * .12, .07, -.15).scale.set(1.3, 1.3, 1); // hairy mitts
      add(new THREE.SphereGeometry(.014, 6, 4), new THREE.MeshBasicMaterial({ color: 0x111111 }), s * .04, .12, -.1); }); return g; }
  if (k === "saeu") { const mm = new THREE.MeshPhongMaterial({ color: F.col, transparent: true, opacity: .85 }); for (let i = 0; i < 5; i++) add(new THREE.SphereGeometry(.035 - i * .004, 8, 6), mm, 0, .2 - i * .045, i * .012).scale.set(1, .8, 1.3);
    [-1, 1].forEach(s => add(new THREE.CylinderGeometry(.008, .006, .34, 5), mm, s * .05, .35, -.02).rotation.z = s * .25); return g; }
  if (k === "jara") { const mm = mat(F.col); add(new THREE.SphereGeometry(.16, 14, 8), mm, 0, .05, 0).scale.set(1, .35, 1.15); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => add(new THREE.SphereGeometry(.04, 6, 4), mm, sx * .13, .02, sz * .12).scale.set(1.4, .5, 1)); add(new THREE.SphereGeometry(.03, 8, 6), mm, 0, .05, -.19); return g; } // head tucked in
  if (k === "puffer") { const mm = mat(F.col); add(new THREE.SphereGeometry(.16, 14, 10), mm, 0, .16, 0); add(new THREE.SphereGeometry(.12, 12, 8), mat(0xf4efe2), 0, .1, -.04);
    for (let i = 0; i < 26; i++) { const a = Math.random() * 6.28, b = Math.acos(2 * Math.random() - 1), d = new THREE.Vector3(Math.sin(b) * Math.cos(a), Math.cos(b), Math.sin(b) * Math.sin(a)), sp = add(new THREE.ConeGeometry(.012, .06, 4), mm, d.x * .17, .16 + d.y * .17, d.z * .17); sp.lookAt(sp.position.clone().add(d)); sp.rotateX(Math.PI / 2); }
    [-1, 1].forEach(s => add(new THREE.SphereGeometry(.025, 8, 6), new THREE.MeshBasicMaterial({ color: 0x111111 }), s * .07, .22, -.13)); return g; }
  if (k === "jelly") { const glow = new THREE.MeshBasicMaterial({ color: F.col, transparent: true, opacity: .65 }); const bell = add(new THREE.SphereGeometry(.15, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), glow, 0, .2, 0); bell.scale.y = .8;
    for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28; add(new THREE.CylinderGeometry(.006, .003, .4, 4), glow, Math.cos(a) * .09, 0, Math.sin(a) * .09); } return g; }
  if (k === "ball") { add(new THREE.SphereGeometry(.13, 16, 12), mat(0xffffff), 0, .13, 0); for (let i = 0; i < 6; i++) { const a = i * 1.05, b = i % 2 ? .8 : 2.2; add(new THREE.CircleGeometry(.04, 5), mat(0x222222, { side: THREE.DoubleSide }), Math.sin(b) * Math.cos(a) * .131, .13 + Math.cos(b) * .131, Math.sin(b) * Math.sin(a) * .131).lookAt(0, -10, 0); } return g; }
  if (k === "umbrella") { add(new THREE.ConeGeometry(.28, .14, 8, 1, true), mat(F.col, { side: THREE.DoubleSide }), 0, .5, 0); add(new THREE.CylinderGeometry(.008, .008, .55, 5), mat(0x333333), 0, .22, 0); const h = add(new THREE.TorusGeometry(.04, .01, 4, 10, Math.PI), mat(0x333333), .04, -.05, 0); h.rotation.z = Math.PI; return g; }
  if (k === "wheel") { const w = add(new THREE.TorusGeometry(.22, .025, 8, 24), mat(0x222222), 0, .22, 0); for (let i = 0; i < 8; i++) add(new THREE.CylinderGeometry(.003, .003, .42, 3), mat(0xc0c4ca), 0, .22, 0).rotation.z = i * Math.PI / 8; add(new THREE.CylinderGeometry(.03, .03, .05, 8), mat(0x777777), 0, .22, 0).rotation.x = Math.PI / 2; return g; }
  if (k === "sturgeon") { const mm = mat(F.col); add(new THREE.SphereGeometry(1, 14, 10), mm, 0, 0, 0).scale.set(.08, .08, .45); add(new THREE.ConeGeometry(.04, .14, 6), mm, 0, -.01, -.52).rotation.x = -Math.PI / 2;
    for (let i = 0; i < 9; i++) add(new THREE.ConeGeometry(.02, .04, 4), mat(0xd8d4c8), 0, .08, -.32 + i * .08); const t = add(new THREE.ConeGeometry(.1, .2, 4), mm, 0, .03, .5); t.rotation.x = Math.PI / 2; t.scale.set(.25, 1, 1); return g; }
  if (k === "coela") { const mm = mat(F.col); add(new THREE.SphereGeometry(1, 14, 10), mm, 0, 0, 0).scale.set(.12, .15, .42);
    for (let i = 0; i < 14; i++) add(new THREE.SphereGeometry(.015, 5, 4), mat(0xf4f1ea), (i % 2 ? .11 : -.11), -.05 + (i % 5) * .03, -.3 + i * .045);
    [-1, 1].forEach(s => { const fin = add(new THREE.SphereGeometry(.05, 8, 6), mm, s * .13, -.06, -.1); fin.scale.set(.4, .6, 1.3); });
    const t = add(new THREE.ConeGeometry(.12, .2, 5), mm, 0, 0, .5); t.rotation.x = Math.PI / 2; t.scale.set(.25, 1, 1); return g; }
  if (k === "cupra") { add(new THREE.CylinderGeometry(.09, .065, .14, 16, 1, true), mat(0xf4f1ea, { side: THREE.DoubleSide }), 0, .07, 0); add(new THREE.CylinderGeometry(.091, .091, .04, 16, 1, true), mat(0xd8322f, { side: THREE.DoubleSide }), 0, .1, 0); const lid = add(new THREE.CircleGeometry(.09, 16), mat(0xe8c15a, { side: THREE.DoubleSide }), .05, .16, 0); lid.rotation.set(-1.2, 0, .3); return g; }
  if (k === "bag") { const b = add(new THREE.SphereGeometry(.13, 10, 8), new THREE.MeshPhongMaterial({ color: F.col, transparent: true, opacity: .7 }), 0, .12, 0); b.scale.set(1, 1.2, .7); [-1, 1].forEach(s => { add(new THREE.TorusGeometry(.04, .01, 4, 10), b.material, s * .05, .28, 0).rotation.y = Math.PI / 2; }); return g; }
  if (k === "slipper") { add(new THREE.BoxGeometry(.1, .03, .26), mat(F.col), 0, .015, 0); add(new THREE.TorusGeometry(.045, .012, 6, 12, Math.PI), mat(0xffffff), 0, .03, -.04).rotation.y = Math.PI / 2; return g; }
  if (F.rare === 3) {
    if (k === "boot") { const a = new THREE.Mesh(new THREE.BoxGeometry(.14, .3, .14), m); a.position.y = .15; g.add(a); const b = new THREE.Mesh(new THREE.BoxGeometry(.14, .1, .26), m); b.position.set(0, .05, -.06); g.add(b); }
    else { const c = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .2, 12), m); c.position.y = .1; g.add(c); }
    return g;
  }
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), m); body.scale.set(.09, .1, .3); g.add(body);
  if (k === "bluegill") body.scale.set(.08, .16, .22); if (k === "pirami") body.scale.set(.06, .07, .22);
  if (F.body) body.scale.set(...F.body);
  if (k === "chammaja") for (let i = 0; i < 6; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.014, 5, 4), mat(0x3a3530)); d.position.set(.075, .01, -.18 + i * .07); g.add(d); }
  if (k === "napjaru") { const st = new THREE.Mesh(new THREE.BoxGeometry(.1, .02, .26), new THREE.MeshBasicMaterial({ color: 0x6ad0ff })); st.position.y = .02; g.add(st); }
  const tail = new THREE.Mesh(new THREE.ConeGeometry(.09, .16, 4), m); tail.rotation.x = Math.PI / 2; tail.position.z = .34; tail.scale.set(.25, 1, 1); g.add(tail);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(.018, 6, 4), new THREE.MeshBasicMaterial({ color: 0x111111 })); eye.position.set(.07, .03, -.2); g.add(eye);
  g.rotation.x = -Math.PI / 2.3; return g;
}
const LINE_N = 16;
function rodFor(av) {
  const u = av.userData;
  if (!u.rodG) {
    const g = new THREE.Group(), rod = new THREE.Mesh(new THREE.CylinderGeometry(.015, .03, 1.9, 6), mat(0x2a2e3a)); rod.position.y = .95; g.add(rod);
    const tip = new THREE.Object3D(); tip.position.y = 1.9; g.add(tip);
    g.position.set(.2, .15, -.32); g.rotation.x = -.85; u.torso.add(g); u.rodG = g; u.rodTip = tip;
    const lineGeo = new THREE.BufferGeometry(); lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(LINE_N * 3), 3));
    u.line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xeeeeee, transparent: true, opacity: .75 })); u.line.frustumCulled = false; scene.add(u.line);
    u.bobber = new THREE.Mesh(new THREE.SphereGeometry(.11, 12, 8), new THREE.MeshLambertMaterial({ color: 0xff3b30, emissive: 0xff3b30, emissiveIntensity: .5 })); scene.add(u.bobber);
    u.ripple = new THREE.Mesh(new THREE.RingGeometry(.8, 1, 28), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })); u.ripple.rotation.x = -Math.PI / 2; scene.add(u.ripple);
  }
  return u;
}
const tipW = new THREE.Vector3();
// a line that sags between the rod tip and its end
function drawLine(u, x, y, z, sag) {
  const a = u.line.geometry.attributes.position.array;
  for (let i = 0; i < LINE_N; i++) { const k = i / (LINE_N - 1); a[i * 3] = tipW.x + (x - tipW.x) * k; a[i * 3 + 1] = tipW.y + (y - tipW.y) * k - Math.sin(k * Math.PI) * sag; a[i * 3 + 2] = tipW.z + (z - tipW.z) * k; }
  u.line.geometry.attributes.position.needsUpdate = true;
}
function showRod(av, has, fs) {
  const u = av.userData;
  if (!has) { if (u.rodG) { u.rodG.visible = false; u.line.visible = false; u.bobber.visible = false; u.ripple.visible = false; if (u.fishW) u.fishW.visible = false; } return; }
  rodFor(av); u.rodG.visible = true;
  // not fishing right now: the rod rides on the back so hands are free for everything else
  if (!fs) { u.rodG.position.set(-.12, .05, .26); u.rodG.rotation.set(.32, 0, .25); u.line.visible = u.bobber.visible = u.ripple.visible = false; if (u.fishW) u.fishW.visible = false; return; }
  u.rodG.position.set(.2, .15, -.32);
  const s = fs && fs.s, t = fs ? (Date.now() - fs.at) / 1000 : 0, inWater = s === "cast" || s === "bite";
  const catching = s === "catch" && t < 6;
  // rod swing: back, whip forward, settle; held high while showing a catch
  let rx = -.85;
  if (s === "cast" && t < .75) rx = t < .2 ? -.85 + 1.1 * (t / .2) : t < .35 ? .25 - 1.6 * ((t - .2) / .15) : -1.35 + .5 * Math.min(1, (t - .35) / .4);
  if (catching) rx = -.85 + .55 * Math.min(1, t / .5);
  u.rodG.rotation.x = rx; u.rodG.rotation.z = catching ? -.75 * Math.min(1, t / .5) : 0; // swing the catch out to the side where it can be seen
  u.line.visible = inWater || catching; u.bobber.visible = inWater;
  u.rodTip.getWorldPosition(tipW);
  if (inWater) {
    const ft = fs.ft || .6, fly = clamp((t - .25) / ft, 0, 1), dip = s === "bite" ? (fs.x ? .3 + Math.sin(T * 22) * .12 : .12 + Math.sin(T * 30) * .03) : 0;
    const by = -.58 + Math.sin(T * 2.2 + av.id) * .02 - dip, landed = s !== "cast" || fly >= 1;
    let bx = fs.bx, bz = fs.bz, byy = by;
    if (!landed) { bx = tipW.x + (fs.bx - tipW.x) * fly; bz = tipW.z + (fs.bz - tipW.z) * fly; byy = tipW.y + (by - tipW.y) * fly + Math.sin(fly * Math.PI) * (fs.ah || 1.5); }
    u.bobber.position.set(bx, byy, bz);
    drawLine(u, bx, byy + .06, bz, landed ? .35 : .05);
    // rings where the float hits the water
    const rt = s === "cast" ? t - .25 - ft : 9;
    if (rt >= 0 && rt < 1.4) { u.ripple.visible = true; u.ripple.position.set(fs.bx, -.57, fs.bz); u.ripple.scale.setScalar(.2 + rt * .9); u.ripple.material.opacity = .6 * (1 - rt / 1.4); }
    else if (s === "bite") { u.ripple.visible = true; u.ripple.position.set(fs.bx, -.57, fs.bz); const k = (T * 1.6) % 1; u.ripple.scale.setScalar(.2 + k * .6); u.ripple.material.opacity = .5 * (1 - k); }
    else u.ripple.visible = false;
  } else u.ripple.visible = false;
  // the catch comes up out of the water and hangs from the line
  if (catching && fs.k === "whale") { whaleShow(av, fs, t); u.line.visible = t < .8; if (u.fishW) u.fishW.visible = false; return; }
  if (catching && (!u.fishW || u.fishK !== fs.k)) { if (u.fishW) scene.remove(u.fishW); u.fishW = makeFishMesh(fs.k); u.fishW.rotation.order = "YXZ"; u.fishK = fs.k; scene.add(u.fishW); }
  if (u.fishW) {
    u.fishW.visible = catching;
    if (catching) {
      const F = FISH_BY[fs.k], sc = F && (F.rare === 3 || F.k === "oar") ? 1 : clamp((fs.cm || 30) / 45, .6, 1.8), up = ease(Math.min(1, t / .9));
      const hx = tipW.x, hy = tipW.y - .55 - .3 * sc, hz = tipW.z, sx = fs.bx || hx, sz = fs.bz || hz;
      const fx = sx + (hx - sx) * up, fy = -.6 + (hy + .6) * up + Math.sin(up * Math.PI) * 1.2, fz = sz + (hz - sz) * up;
      u.fishW.position.set(fx, fy, fz); u.fishW.scale.setScalar(sc);
      if (F && F.rare !== 3 && F.shape !== "up") u.fishW.rotation.set(Math.PI / 2, T * .8, Math.sin(T * 11) * .35); else u.fishW.rotation.set(0, T * .8, Math.sin(T * 5) * .2);
      drawLine(u, fx, fy + .2 * sc, fz, 0);
      if (t < .9 && Math.random() < .5) sparksS.emit(fx, fy, fz, rnd(-1, 1), rnd(0, 2), rnd(-1, 1), WHITE, .4, 6);
    }
  }
}
const seenCatch = new Map();
function updateFishing() {
  if (me.fs && me.fs.s === "catch" && $("fishModal").hidden && Date.now() - me.fs.at > 7000) me.fs = null; // panel closed after a catch: put the rod away
  if (myAvatar) showRod(myAvatar, !!me.rod, me.fs);
  for (const [peer, o] of others) {
    showRod(o.obj, !!o.p.fr, o.p.fs);
    const fs = o.p.fs;
    if (fs && fs.s === "bite" && fs.x && seenCatch.get(peer + "b") !== fs.at) { seenCatch.set(peer + "b", fs.at); const id = peer; showBubble(() => (others.get(id) || {}).obj, "…!", 1.6, id); }
    if (fs && fs.s === "catch" && seenCatch.get(peer) !== fs.at) {
      seenCatch.set(peer, fs.at); const F = FISH_BY[fs.k];
      if (F && Date.now() - fs.at < 4000) { const id = peer; showBubble(() => (others.get(id) || {}).obj, F.rare === 4 ? `${F.icon} ${F.name}!` : F.rare === 3 ? `${F.name}…?` : `${F.name} ${fs.cm}cm!`, 3, id); if (F.ann) announceRare(o.p.n, F, fs.cm); }
    }
  }
}
// rod pose: both hands forward on the grip
function rodPose(v, fs) {
  v.arR = 1.15; v.azR = -.25; v.arL = 1.0; v.azL = -.35;
  if (!fs) return; const t = (Date.now() - fs.at) / 1000;
  if (fs.s === "cast" && t < .75) { const k = t < .2 ? t / .2 : t < .35 ? 1 - (t - .2) / .15 * 1.6 : -.6 + .6 * Math.min(1, (t - .35) / .4); v.arR += .9 * k; v.arL += .7 * k; v.lean -= .15 * k; }
  if (fs.s === "catch" && t < 6) { v.arL = v.arR = 1.6; v.azL = v.azR = -.15; v.lean -= .12; }
}

/* treasures: an announcement for everyone, sparkles, and the baby whale */
function announceRare(name, F, cm) {
  const bar = $("annBar"); bar.textContent = `${F.icon} ${name}님이 ${F.deep ? "깊은 한강에서" : "한강에서"} ${F.name}${F.k === "whale" ? "를 만났어요" : F.cm[1] ? ` ${cm}cm를 낚았어요` : "를 낚았어요"}!`;
  bar.hidden = false; bar.classList.remove("go"); void bar.offsetWidth; bar.classList.add("go");
  clearTimeout(bar._t); bar._t = setTimeout(() => { bar.hidden = true; }, 6000);
  if (audio.ready) audio.ding();
}
function sparkBurst(av) { if (!av) return; av.userData.head.getWorldPosition(tipW); for (let i = 0; i < 60; i++) sparksS.emit(tipW.x, tipW.y + .3, tipW.z, rnd(-3, 3), rnd(1, 5), rnd(-3, 3), Math.random() < .5 ? GOLD : WHITE, rnd(.6, 1.2), 4); }
function makeWhale() {
  const g = new THREE.Group(), skin = mat(0x3d5a80), belly = mat(0xd8e4ef);
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), skin); body.scale.set(1.05, .95, 2.4); g.add(body);
  const under = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), belly); under.scale.set(.85, .6, 2.1); under.position.y = -.38; g.add(under);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(.45, 1.6, 10), skin); tail.rotation.x = -Math.PI / 2; tail.position.z = 2.9; g.add(tail);
  [-1, 1].forEach(s => { const f = new THREE.Mesh(new THREE.BoxGeometry(1.3, .1, .55), skin); f.position.set(s * .6, 0, 3.6); f.rotation.y = s * .35; g.add(f);
    const fin = new THREE.Mesh(new THREE.BoxGeometry(.9, .08, .4), skin); fin.position.set(s * 1.0, -.35, -.6); fin.rotation.z = s * -.5; g.add(fin);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), new THREE.MeshBasicMaterial({ color: 0x111111 })); eye.position.set(s * .78, .05, -1.6); g.add(eye); });
  g.traverse(m => { if (m.isMesh) m.castShadow = true; }); scene.add(g); return g;
}
let whale = null, whaleSnapAt = 0;
function whaleShow(av, fs, t) {
  if (!whale) whale = makeWhale();
  const u = av.userData; if (!u.whaleAt || u.whaleAt !== fs.at) u.whaleAt = fs.at;
  const k = clamp(t / 5.5, 0, 1), arc = Math.sin(k * Math.PI);
  whale.visible = t < 6; whale.position.set(fs.bx + (k - .5) * 6, -2.4 + arc * 3.2, fs.bz - 2); whale.rotation.set(-Math.cos(k * Math.PI) * .6, Math.PI / 2, 0);
  if (t > 1.2 && t < 3.2 && Math.random() < .8) for (let i = 0; i < 4; i++) sparksS.emit(whale.position.x, whale.position.y + 1, whale.position.z, rnd(-.5, .5), rnd(5, 8), rnd(-.5, .5), WHITE, 1, 6);
  if (t > 5.8) whale.visible = false;
  // the catcher gets a keepsake photo as the whale tops its leap
  if (av === myAvatar && t > 2.6 && whaleSnapAt !== fs.at) { whaleSnapAt = fs.at; snapWhale(); }
}
function snapWhale() {
  photoCam.aspect = canvas.width / canvas.height; photoCam.updateProjectionMatrix();
  photoCam.position.set(me.x + 4, me.y + 2.4, me.z + 4); photoCam.lookAt(whale.position.x, whale.position.y, whale.position.z);
  renderer.render(scene, photoCam);
  const w = canvas.width, h = canvas.height, c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d"); x.drawImage(canvas, 0, 0);
  const sc = Math.max(1, w / 900), k = kst(); x.font = `${Math.round(16 * sc)}px 'Gowun Batang', serif`; x.fillStyle = "rgba(255,255,255,.92)"; x.textAlign = "right"; x.textBaseline = "bottom"; x.shadowColor = "rgba(0,0,0,.45)"; x.shadowBlur = 8 * sc;
  x.fillText(`🐋 한강에서 아기 고래를 만난 날 · ${me.name} · ${k.getMonth() + 1}월 ${k.getDate()}일`, w - 18 * sc, h - 16 * sc);
  setTimeout(() => deliverShot(c), 3200);
}
