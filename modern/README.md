# Blue Renaissance CMS — React + D1

라이브 사이트: https://frontend-lab.rhee.life · 관리자: https://frontend-lab.rhee.life/admin

서비스 UI는 **React 19**로, 로그인·강의·문제·성적·권한은 **Cloudflare Workers + D1**으로 구성됩니다.

- 기존 HTML 강의 **44개** 이관 완료. 실제 학습 화면은 React `/learn/:slug`.
- 원본 퀴즈 자료를 D1 **19개 세트/243개 문항**으로 이관. React `/practice/:slug`에서 서버 채점.
- Blue Renaissance CMS는 **강의별 리치텍스트 편집**, **문제 세트 및 문항별 편집**, **초안/게시/복원**, **학생별 통계**, **창조자 전용 관리자 임명**을 제공합니다.
- 옛 수업별 HTML·정답 JavaScript는 운영 저장소에서 삭제하고 `archive/legacy-courses-20261109` 브랜치에 보존했습니다.
- 정적 파일은 React 앱 번들, SVG·이미지, 최초 로딩용 `index.html`뿐입니다.
- Google 로그인, 관리자 비밀번호 검증, 비공개 학생 기록은 계속 서버 API가 처리합니다.

[전체 시스템 관계도](../../docs/blue-renaissance-system-map.svg) · [전환 기록](docs/REACT_D1_REBUILD.md) · [RBAC](docs/CREATOR_RBAC.md).
