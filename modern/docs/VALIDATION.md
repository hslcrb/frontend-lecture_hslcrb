# 검증 기록 — 확인 사실과 남은 검증

2026-11-09 기준. GitHub/Cloudflare API 및 빌드 로그에서 **실제 확인한 항목**과 사용자·교사의 추가 확인이 필요한 항목을 분리합니다.

## A. 실제 확인한 것

| 영역 | 확인 방법 | 결과 |
| --- | --- | --- |
| Fork 쓰기 권한 | GitHub 저장소 권한 조회 | 개인 Fork `hslcrb/frontend-lecture_hslcrb` push/admin 가능 |
| 원본 보존 | 선생님 원본 main과 무료 개발 브랜치 비교 | 원본 파일 변경·삭제 없이 `modern/` 및 진입 문서만 추가 |
| 최신 강의 수용 | 최신 업스트림 커밋·Grid 수정 비교 | 2026-11-09 Grid `fr/auto` 자료까지 동기화 |
| Node 단위·정적 테스트 | Cloudflare Workers Builds의 `npm test` 로그 | **12개 성공 / 실패 0개** |
| TypeScript + Vite | Workers Builds의 `tsc --noEmit && vite build` 로그 | 프로덕션 빌드 성공 |
| Worker 업로드 | Wrangler 로그 | 빌드 에셋 업로드·`frontend-lab-web` 배포 성공 |
| Cloudflare Custom Domain | Cloudflare Workers Domains API | `frontend-lab.rhee.life` ↔ `frontend-lab-web` |
| Google 제공자 | Cloudflare Access Identity Providers API | `Frontend Lab Google` 존재 |
| Access 정책 | Cloudflare Access Applications API | `Frontend Lab — Google login`, Google 제공자만 허용, `Allow Everyone` |
| D1 프로비저닝 | Cloudflare D1 API | `frontend-lab-cms` 생성 확인 |
| D1 스키마 | D1 `sqlite_master` 조회 | 학생/CMS/교사 인증 관련 **6개 테이블** 생성 확인 |
| D1 SQL 연동 | D1 API의 합성 데이터 INSERT/SELECT/DELETE | 학생 프로필, 게시본 및 수정 이력 저장·조회·삭제 성공 |
| 원본 SVG | 테스트 및 GitHub 파일 조회 | 자체 제작 SVG **31개** 존재 |
| 원본 수업 동기화 | Node 임시 테스트 폴더 및 클라우드 `prebuild` | 원본 HTML/HTM/CSS/JS 복사 및 매니페스트 생성 성공 |
| PR 미생성 | GitHub PR 검색 | 선생님 원본 저장소에 해당 개발 PR **없음** |

`modern/frontend/tests/defense-in-depth.test.mjs`는 주로 **서명 검증 코드 사용, 경로 설정, D1 migration 존재, 원본 보존, 인증 API 경계** 등을 코드 수준에서 확인합니다. `sync-original.test.mjs`는 가상 원본 폴더를 만들고 HTML 파일 복사·아이콘 치환·기존 퀴즈 스크립트 보존 여부를 검증합니다. **12/12 성공은 실제 사용자 브라우저 E2E 검증과 다릅니다.**

## B. 추가 검증이 필요한 항목 — 완료라고 쓰지 않음

| 우선순위 | 테스트 | 기대 결과 |
| --- | --- | --- |
| 높음 | 로그인하지 않고 메인/강의/퀴즈 접근 | Cloudflare Access 로그인 안내 또는 차단 |
| 높음 | 기존 허용 목록에 없던 임의 Google 계정 로그인 | Google 정책상 사용 가능하다면 Access 인증 성공 |
| 높음 | Google OAuth 동의 화면의 Testing/Production 확인 | 테스트 사용자 한정 여부 파악, 일반 사용자 접근 전 게시 상태 검토 |
| 높음 | 등록되지 않은 계정으로 강의 HTML·JS/CSS 요청 | 403으로 거부 |
| 높음 | 신규 Google 계정으로 이름 입력 | D1 등록 후 `/api/home`과 강의 페이지 표시 |
| 높음 | 타 Google 계정으로 `/admin` 접속 | 403 거부 및 교사 CMS 데이터 접근 불가 |
| 높음 | 선생님 Google 계정으로 관리자 초기 비밀번호 설정 | 해시가 D1에 저장되고 인증 쿠키 발급 |
| 높음 | 올바른/틀린 관리자 비밀번호 | 성공/401/5회 실패 시 잠금 검증 |
| 높음 | 교사 수신 주소 Cloudflare 메일 인증 | 발송 가능 상태 확인 |
| 높음 | 비밀번호 분실 메일 요청 및 일회용 링크 | 실제 수신·15분 유효·1회 소비·기존 세션 무효화 |
| 높음 | Workers Free **CPU 10ms**와 PBKDF2 120k 반복 | 실사용 관리자 로그인·재설정에서 CPU 한도 초과가 없는지 측정 |
| 높음 | HTML/CSS/JS CMS 초안·게시·숨김·복원 | 실제 브라우저로 학생에게 적용 여부 검증 |
| 보통 | AI·Flex·Grid·JavaScript 및 다양한 퀴즈 답안 | 클릭·문제 로드·채점·애니메이션 모두 정상 |
| 보통 | 375px/768px/1440px 화면 | 텍스트·카드·내비게이션·관리 화면 깨짐 없음 |
| 보통 | Google Access/Worker 우회 접속 시도 | workers.dev/Preview URL 없고 허용되지 않은 API 호출 차단 |
| 보통 | 관리자 로그아웃·비밀번호 재설정 | 과거 관리자 세션으로 DB 쓰기 불가 |
| 보통 | 개인정보 수집·정정·삭제 요청 | 관리자 운영 절차로 수행 가능하고 학교 정책과 일치 |

## C. 실제로 관찰한 실패·수정 이력

**첫 클라우드 자동 빌드:** `src/Admin.tsx`, `src/App.tsx`, `src/TeacherGate.tsx`에서 JSON 응답의 TypeScript 타입이 `unknown`인 문제로 오류 6건 발생. 컴파일러가 확인할 수 있도록 오류 응답의 타입을 명시해 수정했습니다. 이후 재빌드 성공.

**일반 사용자 DB:** 테스트에 사용한 합성 레코드를 삭제하고 상태를 재확인했습니다. 실제 사용자 데이터는 별개의 운영 데이터로 간주하며 개발 문서나 공개 로그에 복제하지 않습니다.

**교사 비밀번호 재설정:** 수신 주소 `spacejh72@gmail.com`을 Cloudflare Email Routing에 등록했지만, 이메일 인증이 완료되기 전에는 발송 테스트 성공을 기록하지 않았습니다.

**원래 Payload 기반 설계:** 무료 계정의 제약으로 D1 자체 CMS로 교체했습니다. 따라서 Payload의 리치텍스트 UI나 R2 미디어 업로드가 작동한다고 주장하지 않습니다.

## D. 릴리스 게이트

- [x] GitHub 원본 강의 보존 및 새 구현 격리
- [x] 무료 Workers/D1 배포 연결
- [x] Cloudflare Access Google 앱 생성
- [x] 무료 D1 스키마 및 합성 CRUD 검증
- [x] Node 12개 테스트·TypeScript/Vite 빌드 확인
- [ ] 교사 메일 수신 주소 인증
- [ ] 실제 학생 Google 로그인·등록·수업 접근 테스트
- [ ] 실제 교사 최초 비밀번호 설정·로그인 테스트
- [ ] 실제 이메일 복구·세션 만료 테스트
- [ ] 무료 Workers CPU 한도 아래 인증 성능 테스트
- [ ] 원본 전체 강의·퀴즈·반응형 화면 회귀 테스트
- [ ] 학교/선생님 개인정보 처리 고지 및 운영 정책 확인

**원본 선생님 저장소 Pull Request:** 사용자가 최종적으로 승인하지 않았으므로 만들지 않습니다. 개인 Fork의 main 병합과는 별개의 일입니다.
