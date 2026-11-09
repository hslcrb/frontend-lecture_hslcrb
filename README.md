# Frontend Lab — 원본 강의와 무료 클라우드 확장판

이 저장소는 현재 **독립된 공개 GitHub 저장소**입니다. 처음에는 [JJinMangGo/frontend-lecture](https://github.com/JJinMangGo/frontend-lecture)의 Fork로 시작했으나, 2026년 11월 9일 GitHub의 **Leave fork network** 기능을 통해 관계를 공식 해제했습니다. 기존 강의 자료의 출처와 원저작권을 유지하며, 원본 화면과 파일 경로를 보존하는 **React + Cloudflare Workers Free + D1** 버전을 함께 담고 있습니다.

**실제 사이트:** https://frontend-lab.rhee.life

**CMS 내부 제품명:** **Blue Renaissance** — 선생님 관리자 대시보드, 학생 통계, 강의 콘텐츠·퀴즈 편집 시스템.
기존 수업 HTML **44개 원본을 D1 강의 라이브러리에도 저장**해 CMS 수정본과 분리 관리하고, CSS·JS·이미지 등 실행 에셋은 Cloudflare 정적 배포를 유지합니다.

[Blue Renaissance CMS 아키텍처·로고 적용 안내](modern/docs/BLUE_RENAISSANCE.md)

## 두 개의 구역

| 경로 | 용도 |
| --- | --- |
| 저장소 최상위 `index.html` · `ai/` · `flex/` · `grid/` · `quiz/` 등 | 선생님 원본 강의·문제·디자인·JavaScript 자료. 무단 재설계하지 않습니다. |
| [`modern/`](modern/README.md) | React 학생 화면, Google Access, 별도 이름 등록, 무료 D1 CMS와 교사 전용 비밀번호 인증 |
| [`modern/frontend/`](modern/frontend/) | Cloudflare Workers에 빌드 및 배포하는 실제 웹 애플리케이션 |
| [`modern/docs/`](modern/docs/) | 전체 제작 일지, 시스템 설계, 운영 가이드, 검증 결과와 보안 문서 |

## 핵심 원칙

- 원본 강의 사이트의 디자인·퀴즈 기능·경로를 보존하고, 빌드할 때 원본을 **복사**하여 새로운 사이트에 포함합니다.
- 일반 사용자는 **Google 로그인만** 있으면 접근 정책상 계정을 제한하지 않습니다. 강의를 읽기 전 **학생 이름을 별도로 등록**합니다.
- 교사 관리자 화면은 지정한 Google 계정에 비밀번호 인증을 추가합니다. 비밀번호 원문과 재설정 토큰 원문은 D1에 저장하지 않습니다.
- 원본 강의 HTML 44개와 CMS 수정본을 각각 D1에 보관합니다. 수정본 우선, D1 원본 다음, 정적 원본 최종 폴백으로 제공합니다. CSS·JS·이미지는 정적 에셋을 유지합니다.
- 유료 Payload CMS나 R2를 요구하지 않는 **무료 플랜 우선** 아키텍처입니다.
- GitHub Actions는 사용하지 않고 **Cloudflare Workers Builds**로 자동 배포합니다.
- 선생님 원저작권을 존중합니다. 공개 저장소라고 해서 저작물에 임의로 오픈소스 라이선스를 부여하지 않습니다.

## 창조자·선생님 관리자 권한

- **0순위 창조자:** `sea35652@gmail.com` — 전체 CMS 관리 + 가입 계정의 관리자 임명·박탈.
- **1순위 선생님:** `spacejh72@gmail.com` — 강의·퀴즈·학생 학습 관리.
- **2순위 임명 관리자:** 창조자가 권한을 부여한 계정만 CMS 접근 가능.
- **일반 학생:** 마이페이지와 본인 성적만 이용.

초기 대시보드 접근 가능 계정은 **창조자와 선생님 두 계정**입니다. 모두 Google 인증과 개인별 관리자 비밀번호가 필요합니다. 관리자 임명·박탈은 [권한 관리 설계](modern/docs/CREATOR_RBAC.md)에서 확인할 수 있습니다.

Blue Renaissance CMS에는 [사용자가 제공한 실제 SVG 로고](modern/frontend/public/ui/blue-renaissance-logo.svg)가 반영되었습니다.

## 제작 기록과 운영 문서

1. [2026-11-09 전체 제작 과정 기록](modern/docs/DEVELOPMENT_HISTORY.md) — 요구사항, 주요 결정, 시행착오, GitHub·Cloudflare 실제 작업.
2. [시스템 설계와 데이터 흐름](modern/docs/ARCHITECTURE.md) — 인증, React, Workers, D1, 편집 이력, 기존 파일과의 결합 방식.
3. [운영·배포·복구 실행서](modern/docs/OPERATIONS.md) — Cloudflare 연결, 환경변수, 데이터 보존, 롤백, 교사 인수인계.
4. [검증 결과와 미해결 사항](modern/docs/VALIDATION.md) — 실제로 확인한 테스트와 아직 확인하지 못한 흐름.
5. [독립 운영·Fork 관계 해제 결과](modern/docs/INDEPENDENT_OPERATIONS.md) — 공식 해제 성공, 저장소 ID·브랜치·Cloudflare 자동 배포 검증.
6. [2026-11-09 main 병합 보고서](modern/docs/RELEASE_2026-11-09.md) — 병합 SHA·변경 범위·Cloudflare 감시 브랜치 검증.
7. [배포 설정](modern/docs/DEPLOYMENT.md) / [보안·개인정보](modern/docs/SECURITY.md).

> **주의:** Worker 빌드·배포 성공이나 12개 자동 테스트 통과만으로 실제 Google 로그인, 첫 교사 비밀번호 설정, 메일 재설정 및 전 강의 브라우저 검증 완료를 의미하지 않습니다. 교사 메일 수신 주소 인증 및 학교 운영·개인정보 고지가 남아 있습니다.

## 로컬 개발

```bash
cd modern/frontend
npm install
npm test
npm run db:local
npm run dev
npm run build
```

Node.js, npm 및 Cloudflare Wrangler가 필요합니다. 원본 GitHub 저장소 전체가 같은 체크아웃에 있어야 합니다. 세부 설정은 운영 문서를 참고하세요.

### 저장소 간 관계

- **선생님 공식 원본:** [JJinMangGo/frontend-lecture](https://github.com/JJinMangGo/frontend-lecture).
- **독립 운영 저장소:** [hslcrb/frontend-lecture_hslcrb](https://github.com/hslcrb/frontend-lecture_hslcrb) (`fork: false`, 원본 네트워크 관계 해제).
- **원본 저장소로의 Pull Request:** 별도 승인 전까지 생성하지 않습니다. 이 프로젝트의 `main` 병합은 **독립된 본 저장소 내부의 병합**입니다.

_기록 작성일: 2026-11-09, KST. 이 문서는 민감한 API 키·비밀번호·학생 개인정보를 포함하지 않습니다._
