# Frontend Lab — 무료 Cloudflare 아키텍처

본 폴더는 [JJinMangGo/frontend-lecture](https://github.com/JJinMangGo/frontend-lecture)의 **기존 디자인과 31개 HTML 강의·퀴즈 페이지를 그대로 유지**하면서 React + Cloudflare Workers Free + D1으로 동적화하는 선택형 구현입니다.

## 무료 버전 구조

| 구성요소 | 역할 | 비용 |
| --- | --- | --- |
| `modern/frontend` React 19 + Vite | 메인 홈, 학생 이름 등록, 관리자 페이지 | Workers Free 한도 내 무료 |
| Cloudflare Access + Google OAuth | **필수 Google 로그인**과 허용 계정 정책 | Access Free 조건 내 |
| JWT 서명 검사 | Worker에서 모든 요청의 인증을 이중 검증 | 별도 요금 없음 |
| Cloudflare D1 `frontend-lab-cms` | 학생 이름·원본 강의 HTML/CSS/JS 수정본·개정 이력 저장 | D1 Free 한도 내 무료 |
| 31개 직접 만든 SVG | 카드에 표시된 이모지 교체 | 무료 |
| Supabase | 무료 프로젝트를 별도로 확보하면 학생 이름 저장소로 전환하는 **선택 옵션** | Free 한도 내 |

**Payload CMS·R2·유료 Workers는 필수 구성에서 제외했습니다.** Payload는 공식 Cloudflare Next.js 배포에서 Workers Paid가 필요하므로, 지금은 D1 기반 자체 관리자 기능으로 대체합니다. 원래 디자인 변경은 하지 않습니다.

## 기능

- Google 로그인 후 **별도 학생 이름 2~40자** 필수 등록; 미등록 학생은 강의·퀴즈 파일 접근 불가.
- 선생님만 `/admin` 접근 가능 (Access signed JWT + `ADMIN_EMAILS` 정확한 이메일 허용 목록).
- HTML·HTM 강의, 퀴즈 문제 JavaScript, CSS에 대해 **초안 저장 → 게시 → 숨김 → 과거 게시본 복원** 가능.
- 수정하지 않은 원본 자료는 Github 파일 그대로 제공. 원본 파일을 변경하거나 덮어쓰지 않음.
- 원본 학습 자료 목록 자동 생성, 검색, HTML 샌드박스 미리보기.
- 관리 기능은 원본 강의 CSS 및 DOM 구조와 완전히 분리.
- HTML·JS·CSS는 텍스트 편집 중심. **이미지 파일 업로드/비주얼 WYSIWYG는 무료 버전의 범위 밖**이며 기존 GitHub 저장소에서 관리.

## GitHub 디렉터리

```
modern/
├─ frontend/
│  ├─ src/                React 홈 + 관리자 인터페이스
│  ├─ worker/             JWT 검증, 이름 등록, D1 CMS
│  ├─ migrations/         무료 D1 스키마
│  ├─ scripts/            원본 강의 링크·자료 동기화
│  ├─ public/ui/icons/    직접 제작한 아이콘 SVG 31개
│  ├─ tests/              Node 단위/정적 테스트
│  └─ wrangler.jsonc      D1 바인딩; 공개 workers.dev/preview 비활성화
├─ supabase/              선택적 Supabase 무료 연결 SQL
└─ docs/                  배포·보안·확인 문서
```

## 로컬 설치 (Node 22.12+ 추천)

```bash
cd modern/frontend
npm install
npm test
npm run db:local
npm run dev
npm run build
```

원본 저장소 체크아웃 루트에 `index.html`, `DESIGN.md`, `assets/css/tokens.css`가 있어야 합니다. 빌드 과정에서 복사하며 원본은 수정하지 않습니다.

**실제 Google 로그인 없이 운영 서비스를 여는 개발용 인증 우회 기능은 없습니다.** Zero Trust 설정이 완료되기 전까지 401/503 거부가 정상입니다.

## 배포 상태

Cloudflare D1 `frontend-lab-cms` **생성 완료**, 테이블 생성 및 합성 데이터 CRUD 테스트 완료(2026-11-09). 실제 배포는 **Google OAuth/Access 앱 설정 전까지 금지**합니다. GitHub 개발 브랜치만 반영되어 있습니다.

- [0원 배포·OAuth 설정](docs/DEPLOYMENT.md)
- [보안 및 학생 정보 보호](docs/SECURITY.md)
- [상위 저장소 제안문 — PR은 아직 보내지 않음](PR_DRAFT.md)

원저작자는 JJinMangGo입니다. 별도의 라이선스가 확인되지 않은 수업 자료에 임의의 라이선스를 부여하지 않습니다.
