# 우리들의 게임 테이블

완성된 정적 웹사이트입니다. `index.html`을 포함한 폴더 전체를 GitHub Pages / Netlify / Vercel 등에 올리면 실행됩니다.

## 기본 입장 코드
- 나: `HOST`
- 김소미: `SOMI`
- 연시은: `SIEUN`
- 차현수: `HYUNSU`
- 한수강: `SUGANG`

코드/표시 이름은 `data/config.js`에서 바로 바꿀 수 있습니다.

## 공유 리더보드 + 방명록 (한 번만 설정)
정적 호스팅만으로는 여러 사람의 기록을 공유할 서버가 없으므로, Supabase 무료 프로젝트가 필요합니다.
1. Supabase 프로젝트 생성
2. SQL Editor에서 `SUPABASE_SETUP.sql` 전체 실행
3. Project Settings → API에서 Project URL / anon public key 확인
4. `data/config.js`의 `supabaseUrl`, `supabaseAnonKey` 두 칸에 붙여넣기
5. 사이트 업로드

두 값을 비워 둔 상태에서도 사이트/게임은 전부 동작하지만 기록은 각 브라우저의 localStorage에만 저장됩니다.

## 편지 넣기
`data/letters.js`의 각 사용자 HTML 문구를 원하는 편지로 교체하세요.

## 게임
- YAHTZEE: 13개 표준 점수 항목, 상단 63점 보너스, 추가 야추 보너스 포함
- SEVEN: 7라운드 솔로 푸시유어럭. 중복 숫자는 버스트, 서로 다른 숫자 7종은 +15
- CAN'T STOP: 4주사위 페어링 / 최대 3개 활성 열 / 버스트 / STOP 확정 / 3열 완주 승리 규칙으로 CPU와 대전

## 참고
홈 화면의 Can't Stop 박스 이미지는 Gameology CDN의 실물 박스 이미지를 원격으로 표시합니다.
