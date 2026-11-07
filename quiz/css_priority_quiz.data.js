/* Original quiz questions, answers, hints and explanations */
window.QUIZ_CONFIG = {"subject":"CSS","title":"CSS 선택자 우선순위 퀴즈"};
window.QUIZ_DATA = [

  /* ── 1. 점수 체계 이해 ── */
  {
    cat: '점수 체계',
    q: '다음 중 CSS 선택자 점수가 높은 순서로 올바르게 나열된 것은?',
    code: null,
    hint: '선택자 종류별 점수\n전체(*) = 0점  |  태그(h1) = 1점  |  클래스(.box) = 10점  |  id(#gnb) = 100점  |  인라인 style="" = 1000점',
    opts: [
      { text: 'id > class > tag > 전체(*)', color: null },
      { text: 'class > id > tag > 전체(*)', color: null },
      { text: 'tag > class > id > 전체(*)', color: null },
      { text: 'id > tag > class > 전체(*)', color: null }
    ],
    ans: 0,
    ex: 'CSS 선택자 우선순위 점수는 id(100점) > class(10점) > tag(1점) > 전체*(0점) 순입니다. 점수가 높을수록 우선 적용됩니다.'
  },

  /* ── 2. 같은 선택자 중복 ── */
  {
    cat: '동일 선택자 중복',
    q: '아래 CSS에서 .sub-depth01 의 최종 background-color 는?',
    code:
'.sub-depth01 {\n' +
'  background-color: red;    /* 첫 번째 */\n' +
'}\n' +
'.sub-depth01 {\n' +
'  background-color: orange; /* 두 번째 */\n' +
'}',
    hint: '같은 선택자(점수가 동일)가 두 번 등장하면\n→ 나중에 작성된 규칙이 이긴다 (Cascade = 폭포처럼 아래로 흐름)',
    opts: [
      { text: 'red (첫 번째가 우선)', color: 'red' },
      { text: 'orange (나중에 쓴 것이 우선)', color: 'orange' },
      { text: '두 색이 섞인다', color: null },
      { text: '오류가 나서 아무 색도 없다', color: null }
    ],
    ans: 1,
    ex: '선택자 점수가 같으면 CSS에서 나중에 선언된 규칙이 적용됩니다. 이것이 Cascade(폭포) 원리입니다. 따라서 두 번째에 쓴 orange가 최종 적용됩니다.'
  },

  /* ── 3. tag vs class ── */
  {
    cat: '선택자 점수 충돌',
    q: '아래 CSS에서 span.sub-depth01 의 최종 background-color 는?',
    code:
'span {\n' +
'  background-color: darkgoldenrod; /* tag 선택자: 1점 */\n' +
'}\n' +
'.sub-depth01 {\n' +
'  background-color: orange;        /* class 선택자: 10점 */\n' +
'}',
    hint: 'tag 선택자(1점) vs class 선택자(10점)\n→ 점수가 높은 쪽이 항상 이긴다 (선언 순서 무관)',
    opts: [
      { text: 'darkgoldenrod (span이 먼저 선언됨)', color: 'darkgoldenrod' },
      { text: 'orange (class 점수 10점 > tag 점수 1점)', color: 'orange' },
      { text: '두 색이 번갈아 나온다', color: null },
      { text: '어떤 게 적용될지 알 수 없다', color: null }
    ],
    ans: 1,
    ex: 'class 선택자(.sub-depth01)는 10점, tag 선택자(span)는 1점입니다. 선언 순서와 상관없이 점수가 높은 class 선택자가 이기므로 orange가 적용됩니다.'
  },

  /* ── 4. id vs class ── */
  {
    cat: '선택자 점수 충돌',
    q: '아래 CSS에서 ul#gnb.gnb 의 border-color 최종 값은?',
    code:
'ul {\n' +
'  border: 1px solid black; /* tag: 1점 */\n' +
'}\n' +
'.gnb {\n' +
'  border-color: #fff;      /* class: 10점 */\n' +
'}\n' +
'/* HTML: <ul id="gnb" class="gnb"> */',
    hint: 'border 속성은 border-color, border-width, border-style 을 한꺼번에 지정합니다.\nborder-color만 따로 바꾸면 나머지(width, style)는 유지됩니다.',
    opts: [
      { text: 'black (ul이 먼저 선언됨)', color: 'black' },
      { text: '#fff 흰색 (class .gnb 가 10점으로 더 높음)', color: '#fff' },
      { text: 'border 자체가 사라진다', color: null },
      { text: '두 색이 동시에 적용된다', color: null }
    ],
    ans: 1,
    ex: '.gnb는 10점, ul은 1점입니다. 점수가 높은 .gnb의 border-color: #fff가 적용됩니다. 단, border-width(1px)와 border-style(solid)은 ul에서 그대로 상속되므로 흰색 테두리 선이 보입니다.'
  },

  /* ── 5. 인라인 vs 내부 CSS ── */
  {
    cat: '적용 위치 우선순위',
    q: '같은 요소에 내부CSS와 인라인 스타일이 동시에 적용될 때 어느 것이 우선인가?',
    code:
'/* 내부 CSS (style 태그 안) */\n' +
'p { color: blue; }\n' +
'\n' +
'<!-- HTML -->\n' +
'<p style="color: red;">이 텍스트 색은?</p>',
    hint: '위치별 우선순위\n인라인 style="" (1000점) > 내부 CSS <style> (선택자 점수) > 외부 CSS <link>',
    opts: [
      { text: 'blue (내부 CSS가 먼저 로드되므로)', color: 'blue' },
      { text: 'red (인라인 스타일이 1000점으로 가장 강함)', color: 'red' },
      { text: '보라색 (두 색이 섞임)', color: 'purple' },
      { text: '기본 검정 (둘 다 무시됨)', color: '#222' }
    ],
    ans: 1,
    ex: '인라인 스타일(style="")은 1000점으로 내부 CSS나 외부 CSS의 어떤 선택자보다 높습니다. 따라서 style="color: red"가 우선 적용되어 텍스트는 빨간색이 됩니다.'
  },

  /* ── 6. 상속 ── */
  {
    cat: '상속',
    q: '아래 코드에서 li 안의 텍스트 색깔은 무엇인가?',
    code:
'ul {\n' +
'  color: navy;\n' +
'}\n' +
'\n' +
'<ul>\n' +
'  <li>메뉴1</li>   ← 이 텍스트 색은?\n' +
'</ul>',
    hint: 'color, font-size, font-family 등 글자 관련 속성은 자식 요소에게 자동으로 상속됩니다.\nmargin, padding, border, background 등은 상속되지 않습니다.',
    opts: [
      { text: '기본 검정 (li에 직접 지정 안 했으니까)', color: '#222' },
      { text: 'navy (부모 ul의 color가 상속됨)', color: 'navy' },
      { text: '투명 (상속이 안 돼서 색이 없음)', color: null },
      { text: '오류가 난다', color: null }
    ],
    ans: 1,
    ex: 'color 속성은 자식 요소에게 상속됩니다. ul에 color: navy를 지정하면 자식인 li도 navy 색상을 물려받습니다. 상속되는 대표 속성: color, font-*, line-height 등'
  },

  /* ── 7. 상속 안 되는 속성 ── */
  {
    cat: '상속',
    q: '아래 코드에서 li의 background-color는?',
    code:
'ul {\n' +
'  background-color: blue;\n' +
'}\n' +
'\n' +
'<ul>\n' +
'  <li>메뉴1</li>   ← 배경색은?\n' +
'</ul>',
    hint: 'background-color, margin, padding, border 등은 상속되지 않습니다.\n부모에게 지정해도 자식 요소에는 적용되지 않아요.',
    opts: [
      { text: 'blue (부모 ul 배경이 상속됨)', color: 'blue' },
      { text: '투명(기본값) - background-color는 상속 안 됨', color: null },
      { text: '흰색 (브라우저 기본)', color: 'white' },
      { text: '검정', color: '#222' }
    ],
    ans: 1,
    ex: 'background-color는 상속되지 않는 속성입니다. ul의 배경이 파랗게 보이지만 li 자체의 background-color는 기본값인 투명(transparent)입니다. 실제 화면에서 파랗게 보이는 건 ul의 배경이 비쳐 보이는 것입니다.'
  },

  /* ── 8. 복합 선택자 점수 ── */
  {
    cat: '점수 계산',
    q: '아래 두 선택자 중 더 높은 점수를 가진 것은?',
    code:
'/* A */  ul li span { color: red; }\n' +
'/* B */  .sub-depth01 { color: orange; }',
    hint: '선택자 점수 계산법\ntag 하나당 1점, class 하나당 10점, id 하나당 100점\nA: ul(1) + li(1) + span(1) = 3점\nB: .sub-depth01 = 10점',
    opts: [
      { text: 'A (ul li span) - 태그가 3개라서', color: 'red' },
      { text: 'B (.sub-depth01) - class 10점 > tag 3점', color: 'orange' },
      { text: '점수가 같다', color: null },
      { text: '순서가 나중인 것이 이긴다', color: null }
    ],
    ans: 1,
    ex: 'A의 점수: ul(1) + li(1) + span(1) = 3점 / B의 점수: .sub-depth01 = 10점\n태그를 아무리 많이 써도 class 하나(10점)를 이길 수 없습니다. B가 이깁니다.'
  },

  /* ── 9. 외부/내부/인라인 순서 ── */
  {
    cat: '적용 위치 우선순위',
    q: '외부CSS, 내부CSS, 인라인 스타일 모두 같은 선택자에 같은 속성을 적용할 때 최종 적용 순서는?',
    code: null,
    hint: '파일 위치별 적용 강도\n외부 CSS (.css 파일) < 내부 CSS (<style>태그) < 인라인 (style="")\n단, 선택자 점수가 같을 때 기준!',
    opts: [
      { text: '외부CSS > 내부CSS > 인라인', color: null },
      { text: '인라인 > 내부CSS > 외부CSS', color: null },
      { text: '내부CSS > 인라인 > 외부CSS', color: null },
      { text: '모두 동등하고 나중에 로드된 것이 우선', color: null }
    ],
    ans: 1,
    ex: '같은 선택자, 같은 속성이 충돌하면 인라인(1000점) > 내부CSS > 외부CSS 순으로 적용됩니다. 실무에서 인라인 스타일을 남용하면 CSS 관리가 어려워져 가급적 지양합니다.'
  },

  /* ── 10. 실전 종합 ── */
  {
    cat: '종합 문제',
    q: '아래 코드에서 span.sub-depth01 의 최종 background-color 는?',
    code:
'/* 외부 CSS */\n' +
'span { background-color: darkgoldenrod; } /* 1점 */\n' +
'\n' +
'/* 내부 CSS (<style> 태그) */\n' +
'.sub-depth01 { background-color: red;    } /* 10점, 1번째 */\n' +
'.sub-depth01 { background-color: orange; } /* 10점, 2번째 */\n' +
'\n' +
'/* HTML */\n' +
'<span class="sub-depth01">하위메뉴1</span>',
    hint: '판단 순서\n① 점수가 다르면 → 점수 높은 것이 무조건 이김\n② 점수가 같으면 → 나중에 선언된 것이 이김\n③ 위치가 다르면 → 인라인 > 내부 > 외부',
    opts: [
      { text: 'darkgoldenrod (외부 CSS span 태그)', color: 'darkgoldenrod' },
      { text: 'red (내부 CSS 첫 번째 .sub-depth01)', color: 'red' },
      { text: 'orange (내부 CSS 두 번째 .sub-depth01 - 점수 같고 나중에 선언)', color: 'orange' },
      { text: '알 수 없다', color: null }
    ],
    ans: 2,
    ex: '① span(1점) vs .sub-depth01(10점) → class가 이김 → darkgoldenrod 탈락\n② .sub-depth01 두 개는 점수 동일(10점) → 나중에 선언된 orange가 이김\n최종 답: orange'
  }
];
