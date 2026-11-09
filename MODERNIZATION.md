# Frontend Lab — 무료 클라우드 확장 프로젝트

프로젝트 진입: [README.md](README.md)  
사이트: https://frontend-lab.rhee.life  
실제 소스: [modern/README.md](modern/README.md)

## 개발과 운영
- [2026-11-09 전체 제작 과정](modern/docs/DEVELOPMENT_HISTORY.md)
- [시스템 설계와 D1 데이터 흐름](modern/docs/ARCHITECTURE.md)
- [운영·배포·복구](modern/docs/OPERATIONS.md)
- [실제 테스트와 남은 검증](modern/docs/VALIDATION.md)
- [보안 및 개인정보](modern/docs/SECURITY.md)

React + Cloudflare Workers Free + D1을 사용하고, Google 계정 로그인 후 학생 이름을 별도로 받습니다. 교사 `spacejh72@gmail.com` 계정에만 관리자 비밀번호 2차 인증을 적용합니다. 유료 Payload CMS/R2는 사용하지 않습니다.

**중요:** 기존 선생님 강의 소스·디자인은 원본 그대로 유지하고 `modern/`에서 확장합니다. Cloudflare 배포 성공과 실제 Google 로그인/교사 메일 복구·모든 퀴즈의 브라우저 검증은 별개의 단계입니다. 선생님 원본 저장소로의 PR은 허가 전까지 만들지 않습니다.
