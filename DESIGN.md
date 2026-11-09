# Frontend Lab — DESIGN.md

## 목적
HTML/CSS/JavaScript/UI·UX 및 AI 학습 자료를 하나의 시각 규칙으로 운영한다.
사용 흐름: **이론 → 실습/예제 → 암기할 핵심 → 문제풀이 → 해설/복습**.
기존 실습 JS, 문제 및 정답, 배포 URL은 유지한다.

## CSS 아키텍처
스타일은 HTML 안에 작성하지 않고 아래 계층으로 분리한다.
```text
assets/css/
  reset.css        기본 브라우저 reset
  tokens.css       전체 컬러·폰트·여백·모서리 토큰
  base.css         기본 요소
  layout.css       페이지 외곽과 반응형 그리드
  components.css   카드·버튼·탭·공통 UI
  quiz.css         문제, 선택지, 채점 상태, 점수
  demos.css        공통 실습 프레임
  pages/           각 페이지 고유 데모·표시 CSS
```
HTML 로드 순서: reset → tokens → base → layout → components → quiz → demos → pages/<page>.css.
`assets/css/core-theme.css`와 `assets/js/theme-engine.js`는 오래된 페이지에 연결하지 않는다. 
구형 테마의 `--text`, `--card`, `--primary` 변수 덮어쓰기 때문에 글자 대비가 사라졌었다.

## 공통 토큰
- 표면 `--panel:#fff`, 배경 `--page:#f6f7fb`, 본문 `--ink:#172033`, 보조 `--ink-sub:#526079`
- 선 `--line:#dce3ec`, 강조 `--primary-ui:#3455d1`, 정답 `--success-ui:#18794e`, 오답 `--error-ui:#b4233b`
- 폰트 Pretendard → Noto Sans KR → system-ui, 기본 16px / line-height 1.7.
- 주요 간격 4/8/12/16/24/32/48px, 최대 콘텐츠 폭 1120px.
- 중요 색상은 상태를 전달하는 유일한 수단으로 사용하지 않는다.

## 구분 원칙
- 공통 색상/여백/기본 타이포는 반드시 `tokens.css`에서 관리.
- 범용 레이아웃은 `layout.css`, 공통 UI 상태는 `components.css`와 `quiz.css`.
- `pages/`에는 각 강의만의 시연 요소(예: .fi / .gi / .pos-scene), 코드 실습의 그래픽과 특수한 레이아웃만 남긴다.
- 페이지별 `:root`, 범용 `body`, `.card`, `.opt-btn` 중복을 점진적으로 공통 파일로 이관해야 한다. **현재 추출된 pages CSS에는 아직 기존 규칙 일부가 중복되어 있다. 이를 완전한 통일 상태로 간주하지 않는다.**
- 데모의 Flex/Grid/Position 속성은 시연 내용이므로 일괄 reset 하지 않는다.
- **HTML에 `<style>` 블록을 새로 추가하지 않는다.** 예시 코드는 `<pre><code>` 등으로 제시한다.
- 다크모드는 모든 페이지/데모에 대한 명확한 색상·대비 기준과 시각 검증이 끝나기 전에는 다시 도입하지 않는다.

## 학습 페이지 구조
1. 학습 범주·제목·설명 및 메인 이동
2. 학습 목표
3. 쉬운 비유 + 정확한 개념 설명
4. 코드 또는 실습/시각화
5. 반드시 암기 vs 이해 vs 찾아보기
6. 복습 및 관련 퀴즈 링크

## 문제풀이 구조
- 문제 번호·진행 상태 → 문제 → (선택적) 힌트/코드 → 4지선다 → 정답/오답 피드백 → 해설 → 다음 → 결과/재시작.
- 선택 전 정답 색 노출 금지, disabled 버튼도 WCAG 수준으로 가독성 검토.
- 텍스트가 보이는지 : quiz/html_quiz1.html, quiz/css_priority_quiz.html, quiz/css-boxmodel-quiz.html 등 필수 확인.

## HTML/CSS 퀴즈 공통 템플릿 (필수)
- CSS 7개 + HTML 2개는 같은 HTML 마크업, `assets/css/quiz-unified.css`, `assets/js/quiz-unified.js`를 사용한다.
- 퀴즈 HTML에는 수업명 `<h1>`, 주제 설명, `#quiz-root`만 둔다. 파일별 CSS 또는 인라인 `<style>`/별도 렌더링 함수는 금지.
- 문항은 `quiz/<페이지명>.data.js`의 `window.QUIZ_DATA`에 저장. 문제, 선택지, 정답, 힌트, 해설은 데이터로만 변경한다.
- 문제 번호는 항상 `현재 번호 / 전체 문제 수`(예: `1 / 10`). 객관식·단답형을 모두 지원한다.
- 공통 UI 변경은 기존 선언의 재설계를 원칙으로 한다. 페이지 끝에 보정 CSS를 덧붙여 해결하지 않는다.
- 각 9개 HTML의 문제 선택·채점·해설·이전·다음·결과·다시 풀기 기능을 검증한다.

## 게슈탈트 3개 페이지 UI 패턴
- `uiux/gestalt.html`, `uiux/gestalt-theory.html`, `uiux/gestalt-quiz.html`은 모두 `assets/css/gestalt-common.css`을 사용.
- `gestalt-theory.html`을 레이아웃 기준으로 삼고, 제목·본문·카드·간격 및 하단 탭을 동일하게 유지.
- 글꼴과 위계는 HTML/CSS 공통 퀴즈 토큰과 동일: `var(--font-body)`, H1 25~34px, 섹션 H2 20~25px, 본문 16px, 보조 14px, 키커 12px.
- `gestalt-theory-demos.css`에는 이론 시각화만, `gestalt-quiz-demos.css`에는 문제/선택지와 예제 전용 규칙만 작성.
- 3개 페이지 모두 상단과 **하단**에 게슈탈트 홈/법칙 해설/문제 풀기/전체 강의 네비게이션 포함. 현재 화면에는 `aria-current=page`를 명시.
- 예전 `assets/css/pages/uiux--gestalt*.css` 3개는 폐기; 하단에 보정 CSS 덧붙이지 말고 원래 규칙을 편집한다.
- 이론 이미지, 퀴즈 13개 선택형과 서술형 1개, 채점과 해설 스크립트는 변경 없이 유지.

## AI 학습 6단계
- 홈 첫 번째 카테고리 `#ai` → `ai/index.html` → 이론/퀴즈 선택.
- `ai/content.data.js`: 6단계 이론의 단일 원본. 각 단계는 5개 주제로 구성하며 정확한 개념, 쉬운 비유, 웹 수업·실무 사례, 핵심 기억하기를 포함한다.
- `assets/js/ai-learning.js`: 이론 렌더러. `assets/css/ai-learning.css`: 이론 전용 UI. 두 파일은 6개 이론 페이지에서 재사용한다.
- `ai/step-01.html`~`step-06.html`: 동일한 HTML 골격과 동일한 타이포 위계, 상단 단계 이동과 하단 퀴즈/이전·다음 이동.
- `ai/quiz-01.html`~`quiz-06.html`: 기존 `assets/css/quiz-unified.css`, `assets/js/quiz-unified.js` 재사용. `quiz-XX.data.js`만 문제 데이터가 다르다. 각 10문항, 총 60문항.
- 퀴즈가 참조하는 파일 경로는 HTML 기준 상대 경로이며 기존 수업 CSS에 덧씌우는 보정 CSS를 추가하지 않는다.
- 이론 설명은 기술·제공 업체에 따라 세부 동작이 달라질 수 있으므로 특정 제품의 기능이나 권한을 보편적 사실로 단정하지 않는다.
- 검증: JS 문법, 데이터 수량·정답 인덱스, 각 HTML 참조, 퀴즈 정답/오답·재시작, 모바일 가독성, 메인 첫 노출 확인.

## 검증 체크
- 31개 HTML의 외부 CSS 참조 오류/인라인 style 블록 없음.
- 강의의 Flex, Grid, Position 작동 시연을 원래대로 사용할 수 있는가.
- JS 실행 예제와 모든 퀴즈의 답/오답·점수·이전/다음 버튼이 작동하는가.
- 밝은 패널의 글씨 및 어두운 코드 블록의 가독성 확보.
- 375px / 768px / 1440px 화면에서 수평 스크롤 및 잘림이 없는가.
- 키보드 이동·초점 표시·실제 화면 대비 점검.
- CSS 중복 정리 및 브라우저 회귀 검사가 완료되기 전 PR을 병합하지 않는다.
