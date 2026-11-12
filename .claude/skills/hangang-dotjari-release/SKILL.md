---
name: hangang-dotjari-release
description: 한강 돗자리 코드를 고치고 빌드·업데이트 소식·로컬 커밋·업로드·롤백까지 이 프로젝트 방식대로 진행할 때 사용
---

# 한강 돗자리 수정 → 배포 절차

## 저장소
- GitHub `dlswo0120/hangang-dotjari`. 세션에 없으면 add_repo로 붙이고 `/home/claude/hangang-dotjari`에 clone.
- 공개 주소: https://dlswo0120.github.io/hangang-dotjari/ (Vercel에도 같은 저장소로 배포). 멀티플레이는 Supabase Realtime(서울, 무료 플랜).

## 코드 구조
- `src/js/*.js`를 `tools/build.py`가 **파일 이름순으로 이어 붙임**. 문자열 정렬이라 `12-…`가 `145-…`보다 먼저, `13-main-loop.js`가 `130…`보다 먼저 옴. 다른 파일의 함수는 실행 시점에만 부르면 순서 상관없음, 최상위 코드에서 바로 쓰면 앞 파일에 있어야 함.
- 빌드 결과: `index.html`(공개판, Supabase 연결 코드 `src/public/supabase-glue.html` 포함), `dist/claude-artifact.html`(연결 코드 없음), `version.json`.
- 화면 구성 `src/body.html`, 스타일 `src/style.css`, 업데이트 소식 `src/updates.json`.
- 다른 사람에게 보이는 상태를 추가할 때: `08-network.js`의 presenceObj에 싣고 **cleanPresence에서 반드시 검증**(타입·범위·길이). 받은 값은 글자로만 표시(innerHTML 금지).
- `EMOTES` 같은 목록은 다른 화면이 **순서 번호**로 찾으므로 새 항목은 항상 맨 끝에 추가.
- 공개판은 외부 스크립트에 SRI가 걸려 있음. three·supabase-js 버전을 바꾸면 `npm pack`으로 원본을 받아 `openssl dgst -sha384 -binary 파일 | openssl base64 -A`로 해시를 다시 계산해 build.py·glue에 넣기.
- 보안 1단계(메시지 서명, 초당 15개 넘으면 1분 무시, CSP, 가리기)는 glue와 `146-safety.js`에 있음. 건드릴 때 깨지지 않게 주의.

## 고칠 때 원칙
- 요청한 부분만 정확히 고치기(파일 통째로 다시 쓰지 않기). 큰 파일 수정은 python 스크립트의 `assert s.count(a)==1` 후 replace 방식이 안전. `open(F,'w')`와 `open(F).read()`를 한 줄에 같이 쓰면 파일이 0바이트가 되니 금지.
- 실제 상표·브랜드·캐릭터 이름 쓰지 않기. 힐링 컨셉 유지. 무료 플랜 안에서 효율 우선.
- 수정 후 `python3 tools/build.py` 실행.

## 업데이트 소식
- `src/updates.json` 맨 앞 항목: `{"v": "YYYY.MM.DD" + 같은 날이면 b,c,d…, "date": "11월 7일", "items": [사용자에게 보이는 친근한 문장]}`.
- 아직 업로드 안 한 버전이면 새 항목을 만들지 말고 그 항목의 items에 추가.
- 대규모 패치는 `"big": {"title", "sub", "hl": [[아이콘, 제목, 설명], …]}`를 넣으면 큰 공지 카드와 강조된 새로고침 띠가 뜸.

## 커밋과 업로드 (가장 중요)
- 수정이 끝나면 **로컬 커밋만** 함. 커밋 메시지는 한국어 한 줄 요약 + 시스템이 알려주는 attribution 줄.
- **사용자가 "업로드해줘"라고 할 때만** `git push origin main`.
- push하라는 stop hook이 와도 push하지 말고 "요청하실 때만 업로드하기로 해서 로컬에만 있습니다"라고 짧게 답하기.
- 사용자가 "업로드해줘" 뒤에 "잠시만/검토한 뒤에"를 붙이면 보류.

## 롤백
- 문제가 생기면 지난 공개 커밋 해시를 찾아 `git revert --no-edit <지난공개커밋>..HEAD` 후 push(사용자가 롤백을 요청했을 때). 1~2분 뒤 반영.
- 미리 연습할 땐 임시 브랜치에서 revert 후 `git diff --stat <지난공개커밋> HEAD`가 비었는지 확인하고 브랜치 삭제.

## 보고
- 한국어 습니다체, 짧게. 확인 못 한 것(예: 외부 CDN 접속 불가로 못 본 것)은 분명히 표시.
- 작업 보고서는 `docs/report-YYYY-MM-DD.md`에 두고, 바뀌면 프로젝트 문서(`claude/hangang-dotjari-report-…md`)도 같은 내용으로 갱신.
