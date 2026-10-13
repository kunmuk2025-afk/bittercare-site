# BitterCare Homepage V19

GitHub 및 Cloudflare Pages 배포용 정적 홈페이지입니다. V18을 기준으로 FAQ와 5M·10M 구매 디자인을 수정하고 기존 성향 체크·마무리 디자인을 복원했습니다. 무음 반복 영상과 관리자·문의 기능, 다국어 페이지를 포함합니다. V18 대비 변경 파일은 CHANGELOG_V19.md를 확인하세요.

## 포함된 구성

- 한국어 및 영어·일본어·중국어·베트남어 페이지
- 반응형 이미지, 아이콘, 최적화된 메인 영상
- 관리자 페이지와 방문자·문의 API용 Cloudflare Worker
- Cloudflare Pages 설정 파일과 D1 초기화 SQL
- 검색엔진 설정 및 네이버 사이트 소유 확인 파일
- 강아지 성격 테스트·기질 검사 전용 검색 페이지

## 배포

저장소 루트가 이 폴더가 되도록 GitHub에 업로드한 뒤 Cloudflare Pages와 연결합니다. 별도의 빌드 명령이나 출력 폴더는 필요하지 않습니다.

관리자 및 문의 기능을 사용하려면 Cloudflare D1 바인딩 `VISITOR_DB`와 관리자 환경 변수 `ADMIN_USER`, `ADMIN_PASSWORD_HASH`를 설정하고 다음 SQL을 적용해야 합니다.

- `visitor-schema.sql`
- `admin-schema.sql`

비밀번호나 환경 변수 값은 GitHub 저장소에 직접 올리지 마세요.

## 제외된 항목

V16의 QA 캡처·브라우저 캐시, 디자인 작업 기록, 이전 버전 안내서, 작업용 이미지 맵, 실제 페이지에서 참조하지 않는 구형 에셋은 제외했습니다.
