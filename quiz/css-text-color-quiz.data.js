/* Original quiz questions, answers, hints and explanations */
window.QUIZ_CONFIG = {"subject":"CSS","title":"CSS 텍스트 · 컬러 퀴즈"};
window.QUIZ_DATA = [
  {
    q: `<code>text-align: justify</code> 속성의 기능으로 올바른 것은?`,
    options: ["텍스트를 오른쪽으로 정렬한다", "텍스트를 양쪽 끝에 맞게 균등하게 정렬한다", "텍스트를 가운데로 정렬한다", "텍스트를 왼쪽으로 정렬한다"],
    answer: 1,
    feedback: "justify는 텍스트를 양쪽 끝(left & right)에 모두 맞게 공백을 늘려 균등 배분합니다. 신문 기사 같은 레이아웃에 자주 사용됩니다."
  },
  {
    q: `<code>text-transform: capitalize</code> 속성을 "hello world"에 적용하면?`,
    options: ['"HELLO WORLD"', '"hello world"', '"Hello World"', '"Hello world"'],
    answer: 2,
    feedback: "capitalize는 각 단어의 첫 글자만 대문자로 변환합니다. uppercase는 전체 대문자, lowercase는 전체 소문자입니다."
  },
  {
    q: `링크에서 밑줄을 제거하려면 어떤 속성값을 사용해야 하나요?`,
    options: ["text-decoration: underline", "text-decoration: line-through", "text-decoration: none", "text-decoration: overline"],
    answer: 2,
    feedback: "<a> 태그는 기본적으로 underline이 적용됩니다. text-decoration: none 으로 제거할 수 있으며, :hover 상태에서 다시 underline을 주는 패턴을 자주 사용합니다."
  },
  {
    q: `<code>text-shadow: 2px 4px 6px rgba(0,0,0,0.5)</code> 에서 세 번째 값 <code>6px</code>은 무엇을 의미하나요?`,
    options: ["그림자의 수평 오프셋", "그림자의 수직 오프셋", "그림자의 흐림(blur) 반경", "그림자의 투명도"],
    answer: 2,
    feedback: "text-shadow의 순서는 수평오프셋 수직오프셋 blur-radius 색상 입니다. blur 값이 클수록 그림자가 더 넓게 퍼져 흐릿해집니다."
  },
  {
    q: `<code>text-align</code>이 적용되지 않는 상황은?`,
    options: ["블록 요소 안에 텍스트가 있을 때", "부모 요소가 텍스트보다 클 때", "요소의 너비가 텍스트 너비와 딱 맞을 때 (hug 상태)", "inline-block 요소에 width가 지정되었을 때"],
    answer: 2,
    feedback: "text-align은 텍스트를 감싼 컨테이너가 텍스트보다 클 때만 효과가 있습니다. 요소의 크기가 콘텐츠에 꼭 맞게 줄어든 경우(hug)에는 정렬할 여백이 없으므로 적용되지 않습니다."
  },
  {
    q: `버튼에 마우스를 올렸을 때만 배경색이 나타나게 하려고 합니다. 가장 적절한 방법은?`,
    options: ["button { background-color: blue; }", "button:hover { background-color: blue; }", "button { text-decoration: underline; }", "button:active { background-color: blue; }"],
    answer: 1,
    feedback: ":hover 는 마우스를 올렸을 때 적용되는 가상 클래스(pseudo-class)입니다. 수업 코드처럼 기본 상태에서는 alpha=0(투명)으로 두고 :hover에서 alpha=1로 바꾸는 패턴도 자주 씁니다."
  },
  {
    q: `<code>text-decoration: line-through</code> 는 텍스트를 어떻게 표시하나요?`,
    options: ["텍스트 아래에 밑줄을 표시한다", "텍스트 위에 윗줄을 표시한다", "텍스트 가운데를 가로지르는 취소선을 표시한다", "텍스트를 보이지 않게 숨긴다"],
    answer: 2,
    feedback: "line-through는 텍스트 중간을 가로지르는 취소선입니다. underline은 아래 밑줄, overline은 위 윗줄입니다. 쇼핑몰 할인 전 가격 표시 등에 자주 활용됩니다."
  },
  {
    q: `아래 그라디언트를 만드는 CSS는?\n(왼쪽: #4f46e5 → 오른쪽: #ec4899)`,
    preview: `<div class="gradient-demo"></div>`,
    options: ["background: radial-gradient(#4f46e5, #ec4899)", "background: linear-gradient(to right, #4f46e5, #ec4899)", "background: linear-gradient(to bottom, #4f46e5, #ec4899)", "background-color: linear-gradient(#4f46e5, #ec4899)"],
    answer: 1,
    feedback: "linear-gradient(to right, ...) 은 왼쪽에서 오른쪽 방향의 선형 그라디언트입니다. background-color가 아닌 background(또는 background-image)에 적용해야 합니다."
  },
  {
    q: `<code>rgba(0, 0, 0, 0)</code> 와 <code>rgba(0, 0, 0, 1)</code> 의 차이는?`,
    options: ["색상이 다르다 (흰색 vs 검정)", "알파값이 달라 전자는 완전 투명, 후자는 완전 불투명이다", "전자는 RGB, 후자는 RGBA 포맷이다", "차이가 없다"],
    answer: 1,
    feedback: "RGBA의 A(Alpha)는 0~1 사이 값으로 투명도를 제어합니다. 0은 완전 투명(보이지 않음), 1은 완전 불투명입니다. hover 효과에서 alpha 값만 바꾸는 방식을 자주 활용합니다."
  },
  {
    q: `<code>word-break: keep-all</code> 속성의 역할로 올바른 것은?`,
    options: ["모든 단어를 대문자로 변환한다", "긴 단어를 강제로 줄바꿈한다", "한글 단어 중간에서 줄바꿈되지 않도록 단어 단위로 줄바꿈한다", "텍스트가 줄바꿈되지 않도록 한 줄로 유지한다"],
    answer: 2,
    feedback: "word-break: keep-all 은 CJK(한중일) 텍스트에서 어절 단위로 줄바꿈을 허용합니다. 한글이 단어 중간에서 잘리는 것을 방지할 때 유용합니다."
  }
];
