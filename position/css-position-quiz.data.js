/* Preserved original quiz questions and answers */
window.QUIZ_CONFIG = {"subject":"CSS","title":"CSS Position 퀴즈"};
window.QUIZ_DATA = [
  {
    cat: '개념 이해',
    q: 'CSS position 속성의 기본값은 무엇인가요?',
    code: null,
    hint: 'position을 따로 지정하지 않은 요소는 이 값을 가집니다.',
    opts: ['relative', 'absolute', 'static', 'fixed'],
    ans: 2,
    ex: '<strong>static</strong>이 기본값입니다. 요소를 특별히 이동시키지 않으며, left/top/right/bottom 값이 적용되지 않습니다. 반응형 작업 시 absolute나 fixed를 풀고 기본 흐름으로 되돌릴 때 사용합니다.'
  },
  {
    cat: '개념 이해',
    q: 'position: relative를 사용할 때, 요소는 어디를 기준으로 이동하나요?',
    code: null,
    hint: 'relative는 "상대적"이라는 뜻입니다.',
    opts: [
      '뷰포트(화면) 기준으로 이동',
      '요소 자신의 원래 위치 기준으로 이동',
      '가장 가까운 부모 요소 기준으로 이동',
      'body 기준으로 이동'
    ],
    ans: 1,
    ex: '<strong>relative</strong>는 요소의 본래 위치를 기준으로 이동합니다. 이동해도 원래 자리는 유지(공간 차지)되며, 주로 자식 요소에 absolute를 적용하기 위한 기준점 역할로 사용합니다.'
  },
  {
    cat: '개념 이해',
    q: 'position: fixed를 주로 사용하는 상황으로 올바른 것을 모두 고르면? (복수 가능 — 가장 적절한 하나 선택)',
    code: null,
    hint: 'fixed는 스크롤해도 항상 같은 자리에 고정됩니다.',
    opts: [
      '텍스트에 밑줄을 추가할 때',
      '내비게이션 바를 화면 상단에 고정할 때',
      '이미지 위에 뱃지를 올릴 때',
      '섹션 간 간격을 조절할 때'
    ],
    ans: 1,
    ex: '<strong>fixed</strong>는 뷰포트를 기준으로 고정되어 스크롤에 영향받지 않습니다. 네비게이션 고정, "위로" 버튼 고정, 모달 배경 등에 사용합니다.'
  },
  {
    cat: '빈칸 채우기',
    q: '다음은 이미지 카드 위에 뱃지를 올리는 코드입니다. 빈칸에 알맞은 값을 고르세요.',
    code: `.img-box {
  <span class="prop">position</span>: <span class="blank"></span>;
}
.num {
  <span class="prop">position</span>: <span class="val">absolute</span>;
  <span class="prop">right</span>: <span class="val">12px</span>;
  <span class="prop">bottom</span>: <span class="val">58px</span>;
}`,
    hint: 'absolute 자식 요소의 기준점이 되려면 부모에게 특정 position 값이 필요합니다.',
    opts: ['static', 'fixed', 'relative', 'absolute'],
    ans: 2,
    ex: 'absolute는 <strong>가장 가까운 position이 지정된 조상 요소</strong>를 기준으로 위치합니다. 부모에게 <strong>relative</strong>를 주어야 자식 absolute가 부모 기준으로 배치됩니다. static이면 기준이 되지 못합니다.'
  },
  {
    cat: '빈칸 채우기',
    q: '"위로 가기" 버튼을 화면 우측 하단에 고정하려 합니다. 빈칸에 알맞은 position 값은?',
    code: `.top {
  <span class="prop">position</span>: <span class="blank"></span>;
  <span class="prop">right</span>: <span class="val">20px</span>;
  <span class="prop">bottom</span>: <span class="val">30px</span>;
  <span class="prop">z-index</span>: <span class="val">99</span>;
}`,
    hint: '스크롤해도 항상 같은 위치에 보여야 합니다.',
    opts: ['sticky', 'relative', 'absolute', 'fixed'],
    ans: 3,
    ex: '<strong>fixed</strong>는 뷰포트 기준으로 고정되어 스크롤과 무관하게 항상 같은 자리에 있습니다. 수업 예제에서도 .top 버튼에 fixed를 적용했습니다.'
  },
  {
    cat: '빈칸 채우기',
    q: '다음 코드에서 .box는 호버 시 왼쪽에서 슬라이드 인 되어야 합니다. 초기 상태의 빈칸 값은?',
    code: `.box {
  <span class="prop">position</span>: <span class="val">absolute</span>;
  <span class="prop">left</span>: <span class="blank"></span>;
  <span class="prop">top</span>: <span class="val">0</span>;
  <span class="prop">width</span>: <span class="val">100%</span>;
  <span class="prop">height</span>: <span class="val">100%</span>;
}
<span class="sel">a:hover .box</span> {
  <span class="prop">left</span>: <span class="val">0</span>;
  <span class="prop">transition</span>: <span class="val">0.5s</span>;
}`,
    hint: '처음엔 완전히 화면 밖(왼쪽)에 숨겨져 있다가 호버 시 나타나야 합니다.',
    opts: ['0', '-50%', '-100%', 'auto'],
    ans: 2,
    ex: '<strong>left: -100%</strong>로 요소를 자신의 너비만큼 왼쪽으로 밀어 숨겨두고, 호버 시 left: 0으로 바꿔 슬라이드 인 효과를 만듭니다. 부모에 overflow: hidden도 함께 써야 밖으로 삐져나오지 않습니다.'
  },
  {
    cat: '코드 결과 예측',
    q: '다음 코드를 적용했을 때, span 요소는 어디를 기준으로 배치되나요?',
    code: `<span class="sel">div</span> {
  <span class="prop">margin-left</span>: <span class="val">100px</span>;
  <span class="prop">margin-top</span>: <span class="val">100px</span>;
  <span class="kw">/* position: relative 없음 */</span>
}
<span class="sel">span</span> {
  <span class="prop">position</span>: <span class="val">absolute</span>;
  <span class="prop">left</span>: <span class="val">20px</span>;
  <span class="prop">top</span>: <span class="val">20px</span>;
}`,
    hint: '부모인 div에 position이 지정되어 있지 않습니다.',
    opts: [
      'div 기준으로 좌측에서 20px, 상단에서 20px',
      'body(또는 position이 있는 상위 요소) 기준으로 배치',
      '뷰포트 기준으로 고정',
      '제자리에 그대로 있음'
    ],
    ans: 1,
    ex: 'absolute는 <strong>가장 가까운 position 지정 조상</strong>을 기준으로 합니다. div에 relative가 없으므로 계속 위로 올라가 body(position 없으면 초기 컨테이닝 블록)를 기준으로 배치됩니다. 수업 예제에서 div에 relative를 주석 처리한 상황과 동일합니다.'
  },
  {
    cat: '코드 결과 예측',
    q: 'overflow: hidden이 없을 때, left: -100%로 숨겨둔 .box는 어떻게 보이나요?',
    code: `<span class="sel">div</span> {
  <span class="prop">position</span>: <span class="val">relative</span>;
  <span class="kw">/* overflow: hidden 없음 */</span>
}
<span class="sel">.box</span> {
  <span class="prop">position</span>: <span class="val">absolute</span>;
  <span class="prop">left</span>: <span class="val">-100%</span>;
}`,
    hint: 'overflow: hidden은 부모 영역 밖을 잘라냅니다.',
    opts: [
      '완전히 사라짐',
      '부모 왼쪽 바깥으로 삐져나와 보임',
      '부모 안에 정상 표시됨',
      '뷰포트 기준으로 이동함'
    ],
    ans: 1,
    ex: 'overflow: hidden이 없으면 부모 영역 밖으로 삐져나온 요소가 그대로 보입니다. <strong>overflow: hidden</strong>을 함께 써야 부모 경계 밖의 내용이 잘려서 슬라이드 효과가 완성됩니다.'
  },
  {
    cat: '코드 결과 예측',
    q: 'position: sticky를 적용한 section은 어떤 동작을 하나요?',
    code: `<span class="sel">section</span> {
  <span class="prop">position</span>: <span class="val">sticky</span>;
  <span class="prop">top</span>: <span class="val">0</span>;
}
<span class="sel">footer</span> {
  <span class="prop">position</span>: <span class="val">relative</span>;
  <span class="prop">z-index</span>: <span class="val">1</span>;
}`,
    hint: 'sticky는 스크롤 위치에 따라 동작이 달라집니다.',
    opts: [
      '항상 화면 상단에 고정되어 스크롤 영향을 전혀 받지 않음',
      '스크롤 시 원래 위치까지는 일반 흐름으로, 그 이후엔 top:0에 고정되다가 footer가 올라오면 밀려남',
      '부모 요소 안에서만 top:0으로 고정',
      'fixed와 동일하게 동작'
    ],
    ans: 1,
    ex: '<strong>sticky</strong>는 스크롤 전엔 normal flow처럼, 지정 임계점(top:0)에 닿으면 fixed처럼 동작합니다. 단, 부모 요소 범위를 벗어나면 사라지므로 footer에 z-index를 줘서 section 위로 올라오게 하면 덮이는 효과가 납니다.'
  },
  {
    cat: '오류 찾기',
    q: '이미지 위에 버튼을 absolute로 배치하려 합니다. 버튼이 의도한 위치에 나타나지 않는 이유는?',
    code: `<span class="sel">.img-box</span> {
  <span class="kw">/* position 없음 */</span>
  <span class="prop">width</span>: <span class="val">264px</span>;
  <span class="prop">height</span>: <span class="val">264px</span>;
}
<span class="sel">button</span> {
  <span class="prop">position</span>: <span class="val">absolute</span>;
  <span class="prop">right</span>: <span class="val">12px</span>;
  <span class="prop">bottom</span>: <span class="val">12px</span>;
}`,
    hint: 'absolute는 기준이 되는 부모가 필요합니다.',
    opts: [
      'button에 z-index가 없어서',
      '.img-box에 position: relative가 없어서 button이 엉뚱한 기준점을 찾아감',
      'button의 right 값이 너무 작아서',
      'width/height가 px 단위여서'
    ],
    ans: 1,
    ex: '<strong>position: relative</strong>가 없는 .img-box는 absolute의 기준이 되지 못합니다. button은 더 위 조상으로 기준을 찾아가 의도와 다른 위치에 배치됩니다. 반드시 부모에 relative, 자식에 absolute를 세트로 적용해야 합니다.'
  },
  {
    cat: '오류 찾기',
    q: '다음 중 position: sticky가 작동하지 않는 원인으로 올바른 것은?',
    code: `<span class="sel">section</span> {
  <span class="prop">position</span>: <span class="val">sticky</span>;
  <span class="prop">top</span>: <span class="val">0</span>;
}
<span class="sel">.parent</span> {
  <span class="prop">overflow</span>: <span class="val">hidden</span>;
}`,
    hint: 'sticky의 동작에는 부모 요소의 상태가 영향을 줍니다.',
    opts: [
      'section에 width가 없어서',
      'top 값이 0이어서 의미가 없어서',
      '부모(.parent)에 overflow: hidden이 있으면 sticky가 동작하지 않음',
      'z-index를 지정하지 않아서'
    ],
    ans: 2,
    ex: '<strong>overflow: hidden / auto / scroll</strong>이 적용된 조상 요소가 있으면 sticky가 그 조상을 스크롤 컨테이너로 인식해 제대로 동작하지 않습니다. sticky 사용 시 부모에 overflow를 함부로 주지 않도록 주의해야 합니다.'
  },
  {
    cat: '오류 찾기',
    q: '헤더 안에 em 요소들을 absolute로 겹치게 배치했는데 모두 같은 자리에 쌓입니다. 문제 없는 코드는?',
    code: `<span class="sel">header</span> {
  <span class="prop">position</span>: <span class="val">relative</span>;
}
<span class="sel">header > .em</span> {
  <span class="prop">position</span>: <span class="val">absolute</span>;
  <span class="kw">/* left, top 값 없음 */</span>
}`,
    hint: 'absolute로 배치할 때 위치를 지정하지 않으면 어떻게 될까요?',
    opts: [
      'header에 relative가 없어서 문제',
      'em이 인라인 요소여서 문제',
      'left/top 값이 없어 모든 .em이 같은 기본 위치에 겹쳐짐',
      'z-index가 없어서 문제'
    ],
    ans: 2,
    ex: 'absolute 요소에 <strong>left/top/right/bottom</strong>을 지정하지 않으면 원래 있던 자리 근처에 겹쳐 배치됩니다. 각 요소마다 다른 위치 값을 줘야 의도대로 배치할 수 있습니다.'
  },
  {
    cat: '개념 이해',
    q: 'z-index 속성이 동작하기 위한 조건은 무엇인가요?',
    code: null,
    hint: 'z-index는 아무 요소에나 적용되지 않습니다.',
    opts: [
      '요소에 width와 height가 있어야 함',
      'position이 static이 아닌 값(relative, absolute, fixed, sticky)으로 지정된 요소에서만 동작',
      '부모 요소에 z-index가 먼저 있어야 함',
      '항상 모든 요소에 동작함'
    ],
    ans: 1,
    ex: '<strong>z-index</strong>는 position이 <strong>static이 아닌</strong> 요소에서만 의미가 있습니다. 수업 예제에서도 footer에 position: relative와 z-index: 1을 함께 써서 sticky section 위로 올라오게 한 것을 기억해보세요.'
  },
  {
    cat: '빈칸 채우기',
    q: '자식 li 요소에 absolute를 주었더니 width가 줄어들었습니다. 빈칸을 채워 .img-box의 가로를 꽉 채우세요.',
    code: `<span class="sel">.img-box > a</span> {
  <span class="prop">display</span>: <span class="val">inline-block</span>;
  <span class="prop">width</span>: <span class="blank"></span>;
  <span class="prop">height</span>: <span class="val">264px</span>;
}`,
    hint: 'absolute 자식에게 부모와 같은 가로폭을 주려면?',
    opts: ['auto', '264px', '100%', 'inherit'],
    ans: 2,
    ex: '<strong>width: 100%</strong>는 부모 요소의 너비를 상속받습니다. absolute 요소는 기본적으로 콘텐츠 크기만큼 줄어들므로, 부모를 꽉 채우려면 100%를 명시해야 합니다.'
  },
  {
    cat: '개념 이해',
    q: 'position: absolute를 적용하면 요소의 display 특성은 어떻게 변하나요?',
    code: null,
    hint: '수업에서 span(인라인)에 absolute를 줬는데 width/height가 적용됐습니다.',
    opts: [
      '변화 없음, 인라인은 인라인 그대로',
      '무조건 display: none이 됨',
      '인라인 요소도 블록처럼 width/height 적용이 가능한 상태가 됨',
      'display: flex로 변경됨'
    ],
    ans: 2,
    ex: 'absolute(또는 fixed)를 적용하면 인라인 요소도 <strong>블록 레벨처럼</strong> width, height, margin 등이 자유롭게 적용됩니다. 그래서 수업 예제에서 span에 absolute를 주자 padding/크기 지정이 가능해진 것입니다.'
  }
];
