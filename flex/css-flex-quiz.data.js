/* Preserved original quiz questions and answers */
window.QUIZ_CONFIG = {"subject":"CSS","title":"CSS Flexbox 퀴즈"};
window.QUIZ_DATA = [
  // ── 개념 이해 ──
  {
    cat: '개념 이해',
    q: 'display: flex를 부모 요소에 적용하면 어떤 일이 일어나나요?',
    code: null,
    hint: 'flex는 부모에 선언하고 자식들을 정렬합니다.',
    opts: [
      '부모 요소 자체가 화면 중앙으로 이동한다',
      '해당 요소가 flex 컨테이너가 되어 내부 자식 요소(flex 아이템)들을 정렬할 수 있게 된다',
      '자식 요소들이 자동으로 같은 크기가 된다',
      '자식 요소들에 자동으로 position: absolute가 적용된다'
    ],
    ans: 1,
    ex: '<strong>display: flex</strong>는 해당 요소를 flex 컨테이너로 지정합니다. 이후 내부 자식 요소들이 flex 아이템이 되어 flex 속성으로 정렬이 가능해집니다. 부모에 선언하고 자식들이 영향을 받는 구조입니다.'
  },
  {
    cat: '개념 이해',
    q: 'flex-direction의 기본값은 무엇이며, 어떤 방향으로 자식을 정렬하나요?',
    code: null,
    hint: '피그마 오토레이아웃의 기본 방향과 같습니다.',
    opts: [
      'column — 위에서 아래로',
      'row-reverse — 오른쪽에서 왼쪽으로',
      'row — 왼쪽에서 오른쪽으로',
      'column-reverse — 아래에서 위로'
    ],
    ans: 2,
    ex: '<strong>flex-direction: row</strong>가 기본값으로, 자식 요소들을 가로 방향(왼쪽→오른쪽)으로 나열합니다. column은 세로(위→아래), reverse가 붙으면 각각 역순이 됩니다.'
  },
  {
    cat: '개념 이해',
    q: 'justify-content와 align-items의 차이를 가장 잘 설명한 것은?',
    code: null,
    hint: '메인축과 교차축의 차이입니다.',
    opts: [
      'justify-content는 자식 크기 조절, align-items는 자식 간격 조절',
      'justify-content는 flex-direction으로 결정된 메인축 정렬, align-items는 그 반대 교차축 정렬',
      'justify-content는 세로 정렬, align-items는 가로 정렬',
      '둘 다 같은 역할이며 중복 사용 불가'
    ],
    ans: 1,
    ex: '<strong>justify-content</strong>는 메인축(flex-direction 방향) 기준 정렬, <strong>align-items</strong>는 교차축(메인축과 수직) 기준 정렬입니다. row일 때 justify-content는 좌우, align-items는 상하 정렬이 됩니다.'
  },
  {
    cat: '개념 이해',
    q: 'align-items의 기본값인 stretch는 어떻게 동작하나요?',
    code: null,
    hint: 'flex를 적용하면 자식들의 높이가 자동으로 맞춰지는 이유가 여기에 있습니다.',
    opts: [
      '자식 요소들을 교차축의 시작점에 붙인다',
      '자식 요소들을 교차축 가운데로 정렬한다',
      '자식 요소들의 높이(또는 너비)를 부모 크기에 맞게 늘려 꽉 채운다',
      '자식 요소들 사이에 균등한 여백을 배분한다'
    ],
    ans: 2,
    ex: '<strong>stretch</strong>는 자식 요소의 높이(row 방향일 때)를 따로 지정하지 않았을 때 부모 높이만큼 늘려버립니다. flex 적용 후 자식들 높이가 자동으로 맞춰지는 이유가 바로 stretch 기본값 때문입니다.'
  },
  {
    cat: '개념 이해',
    q: 'flex-grow: 0 과 flex-grow: 1 의 차이는?',
    code: null,
    hint: '피그마의 Fill 모드와 같은 개념입니다.',
    opts: [
      'flex-grow: 0은 요소를 숨김, flex-grow: 1은 요소를 보임',
      'flex-grow: 0은 남은 공간을 차지하지 않음(기본), flex-grow: 1은 남은 공간을 나눠 가지며 늘어남',
      'flex-grow: 0은 줄어들지 않음, flex-grow: 1은 줄어들 수 있음',
      'flex-grow는 아이템 속성이 아닌 컨테이너 속성이다'
    ],
    ans: 1,
    ex: '<strong>flex-grow: 0</strong>이 기본값으로 남은 공간을 차지하지 않습니다. <strong>flex-grow: 1</strong> 이상이면 컨테이너의 남은 여백을 비율에 따라 나눠가져 늘어납니다. 피그마의 Fill 모드와 같은 개념입니다.'
  },
  {
    cat: '개념 이해',
    q: 'flex-shrink의 기본값은 무엇이며 어떤 의미인가요?',
    code: null,
    hint: '기본값이 0이 아닙니다.',
    opts: [
      '기본값 0 — 공간이 부족해도 절대 줄어들지 않는다',
      '기본값 1 — 공간이 부족하면 기본적으로 자식들이 줄어들도록 설계되어 있다',
      '기본값 auto — 콘텐츠 크기에 맞게 자동 조절된다',
      '기본값 1 — 공간이 남으면 자동으로 늘어난다'
    ],
    ans: 1,
    ex: '<strong>flex-shrink: 1</strong>이 기본값입니다. 부모 공간이 부족할 때 자식들이 기본적으로 줄어들게 설계되어 있습니다. <strong>0</strong>으로 바꾸면 부모가 좁아져도 자신의 크기를 유지합니다.'
  },
  {
    cat: '개념 이해',
    q: 'flex-wrap의 기본값과 wrap 값의 차이는?',
    code: null,
    hint: '피그마 오토레이아웃의 wrap 기능과 매핑됩니다.',
    opts: [
      'nowrap(기본) — 공간 부족 시 자식이 다음 줄로 내려감 / wrap — 강제로 한 줄 유지',
      'nowrap(기본) — 공간 부족해도 한 줄 유지, 자식 크기 강제 축소 / wrap — 공간 부족 시 다음 줄로 내려감',
      '둘 다 동일하게 동작하며 차이 없음',
      'nowrap — 세로 정렬 / wrap — 가로 정렬 전환'
    ],
    ans: 1,
    ex: '<strong>nowrap</strong>(기본)은 공간이 부족해도 줄바꿈하지 않고 자식 크기를 강제로 줄입니다. <strong>wrap</strong>은 공간이 부족하면 자동으로 다음 줄로 내려가 정렬됩니다. 피그마 오토레이아웃 wrap과 매핑됩니다.'
  },
  {
    cat: '개념 이해',
    q: 'order 속성 사용 시 주의해야 할 접근성 이슈는?',
    code: null,
    hint: '스크린리더는 HTML 구조 순서대로 읽습니다.',
    opts: [
      'order를 쓰면 z-index가 초기화된다',
      'order는 컨테이너 속성이라 아이템에 적용되지 않는다',
      '시각적 순서는 바뀌지만 스크린리더는 HTML 구조 순서대로 읽어 시각과 접근성 순서가 어긋날 수 있다',
      'order는 음수 값을 사용할 수 없다'
    ],
    ans: 2,
    ex: '<strong>order</strong>는 HTML 구조를 바꾸지 않고 시각적 순서만 변경합니다. 스크린리더는 원래 HTML 구조 순서대로 읽기 때문에, 시각 순서와 읽기 순서가 달라지는 접근성 문제가 생길 수 있습니다.'
  },

  // ── 빈칸 채우기 ──
  {
    cat: '빈칸 채우기',
    q: 'SBS 골프 카드 리스트에서 4개의 li가 부모 여백을 균등하게 나눠 채우도록 합니다. 빈칸을 채우세요.',
    code: `<span class="sel">ul > li</span> {
  <span class="kw">flex-grow</span>: <span class="blank"></span>;
  <span class="kw">flex-basis</span>: <span class="val">100%</span>;
}`,
    hint: 'grow 값이 모두 같으면 남은 공간을 균등하게 나눕니다.',
    opts: ['0', '1', 'auto', '100%'],
    ans: 1,
    ex: '<strong>flex-grow: 1</strong>을 모든 li에 주면 남은 공간을 동일 비율로 나눠 가집니다. flex-basis: 100%와 함께 쓰면 모든 아이템이 같은 너비로 늘어납니다.'
  },
  {
    cat: '빈칸 채우기',
    q: '자식 요소들을 가로로 나열하고 양끝에 붙이되 사이 여백을 균등하게 배분하려 합니다.',
    code: `<span class="sel">.container</span> {
  <span class="kw">display</span>: <span class="val">flex</span>;
  <span class="kw">justify-content</span>: <span class="blank"></span>;
}`,
    hint: '피그마의 auto 정렬과 매핑되는 값입니다.',
    opts: ['space-around', 'space-evenly', 'space-between', 'center'],
    ans: 2,
    ex: '<strong>space-between</strong>은 첫 번째와 마지막 요소를 양끝에 붙이고 남은 여백을 자식 사이에 균등 배분합니다. 피그마의 auto 정렬과 매핑됩니다. space-around는 양끝 여백이 사이 여백의 절반, space-evenly는 모든 여백이 동일합니다.'
  },
  {
    cat: '빈칸 채우기',
    q: '핀텐 예제에서 800px 이하일 때 list-box의 방향을 세로로 바꾸려 합니다. 빈칸을 채우세요.',
    code: `<span class="sel">@media (max-width: 800px)</span> {
  <span class="sel">.list-box</span> {
    <span class="kw">flex-direction</span>: <span class="blank"></span>;
    <span class="kw">row-gap</span>: <span class="val">20px</span>;
  }
}`,
    hint: '가로 → 세로로 바꾸는 값입니다.',
    opts: ['row', 'row-reverse', 'column', 'column-reverse'],
    ans: 2,
    ex: '<strong>flex-direction: column</strong>으로 바꾸면 자식들이 세로(위→아래)로 쌓입니다. 핀텐 예제에서 모바일 분기점에서 카드들을 세로로 재배치할 때 사용한 패턴입니다.'
  },
  {
    cat: '빈칸 채우기',
    q: '부모가 align-items: flex-start인 상태에서 특정 자식 하나만 세로 가운데로 정렬하려 합니다.',
    code: `<span class="sel">.special-item</span> {
  <span class="blank"></span>: <span class="val">center</span>;
}`,
    hint: '부모의 align-items를 무시하고 개별적으로 적용하는 속성입니다.',
    opts: ['justify-content', 'align-items', 'align-self', 'flex-align'],
    ans: 2,
    ex: '<strong>align-self</strong>는 부모의 align-items를 무시하고 해당 아이템 하나만 교차축 정렬을 다르게 지정합니다. align-items와 동일한 값을 사용하며 아이템에 적용하는 속성입니다.'
  },
  {
    cat: '빈칸 채우기',
    q: 'flex 축약형으로 grow:0, shrink:1, basis:auto를 한 줄로 쓰면?',
    code: `<span class="sel">.item</span> {
  <span class="kw">flex</span>: <span class="blank"></span>;
}`,
    hint: 'grow shrink basis 순서입니다.',
    opts: ['auto 1 0', '1 0 auto', '0 1 auto', '0 0 auto'],
    ans: 2,
    ex: '<strong>flex: 0 1 auto</strong>가 flex의 기본값입니다. grow shrink basis 순서로 작성합니다. 수업 예제에서 "세가지 속성을 묶어 flex: 0 1 auto 형태로 사용"이라고 배운 내용입니다.'
  },

  // ── 코드 결과 예측 ──
  {
    cat: '코드 결과 예측',
    q: '다음 코드를 적용하면 자식 div들은 어떻게 배치되나요?',
    code: `<span class="sel">.flex-box</span> {
  <span class="kw">display</span>: <span class="val">flex</span>;
  <span class="kw">flex-direction</span>: <span class="val">column</span>;
  <span class="kw">align-items</span>: <span class="val">center</span>;
}`,
    hint: 'column일 때 메인축과 교차축 방향을 생각해보세요.',
    opts: [
      '자식들이 가로로 나열되고 세로 가운데 정렬',
      '자식들이 세로로 쌓이고 가로 가운데 정렬',
      '자식들이 세로로 쌓이고 세로 가운데 정렬',
      '자식들이 가로로 나열되고 가로 가운데 정렬'
    ],
    ans: 1,
    ex: '<strong>flex-direction: column</strong>이면 메인축이 세로입니다. <strong>align-items</strong>는 교차축(가로) 기준이므로 center를 주면 자식들이 가로 가운데로 정렬됩니다. 자식들은 세로로 쌓이면서 가로 기준 중앙에 배치됩니다.'
  },
  {
    cat: '코드 결과 예측',
    q: '두 자식이 있을 때 아래 코드를 적용하면 공간 배분이 어떻게 되나요?',
    code: `<span class="sel">.item-a</span> { <span class="kw">flex-grow</span>: <span class="val">1</span>; }
<span class="sel">.item-b</span> { <span class="kw">flex-grow</span>: <span class="val">2</span>; }`,
    hint: 'grow 값의 비율로 남은 공간을 나눕니다.',
    opts: [
      'item-a와 item-b가 동일한 크기',
      'item-a가 남은 공간의 1/3, item-b가 2/3를 차지',
      'item-b만 늘어나고 item-a는 고정',
      'item-a가 2/3, item-b가 1/3을 차지'
    ],
    ans: 1,
    ex: '<strong>flex-grow</strong> 값의 합(1+2=3)을 기준으로 남은 공간을 비율로 나눕니다. item-a는 1/3, item-b는 2/3를 가져갑니다. 두 값이 모두 1이면 1:1로 균등하게 나눕니다.'
  },
  {
    cat: '코드 결과 예측',
    q: 'flex-shrink: 0을 자식에 적용하면 어떻게 되나요?',
    code: `<span class="sel">.item</span> {
  <span class="kw">width</span>: <span class="val">200px</span>;
  <span class="kw">flex-shrink</span>: <span class="val">0</span>;
}`,
    hint: 'shrink 0은 줄어들지 않겠다는 의미입니다.',
    opts: [
      '부모가 200px보다 좁아지면 자동으로 줄어든다',
      '부모가 좁아져도 200px 고정 크기를 유지한다',
      '요소가 사라진다',
      'flex-grow: 1과 같은 효과'
    ],
    ans: 1,
    ex: '<strong>flex-shrink: 0</strong>은 부모 공간이 부족해도 해당 아이템이 줄어들지 않고 지정한 크기(200px)를 유지합니다. 로고, 아이콘처럼 크기가 고정되어야 하는 요소에 사용합니다.'
  },
  {
    cat: '코드 결과 예측',
    q: 'align-content가 작동하기 위한 조건은 무엇인가요?',
    code: `<span class="sel">.container</span> {
  <span class="kw">display</span>: <span class="val">flex</span>;
  <span class="kw">flex-wrap</span>: <span class="val">wrap</span>;
  <span class="kw">align-content</span>: <span class="val">space-between</span>;
}`,
    hint: 'align-content는 한 줄일 때 반응이 없습니다.',
    opts: [
      'flex-direction: column이 있어야 함',
      'align-items가 없어야 함',
      'flex-wrap: wrap 상태이고 자식들이 두 줄 이상일 때만 작동',
      '항상 작동하며 조건 없음'
    ],
    ans: 2,
    ex: '<strong>align-content</strong>는 <strong>flex-wrap: wrap</strong> 상태에서 자식들이 두 줄 이상(다중행)으로 배치되었을 때만 작동합니다. 한 줄일 때는 반응이 없으며, 여러 줄 전체 덩어리를 교차축 기준으로 배분합니다.'
  },

  // ── 오류 찾기 ──
  {
    cat: '오류 찾기',
    q: '자식 li들을 가로로 균등하게 나누려 했는데 의도대로 되지 않습니다. 문제는?',
    code: `<span class="sel">ul</span> {
  <span class="kw">display</span>: <span class="val">flex</span>;
}
<span class="sel">ul > li</span> {
  <span class="kw">flex-grow</span>: <span class="val">1</span>;
  <span class="kw">flex-basis</span>: <span class="val">100%</span>;
  <span class="kw">flex-shrink</span>: <span class="val">0</span>; <span class="cm">/* ← 이 줄이 문제 */</span>
}`,
    hint: 'basis: 100%인데 shrink: 0이면 어떻게 될까요?',
    opts: [
      'flex-grow 값이 너무 작아서',
      'ul에 width가 없어서',
      'flex-basis: 100%에 flex-shrink: 0을 주면 각 li가 부모 전체 너비를 차지하려 해서 넘쳐버림',
      'display: flex 대신 inline-flex를 써야 해서'
    ],
    ans: 2,
    ex: '<strong>flex-basis: 100%</strong>는 각 아이템이 부모 너비 전체를 기본 크기로 잡습니다. 여기에 <strong>flex-shrink: 0</strong>을 주면 줄어들지 않아 모든 li가 100% 너비로 넘쳐버립니다. shrink를 1로 두거나 basis를 조정해야 합니다.'
  },
  {
    cat: '오류 찾기',
    q: '수직 가운데 정렬을 하려 했는데 작동하지 않습니다. 원인은?',
    code: `<span class="sel">.box</span> {
  <span class="kw">display</span>: <span class="val">flex</span>;
  <span class="kw">justify-content</span>: <span class="val">center</span>; <span class="cm">/* ← 여기를 수정해야 */</span>
  <span class="kw">height</span>: <span class="val">300px</span>;
}`,
    hint: 'row 방향에서 justify-content는 가로 정렬입니다.',
    opts: [
      'height 값이 없어서',
      'display: flex 대신 display: block을 써야 해서',
      'row 방향에서 justify-content는 가로(메인축) 정렬이므로 수직 가운데는 align-items: center로 해야 함',
      'center 값이 잘못됨'
    ],
    ans: 2,
    ex: '<strong>flex-direction: row</strong>(기본)일 때 <strong>justify-content</strong>는 가로(메인축) 정렬입니다. 수직(교차축) 가운데 정렬은 <strong>align-items: center</strong>로 해야 합니다.'
  },
  {
    cat: '오류 찾기',
    q: '핀텐 예제처럼 section 안 요소들을 가로로 나열하고 사이 간격을 주려 합니다. 잘못된 속성은?',
    code: `<span class="sel">section</span> {
  <span class="kw">display</span>: <span class="val">flex</span>;
  <span class="kw">justify-content</span>: <span class="val">space-between</span>;
  <span class="kw">margin-gap</span>: <span class="val">20px</span>; <span class="cm">/* ← 잘못된 속성 */</span>
}`,
    hint: 'flex에서 간격을 주는 올바른 속성명은 따로 있습니다.',
    opts: [
      'justify-content 값이 잘못됨',
      'margin-gap은 존재하지 않는 속성, 올바른 속성은 gap (또는 column-gap)',
      'display: flex 대신 display: grid를 써야 함',
      'section에 width가 없어서'
    ],
    ans: 1,
    ex: '<strong>margin-gap</strong>은 존재하지 않는 속성입니다. flex에서 아이템 사이 간격을 줄 때는 <strong>gap</strong>, <strong>column-gap</strong>, <strong>row-gap</strong>을 사용합니다. 핀텐 예제에서도 column-gap: 20px로 카드 사이 간격을 줬습니다.'
  }
];
