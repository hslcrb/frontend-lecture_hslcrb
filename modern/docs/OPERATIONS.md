# Frontend Lab 운영·배포·복구 실행서

작성: 2026-11-09 (KST) · 대상: 개인 Fork `hslcrb/frontend-lecture_hslcrb` · 환경: Cloudflare Workers **Free**

이 문서는 GitHub 소스를 인계받아 운영하거나 실서비스 오류를 조사할 때 필요한 실행 절차입니다. **관리자 비밀번호·Google OAuth Client Secret·인증 쿠키·학생 개인정보는 채팅이나 GitHub 커밋에 포함하지 마세요.**

## 1. 배포 구성 — 어느 저장소에서 무엇이 나가는가

| 구분 | 값 |
| --- | --- |
| GitHub | https://github.com/hslcrb/frontend-lecture_hslcrb |
| 배포 소스 | Fork의 `main` |
| 원본 선생님 저장소 | https://github.com/JJinMangGo/frontend-lecture (별개) |
| Cloudflare Workers | `frontend-lab-web` |
| 사이트 | https://frontend-lab.rhee.life |
| 빌드 루트 | `modern/frontend` |
| 빌드 명령 | `npm test && npm run build` |
| 배포 명령 | `npx wrangler deploy` |
| Worker 설정 | `modern/frontend/wrangler.jsonc` |
| 데이터베이스 | D1 `frontend-lab-cms` |
| D1 식별자 | `84a90c4b-fdc4-4bc0-9030-acf7ba26f069` |
| Google Access 제공자 | `Frontend Lab Google` |
| Access 앱 | `Frontend Lab — Google login` |
| Preview, workers.dev | 비활성 |

**릴리스 전 브랜치 정리:** 실제 개발은 `feat/cloudflare-free-d1-cms-20261109`에서 진행했으며, 이 문서화 작업에서 **개인 Fork의 main으로 합치고 Workers Builds의 감시 브랜치도 main으로 변경**하도록 계획했습니다. 변경이 완료되었는지 Cloudflare 대시보드에서 최종 확인해야 합니다.

## 2. 새 운영자가 개발 환경을 재현하는 절차

1. 전체 Fork를 체크아웃합니다. `DESIGN.md`, `index.html` 및 원본 `assets/css/tokens.css`가 최상위에 있어야 합니다.
2. Node.js 및 npm을 준비합니다. 클라우드 빌드 시 설치되는 의존성은 `modern/frontend/package.json`을 참조합니다.
3. 프론트엔드 디렉터리에서 아래 명령으로 자동 검사합니다.

```bash
cd modern/frontend
npm install
npm test
npm run db:local
npm run build
```

- `prebuild`는 자동으로 `scripts/sync-original.mjs`을 수행합니다. 9개 원본 디렉터리에서 새 배포 폴더로 강의 자료를 복사하고 목록 JSON을 생성합니다.
- `db:local`은 **로컬 D1**에만 마이그레이션을 적용합니다. 운영 DB의 실제 학생 자료를 수정하지 않습니다.
- 운영 Worker/D1을 호출하거나 원격 마이그레이션을 실행하기 전에는 대상 계정·데이터베이스·백업을 확인하세요.
- 라이브 Worker는 서명된 Cloudflare Access JWT를 요구합니다. 로컬 테스트를 위해 JWT 검증을 제거한 빌드를 운영에 반영해서는 안 됩니다.

## 3. GitHub → Workers Builds 자동 배포

Cloudflare 계정 → Workers & Pages → `frontend-lab-web` → **Settings → Builds**.

- 저장소: `hslcrb/frontend-lecture_hslcrb`.
- 프로덕션 브랜치: **main**.
- 루트: `modern/frontend`.
- Build: `npm test && npm run build`.
- Deploy: `npx wrangler deploy`.
- Preview: 비활성, GitHub Actions: 사용하지 않음.

**배포 완료 판단:** Cloudflare 빌드에서 tests 12/12 통과, TypeScript 및 Vite build 성공, 정적 에셋 업로드, `Uploaded frontend-lab-web`, `Deployed frontend-lab-web triggers`, `Success: Deploy command completed`를 확인합니다. 로그 중 'stopped'만으로 빌드 실패라 단정하지 말고 구체적인 성공/오류 줄을 봅니다.

소스가 변경되지 않은 문서 커밋도 빌드를 다시 실행할 수 있습니다. 원본 `main`에 최신 선생님 수업을 동기화하는 경우에도 기존 강의 HTML을 임의로 다시 작성하지 않고 자동 복사·배포로 반영해야 합니다.

## 4. Access와 교사 계정 운영

Cloudflare Access 앱은 인증 방식으로 **Google만** 허용하고, Google 계정 이메일 화이트리스트를 두지 않습니다. `Allow Everyone`은 로그인한 모든 유효한 Google 계정에 해당한다는 뜻으로, 익명 공개 `Bypass`를 의미하지 않습니다.

Cloudflare Access 앱의 AUD가 `modern/frontend/wrangler.jsonc`의 `CF_ACCESS_AUD`와 일치해야 합니다. 팀 도메인은 `long-flower-8d9c.cloudflareaccess.com`입니다.

**선생님:** `spacejh72@gmail.com`으로 Google 로그인한 뒤 `https://frontend-lab.rhee.life/admin` 접속. 최초에만 본인이 12자 이상 비밀번호를 설정하고, 다음부터는 Google 로그인과 비밀번호를 같이 입력합니다. 세션은 12시간 뒤 만료되나 비밀번호 해시는 D1에 유지됩니다. 운영자는 이 비밀번호를 대신 생성하거나 전달하지 않습니다.

**선생님 복구:** Cloudflare Email Routing의 Destination Addresses에서 `spacejh72@gmail.com` 인증이 **반드시 완료되어야** 합니다. 비밀번호 재설정 링크는 15분 유효·1회 사용이며 기존 로그인 세션이 폐기됩니다. 현장 인수인계 전 선생님 본인이 인증 메일을 확인한 뒤 복구 동작을 직접 테스트해야 합니다.

**Google Cloud 동의 화면:** OAuth 클라이언트가 External/Testing이면 Google 쪽 테스트 사용자 제한이 걸릴 수 있습니다. Access의 `Allow Everyone`이 이 제한을 해제하지 않으므로 Google Auth Platform의 게시 상태를 별도로 확인합니다.

## 5. 교사 관리자 CMS 사용법

1. 선생님 Google 계정으로 `/admin`에서 2차 비밀번호 인증합니다.
2. 목록/검색에서 기존 강의 HTML, 퀴즈 JavaScript 또는 CSS 경로를 고릅니다.
3. 내용을 변경하고 **초안 저장**합니다. 아직 학생 화면에는 반영되지 않습니다.
4. 검토 후 **게시**합니다. Worker가 D1의 게시본을 같은 원본 URL에 제공합니다.
5. 숨기려면 **숨기기**를 선택하고, 다시 활성화하려면 **다시 공개**합니다.
6. 이전 버전을 복원하려면 **게시·변경 이력 → 이 버전 복원**을 사용합니다.
7. 변경하지 않은 자료는 GitHub 원본 정적 에셋이 계속 제공됩니다.

**범위 제한:** CMS는 텍스트 소스 편집기입니다. 이미지 업로드, 복합 표 WYSIWYG, 협업 권한 등 Payload CMS의 고급 기능을 제공하지 않습니다.

## 6. 장애 조사 순서

| 증상 | 확인 항목 |
| --- | --- |
| Google 로그인 전에 403/401 | Access 앱 정책, 로그인 제공자, Google OAuth Testing 여부, 앱 도메인 |
| Google 로그인 이후 Worker 401 | `Cf-Access-Jwt-Assertion`, 팀 도메인, AUD 값, JWT 검증 |
| 등록 폼에서 계속 오류 | D1 바인딩 `DB`, `lab_students`, 실제 `/api/session` · `/api/profile` |
| 강의 HTML·퀴즈 파일 403 | 학생 이름 미등록 여부, JWT, 원본 파일 경로 |
| 선생님 /admin 403 | 로그인 이메일이 `spacejh72@gmail.com`과 일치하는지 |
| /api/admin/* 401 | 교사 추가 비밀번호 인증 및 12시간 세션 만료 |
| 비밀번호 설정·로그인에서 오류 | D1 `lab_teacher_credentials` / `lab_teacher_sessions`, Workers Free CPU 시간 제한 |
| 비밀번호 재설정 메일 불발 | 수신 주소 인증 완료 여부, EMAIL 바인딩, Email Service 발송 제한 |
| 빌드 실패 | Cloudflare Builds 로그의 `npm test`, `tsc`, Vite 단계 오류 |
| 원본 강의 일부 누락 | 최상위 원본 파일 존재, `sync-original.mjs`의 대상 폴더, 빌드 출력 |

## 7. 안전한 롤백과 데이터 백업

- **코드 롤백:** GitHub에서 문제 이전의 정상 커밋으로 별도 복구 커밋을 작성하거나 Cloudflare Worker의 이전 정상 버전으로 롤백합니다. 롤백 후 JWT 인증, D1 바인딩 및 커스텀 도메인이 유지되는지 확인합니다.
- **D1 백업:** DB는 코드 릴리스와 별개입니다. 스키마·데이터 변경 전에 Cloudflare D1의 백업/Time Travel 지원 범위와 운영 DB 식별자를 확인합니다. 개인정보가 들어 있는 DB SQL 내보내기를 **GitHub에 올리지 않습니다**.
- **원본 복구:** 현대화된 소스는 `modern/` 아래에 있으며 선생님 강의는 최상위에 보존됩니다. 따라서 새로운 CMS 게시본을 숨기거나 복원해도 원본 GitHub 파일을 덮어쓰지는 않습니다.
- **교사 비밀번호:** Worker 코드 롤백은 D1의 비밀번호를 자동 초기화하지 않습니다. 교사의 명시적인 인증·복구 없이 D1 인증 레코드를 삭제하면 안 됩니다.
- **서비스 공개 범위:** 새로운 Cloudflare Access 앱을 제거해도 선생님 GitHub Pages 원본은 여전히 공개 저장소 기반으로 별개 운영됩니다.

## 8. 운영 전 필수 합의

학생 이름 및 이메일을 저장합니다. 학교/교사 측에서 개인정보 수집 목적·보유 및 삭제 기간·접근권한·연락처를 정하고, 실제 학생 전체에게 배포하기 전에 확인해야 합니다. 누구나 Google 로그인 가능한 정책은 수업 외 계정의 등록 가능성도 의미합니다.

**선생님 공식 저장소에는 여기서 PR을 생성하지 않습니다.** 원본 변경·병합은 별도의 허가가 필요한 독립 작업입니다.

참고: [Cloudflare 계정 직접 연결 방식과 배포 내역](DEPLOYMENT.md) / [검증 체크리스트](VALIDATION.md).
