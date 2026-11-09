# Frontend Lab 개발 전 과정 기록

> 작성일: **2026년 11월 9일 (한국 시간)**  
> 개발 대상: `hslcrb/frontend-lecture_hslcrb` (선생님 공개 저장소의 개인 Fork)  
> 최종 목표: 원본 교재를 보존하면서 무료 인프라에서 Google 로그인·학생 등록·교사 CMS 지원  
> 증거 기준: GitHub 파일·커밋·Cloudflare 계정 설정·빌드 로그·D1 실행 결과로 확인된 내용만 완료로 기록합니다.

## 1. 출발점 — 왜 개발했는가

선생님이 공개한 Frontend Lab은 HTML/CSS/JavaScript 강의와 Quiz를 여러 개의 정적 파일로 제공하던 구조였습니다. 이 프로젝트에서 요구한 것은 **디자인을 예쁘게 새로 그리는 것이 아니라, 원본의 학습 흐름을 그대로 살려 로그인과 데이터 기반 운영 기능을 덧씌우는 일**이었습니다.

초기 요구사항:

1. 기존 수업 카드·색·타이포그래피·레이아웃·퀴즈 채점 동작 보존.
2. 홈페이지 이모지만 직접 제작한 SVG 아이콘으로 교체.
3. React로 새로운 앱 뼈대 구성, Cloudflare에서 배포.
4. Google 로그인 뒤 학생 이름을 따로 입력하게 하고, 학생 데이터를 DB에 기록.
5. 관리자에서 강의 HTML/CSS/JavaScript를 수정·게시하고 과거 변경 이력을 복구.
6. 선생님 원본 저장소는 무단 수정하지 않고 개인 Fork에 작업, 원본으로 PR은 명시적 승인까지 보류.

원본의 `DESIGN.md`, `index.html`, `assets/css/`, 각 폴더 강의 HTML·퀴즈 문제 JavaScript를 살펴본 뒤 별도의 `modern/` 디렉터리에 확장판을 구축하기로 했습니다. 초기 Fork 기본 브랜치 `main`은 2026-09-18자 오래된 상태였고, 개발 브랜치에서 최신 원본을 동기화했습니다.

## 2. 설계 1차안 — React + Cloudflare + Payload CMS + Supabase

**초기 연구 결과:**

- 학습 페이지를 일괄 React 컴포넌트로 재작성하면 원본 인터랙션, 스타일 및 URL이 훼손될 가능성이 있었습니다.
- 이에 홈페이지와 학생 온보딩만 React로 만들고 강의 HTML/JS/CSS는 빌드 시 그대로 복사하는 점진적 마이그레이션 방식을 택했습니다.
- Cloudflare Access JWT를 서버에서 확인하고 학생 이름은 별도 DB 조회를 통해 강제하도록 설계했습니다.
- 관리 기능은 Payload CMS 공식 Cloudflare D1 템플릿(Next.js/OpenNext, D1, R2)을 채택하는 안을 검토했습니다.
- 데이터베이스 후보로 Supabase를 검토했고, 기존 다른 서비스의 Supabase 프로젝트는 변경하지 않고 전용 학생 테이블 마이그레이션만 소스에 보존했습니다.

**개발 흔적:** `feat/react-cloudflare-payload-supabase-20261109` 브랜치. 주요 커밋 `6ed14fc`, 이후 보완 커밋 `22565d4`. 이 브랜치는 **폐기하지 않고 과거 설계안으로 보관**하되 현재 배포에는 사용하지 않습니다.

## 3. 무료 플랜 전환 — 구조를 단순화

사용자가 **유료 상품을 쓰지 않고 무료 플랜만으로 구현**하기를 요청했습니다. Cloudflare 계정 점검에서 R2는 활성화되어 있지 않았고 Payload/Next 기반 CMS를 상시 운영하기에는 Workers Paid가 필요한 구성이었습니다.

따라서 다음과 같이 변경했습니다.

| 초기 구성 | 최종 무료 구성 | 사유 |
| --- | --- | --- |
| 별도의 Payload CMS Worker | 단일 Worker 내 **직접 구현한 D1 CMS API** | 유료 플랜과 R2 의존성 제거 |
| Payload 미디어 라이브러리/R2 | GitHub에 남아 있는 원본 이미지·동영상 정적 에셋 | 별도 파일 저장 서비스 불필요 |
| Supabase 필수 저장소 | **D1 학생 테이블** | 이미 사용 가능한 무료 DB 활용 |
| React + 기존 전체 강의 재작성 | React 홈페이지/관리 UI + **기존 HTML/JS/CSS 원형 유지** | 기존 수업 동작 보존 |
| 비밀번호 없는 관리자 진입 | Google 본인 확인 + 별도 교사 비밀번호 세션 | 교사 전용 콘텐츠 편집 보호 |

무료 구현 전용 브랜치: `feat/cloudflare-free-d1-cms-20261109`. 유료 CMS 파일은 이 브랜치에서 제거했습니다. 원본 파일은 남겨 두고 `modern/frontend/`만 빌드 대상으로 삼았습니다.

## 4. D1 데이터베이스 생성 및 스키마

Cloudflare 계정에 기존 프로젝트들과 독립적인 **`frontend-lab-cms`** D1 DB를 실제 생성했습니다. 식별자: `84a90c4b-fdc4-4bc0-9030-acf7ba26f069` (비밀키 아님). 데이터베이스는 APAC 지역 힌트로 생성했습니다.

**최초 3개 테이블** (`migrations/0001_free_lab.sql`):
- `lab_students` — Access 검증 계정의 `access_subject`, 이메일, 학생이 입력한 이름, 시각.
- `lab_content` — 원본 경로, HTML/CSS/JS 종류, 초안, 게시본, 숨김 상태, 마지막 수정자.
- `lab_content_versions` — 게시·숨김·복원 시 이전 상태 스냅샷과 수정 이력.

**추가 3개 테이블** (`migrations/0002_teacher_auth.sql`):
- `lab_teacher_credentials` — 교사 계정 이메일, salt, PBKDF2 비밀번호 해시, 로그인 실패·잠금 상태.
- `lab_teacher_sessions` — 교사 로그인 세션 토큰의 SHA-256 해시와 Access subject·만료 시각.
- `lab_teacher_reset_tokens` — 이메일 재설정 일회용 토큰의 해시·만료·사용 시각.

D1 API로 테이블을 생성하고 합성 학생 프로필·합성 게시본·버전 이력에 대해 INSERT/SELECT/DELETE를 실행해 성공을 확인했습니다. 합성 테스트 레코드는 삭제했습니다. **실제 학생 개인정보는 테스트·문서 출력에 사용하지 않았습니다.**

## 5. 학생 화면 · 원본 강의 · SVG

**React 진입점:** `modern/frontend/src/main.tsx` → `App.tsx`. `index.html`에 기존 CSS들을 로딩하고, `scripts/sync-original.mjs`가 원본 강의/퀴즈/디자인 파일을 `modern/frontend/public/` 아래로 복사합니다. 원본을 직접 편집하지 않습니다.

보존한 강의 경로의 예:
- `/ai/step-01.html`, `/ai/quiz-01.html`
- `/flex/flex-lecture.html`, `/grid/grid-lecture.html`
- `/javascript/01-history.html`, `/quiz/html_quiz1.html`
- CSS, AI·퀴즈 문제 데이터 JavaScript 등

원본 스타일과 퀴즈 채점용 스크립트는 복사 후 그대로 제공합니다. 홈페이지 카드에 있던 아이콘만 원본 제작 SVG **31종**으로 대체하고, 학생 이름 등록 UI는 자체 `portal.css`로 격리했습니다. HTML 강의를 전체 React JSX로 변환하지 않기 때문에 이 프로젝트는 **점진적 현대화**입니다.

## 6. Cloudflare Access · Google OAuth

사용자가 Google Cloud OAuth 앱을 생성하고 Cloudflare 로그인 제공자를 연결했습니다. Cloudflare 연결을 확인했을 때 다음 설정이 존재했습니다.

- Google Identity Provider: `Frontend Lab Google` (일반 Google 계정).
- Access 앱: `Frontend Lab — Google login`.
- 서비스 도메인: `frontend-lab.rhee.life`.
- Access Team Domain: `long-flower-8d9c.cloudflareaccess.com`.
- 앱 AUD: `9223d412d1840b0bd76ae01e4eb4d2ebe44311aebfa633e3eb37e1d7af70c925`.

사용자의 최종 요구에 따라 **학생 이메일 화이트리스트는 적용하지 않았습니다.** Access 정책은 Google 로그인 제공자를 지정한 `Allow Everyone`이고, Worker는 수신한 Access JWT의 RS256 서명·issuer·AUD를 JWKS로 별도 검증합니다.

이후 학생 이름을 D1에서 조회하며 미등록 이용자는 강의 파일을 받지 못하도록 설계했습니다. **주의:** Google Cloud OAuth 앱이 Testing 모드라면 Google 측 테스트 사용자 제한은 별도로 남을 수 있고, Cloudflare Access 무료 사용자/사용량 제한도 없어지지 않습니다.

## 7. 교사 계정 전용 2차 인증과 비밀번호 복구

사용자 지정 선생님 계정: `spacejh72@gmail.com`.

- 지정 이메일을 사용하는 Access-검증 Google 계정만 `/admin` 진입 및 교사 인증 API 호출 가능.
- 선생님이 첫 접속 시 비밀번호를 **직접 1회 설정**. 데이터베이스에는 비밀번호 원문 대신 무작위 salt + PBKDF2-SHA256(120,000회 반복) 결과를 기록.
- 쿠키 `__Host-FLTeacher`는 Secure/HttpOnly/SameSite=Strict이며, 실제 토큰의 SHA-256만 D1에 저장. 관리자 세션은 12시간 유효하지만 비밀번호 해시 자체는 계속 보존.
- 로그인 5회 연속 실패 시 15분 잠금.
- 재설정 이메일의 256비트 무작위 토큰도 해시만 D1 저장. 15분 동안 1회 사용, 사용 시 기존 관리자 세션 무효화.
- 관리자 변경 API는 Google 인증, 교사 이메일 일치, 관리자 비밀번호 세션, 요청 출처 검증을 확인.

메일은 Cloudflare Email Service의 **무료 플랜 인증 수신자 한정 발송** 경로로 구성했습니다. 수신 주소를 Cloudflare에 등록했지만, 최종 점검 시 **수신 주소 인증이 아직 완료되지 않았으므로 실제 복구 메일 발송을 성공했다고 주장하지 않습니다.** 선생님이 수신 인증 메일을 클릭해야 합니다.

## 8. CMS와 수정 이력

`modern/frontend/src/Admin.tsx`는 외부 Payload 없이 구현한 **직접 제작 관리자 화면**입니다.

- 원본 경로 기반 파일 목록·검색.
- HTML·CSS·JavaScript 소스 편집.
- 초안 저장과 게시를 분리해 작업 실수 감소.
- 학생 화면에서 파일 숨김·다시 공개.
- 게시/숨김/복원 이력을 파일별 최근 50건 조회, 이전 게시본으로 복원.
- HTML 샌드박스 미리보기 및 교사 전용 학생 이름 목록.

`worker/free-cms.ts`와 `free-db.ts`가 D1 prepared statement로 변경 이력을 기록하고, 실제 학생 요청은 D1 게시본이 있으면 그 값을 제공하고 없으면 원본 정적 파일로 폴백합니다. **비주얼 WYSIWYG·CMS 미디어 업로드 기능은 이번 무료판 범위에서 제외**했습니다.

## 9. GitHub와 Cloudflare 빌드·배포 실제 이력

1. GitHub에서 선생님 원본 강의를 최신 상태로 가져와 개발 브랜치의 바탕을 맞췄습니다. `5f1cab1` 등의 병합 이력이 남습니다.
2. 첫 구현을 별도 브랜치에 커밋한 뒤, 무료 버전 요구로 전용 브랜치를 새로 만들고 유료 코드 제거·D1 CMS 구현을 진행했습니다.
3. Cloudflare 계정에 `frontend-lab-web` Worker를 생성했습니다. 처음에는 작업 중 공개를 막기 위해 503으로 응답하는 안전한 임시 코드였습니다.
4. Cloudflare Access 앱에 Google IdP와 해당 도메인을 연결하고, Workers Builds에 GitHub 저장소·`modern/frontend` 루트·개발 브랜치를 설정했습니다. **GitHub Actions는 사용하지 않았습니다.**
5. **첫 자동 빌드는 TypeScript에서 JSON 타입 관련 오류 6건으로 실패**했습니다. `src/Admin.tsx`, `src/App.tsx`, `src/TeacherGate.tsx`에서 불명확한 JSON 타입을 명시적으로 좁혀 수정했습니다(`462dee4`).
6. 재빌드에서 Cloudflare가 실제 정적 에셋을 업로드하고 Worker를 배포했습니다. 이후 12개 Node 정적·단위 테스트와 Vite/TypeScript 빌드가 성공하는 로그를 확인했습니다.
7. 2026-11-09 선생님 원본에 추가된 Grid `fr/auto` 설명 커밋 `782b0c2`를 재확인하고 개발 브랜치에 병합했습니다(`94aa8d0`). 원본과 비교해 **원본 강의 파일의 임의 변경 없이 확장 파일만 추가**되도록 정리했습니다.
8. 본 개발 문서를 작성한 뒤 **개인 Fork의 `main`에 정식 병합**하고, Cloudflare 빌드 감시 브랜치도 `main`으로 변경하는 것이 최종 정리 절차입니다.

## 10. 확인 가능한 성과와 확인하지 못한 부분

**실제로 확인한 것:** GitHub 커밋·브랜치·비교 내용, 31종 SVG 파일, Cloudflare D1 테이블 생성, 합성 SQL CRUD, Access IdP/정책/AUD, Custom Domain 등록, Cloudflare 자동 빌드·배포 및 12/12 자동 테스트 통과.

**아직 별도 검증해야 할 것:** 실제 일반 Google 계정으로 로그인, 새로운 학생 이름 제출과 강의 전체 화면 테스트, 선생님 계정으로 최초 비밀번호 생성, 이메일 인증 및 실제 비밀번호 재설정, 375/768/1440px 화면에서 모든 강의 퀴즈의 채점 동작, PBKDF2 연산이 Workers Free의 CPU 한도 내에서 잘 동작하는지 확인.

공개 서비스의 사용자 등록 기록은 자동 테스트 통과를 대신하지 않습니다. 학생 운영 전에 학습자 개인정보 처리 목적·보유 기간·삭제 절차를 정하고 담당 교사의 동의와 기능 검토를 받아야 합니다.

## 11. 소스와 관련 자료

- [초기 설계안의 브랜치](https://github.com/hslcrb/frontend-lecture_hslcrb/tree/feat/react-cloudflare-payload-supabase-20261109)
- [무료 플랜 버전 브랜치](https://github.com/hslcrb/frontend-lecture_hslcrb/tree/feat/cloudflare-free-d1-cms-20261109)
- [기존 강의와 새 구성 요소의 연결](ARCHITECTURE.md)
- [실제 배포·복구 절차](OPERATIONS.md)
- [검증 내역과 인수인계 체크리스트](VALIDATION.md)
- [보안·개인정보](SECURITY.md)
- [Cloudflare Worker 설정](../frontend/wrangler.jsonc) / [D1 스키마](../frontend/migrations/) / [테스트](../frontend/tests/)

**저작권·협업:** 원본 강의 자료의 소유권은 원저작자에게 있습니다. 공개 저장소라는 사실만으로 코드·저작물의 재라이선싱이 허용되는 것은 아닙니다. 선생님 저장소에 대한 PR은 별도 승인 전까지 만들지 않습니다.
