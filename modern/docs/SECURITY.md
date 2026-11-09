# 무료 버전 보안·개인정보

1. **Cloudflare Access Google 로그인** — 실서비스는 Google을 유일한 IdP로 제한하고 학생/교사 명시적 허용 목록으로 인증합니다. OTP, Everyone 정책을 사용하지 않습니다.
2. **서버 JWT 재검증** — Workers는 Cloudflare Access의 RS256 서명과 issuer, audience를 확인하고 검증된 email/sub만 사용합니다. 관리 권한은 `ADMIN_EMAILS` 정확한 이메일 목록을 추가 확인합니다. 누락된 비밀 설정에는 접근을 허용하지 않습니다.
3. **별도 학생 이름** — 로그인 통과 뒤에도 student_name을 요구합니다. 등록 전 강의 HTML/JS/CSS/이미지는 403. 기본 저장소는 D1입니다.
4. **원본 유지** — 선생님의 기존 HTML·CSS·JS 파일은 GitHub에 남습니다. CMS 게시본이 있을 때만 D1에서 덮어씌우고, 없으면 원본을 제공합니다.
5. **D1 CMS 쓰기** — /api/admin/content POST는 관리자 권한뿐 아니라 동일 Origin 및 X-Frontend-Lab 헤더를 요구합니다. SQL은 prepared statements 사용. 버전은 이전 게시 상태의 스냅샷으로 저장돼 롤백 가능합니다.
6. **내부 환경변수** — Access AUD/도메인은 Worker 환경변수, 교사 이메일 허용 목록은 비밀 설정에 보관. Supabase 키는 선택 사용 시에만 서버에 보관. Google OAuth secret은 Cloudflare 설정 화면에만 입력.
7. **공개 URL 차단** — `workers_dev=false`, `preview_urls=false`. 사용자에게 접근 가능한 도메인/Access 정책이 구비되기 전에는 서비스를 공개하지 않습니다.
8. **개인정보 최소화** — 학생 JWT sub·검증된 이메일·입력 이름·생성/수정 시각만 저장. 배포 전에 학교/관리자의 수집 목적·보유 기간·열람·정정·삭제 정책과 필요시 법정대리인 통지를 검토하세요.
9. **유의할 한계** — CMS의 HTML/JS를 게시할 수 있는 교사는 학생 브라우저에 실행되는 코드를 바꿀 수 있습니다. 관리자 권한은 교사에게만 부여하고 실제 브라우저에서 검수하세요. 브라우저 테스트가 끝나기 전까지 운영 완료라 단정하지 않습니다.
10. **원본 사이트** — 기존 GitHub Pages 호스팅은 별개이며 새 Cloudflare Access로 보호되지 않습니다. 선생님의 원본을 임의로 비공개화하지 않습니다.

Cloudflare D1: https://developers.cloudflare.com/d1/
Cloudflare Access Workers: https://developers.cloudflare.com/workers/configuration/cloudflare-access/
