# 저장소 독립 운영 및 Fork 관계 해제 결과

작성일: 2026-11-09. GitHub 설정에서 사용자가 **Leave fork network를 직접 완료한 뒤**, GitHub 및 Cloudflare API로 검증한 운영 기록입니다. 이 문서의 커밋은 Fork 메타데이터를 변경하지 않으며, 실제 연결 해제는 GitHub 설정 기능으로 처리되었습니다.

## 0. 연결 해제 성공 검증 (2026-11-09)

| 확인 항목 | 검증된 상태 |
| --- | --- |
| 저장소 | `hslcrb/frontend-lecture_hslcrb` |
| GitHub `fork` | **`false`** |
| GitHub `parent`, `source` | **둘 다 없음** |
| GitHub 저장소 ID | **`1374351563` — 변경 없음** |
| 기본 브랜치 | **`main` 유지** |
| 브랜치 | `main` 및 2개의 기존 개발 브랜치 유지 |
| 코드·문서 | 원본 `index.html`, 현대화 Worker 소스, README 및 제작 문서 존재 확인 |
| Cloudflare Workers Builds | 저장소 ID `1374351563`, 브랜치 `main`, 루트 `modern/frontend` 유지 |
| 배포 확인 | Fork 해제 후 실행된 빌드에서 **12개 테스트 통과, 배포 성공** 확인. 버전 `dfff98b9-f66a-42a3-aa40-7ab6aa3e7577` |
| 도메인 | `frontend-lab.rhee.life` → `frontend-lab-web` Worker 유지 |

**결과:** GitHub의 Fork 네트워크에서 공식 분리되었고 Git 커밋과 배포 연결도 유지되었습니다. 이후 새로운 커밋의 빌드·배포는 별도 로그를 확인해야 합니다. 학생 로그인·교사 비밀번호·메일 복구는 자동 빌드 결과만으로 검증 완료가 되지 않습니다.

## 1. 운영 주체와 역할

- **GitHub 코드 저장소 소유·유지보수:** `hslcrb/frontend-lecture_hslcrb`
- **Cloudflare 인프라 소유:** 해당 `hslcrb` 계정의 Cloudflare 계정. Worker `frontend-lab-web`, D1 `frontend-lab-cms`, 도메인 `frontend-lab.rhee.life`
- **교육 콘텐츠·학습 운영 관리자:** `spacejh72@gmail.com`으로 Google 로그인한 교사. 추가 관리자 비밀번호와 세션 검증이 필요함
- **학생:** 이메일 화이트리스트 없이 Google 로그인 후 별도 이름 등록. Google 로그인 없는 익명 접근은 불허
- **원래 콘텐츠 출처:** `JJinMangGo/frontend-lecture`. GitHub 연결 해제 뒤에도 원작자·기여자·기존 커밋 저작권 표시와 출처를 지우지 않음

운영 방향은 **인프라 운영자가 서비스를 제공하고 교사가 교육 콘텐츠를 관리하는 호스팅형 서비스**입니다. 실제 서비스 제공·수익·책임 관계를 정하는 계약까지 체결되었다는 의미는 아니며, 필요하다면 별도 서면 동의를 받아야 합니다.

## 2. 왜 Fork 관계를 분리하는가

원작자의 저장소와 현재 서비스는 운영 구조, 배포 경로, 데이터 저장 및 사용자 인증이 다릅니다. 현재 사이트는 원본 GitHub Pages가 아니라 운영자 자신의 Cloudflare Workers로 배포됩니다. 향후 원본에 PR을 보내거나 자동 Upstream Sync를 수행하는 것이 현재 서비스 운영의 필수 요소는 아닙니다.

**공개(Public) 저장소가 곧 자유롭게 재배포·상용화할 수 있는 허락을 뜻하지는 않습니다.** 원본 저장소의 명시적 라이선스를 확인하지 못했다면 기존 강의 자료를 계속 호스팅·복제·변경하는 부분은 원저작자에게 사용 범위를 확인하는 것이 좋습니다. '독립 운영'과 '저작권 양도'는 별개입니다.

## 3. GitHub에서 사용자가 실행한 공식 분리 절차 (참고용)

GitHub 문서: https://docs.github.com/en/pull-requests/how-tos/work-with-forks/detaching-a-fork

2026-11-09 사전 점검 결과:

- 공개 저장소, 크기 약 13MB (제한 1GB 미만)
- 하위 Fork 수 0개
- 연결한 계정에 저장소 관리자 권한 있음
- 연결 원본: `JJinMangGo/frontend-lecture`

위 조건을 확인한 뒤 사용자가 **Leave fork network**를 직접 실행했습니다. 사후 API에서 `fork: false`와 상위 저장소 연결이 없음을 확인했습니다.

1. https://github.com/hslcrb/frontend-lecture_hslcrb/settings 로 이동합니다.
2. **General → Danger Zone → Leave fork network**를 선택합니다.
3. 경고·영향을 읽고 **I have read and understand these effects**를 누릅니다.
4. 확인 요청에 지정된 저장소 이름을 입력합니다.
5. **Leave fork network**를 최종 선택합니다.

**중요:** GitHub 공식 안내에 따르면 이 기능은 **되돌릴 수 없고**, 기존 Fork에 연결된 이슈, PR, 위키, 스타, 워치, 댓글 및 기타 저장소 메타데이터가 유지되지 않을 수 있습니다. 반면 Git 커밋 이력은 유지됩니다. 저장소를 삭제했다가 새로 만드는 방식은 사용하지 않습니다.

## 4. 해제 후 반드시 검증할 점

| 대상 | 확인할 사항 |
| --- | --- |
| GitHub | `fork: false`, `parent` 필드 없음 |
| GitHub `main` | 모든 현대화 코드, 원본 교육자료, 문서·커밋 유지 |
| GitHub 저장소 ID | 이전 값 `1374351563`과 비교. 변경되면 Cloudflare Workers Builds의 GitHub 연결 재설정 필요 |
| GitHub 브랜치 | 기존 개발/설계 브랜치가 유지되었는지 확인 |
| Cloudflare Builds | `frontend-lab-web`가 저장소 `main`을 계속 추적하는지 확인 |
| Cloudflare 배포 | 새 커밋에서 자동 빌드가 작동하고 `frontend-lab.rhee.life` 접속 가능 |
| D1 | `frontend-lab-cms`에 학생·콘텐츠·교사 인증 테이블/데이터 유지 |
| 교사 운영 | Google 로그인·비밀번호 2차 인증 및 이메일 복구 사용 가능 여부 별도 검증 |

GitHub의 Fork 해제는 Cloudflare D1의 데이터를 옮기거나 인프라 소유자를 바꾸는 작업이 아닙니다. 다만 GitHub 저장소의 내부 ID나 연결 메타데이터가 달라지면 **Cloudflare 자동 빌드 연계가 재인증·재설정 필요할 수 있으므로**, 분리 뒤 재검증해야 합니다.

## 5. 완료 기준

**완료:** GitHub API에서 `fork: false`, `parent` 없음, 저장소 ID 유지, `main` 및 기존 개발 브랜치 보존을 확인했습니다. Cloudflare Workers Builds 저장소 연결·브랜치도 유지되었고, 해제 이후 빌드 로그에서 배포 성공과 12/12 테스트 통과를 확인했습니다.

원본 강의 자료의 출처 표기와 원저작권 존중은 Fork 해제 이후에도 유지합니다.
