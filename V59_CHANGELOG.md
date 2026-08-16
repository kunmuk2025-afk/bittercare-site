# BitterCare Web App V59 변경사항

## 1. 3일 기록 복구
- `비터케어 사용 중이에요` 진입 시 활성 세션이 없으면 DAY 1 세션을 자동 생성하도록 변경했습니다.
- 완료된 기록/ARCHIVE가 있어도 기록 편집 화면을 가리지 않도록 변경했습니다.
- 서버 세션 생성이 실패하면 빈 ARCHIVE만 노출하지 않고 오류 안내와 `다시 시작하기` 버튼을 표시합니다.
- 이전 배포 DB에 observation 테이블이 누락된 경우를 대비해 `/api/program` 진입 시 3일 기록 스키마를 `CREATE TABLE/INDEX IF NOT EXISTS` 방식으로 보강합니다.

## 2. 기질 체크 4가지 핵심성향 표현 개선
- 역문항 계산 구조는 유지합니다.
- 결과 화면에서 큰 숫자 점수 노출을 줄이고 `매우 낮음 / 낮음 / 보통 / 높음 / 매우 높음` 등급과 시각적 막대로 표현합니다.
- 공유 이미지에도 4가지 핵심성향을 2×2 미니 카드 형태로 자동 반영합니다.
- 결과 화면과 공유 이미지가 동일한 내부 점수를 사용합니다.

## 3. SNS 공유 구조 개선
- 단일 Web Share 버튼을 플랫폼별 Bottom Sheet로 변경했습니다.
- 카카오톡: Kakao JavaScript SDK + Feed 공유 카드 + `우리 아이도 해보기` 클릭 링크를 적용했습니다.
- Instagram: 결과 이미지를 파일 공유 우선으로 전달하며 이미지 하단 `app.bittercare.com`을 유지합니다.
- 링크 복사: `?ref=copy&type=...` 유입 추적 파라미터를 포함합니다.
- 다른 앱: 이미지 대신 클릭 가능한 URL 공유를 우선해 링크가 사라지는 문제를 줄였습니다.
- 카카오 공유 URL: `?ref=kakao&type=temperament|chewing`

## Kakao 설정
- Kakao JavaScript SDK 도메인: `https://app.bittercare.com`
- Product Link Web Domain: `https://app.bittercare.com`
- V59에는 현재 BitterCare Default JavaScript Key가 연결되어 있습니다.

## 검증 메모
이 작업 환경은 외부 npm registry DNS가 차단되어 있어 `npm ci`/`npm run build` 전체 빌드를 완료할 수 없었습니다. 대신 변경된 독립 TypeScript 모듈(`share-card.ts`, `temperament-profiles.ts`)은 TypeScript 정적 검사를 통과했고, `page.tsx`에는 TypeScript parser 기준 JSX syntax error가 없음을 확인했습니다. 배포 전 GitHub/Cloudflare 빌드에서 최종 `npm run build`를 확인해 주세요.
