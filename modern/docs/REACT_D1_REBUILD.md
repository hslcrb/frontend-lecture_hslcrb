# React + D1 네이티브 CMS 전환 — 2026-11-09

## 전환 사유

기존 Blue Renaissance는 파일 경로(예: `quiz-03.data.js`)를 강의 관리 화면에 직접 노출했고, 수정 화면이 코드 편집기 중심이었습니다. 운영자가 기대한 **문제 세트 목록 → 개별 문항 선택 → 정답·해설 수정 → 게시** 관리 흐름에 맞지 않았습니다.

따라서 정적 HTML/JavaScript를 렌더링하는 파일 기반 CMS에서 **React UI + Cloudflare Workers API + D1을 데이터 원본으로 삼는 CMS**로 구조를 변경했습니다.

## 데이터 이관 · 삭제 범위

- 기존 `lab_course_sources` HTML 원본 **44개**에서 `br_lessons`의 정식 콘텐츠 항목 생성(25개 강의/안내 항목, 19개 과거 퀴즈 화면 분리). 기존 원본 테이블은 보존했습니다.
- `br_lesson_versions`에 새 게시본 버전 이력 저장, `br_legacy_quiz_map`에 과거 HTML 퀴즈 경로 → D1 문제 세트 매핑.
- `lab_quiz_sets`에 **19개 문제 세트 · 총 243개 문항**, 정답·힌트·해설·예제 등을 구조화해 저장. AI 6단계 본문 데이터도 `ai/content.data.js`에서 가져와 D1 강의로 저장했습니다.
- GitHub의 `archive/legacy-courses-20261109` 브랜치로 기존 레거시 소스와 커밋을 보존했습니다.
- 운영 코드 브랜치에서는 기존 교육용 `.html` · `.data.js` 및 원본 자산 디렉터리를 삭제하는 **명시적인 삭제 커밋**을 작성했습니다. React 진입용 단일 `modern/frontend/index.html`은 앱 마운트를 위해 필수이므로 보존합니다.
- 이미지·SVG는 React의 `public/` 미디어 디렉터리에서 배포하며, **학습 내용·문제·정답은 GitHub 정적 에셋으로 제공하지 않습니다**.

## 런타임

- `/`: D1 강의 및 퀴즈 목록으로 구성되는 React 학습 홈.
- `/learn/:slug`: D1 강의 본문을 인증된 API에서 불러와 React로 표시.
- `/practice/:slug`: D1 문제은행 및 서버 측 정답 채점·개인 기록.
- `/me`: 학생의 고유 ID·점수·학습 이력.
- `/admin`: Blue Renaissance CMS — 학생 통계, React 문제은행(문항별 편집), React 강의 관리(리치텍스트), 창조자 전용 권한 관리.
- 과거 `/ai/quiz-02.html` 등의 접근 경로는 D1 매핑을 통한 React 화면으로 리다이렉트합니다.
- 과거 `.data.js` 및 직접 URL로 실행 가능한 정적 수업 HTML 제공 경로는 Workers에서 차단합니다.

## 기술과 보안

- Cloudflare Access에서 Google 인증을 요구하며, Worker에서 JWT 서명·iss/aud를 다시 확인.
- 관리자 API는 역할과 추가 비밀번호 세션을 확인. 창조자만 권한 부여·박탈 가능.
- 퀴즈 정답·미게시본은 D1에만 두고, 학생 API에는 답안을 제외한 문제를 제공합니다.
- 게시본 편집은 서버에서 불필요한 실행 태그와 위험한 속성을 거부. React 강의 리더 역시 렌더링 전 문서 태그·이벤트 속성·비허용 링크를 제거합니다.
- D1 마이그레이션: `0007_react_native_lessons.sql`.
- GitHub Actions는 사용하지 않으며 Workers Builds가 `main`을 자동 배포합니다.

## 잔여 검증과 범위

**코드 빌드와 실제 수업 UX는 별개입니다.** 기존 HTML에서 CSS/JavaScript와 DOM 이벤트로 직접 구현하던 고급 데모는 현재 데이터 이관과 정적 소스 제거만으로 동일하게 React화되는 것이 아닙니다. 각 실습별 별도 컴포넌트 구현과 교사 리뷰가 필요한 범위는 미검증으로 유지합니다.

정식 수업 운영 전 Google 로그인·이름 등록, 권한 관리, 편집·게시·버전 복원, 모든 243개 문제 응시·채점 및 375/768/1440px 렌더링 회귀 검증과 개인정보 고지를 확인하세요.

이 SVG는 Mermaid가 아닌 직접 작성한 XML 기반 벡터 문서입니다. [전체 시스템 다이어그램](../../docs/blue-renaissance-system-map.svg).
