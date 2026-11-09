# 원본 UI 시각·기능 복원 기록 · 2026-11-09

## 수정 이유

React + D1 전환 때 강의실 디자인까지 새로 바꾸었던 것은 사용자의 요구와 달랐습니다. **요구는 기존 Frontend Lab의 화면·스타일·교육 흐름을 유지하면서 React 컴포넌트로 구현하고, 데이터와 채점만 서버/D1로 이전하는 것**입니다.

## 원본 참고 기준

원본은 별도 GitHub 브랜치 `archive/legacy-courses-20261109`에 유지되어 있으며, 공식 수업 원저작자는 JJinMangGo입니다.

- 홈: `index.html` + `assets/css/pages/index.css`. 원래의 `header-nav`, `hero-inner`, `main-wrapper`, `section-block`, `card-grid`, `card`, `card-tags` 보존.
- 퀴즈: `assets/css/quiz-unified.css` + `assets/js/quiz-unified.js`. 원래의 `quiz-shell`, `quiz-panel`, `quiz-choice`, `quiz-feedback`, `quiz-score` 구조.
- AI: `assets/css/ai-learning.css` + `assets/js/ai-learning.js`. 6단계 탭, 용어, 정의·비유·실무 사례·핵심 정리와 이전/다음 링크.
- Grid/Flex/Position: 원래의 사이드바, 실습 슬라이더·버튼, 그리드/플렉스/위치 변경 화면.
- UIUX: `gestalt-common.css` 및 관련 시각화 클래스.
- 기타 JS·Tailwind 강의의 CSS도 소스 보존.

## 실제 변경

- 원본 CSS **28개를 내용 변경 없이 React 코드 폴더** `modern/frontend/src/original-css/`에 가져왔습니다. 수업별 독립 `.html`을 복구한 것은 아닙니다.
- React 홈 컴포넌트 `OriginalHome.tsx`가 **D1 `br_lessons.home`의 원본 HTML 본문을 읽어 React elements로 렌더링**합니다. 페이지 특화 원본 CSS는 홈에서만 로드합니다. 상단 바에 마이페이지와 관리자 바로가기만 기존 내비게이션 스타일로 추가합니다.
- React AI 페이지 `AiLesson.tsx`에서 원본 구조와 클래스명을 JSX 컴포넌트로 구현하고, 수업의 실제 설명·본문은 D1에서 가져옵니다.
- React 퀴즈 `PracticeQuiz.tsx`는 원본의 진행률·선택지·정오답 피드백·이전/다음·결과·다시 풀기를 재현합니다. 문항별 정답 확인은 Worker의 `/api/quiz/managed/:slug/check`에서 D1 정답으로 채점하고, 최종 제출 결과는 D1 학생 기록에 저장합니다.
- 강의 본문 `LessonPage.tsx`는 D1에서 원래 DOM 구조를 보존한 수업 본문을 읽고 React elements로 변환합니다. 원본 페이지별 CSS를 필요할 때 로드하며, 이벤트 속성 및 실행 태그는 사용하지 않습니다.
- `OriginalDemos.tsx`는 Grid/Flex/Position/Tailwind의 주요 탭과 슬라이더를 React 상태·이벤트로 연결합니다. 기존 인라인 스크립트는 실행·배포하지 않습니다.
- Google Access, 학생 마이페이지, 교사/창조자 권한·CMS·D1 콘텐츠 저장은 그대로 유지합니다.

## 검증 기준과 한계

- Node 기반 소스·스타일 회귀 검사는 실제 페이지 클래스, 레이아웃 CSS, 데이터 API, 퀴즈 채점, 주요 React 시연 이벤트의 존재를 확인합니다.
- **빌드 통과와 원본과의 픽셀 단위 일치·모든 실습의 동작 동일성은 별개**입니다. 기존 JavaScript 강의 중 각 페이지에 직접 묶여 있던 시연 로직과 게슈탈트 데모 등은 추가 브라우저 테스트/React 이식이 필요할 수 있습니다.
- 인증된 학생/선생님 세션으로 실제 원본·React 화면을 나란히 375px/768px/1440px에서 비교하고, 각 실습 슬라이더·채점·퀴즈 설명을 수동 검증해야 최종 완료로 표시합니다.
- 원래의 정적 수업 `.html`, `.data.js`는 `main`에 다시 올리지 않습니다. 원본 보존 브랜치에서만 보관하고 운영은 React + Workers + D1을 유지합니다.
