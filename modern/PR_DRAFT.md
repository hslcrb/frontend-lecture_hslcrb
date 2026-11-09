# PR 초안 — **제출하지 않음**

제안 제목: `feat: optional React + Cloudflare Free lesson portal with Google Access and D1 CMS`

기존 Frontend Lab의 UI와 원본 강의·퀴즈 파일을 변경하지 않고, 별도 `modern/` 디렉터리에 React·무료 Cloudflare Workers/D1 구현을 제공합니다.

### 변경 내용
- React 강의실·학생 이름 등록 UI(원본 디자인·수업 URL 유지).
- Google OAuth를 Cloudflare Access로 강제(교사 별도 허용 목록).
- D1 학생 프로필(로그인 계정과 학생 이름 별도 저장).
- D1 무료 CMS: 원본 HTML/CSS/JS 초안·게시·숨김·롤백.
- 31개의 직접 만든 SVG 교체 아이콘.
- 유료 Workers/Payload/R2는 현재 버전에서 제외하고 Supabase 무료 옵션만 유지.
- 문서·단위 테스트 및 원본 CSS/JS 자동 동기화 스크립트 추가.

### 의도적 미포함
- Payload CMS 상시 호스팅(Workers Paid/R2 필요).
- CMS 미디어 파일 업로드 및 고급 WYSIWYG.
- 원본 GitHub Pages 도메인 변경.
- Google OAuth 및 Cloudflare Access 실제 계정 생성/비밀키 설정(사용자의 콘솔 작업 필요).
- 선생님에게 PR 생성(사용자의 최종 승인 전 금지).

### 합병 전 확인
정식 Google OAuth 연동, Access 정책, D1 CRUD, 수업 31개 이상 브라우저 검증, 교사 검토 및 운영/개인정보 안내.

원저작권: JJinMangGo. 임의 라이선스를 지정하지 않습니다.
