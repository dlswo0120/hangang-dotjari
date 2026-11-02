# 한강 돗자리

말없이 같이 앉아 강을 보는 3D 웹 공간입니다. 돗자리, 오리배, 한강 라면, 한강 편의점이 있습니다.

## 폴더 구조

```
src/
  head.html        제목·폰트
  style.css        화면 스타일
  body.html        버튼·창 같은 화면 구성
  js/              게임 코드 (파일 이름 순서대로 합쳐집니다)
    01-core.js           렌더러, 시간대(한국 시간), 하늘·물
    02-world.js          잔디·나무·벤치·도시·대교
    03-tables-ramen.js   테이블·의자, 라면 매대와 김
    04-boats.js          오리배 모델
    05-avatar.js         캐릭터와 동작, NPC, 말풍선
    055-store-world.js   한강 편의점 건물·진열대·점원·상품 목록
    06-weather-audio.js  날씨 효과와 소리
    07-player-input.js   내 캐릭터, 키보드·조이스틱·카메라 조작
    08-network.js        접속자 동기화
    09-boat-logic.js     오리배 탑승·침몰 규칙
    10-actions.js        화면 오른쪽 아래 행동 버튼
    105-store-logic.js   지갑·장바구니·계산 줄·결제
    11-ui.js             입장·나가기·말하기·사진
    12-simulation.js     이동과 충돌
    13-main-loop.js      매 프레임 업데이트
  public/supabase-glue.html   공개판에서 Supabase로 접속자를 잇는 코드
supabase/setup.sql   Supabase 설정 (날씨·관리자 비밀번호)
tools/build.py       src를 합쳐 index.html을 만드는 스크립트
index.html           빌드 결과 (Vercel·깃허브 페이지가 보여주는 파일)
```

## 고치는 방법

1. `src/` 안의 파일을 고칩니다.
2. `python3 tools/build.py` 를 실행합니다.
3. 새로 만들어진 `index.html` 을 함께 커밋하면 Vercel이 자동으로 배포합니다.

`index.html` 은 직접 고치지 마세요. 빌드할 때마다 `src/` 기준으로 다시 만들어집니다.

## 편의점 돈

- 하루에 한 번(한국 시간 기준) 용돈 4,000원을 받습니다.
- 돈과 산 물건은 그 기기 브라우저에만 저장됩니다. 브라우저 기록을 지우면 사라집니다.

## 업데이트 공지 남기기

1. `src/updates.json` 맨 위에 새 항목을 추가합니다. `v`는 버전(예: `2026.11.03`), `date`는 화면에 보일 날짜, `items`는 바뀐 점입니다.
2. `python3 tools/build.py`를 실행하면 `version.json`이 함께 만들어집니다.
3. 올리면 접속 중인 사람 화면 위에 "한강이 새로 단장했어요 · 새로고침" 안내가 뜨고(3분마다 확인), 다시 들어온 사람에게는 업데이트 내용 창이 한 번 뜹니다. 처음 온 사람에게는 띄우지 않습니다.
