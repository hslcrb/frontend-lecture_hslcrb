/* Original quiz questions, answers, hints and explanations */
window.QUIZ_CONFIG = {"subject":"CSS","title":"CSS 웹폰트 · 텍스트 스타일링 퀴즈"};
window.QUIZ_DATA = [
  {
    type: 'mc',
    q: '다음 중 <code>@font-face</code>에서 가변(Variable) 폰트를 선언할 때 <code>font-weight</code>를 올바르게 지정한 것은?',
    opts: [
      'font-weight: bold;',
      'font-weight: 400;',
      'font-weight: 100 900;',
      'font-weight: normal;'
    ],
    answer: 2,
    explain: '가변 폰트는 하나의 파일로 여러 굵기를 지원합니다. <code>font-weight: 100 900;</code>처럼 범위로 선언해야 모든 굵기 값을 사용할 수 있습니다.'
  },
  {
    type: 'mc',
    q: '<code>font-display: swap;</code>의 역할로 가장 적절한 것은?',
    opts: [
      '폰트 크기를 자동으로 조정한다',
      '웹폰트 로딩 전 시스템 폰트를 먼저 보여주고, 로딩 후 교체한다',
      '폰트 색상을 투명하게 유지한다',
      '폰트가 완전히 로드될 때까지 텍스트를 숨긴다'
    ],
    answer: 1,
    explain: '<code>font-display: swap</code>은 웹폰트가 아직 로드되지 않았을 때 시스템 폰트를 먼저 렌더링하고, 웹폰트 로드 완료 후 교체(swap)합니다. 사용자가 빈 화면 대신 텍스트를 먼저 볼 수 있습니다.'
  },
  {
    type: 'mc',
    q: '한 줄 말줄임(<code>…</code>)을 구현하기 위해 반드시 함께 사용해야 하는 CSS 3가지 조합은?',
    opts: [
      'overflow: hidden + display: flex + text-overflow: ellipsis',
      'overflow: hidden + white-space: nowrap + text-overflow: ellipsis',
      'white-space: nowrap + word-break: keep-all + text-overflow: ellipsis',
      'overflow: hidden + line-height: 1 + text-overflow: ellipsis'
    ],
    answer: 1,
    explain: '한 줄 말줄임의 필수 세트: <code>overflow: hidden</code>으로 넘침 숨기기 + <code>white-space: nowrap</code>으로 줄바꿈 방지 + <code>text-overflow: ellipsis</code>로 말줄임 표시.'
  },
  {
    type: 'mc',
    q: '긴 한국어 본문에서 단어 중간에서 줄이 잘리는 현상을 방지하는 CSS 속성은?',
    opts: [
      'white-space: nowrap',
      'overflow: hidden',
      'word-break: keep-all',
      'text-overflow: clip'
    ],
    answer: 2,
    explain: '<code>word-break: keep-all</code>은 한국어·중국어·일본어에서 단어 단위로만 줄바꿈이 일어나도록 하여, 어색한 음절 분리를 방지합니다.'
  },
  {
    type: 'mc',
    q: '여러 줄 말줄임(3줄 제한)을 위한 CSS 핵심 속성 조합으로 올바른 것은?',
    opts: [
      'overflow: hidden + -webkit-line-clamp: 3 + display: -webkit-box + -webkit-box-orient: vertical',
      'overflow: scroll + max-height: 80px + text-overflow: ellipsis',
      'white-space: nowrap + -webkit-line-clamp: 3 + overflow: hidden',
      'display: flex + flex-wrap: wrap + overflow: hidden'
    ],
    answer: 0,
    explain: '여러 줄 말줄임은 <code>display: -webkit-box</code>, <code>-webkit-box-orient: vertical</code>, <code>-webkit-line-clamp: N</code>, <code>overflow: hidden</code> 4가지가 세트입니다.'
  },
  {
    type: 'mc',
    q: '<code>line-height: 1.8</code>과 동일한 의미를 가지는 값은?',
    opts: [
      'line-height: 18px',
      'line-height: 180%',
      'line-height: 1.8em (항상 동일)',
      'line-height: 1800%'
    ],
    answer: 1,
    explain: '<code>line-height: 1.0</code>과 <code>100%</code>는 같습니다. 따라서 <code>1.8</code>은 <code>180%</code>와 동일한 의미입니다. <code>px</code> 단위는 폰트 크기 변경 시 비율이 깨져 권장하지 않습니다.'
  },
  {
    type: 'short',
    q: '글자와 글자 사이의 간격을 조절하는 CSS 속성 이름을 영문으로 쓰시오. (단위: px, em, % 사용 가능)',
    answer: 'letter-spacing',
    explain: '<code>letter-spacing</code>은 자간(글자 간격)을 설정합니다. 양수는 간격을 넓히고, 음수는 좁힙니다.'
  },
  {
    type: 'short',
    q: '<code>@font-face</code>에서 웹폰트 파일 경로와 형식을 지정하는 속성은 무엇인가요? (영문으로 작성)',
    answer: 'src',
    explain: '<code>@font-face</code> 안에서 <code>src: url(...) format(...);</code>로 폰트 파일 경로와 포맷(woff2, woff2-variations 등)을 지정합니다.'
  },
  {
    type: 'mc',
    q: '다음 중 수업에서 언급된 테크 기업에서 많이 사용하는 한국어 웹폰트는?',
    opts: [
      'Noto Sans KR',
      'Pretendard',
      'SUIT',
      'Apple SD Gothic Neo'
    ],
    answer: 2,
    explain: '수업 내용에 따르면 <strong>SUIT(SUITE)</strong>는 테크 기업에서 많이 사용하는 한국어 폰트입니다. Pretendard는 범용 웹폰트, Noto Sans KR은 구글 웹폰트입니다.'
  },
  {
    type: 'short',
    q: '텍스트가 부모 박스 너비를 넘어갈 경우 줄바꿈 없이 한 줄로 유지하는 CSS 속성과 값을 작성하시오. (예: 속성: 값)',
    answer: 'white-space: nowrap',
    explain: '<code>white-space: nowrap</code>을 적용하면 텍스트가 부모 요소의 너비를 넘어도 줄바꿈이 발생하지 않습니다. 한 줄 말줄임 구현 시 필수입니다.'
  }
];
