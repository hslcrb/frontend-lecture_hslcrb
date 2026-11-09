# Blue Renaissance — 관리자 비밀번호 최초 설정 오류 수정 (2026-11-09)

## 증상

창조자 계정 `sea35652@gmail.com`으로 Google 로그인 후 `/admin`에서 관리자 비밀번호 최초 설정을 누르면 화면에 **“서버 데이터베이스 연결 상태를 확인해 주세요.”**가 나타남.

## 실제 확인

- Cloudflare Access 인증을 통해 관리자 최초 설정 화면에 진입했음.
- D1 `lab_teacher_credentials`, `lab_teacher_sessions` 테이블 정의는 정상.
- 오류 보고 시점, 비밀번호 해시 레코드 **0건**, 세션 레코드 **0건**.
- 따라서 기존 비밀번호를 지우거나 초기화할 필요가 없었음.
- 서버 구현은 모든 비밀번호 설정·로그인·재설정 때 Worker에서 PBKDF2-SHA256 **120,000회**를 수행했음.
- Cloudflare Workers Free는 요청당 **10ms CPU 한도**가 있으므로 이 고비용 연산이 중단을 유발했을 가능성이 높음. 로그에서 정확한 런타임 예외를 입수하지 못했으므로 단정하지 않음.

## 해결 방식

### 기존 구조 (문제 가능성이 있는 부분)

브라우저 → 비밀번호 원문 제출(HTTPS) → 무료 Worker에서 PBKDF2 120,000회 → D1 해시/세션 저장.

### 변경 구조

브라우저 → Google Access JWT 확인 → Worker에서 사용자별 128비트 무작위 salt + **서명된 10분 챌린지** 발급 → **브라우저에서 PBKDF2-SHA256 120,000회 계산** → TLS로 파생 증명값 제출 → Worker에서 계정에 바인딩된 **서버 비밀키 HMAC-SHA256** 검증값 생성 → D1 저장.

- PBKDF2 작업량 **120,000회 유지**. 서버로 계산만 이전했을 뿐 반복 횟수를 임의로 낮추지 않음.
- D1에는 비밀번호 원문·브라우저의 PBKDF2 파생키 자체를 저장하지 않음. 서버 HMAC 검증값과 salt, 반복 횟수, hash_scheme만 저장.
- 12시간 관리자 세션의 Secure, HttpOnly, SameSite=Strict 속성을 유지.
- 기존 창조자/선생님/임명 관리자 권한 검사 및 Google 인증 유지.
- 임의 사용자/다른 Google 계정의 최초 설정 챌린지를 재사용하지 못하도록 JWT 계정(subject·email)과 챌린지를 묶음.
- 비밀번호 재설정에도 서명된 별도 `reset` 챌린지를 사용, 기존 유효성 검사와 기존 세션 무효화 유지.
- 장기적으로 해시를 복구할 수 없는 문제가 생기지 않도록 서버 HMAC 비밀키 `AUTH_PEPPER`는 **Cloudflare Secret**으로만 저장하고 Wrangler `keep_vars`를 활성화.
- 기존 서버 PBKDF2 레코드의 호환 처리도 유지하지만, 무료 환경에서 그 방식의 CPU 한도를 넘는 기존 계정은 이메일 재설정을 통해 새 형식으로 변경해야 할 수 있음.
- 복구 메일 송수신은 Cloudflare에서 해당 이메일 주소가 인증된 경우에만 정상 동작.

### 위협 모델 주의

브라우저에서 생성된 PBKDF2 결과는 전송 시 **로그인용 비밀값과 동등한 민감정보**이므로 TLS 외부에 노출하거나 브라우저/서버 로그에 출력하면 안 됨. 서버는 HMAC 키를 코드에 저장하지 않고 Secret으로 보관합니다. 이 구현은 소규모 무료 교육 서비스에서 **Google 로그인 + 2차 비밀번호**를 제공하기 위한 방식으로, 전문 인증 제품의 보안 감사를 대체하지는 않습니다.

## 변경 파일

- `modern/frontend/worker/teacher-auth.ts`: 서버 서명 챌린지와 서버 비밀키 기반 검증, 무료 런타임 오류 처리.
- `modern/frontend/src/TeacherGate.tsx`: 브라우저 PBKDF2 연산.
- `modern/frontend/migrations/0006_client_kdf_admin.sql`: `hash_scheme` 컬럼 추가.
- `modern/frontend/wrangler.jsonc`: `AUTH_PEPPER` Secret 요구와 `keep_vars` 보호.
- `modern/frontend/tests/teacher-free-kdf.test.mjs`: 실제 KDF·챌린지·인증 세션 로직 테스트.

## 운영 검증 항목

- D1 migration 적용 확인.
- Cloudflare Secret `AUTH_PEPPER`이 배포 이후에도 존재하는지 확인.
- Cloudflare 자동 테스트, TypeScript, Vite 빌드 및 Worker 배포 성공 확인.
- 실제 창조자 계정에서 비밀번호 최초 설정·로그아웃·재로그인 확인.
- 메일 인증 이후 선생님/창조자의 비밀번호 재설정 확인.

**비밀번호 원문, PBKDF2 파생 증명값, 세션 토큰 및 HMAC Secret은 문서에 저장하지 않음.**
