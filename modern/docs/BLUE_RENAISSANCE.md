# Blue Renaissance CMS — D1 강의 라이브러리 및 독립 운영

작성일: 2026-11-09. 이 문서는 **기존 Frontend Lab 웹사이트의 서버 CMS를 Blue Renaissance라는 내부 제품명으로 운영**하기 위한 설계·변경 기록입니다.

## 1. 지금 사이트는 정적·동적 혼합형

Cloudflare Workers에서 **Google Access 인증과 학생 등록·학습 이력·CMS 편집**은 서버 측에서 처리하고, React·CSS·JavaScript·이미지는 정적 에셋을 사용합니다. 초기에는 원본 강의 HTML도 이 정적 번들에서 제공하고, **선생님이 별도로 수정·게시한 강의만 D1에서 제공**했습니다.

이번에는 **원본 강의 HTML까지 D1에서 우선 제공하는 구조**로 확장했습니다. 시스템 전체를 Next.js/Payload 등 유료 스택으로 교체할 필요는 없습니다.

| 저장 대상 | 최종 저장 방식 | 비고 |
| --- | --- | --- |
| 강의 원본 HTML 44개 | D1 `lab_course_sources` | 페이지 본문·메타 및 원본 출처 해시 |
| 선생님이 편집한 강의 초안·게시본 | D1 `lab_content` | 초안/게시 구분과 과거 버전 복구 유지 |
| 문제은행·정답·게시 버전 | D1 `lab_quiz_sets`, `lab_quiz_versions` | 기존 Quiz Studio 유지 |
| 학생 고유 ID·학습 기록·점수 | D1 `lab_student_profiles`, `lab_quiz_attempts` | 학생별 Access 인증에 연결 |
| 선생님 별도 비밀번호 해시 | D1 `lab_teacher_credentials` | Google 로그인+2차 인증 |
| 공통 JS·CSS·아이콘·미디어 | Cloudflare Workers Static Assets | 성능·무료 용량·원본 강의 동작 유지 |
| 장애 시 강의 원본 | GitHub에서 빌드한 정적 HTML | D1 누락에 대한 폴백 |

**강의 제공 우선순위:** 교사가 게시한 CMS 수정본(`lab_content`) → D1 수업 원본(`lab_course_sources`) → 정적 빌드 원본(`ASSETS`).

이것이 의도한 **반동적(Hybrid)** 구조입니다. 파일만 제공하는 순수 정적 사이트가 아니라, 강의 콘텐츠와 학습 기록 모두 서버 DB에서 읽고 관리할 수 있습니다.

## 2. 실제 강의 원문 D1 적재

Cloudflare D1에 `lab_course_sources`를 별도 생성하고, GitHub `main`의 기존 강의 HTML 43개와 홈페이지 본문 1개를 **총 44개** 저장했습니다.

적재 후 D1 집계 검증:

- 저장 페이지: **44**
- HTML 본문 용량 총합: **약 429KiB** (SQLite 문자열 길이 기준)
- 홈페이지 `/`: **1건**
- D1 쓰기 작업: **44/44건 성공**
- 선생님이 게시한 수정본 테이블 `lab_content`과 학생 테이블은 덮어쓰지 않았습니다.
- 원본 GitHub 파일 자체도 변경하지 않았습니다.

일부 파일은 빌드 중 기존 추적용 스크립트를 제거한 내용으로 적재했습니다. 원본 소스의 변경 및 재적재가 필요하면 관리 화면의 **배포본 → D1 원본 동기화** 버튼을 사용하세요. 이 작업은 해당 페이지의 원본 보관본만 새로 쓰고 **교사가 게시한 CMS 수정본은 그대로 둡니다.**

## 3. Blue Renaissance 관리자 UI

**영문 정식 표기:** `Blue Renaissance`  
**용도:** Frontend Lab의 내부 강의 CMS · 학생·퀴즈·수업 관리 시스템  
**디자인 원칙:** 흰색/잉크색/기존 블루를 사용하는 평면형 UI, 장식·이모지·새로운 아이콘 라이브러리 없음.

관리자 상단 왼쪽에 로고 슬롯을 준비했습니다.

- 로고 자산 경로: `modern/frontend/public/ui/blue-renaissance-logo.svg`
- 배포 URL: `/ui/blue-renaissance-logo.svg`
- 원본 SVG가 없을 때: **Blue Renaissance** 텍스트 워드마크를 대신 표시
- **실제 사용자 제공 SVG 파일은 아직 첨부되지 않았습니다.** 따라서 이 경로에는 임의의 로고 이미지를 생성하지 않았고, 파일을 받으면 해당 이름으로 저장해 연결하면 됩니다.
- 기존 학생용 Frontend Lab 명칭과 사이트의 수업 UI는 그대로 유지합니다.

선생님 콘솔 왼쪽 상단의 이름만 바꾸는 것이 아니라, 강의 파일 라이브러리에서 **D1에 보관된 강의 수**, 원본 저장 위치, 신규 HTML 수업 생성, 정적 원본에서 D1로 선택적 동기화를 볼 수 있습니다.

## 4. CMS에서 관리 가능한 것

- 강의 HTML 코드 수정·신규 페이지 생성(허용된 교육용 경로 사용).
- 초안 저장, 학생에게 게시, 숨김·복원.
- 이전 게시 이력에서 특정 버전으로 복원.
- 원본 HTML과 교사 게시본은 별도의 D1 테이블이므로 잘못된 편집이 원본 강의 데이터를 직접 삭제하지 않습니다.
- 기존 `Quiz Studio`에서 객관식·단답형 문제, 보기, 정답, 해설, 초안, 공개 버전, 이전 버전 복원.
- 학생 이름·고유 ID·문제별 점수 분석.

**아직 고급 WYSIWYG는 포함하지 않습니다.** 강의 본문은 HTML 코드 편집 방식이고, 문제는 전용 입력 UI로 관리합니다. 향후 리치텍스트 편집기는 무료 구조 위에서 추가할 수 있습니다.

## 5. 기술적 세부 사항과 제한

- D1 스키마: `modern/frontend/migrations/0004_blue_renaissance_courses.sql`.
- Worker 읽기: `worker/course-db.ts`와 `worker/index.ts`.
- 교사 관리자 API: `worker/free-cms.ts`. 모든 관리자 요청은 기존 Google 인증·지정 교사 계정·추가 비밀번호 세션을 통과해야 합니다.
- 원본 동기화: `POST /api/admin/course/sync`. 정확한 Origin + JSON + CMS 전용 헤더 요구, 수업 HTML 경로만 허용.
- 새 수업을 만들 때 `lab_content`에 초안 저장 후 게시할 수 있습니다. 이 경우 원래 정적 파일이 없더라도 같은 HTML URL로 CMS 게시본을 제공합니다.
- D1에 저장한 HTML은 DB 공간을 사용합니다. 44개 합계가 작은 편이지만, 아주 큰 미디어 파일은 D1에 보관하지 않고 정적 자산으로 유지하는 것이 바람직합니다.
- 원본과 게시본을 혼동하지 않도록 관리자 화면에 D1 원본 여부를 표시합니다.
- 앞으로 GitHub 강의 파일이 수정되더라도 D1 원본은 자동 덮어쓰기하지 않습니다. **운영자가 명시적으로 동기화하는 방식**이므로 정적 빌드와 DB 상태의 차이를 관리해야 합니다.

## 6. 배포와 실제 로고 반영

독립 GitHub 저장소 [hslcrb/frontend-lecture_hslcrb](https://github.com/hslcrb/frontend-lecture_hslcrb)의 `main`이 Cloudflare `frontend-lab-web` Worker와 연결되어 있습니다. `modern/frontend`에서 `npm test && npm run build`로 빌드되며, 배포 도메인은 https://frontend-lab.rhee.life 입니다.

로고 SVG가 전달되면 원본을 확인한 후 **`blue-renaissance-logo.svg`** 이름으로 정리해 같은 경로에 추가해야 합니다. 선생님 관리자 화면 헤더는 이미 이 경로를 참조하므로 추가적인 런타임 설정은 불필요합니다.

## 7. 배포 검증 결과

2026-11-09 Cloudflare Workers Builds에서 **Node 테스트 22건 전부 통과(실패 0건)**, TypeScript 엄격 검사 및 Vite 프로덕션 빌드, Workers 커스텀 도메인 배포까지 성공했습니다.

- GitHub 병합 커밋: `3ac4a1b80a40d5f41f2735d47eadc184ab9fe6a0`
- 첫 검증 배포 버전: `317f74a6-7bb2-4a69-974f-02feae18668e`
- 사이트: https://frontend-lab.rhee.life
- 서버 제공 우선순위: 교사 게시본 D1 → 원본 D1 → 정적 파일.
- 실제 로고 이미지 파일은 **미수신**. `blue-renaissance-logo.svg` 자리만 마련하고 영문 텍스트로 대체했습니다. AI 소스 파일이 별도 전달되더라도 실제 사이트에는 SVG만 사용합니다.

**아직 검증하지 못한 것:** 교사 Google 계정으로 관리자 첫 비밀번호 생성·강의 편집·원본 동기화, 학생 Google 계정으로 D1 원본 HTML 확인, 브라우저 전체 퀴즈 채점 및 SVG 실제 적용. 정적 테스트/빌드 성공을 이 과정의 완료로 오해하지 마세요.
