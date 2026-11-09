/* Original quiz questions, answers, hints and explanations */
window.QUIZ_CONFIG = {"subject":"CSS","title":"CSS 배경 속성 퀴즈"};
window.QUIZ_DATA = [
  {
    cat: 'background-repeat',
    q: '<code>background-repeat: repeat-x</code>를 적용하면 배경 이미지가 어떻게 반복되나요?',
    hint: 'x축은 가로 방향, y축은 세로 방향입니다.',
    code: null,
    opts: [
      '가로 방향으로만 반복된다',
      '세로 방향으로만 반복된다',
      '가로, 세로 모두 반복된다',
      '반복 없이 한 번만 표시된다'
    ],
    ans: 0,
    ex: 'repeat-x는 x축(가로) 방향으로만 반복됩니다. 세로 반복은 repeat-y, 반복 없음은 no-repeat, 기본값은 repeat(가로세로 모두 반복)입니다.'
  },
  {
    cat: 'background-attachment',
    q: '<code>background-attachment: fixed</code>와 기본값의 차이는?',
    hint: '스크롤할 때 배경 이미지가 어떻게 움직이는지 생각해보세요.',
    code: 'body {\n  background-attachment: fixed;\n  /* 기본값은 scroll */\n}',
    opts: [
      'fixed는 배경이 요소에 고정되어 스크롤해도 움직이지 않고, scroll은 페이지와 함께 움직인다',
      'fixed는 배경이 페이지와 함께 스크롤되고, scroll은 고정된다',
      'fixed는 배경 이미지를 고정 크기로 만들고, scroll은 반응형으로 만든다',
      '차이가 없다'
    ],
    ans: 0,
    ex: 'background-attachment: fixed는 배경이 뷰포트에 고정되어 스크롤해도 배경이 움직이지 않는 패럴랙스 효과를 만듭니다. 기본값인 scroll은 배경이 콘텐츠와 함께 스크롤됩니다.'
  },
  {
    cat: 'background-size',
    q: '<code>background-size: cover</code>의 동작으로 올바른 것은?',
    hint: 'cover는 요소를 빈틈없이 덮는 것이 목표입니다.',
    code: 'div {\n  width: 500px;\n  height: 500px;\n  background-size: cover;\n}',
    opts: [
      '이미지를 원본 크기로 표시한다',
      '이미지 전체가 요소 안에 들어오도록 축소한다',
      '이미지가 잘리더라도 요소를 빈틈없이 채운다',
      '이미지를 요소 너비에 맞게 늘리고 세로는 auto로 처리한다'
    ],
    ans: 2,
    ex: 'cover는 가로세로 비율을 유지하면서 요소를 빈틈없이 채웁니다. 이미지 비율과 요소 비율이 다르면 이미지 일부가 잘릴 수 있습니다. 썸네일이나 배경 이미지에 가장 많이 쓰이는 값입니다.'
  },
  {
    cat: 'background-size',
    q: '<code>background-size: contain</code>의 동작으로 올바른 것은?',
    hint: 'contain은 이미지 전체가 보이는 것이 목표입니다.',
    code: null,
    opts: [
      '이미지가 잘리더라도 요소를 빈틈없이 채운다',
      '이미지 전체가 요소 안에 보이도록 맞추며 빈 공간이 생길 수 있다',
      '이미지를 요소 크기에 맞게 강제로 늘린다',
      '이미지를 원본 크기 그대로 표시한다'
    ],
    ans: 1,
    ex: 'contain은 이미지 비율을 유지하면서 이미지 전체가 요소 안에 보이도록 맞춥니다. cover와 달리 이미지가 잘리지 않지만, 요소와 이미지 비율이 다르면 여백(빈 공간)이 생길 수 있습니다.'
  },
  {
    cat: 'background-position',
    q: '<code>background-position: 50% 50%</code>과 동일한 값은?',
    hint: '키워드로도 같은 위치를 표현할 수 있습니다.',
    code: '.bg {\n  background-position: 50% 50%;\n  /* 이것과 동일한 표현은? */\n}',
    opts: [
      'left top',
      'right bottom',
      'center center',
      'left center'
    ],
    ans: 2,
    ex: 'background-position에서 50% 50%는 가로 50%, 세로 50% 위치, 즉 정중앙을 의미합니다. 이는 center center와 동일합니다. left=0%, center=50%, right=100%로 대응됩니다.'
  },
  {
    cat: 'background 단축',
    q: 'background 단축 표기에서 <code>background-size</code>를 포함할 때 반드시 함께 써야 하는 속성은?',
    hint: '슬래시(/)를 사이에 두고 함께 작성합니다.',
    code: 'div {\n  background: url(img/cat1.jpg) no-repeat scroll 0 0 / auto;\n  /*                                        ↑position / ↑size */\n}',
    opts: [
      'background-repeat',
      'background-attachment',
      'background-position',
      'background-color'
    ],
    ans: 2,
    ex: 'background 단축 표기에서 background-size를 쓰려면 반드시 background-position을 먼저 쓰고 슬래시(/)로 구분해야 합니다. 예: center / 60px → position: center, size: 60px.'
  },
  {
    cat: 'background 단축',
    q: '아래 단축 표기에서 생략 가능한 속성끼리 묶인 것은?',
    hint: '기본값인 속성은 생략할 수 있습니다.',
    code: 'background: transparent url(img/cat1.jpg) no-repeat scroll 0 0 / auto;',
    opts: [
      'url(img/cat1.jpg), no-repeat',
      'transparent, scroll, 0 0, auto',
      'no-repeat, url(img/cat1.jpg)',
      'transparent, url(img/cat1.jpg)'
    ],
    ans: 1,
    ex: 'background의 기본값은 color: transparent, repeat: repeat, attachment: scroll, position: 0 0, size: auto 입니다. 이 기본값들은 생략 가능합니다. 수업 코드처럼 background: url(img/cat1.jpg) no-repeat; 처럼 필요한 것만 써도 됩니다.'
  },
  {
    cat: 'background-image',
    q: '배경 이미지와 배경 색상을 동시에 지정하면 어떻게 표시되나요?',
    hint: '이미지가 색상보다 위 레이어에 존재합니다.',
    code: 'div {\n  background-color: rgb(168, 142, 211);\n  background-image: url(img/figma_logo.svg);\n}',
    opts: [
      'background-color만 표시되고 이미지는 무시된다',
      'background-image가 background-color 위에 표시된다',
      'background-color가 background-image 위에 표시된다',
      '두 속성이 충돌해서 아무것도 표시되지 않는다'
    ],
    ans: 1,
    ex: 'background-image는 background-color보다 위 레이어에 렌더링됩니다. 배경 이미지가 투명한 영역이 있거나 no-repeat일 때 이미지가 없는 부분에 배경 색상이 보이게 됩니다. 수업의 원형 프로필 예제처럼 함께 활용하면 좋습니다.'
  },
  {
    cat: '접근성',
    q: 'CSS background-image로 넣은 이미지의 접근성 문제는?',
    hint: '스크린리더기는 CSS 배경 이미지를 어떻게 처리할까요?',
    code: '<!-- CSS 배경 이미지 -->\n<a href="#" class="bg"></a>\n\n<!-- img 태그 -->\n<img src="img/logo.svg" alt="피그마로고">',
    opts: [
      '배경 이미지도 alt 속성을 쓸 수 있어 접근성 문제가 없다',
      '스크린리더기가 배경 이미지를 읽을 수 없어 시각 장애인이 내용을 파악하기 어렵다',
      'background-image는 img 태그보다 로딩이 느려 성능 문제가 생긴다',
      '배경 이미지는 모바일에서만 접근성 문제가 발생한다'
    ],
    ans: 1,
    ex: '스크린리더기(화면 낭독 프로그램)는 CSS background-image를 읽지 못합니다. 따라서 의미 있는 이미지(로고, 아이콘 등)는 <img> 태그에 alt 속성을 붙여 사용해야 합니다. 장식용 이미지에만 배경 이미지를 사용하는 것이 권장됩니다.'
  },
  {
    cat: 'background-size',
    q: '원형 프로필 영역에 로고 이미지를 배경으로 넣되, 이미지 크기를 <code>60px</code>로 고정하고 정중앙에 배치하려면?',
    hint: '단축 표기로 position과 size를 함께 쓸 수 있습니다.',
    code: '.profile {\n  width: 120px;\n  height: 120px;\n  border-radius: 50%;\n  background: rgb(168, 142, 211) url(img/logo.svg) no-repeat ??? / ???;\n}',
    opts: [
      'left top / 60px',
      'center / 60px',
      '50px 50px / auto',
      'center / cover'
    ],
    ans: 1,
    ex: '정중앙 배치는 position: center(= 50% 50%), 크기 고정은 size: 60px을 사용합니다. 단축 표기로 center / 60px처럼 position / size 순서로 씁니다. 수업 코드의 .bg 예제와 동일한 패턴입니다.'
  }
];
