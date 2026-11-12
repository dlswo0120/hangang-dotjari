---
name: hangang-dotjari-testkit
description: 한강 돗자리를 Playwright로 여러 창 멀티플레이·화면 캡처·이동 시험할 때 사용 (가짜 Supabase, 시간 고정 캡처 포함)
---

# 한강 돗자리 시험 방법

## 준비
- 시험 도구 폴더: `/home/claude/.testkit` (세션이 바뀌면 없을 수 있음 → 다시 만들기).
  - `npm install three@0.128.0` 해서 `node_modules/three/build/three.min.js`를 로컬 3D 엔진으로 씀.
  - `fake-supabase.js`: 진짜 Supabase 대신 쓰는 가짜. `window.supabase.createClient()`가 `channel(name)`을 돌려주고, `on('broadcast'|'presence')`, `subscribe`, `send`, `track`, `presenceState`, `removeChannel`, 날씨 테이블용 `from().select()`(null 반환)을 흉내 냄. 창끼리는 `BroadcastChannel('fake-hangang-dotjari')`로 `{t:'b', ev, payload}`(방송)와 `{t:'track', id, meta}`(접속 정보)를 주고받음. 없으면 이 규격대로 새로 작성.
- Playwright·Chromium은 미리 설치돼 있음(재설치 금지). 실행 인자: `--use-gl=swiftshader --enable-webgl --ignore-gpu-blocklist`. 화면이 초당 2.5프레임 정도라 기다림을 넉넉히, `goto`는 `wait_until="domcontentloaded"`.

## 한 창 시험 (artifact 빌드)
- `dist/claude-artifact.html`을 읽어 `<head>` 바로 뒤에 localStorage 준비 스크립트를 넣음: 지갑 `hangang-wallet`, 소식창 건너뛰기 `hangang-seen-version`(현재 버전), 필요하면 도감 `hangang-fishdex`.
- 내부 값 접근: 첫 `"\n})();\n</script>"` 앞에 `window.__me=me;window.__cam=cam;…`를 끼워 넣음.
- `/tmp/t9/t.html`로 저장해 `file://`로 열고, `**/three.min.js`는 로컬 파일로, `**/fonts.googleapis.com/**`는 빈 CSS로 route.
- 입장: `#enterBtn` 클릭 → `#nameInput` 입력 → `.go` 클릭.

## 여러 창 멀티플레이 (공개판)
- `index.html`을 복사하며 훅을 넣고, **supabase 스크립트의 integrity 속성만 지움**(가짜 파일은 해시가 다름. three는 진짜 파일이라 SRI 그대로 시험됨). `/tmp/t9/web/index.html`로 저장.
- `cd /tmp/t9/web && python3 -m http.server 8765`를 run_in_background로 띄움(자주 죽으니 curl로 200 확인 후 시작).
- 한 context에서 페이지 여러 개 열기: `**/supabase.js` → fake-supabase.js로 route.
- 가짜 공격 시험: 페이지에서 `new BroadcastChannel('fake-hangang-dotjari')`를 만들어 남의 id로 `postMessage`(사칭), 대량 전송(도배), `ev:'weather'`(날씨 조작)를 보내고 결과 확인.
- CSP 위반은 `securitypolicyviolation` 리스너를 head에 넣어 모음.

## 동작·춤 캡처 (시간 고정)
- 원하는 박자에서 멈추려면 `Date.now`를 고정: `const base=real(); me.em={i,at:base}; Date.now=()=>base+초*1000` 후 900ms 기다려 screenshot.
- 카메라: `cam.tYaw`(π면 얼굴 정면), `cam.tPitch`, `cam.tDist`.
- 여러 장은 PIL로 이어 붙여 한 장(contact sheet)으로 만들고 SendUserFile로 보내기.

## 이동 시험
- `me`의 x,z,st,level을 바로 정해 순간이동한 뒤 `keyboard.down('w')`로 걷고, 2.5초마다 위치를 기록해 경로(trail)와 `st`(walk/swim)를 확인.
- 카메라 방향 `cam.yaw/tYaw`를 바꿔 비스듬한 이동도 시험.

## 주의
- 시험용 복사본에만 훅을 넣고 저장소 파일은 건드리지 않기.
- 화면 확인이 필요한 변경은 PC(1100×720)와 휴대폰 세로(390×780) 두 크기로 캡처.
