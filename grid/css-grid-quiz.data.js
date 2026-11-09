/* Preserved Grid quiz questions and answers. */
window.QUIZ_CONFIG = {"subject":"CSS","title":"CSS Grid 퀴즈"};
window.QUIZ_DATA = [
  {
    cat: '기본 개념',
    q: 'CSS Grid를 활성화하는 속성은 무엇인가요?',
    code: null,
    hint: 'Flexbox를 활성화할 때도 비슷한 방식을 사용해요.',
    opts: ['display: grid', 'position: grid', 'layout: grid', 'grid: active'],
    ans: 0,
    ex: '<strong>display: grid</strong>를 부모 요소에 적용하면 자식 요소들이 그리드 아이템이 돼요. Flexbox의 display: flex와 같은 방식이에요.'
  },
  {
    cat: 'grid-template-columns',
    q: '다음 코드는 컬럼을 몇 개 만드나요?\n\ngrid-template-columns: repeat(4, 1fr);',
    code: `.container {\n  grid-template-columns: <span class="prop">repeat</span>(<span class="val">4, 1fr</span>);\n}`,
    hint: 'repeat(횟수, 크기)에서 첫 번째 인수가 반복 횟수예요.',
    opts: ['1개', '2개', '4개', '8개'],
    ans: 2,
    ex: '<strong>repeat(4, 1fr)</strong>은 같은 너비의 컬럼을 4개 만들어요. 1fr 1fr 1fr 1fr과 완전히 동일한 코드예요.'
  },
  {
    cat: 'fr 단위',
    q: 'fr 단위에 대한 설명으로 올바른 것은?',
    code: `.container {\n  grid-template-columns: <span class="val">2fr 1fr 1fr</span>;\n}`,
    hint: 'fr = fraction(비율)의 줄임말이에요.',
    opts: ['고정 픽셀 단위', '남은 공간의 비율', '폰트 크기 기준 단위', '뷰포트 기준 단위'],
    ans: 1,
    ex: '<strong>fr</strong>은 남은 공간을 비율로 나눠요. 2fr 1fr 1fr이면 전체를 4등분해서 첫 컬럼이 2/4, 나머지 둘이 각 1/4씩 차지해요.'
  },
  {
    cat: 'minmax()',
    q: 'minmax(120px, 1fr)의 의미로 올바른 것은?',
    code: `.container {\n  grid-template-columns: repeat(3, <span class="prop">minmax</span>(<span class="val">120px, 1fr</span>));\n}`,
    hint: 'minmax(최솟값, 최댓값) 형태로 범위를 지정해요.',
    opts: [
      '정확히 120px 고정 너비',
      '최소 120px, 최대 1fr(남은 공간)',
      '최소 1fr, 최대 120px',
      '120px와 1fr 중 큰 값'
    ],
    ans: 1,
    ex: '<strong>minmax(120px, 1fr)</strong>은 "최소 120px 이하로는 줄어들지 않고, 공간이 남으면 1fr만큼 늘어난다"는 뜻이에요.'
  },
  {
    cat: 'auto-fill vs auto-fit',
    q: 'repeat(auto-fill, minmax(150px, 1fr))에서 아이템이 2개뿐일 때, 빈 트랙은 어떻게 되나요?',
    code: `.container {\n  grid-template-columns: repeat(<span class="val">auto-fill</span>, minmax(150px, 1fr));\n}`,
    hint: 'auto-fill과 auto-fit의 차이는 빈 트랙 처리 방식이에요.',
    opts: [
      '빈 트랙이 0px로 접혀서 아이템이 전체 너비를 채운다',
      '빈 트랙도 공간을 차지해서 아이템이 왼쪽에 몰린다',
      '아이템이 자동으로 복제된다',
      '오류가 발생한다'
    ],
    ans: 1,
    ex: '<strong>auto-fill</strong>은 빈 트랙을 그대로 유지해요. 아이템이 적으면 빈 공간이 생겨서 왼쪽에 몰린 것처럼 보여요. 반면 <strong>auto-fit</strong>은 빈 트랙을 0px로 접어서 아이템들이 전체 너비를 채워요.'
  },
  {
    cat: 'auto-fill vs auto-fit',
    q: '카드가 항상 전체 너비를 꽉 채워야 하는 반응형 갤러리에 더 적합한 값은?',
    code: `.gallery {\n  grid-template-columns: repeat(<span class="blank"></span>, minmax(200px, 1fr));\n}`,
    hint: '아이템이 적어도 늘어나서 전체를 채우는 쪽을 선택하세요.',
    opts: ['auto-fill', 'auto-fit', 'auto', '1fr'],
    ans: 1,
    ex: '<strong>auto-fit</strong>은 빈 트랙을 접어버리기 때문에 아이템 수가 적어도 전체 너비를 꽉 채워요. 반응형 카드 레이아웃에 가장 많이 쓰이는 패턴이에요.'
  },
  {
    cat: 'grid-column / grid-row',
    q: '3×3 그리드에서 grid-column: 1 / 3은 몇 칸을 차지하나요?',
    code: `.item {\n  <span class="prop">grid-column</span>: <span class="val">1 / 3</span>;\n}`,
    hint: '그리드 라인 번호는 칸 번호가 아니라 선의 번호예요.',
    opts: ['1칸', '2칸', '3칸', '전체'],
    ans: 1,
    ex: 'grid-column: 1 / 3은 <strong>1번 라인부터 3번 라인까지</strong>예요. 3×3 그리드에서 라인은 1~4번까지 있고, 1번~3번 사이에 칸이 2개 있으므로 2칸을 차지해요.'
  },
  {
    cat: 'grid-column / grid-row',
    q: '다음 중 item이 2칸을 차지하는 코드가 아닌 것은?',
    code: null,
    hint: 'span N은 현재 위치에서 N칸을 차지하겠다는 뜻이에요.',
    opts: [
      'grid-column: 1 / 3',
      'grid-column: 2 / 4',
      'grid-column: span 2',
      'grid-column: 1 / 2'
    ],
    ans: 3,
    ex: '<strong>grid-column: 1 / 2</strong>는 1번 라인부터 2번 라인까지, 즉 1칸만 차지해요. 나머지 세 개는 모두 2칸을 차지하는 올바른 코드예요.'
  },
  {
    cat: 'grid-template-areas',
    q: '다음 grid-template-areas에서 header 영역은 몇 칸인가요?\n\n"header header header"\n"sidebar main main"\n"footer footer footer"',
    code: `.container {\n  grid-template-columns: repeat(3, 1fr);\n  grid-template-areas:\n    <span class="val">"header header header"</span>\n    <span class="val">"sidebar main main"</span>\n    <span class="val">"footer footer footer"</span>;\n}`,
    hint: '같은 이름이 반복된 횟수가 해당 영역이 차지하는 칸 수예요.',
    opts: ['1칸', '2칸', '3칸', '4칸'],
    ans: 2,
    ex: '"header header header"에서 header가 3번 반복됐으므로 <strong>3칸(전체 너비)</strong>을 차지해요. grid-area: header를 적용한 요소가 이 자리를 찾아가요.'
  },
  {
    cat: 'grid-template-areas',
    q: 'grid-template-areas에서 빈 칸을 나타내는 기호는?',
    code: `.container {\n  grid-template-areas:\n    <span class="val">". . a"</span>\n    <span class="val">". b c"</span>;\n}`,
    hint: '특수 문자 하나로 표현해요.',
    opts: ['빈 문자열 ""', '점 .', '언더바 _', '별표 *'],
    ans: 1,
    ex: '<strong>점(.)</strong>은 grid-template-areas에서 빈 칸을 의미해요. 아무 아이템도 배치되지 않는 빈 공간이에요.'
  },
  {
    cat: 'grid-template-areas',
    q: '반응형에서 grid-template-areas를 초기화하려면 어떻게 해야 하나요?',
    code: `<span class="cm">/* 모바일 */</span>\n@media (max-width: 768px) {\n  .container {\n    <span class="prop">grid-template-areas</span>:\n      <span class="val">"a" "b" "c"</span>;\n  }\n}`,
    hint: 'absolute를 static으로 바꾸는 것처럼 생각해보세요.',
    opts: [
      'grid-template-areas: none을 써야 한다',
      '미디어 쿼리에서 grid-template-areas를 다시 써주면 된다',
      '자식의 grid-area도 함께 바꿔야 한다',
      '반응형 변경이 불가능하다'
    ],
    ans: 1,
    ex: '미디어 쿼리 안에서 <strong>grid-template-areas를 다시 써주면</strong> 덮어써져요. 자식의 grid-area는 건드릴 필요 없고, 부모의 지도만 바꾸면 자식들이 새 지도대로 따라가요.'
  },
  {
    cat: 'grid-auto-flow',
    q: 'grid-auto-flow의 기본값은 무엇이며, 아이템이 어느 방향으로 흐르나요?',
    code: `.container {\n  grid-template-columns: repeat(3, 1fr);\n  <span class="cm">/* grid-auto-flow 기본값 */</span>\n}`,
    hint: 'Flexbox의 flex-direction과 비슷한 개념이에요.',
    opts: [
      'column — 위에서 아래로',
      'row — 왼쪽에서 오른쪽으로',
      'dense — 빈 칸을 채우며',
      'auto — 자동으로'
    ],
    ans: 1,
    ex: '<strong>grid-auto-flow: row</strong>가 기본값이에요. 왼쪽에서 오른쪽으로 채우고, 줄이 꽉 차면 다음 행으로 넘어가요.'
  },
  {
    cat: 'gap',
    q: '행 간격은 20px, 열 간격은 10px로 설정하려면?',
    code: `.container {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  <span class="prop">gap</span>: <span class="blank"></span>;\n}`,
    hint: 'gap: 행간격 열간격 순서로 두 값을 쓸 수 있어요.',
    opts: [
      'gap: 10px 20px',
      'gap: 20px 10px',
      'row-gap: 10px; column-gap: 20px',
      'gap: 20px / 10px'
    ],
    ans: 1,
    ex: '<strong>gap: 행간격 열간격</strong> 순서예요. gap: 20px 10px이면 행(위아래) 간격 20px, 열(좌우) 간격 10px이에요. 따로 쓰려면 row-gap: 20px; column-gap: 10px;으로 쓸 수 있어요.'
  },
  {
    cat: 'grid-auto-rows',
    q: 'grid-auto-rows: minmax(180px, auto)의 의미로 올바른 것은?',
    code: `.container {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  <span class="prop">grid-auto-rows</span>: <span class="val">minmax(180px, auto)</span>;\n}`,
    hint: 'grid-auto-rows는 명시하지 않은 행의 기본 크기를 정해요.',
    opts: [
      '행을 정확히 180px로 고정한다',
      '행 높이를 최소 180px로 하고, 내용이 많으면 늘어난다',
      '행을 최대 180px로 제한한다',
      '첫 번째 행만 180px로 설정한다'
    ],
    ans: 1,
    ex: '<strong>grid-auto-rows: minmax(180px, auto)</strong>는 자동 생성되는 행의 높이를 최소 180px로 설정하고, 내용이 많으면 auto로 늘어나도록 해요. grid-template-rows로 명시하지 않은 행에 적용돼요.'
  },
  {
    cat: 'Table vs Grid',
    q: 'HTML 테이블의 colspan과 CSS Grid의 grid-column 차이로 올바른 것은?',
    code: `<span class="cm">/* 테이블 */</span>\n&lt;td <span class="prop">colspan</span>="<span class="val">2</span>"&gt;합쳐진 셀&lt;/td&gt;\n\n<span class="cm">/* Grid */</span>\n.item { <span class="prop">grid-column</span>: <span class="val">1 / 3</span>; }`,
    hint: '테이블은 HTML 구조가 바뀌고, Grid는 CSS만 바뀌어요.',
    opts: [
      'colspan과 grid-column은 동일하게 동작한다',
      'colspan은 HTML 구조가 바뀌고, grid-column은 CSS만 변경하면 된다',
      'grid-column은 HTML 구조가 바뀌고, colspan은 CSS만 변경하면 된다',
      '둘 다 반응형 적용이 불가능하다'
    ],
    ans: 1,
    ex: '<strong>테이블 colspan</strong>은 HTML 구조 자체가 바뀌어서 반응형으로 레이아웃을 변경하려면 HTML을 다시 짜야 해요. 반면 <strong>CSS Grid</strong>는 HTML은 그대로 두고 CSS만 바꾸면 레이아웃이 완전히 달라져요. 그래서 레이아웃 목적으로는 테이블 대신 Grid를 써요.'
  }
];
/* The shared quiz UI renders source examples as text, so remove old presentation-only spans. */
window.QUIZ_DATA.forEach(q=>{if(typeof q.code==="string")q.code=q.code.replace(/<span\b[^>]*>/g,"").replace(/<\/span>/g,"");});
