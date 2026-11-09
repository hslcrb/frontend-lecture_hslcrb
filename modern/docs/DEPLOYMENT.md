# 무료 배포 가이드 — Cloudflare Workers Free + D1

목표: 로그인 없는 접근 불가 / 학생 이름 미등록 시 강의 자료 접근 불가 / 교사만 CMS 편집 가능. **Google OAuth 설정 전에는 배포를 공개하지 않습니다.**

## 0. 확인된 무료 인프라

- Cloudflare 계정은 Workers + D1 사용 가능, 유료 R2는 활성화되어 있지 않음.
- Frontend Lab 전용 D1 `frontend-lab-cms` 생성 완료.
- D1 ID: `84a90c4b-fdc4-4bc0-9030-acf7ba26f069` (공개해도 되는 리소스 ID; 비밀키 아님)
- 2026-11-09 API로 `lab_students`, `lab_content`, `lab_content_versions` 3개 테이블 및 인덱스 생성, 합성 프로필·게시본 생성/조회/삭제 성공.
- Supabase는 다른 프로젝트를 임의 변경하지 않음. 나중에 `STUDENT_STORAGE=supabase`로 전환 가능.
- 독립된 Payload 서버와 R2 비용이 들지 않음.

현재 무료 할당량: Cloudflare Workers 일 100,000 요청, D1 일 5,000,000 행 읽기 / 100,000 행 쓰기, 5GB 저장(계정 총합), DB 10개. 무료 한도 초과 시 요청 실패 가능.
https://developers.cloudflare.com/workers/platform/pricing/
https://developers.cloudflare.com/d1/platform/pricing/

## 1. Google OAuth 설정 (사용자가 할 일)

1. https://console.cloud.google.com/apis/credentials 에서 OAuth 동의 화면 설정.
2. **Web application** 클라이언트를 만들고 Redirect URI에 아래 값을 넣기:

   `https://long-flower-8d9c.cloudflareaccess.com/cdn-cgi/access/callback`

3. Zero Trust https://one.dash.cloudflare.com/ 에서 **Settings → Authentication → Login methods**로 이동해 Google IdP를 추가하기.
4. Google Cloud OAuth **Client ID, Client Secret은 Cloudflare 관리 화면에만 입력**. GitHub/채팅/React 환경변수에 절대로 넣지 않기.
5. 학생 계정 및 교사 계정이 포함된 **명시적인 allow 정책**을 만들고 IdP는 **Google만 허용**. OTP / Everyone 정책 사용하지 않기.
6. Cloudflare Workers > 새 Worker `frontend-lab-web` > Settings > Domains & Routes에서 자신의 도메인을 지정하고, **Worker의 모든 경로**에 Access 앱을 연결.
7. Access 앱의 **AUD tag**를 `CF_ACCESS_AUD` 값으로 사용. Google Client ID와 서로 다른 값임.

Cloudflare 팀 도메인은 `long-flower-8d9c.cloudflareaccess.com`.
세션 JWT는 Cloudflare Access JWKS 기반 RS256으로 서버에서 검증하며, 학생의 로그인 이메일 HTTP 헤더를 신뢰하지 않습니다.

## 2. Worker 바인딩/설정

`modern/frontend/wrangler.jsonc`에는 아래 설정이 이미 구성되어 있습니다.

```
DB: Cloudflare D1 frontend-lab-cms
ASSETS: Vite 정적 에셋 (run_worker_first=true)
workers_dev=false
preview_urls=false
```

로그인한 사람에게만 화면이 제공되도록 `run_worker_first`를 삭제하지 마세요.

런타임 환경변수(Worker 설정 또는 `wrangler secret put`)는:

- `CF_ACCESS_TEAM_DOMAIN=long-flower-8d9c.cloudflareaccess.com`
- `CF_ACCESS_AUD=<학생용 Access 앱 AUD>`
- `ADMIN_EMAILS=<교사의 정확한 Google 이메일 주소 목록, 쉼표로 구분>`
- `STUDENT_STORAGE=d1` (입력 생략해도 기본 d1)

`ADMIN_EMAILS`가 비어 있으면 모든 관리자 접근이 거부됩니다. 운영 도메인을 공개하기 전에 **별도 교사용 Google Access 정책**도 /admin 및 /api/admin/* 경로에 적용하세요. 백엔드에서 ADMIN_EMAILS를 재검사하므로 URL 우회로 관리자 권한을 획득할 수 없습니다.

## 3. 무료 D1 스키마와 로컬 테스트

```bash
cd modern/frontend
npm install
npm test
npm run db:local
npm run build
```

원격 D1 테이블은 이미 생성했습니다. Wrangler의 마이그레이션 이력도 기록하고 싶으면:

```bash
npm run db:remote
```

SQL에 IF NOT EXISTS가 포함되어 있으므로 이미 존재하는 테이블에 다시 실행해도 기존 데이터는 유지됩니다. **다른 D1을 지정하지 마세요.**

## 4. 배포

Google IdP + Access 정책 + 교사 ADMIN_EMAILS + 새 Worker의 대상 도메인이 모두 준비된 후에만:

```bash
cd modern/frontend
npm install
npm run build
npx wrangler deploy
```

Cloudflare Workers Builds를 GitHub와 연결하면 GitHub Actions 없이 빌드를 자동화할 수 있습니다. 이 작업은 Cloudflare 대시보드에서 GitHub 저장소와 `modern/frontend` 루트 디렉터리를 선택해야 하므로 사용자 승인/로그인이 필요합니다.

`workers_dev=false` / `preview_urls=false`이므로 **도메인을 지정하지 않으면 실제 URL이 없습니다**. 이 상태는 공개하지 않는 것이며 배포 성공을 의미하지 않습니다.

## 5. 강의 편집

- `https://<본인 도메인>/admin`: 선생님 관리자 페이지.
- 초안 저장 → 게시 → 학생에게 반영. 편집·복원 내역은 D1에 저장됩니다.
- 이미지·영상 파일은 무료 버전에서 GitHub 원본 파일로 유지(용량 큰 CMS 미디어 업로드는 지원하지 않음).
- 수정이 없는 강의는 기존 HTML, HTML 퀴즈, 인터랙티브 JS 파일을 제공하고 디자인을 그대로 사용합니다.

## 6. Supabase Free 선택 옵션

필요할 때 별도의 무료 Supabase 프로젝트를 직접 선택하세요. `modern/supabase/migrations/20261109000000_frontend_lab_students.sql` 적용 후 서버 비밀값 `SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`를 Worker에만 넣고 `STUDENT_STORAGE=supabase`를 선택하면 학생 등록을 Supabase로 저장합니다. 브라우저에 서비스 역할 키를 노출하지 않습니다.

D1 기존 학생 정보가 **자동 이전되는 것은 아닙니다**. 개인정보 이전은 별도 동의·계획과 관리자 승인 후 수행해야 합니다.

## 7. 출범 전 필수 확인

- 익명 GET /, /quiz/*.html, /assets/js/* 모두 로그인 차단.
- 허가받지 않은 Google 계정 로그인 거부 / OTP 정책 미허용.
- Google 로그인만 한 사용자에게는 이름 등록만 보이고 수업 파일은 403.
- 2~40자 이름 등록 후 강의/퀴즈 정상 작동.
- 교사 외의 /admin, /api/admin/* 접근은 403.
- HTML/CSS/JS 초안·게시·숨김·복원 실제 반영 확인.
- 375px/768px/1440px 데스크톱·모바일 회귀 검사.
- GitHub Pages의 원본 URL은 **여전히 공개**임. 원본을 비공개로 바꾸는 것이 아니며 URL 전환은 선생님의 동의가 필요.

**참고:** 원본 레포는 선생님 소유입니다. PR은 사용자 최종 승인 전까지 생성하지 않습니다.
