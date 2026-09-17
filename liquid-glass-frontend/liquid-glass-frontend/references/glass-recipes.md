# 유리 표면 레시피 (필터 · 레이어 · 폴백)

## 레이어 규칙

`filter` 는 새 합성 레이어와 containing block 을 만든다. 그래서 부모에 `filter`, 자식에 `backdrop-filter` 를 걸면 자식이 블러할 배경이 사라지고 Safari 에서는 아예 깨진다 ([Carmen Ansio](https://www.carmenansio.com/lab/liquid-glass)). 항상 세 레이어로 분리한다:

1. `.lg__backdrop` - 배경만 굴절/블러
2. `.lg__sheen` - 스펙큘러/캐스틱 (`mix-blend-mode: screen`)
3. `.lg__content` - 필터 없는 선명한 텍스트

## 모드 A - 프로스트 (`.lg--frost`, 모든 브라우저)

- `backdrop-filter: blur(14px) saturate(175%) brightness(1.06)` + `-webkit-` 프리픽스. `saturate` 를 100%로 낮추면 유리가 "더러운 플라스틱"이 된다. blur 가 색을 평균내며 채도를 빼앗기 때문이다 ([dev.to 정리](https://dev.to/devyatov/liquid-glass-on-the-web-6-ways-to-build-it-with-css-and-svg-3m07)).
- 틴트는 흰색 7~8%. 0%면 판이 사라지고 15%↑면 두께감 대신 불투명감이 생긴다.
- 림은 border 하나가 아니라 방향별 inset 하이라이트: 위 0.5 / 아래 0.26 ([webtricks](https://webtricks.dev/blog/liquid-glass-css)).
- `backdrop-filter` 는 2024년 9월부터 주요 브라우저 공통 지원 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter)).
- 배경을 미리 알 수 없는 경우(스크롤 콘텐츠 위 내비/시트, 동적 이미지)는 이 모드만 쓴다.

## 모드 B - 렌즈 굴절 (`.lg--lens`)

**중요(실측):** `backdrop-filter: url(#filter)` 는 파싱은 통과하고 `CSS.supports` 도 `true` 를 주지만 Chromium 에서 실제 굴절이 적용되지 않았다(격자 배경이 전혀 휘지 않음). 그래서 이 스킬은 **배경 클론 + 요소 `filter`** 로 간다. `filter: url(#…)` 는 요소에 걸면 정상 동작한다.

구조:

```css
.lg--lens .lg__backdrop {
  background-color: var(--lg-bg-color);
  background-image: var(--lg-bg-image);
  background-size: 100vw 100vh;                 /* 페이지 배경과 같은 좌표계 */
  background-position: calc(-1 * var(--lg-x, 0px)) calc(-1 * var(--lg-y, 0px));
  filter: url(#lg-lens) blur(6px) saturate(130%) brightness(1.01);
}
```

- `background-attachment: fixed` 는 쓸 수 없다. `filter` 가 걸린 요소 안에서는 뷰포트 기준을 잃는다. 대신 요소의 `getBoundingClientRect()` 를 `--lg-x/--lg-y` 로 넣어 역오프셋한다(`assets/glass-component.html` 의 `syncLenses`, scroll/resize 에서 rAF 1회 갱신).
- 클론 보정은 약하게. `saturate 175% / brightness 1.06` 을 렌즈 모드에 그대로 쓰면 판 안쪽만 밝아져 "다른 이미지를 붙인 것"처럼 보인다. 130% / 1.01 이 실측 기준점이다.
- 페이지 배경이 `<img>`/`<canvas>`/비디오라면 같은 소스를 `.lg__backdrop` 안에 복제하고 동일한 오프셋 규칙을 적용한다. 복제가 불가능하면 모드 A 로 내린다.

### 변위맵을 노이즈로 만들지 말 것

`feTurbulence` 를 바로 물리는 예제가 흔하지만 결과는 렌즈가 아니라 흔들리는 물결이다. 실제 유리는 매끈한 표면이고 굴절은 가장자리에서 최대, 중앙에서 0으로 사라진다 ([Carmen Ansio](https://www.carmenansio.com/lab/liquid-glass)). `feTurbulence` 는 "젖은 잉크/왜곡된 워터마크" 같은 별개 아트 디렉션일 때만 쓴다.

렌즈 맵은 `scripts/gen_glass_maps.py` 로 생성한다. `feDisplacementMap` 은 R 채널을 X, G 를 Y 변위로 읽고 128이 무변위이며 채널당 8비트라 범위는 -128~127px ([kube.io](https://kube.io/blog/liquid-glass-css-svg)). 스크립트는 squircle 베젤 `y = ⁴√(1 − (1 − x)⁴)` 프로파일로 평면-곡면 전이를 가장 부드럽게 만든다.

```svg
<filter id="lg-lens" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">
  <feImage href="glass/displacement-420x220.png" x="0" y="0" width="420" height="220" result="map"/>
  <feDisplacementMap in="SourceGraphic" in2="map" scale="34"
    xChannelSelector="R" yChannelSelector="G"/>
</filter>
```

- `feImage` 의 width/height 는 표면의 실제 CSS 픽셀 크기와 일치해야 한다. 크기가 변하는 표면은 `ResizeObserver` 로 맵을 재생성하거나 모드 A 로 내린다.
- `feImage` 는 `file://` 에서 로드되지 않는다. 반드시 HTTP 로 서빙해 확인한다(굴절이 통째로 사라지면 이 원인을 먼저 의심).
- `scale` 은 굴절 세기. `min(w,h)/6` 부터 시작해 텍스트가 판독 불가해지기 직전에서 멈춘다. `scale` 애니메이션으로 맵 재계산 없이 굴절을 페이드할 수 있다. 부호를 뒤집으면 볼록↔오목.
- 필터 영역을 `-25% / 150%` 로 넓게 잡는다. 좁으면 변위가 가장자리 픽셀을 끌어와 투명한 틈이 생긴다.
- 필터 id 는 인스턴스마다 고유해야 한다. 같은 id 를 재사용하면 두 번째 인스턴스가 자기 파라미터를 무시한다.

### 캐스틱 림

가장 밝은 링은 베젤이 가장 급하게 휘는 지점이다. `gen_glass_maps.py` 가 함께 내보내는 `specular-*.png` 를 `feImage` → `feGaussianBlur(1)` → `feComposite`/`feBlend` 로 굴절 결과 위에 올린다 ([LogRocket](https://blog.logrocket.com/how-create-liquid-glass-effects-css-and-svg/)). SVG 없이 갈 때는 `.lg__sheen` 의 radial+linear 그라디언트가 대체한다.

## 성능

- 유리 표면은 화면당 1~3개. 스크롤하는 큰 면 전체에 굴절 필터를 걸면 저사양에서 FPS 가 무너진다 ([webtricks](https://webtricks.dev/blog/liquid-glass-css)).
- 필터 문자열을 매 프레임 다시 쓰지 않는다. CSS 변수 + `transform`/`opacity` 로 움직이고 갱신은 `requestAnimationFrame` 안에서 프레임당 1회.
- 굴절 표면 안에 세로 스크롤 콘텐츠를 넣지 않는다.
- 모바일에서는 blur 를 60~70%, `scale` 을 절반으로 줄인다.

## 캔버스 픽셀 주의

이미지를 캔버스로 읽어 맵을 만드는 경우, 프리뷰 iframe 은 opaque origin 이라 `getImageData()` 가 `SecurityError` 를 던진다. `img.src` 지정 **전에** `img.crossOrigin = 'anonymous'` 를 설정하고 try/catch 폴백을 둔다.
