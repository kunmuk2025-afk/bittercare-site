# V18 변경 파일 목록

V17을 기준으로 한 변경 내역입니다.

## 추가 파일

- `dog-personality-test.html` — 강아지 성격 테스트·기질 검사 전용 검색 페이지
- `assets/css/personality-seo.css` — 신규 페이지 전용 반응형 스타일
- `assets/img/personality-types-v18.png` — 성격 테스트 대표 이미지
- `CHANGELOG_V18.md` — V17 대비 변경 파일 기록

## 수정 파일

- `index.html`
  - 제목, 설명, 검색 키워드, Open Graph 및 Twitter 메타데이터 보강
  - PC·모바일 메뉴에 성격 테스트 링크 추가
  - 신규 전용 페이지로 연결되는 안내 띠 추가
  - 페이지 버전 표시를 V18로 변경
- `assets/css/layout-wide.css`
  - 메인 페이지의 성격 테스트 안내 띠 반응형 스타일 추가
  - 안내 띠의 NEW 표시를 제거하고 PC 중앙 정렬·모바일 한 줄 표시로 수정
- `dog-personality-test.html`
  - 홈 성향 체크 영역의 이미지로 교체
  - 성격과 물어뜯기 성향을 함께 안내하도록 문구 보강
  - 물어뜯기 안내를 자연스럽고 정다운 문어체로 수정
- `assets/css/personality-seo.css`
  - 교체 이미지 비율에 맞춰 PC·모바일 크기 최적화
- `admin/index.html`
  - 누적 고유 식별값과 기술 설명을 제거
  - 최근 30일 방문, 인기 페이지, 답변 필요 문의, 운영 체크 중심으로 재구성
- `assets/js/admin-v14.js`
  - 최근 30일 합계·인기 콘텐츠·7일 평균 비교·문의 대응 안내 계산 추가
  - 일부 카드 요소가 없을 때 통계 전체 로딩이 중단되던 오류 방지 처리
- `assets/css/admin-v14.css`
  - 운영 체크 카드와 긴 인기 페이지 이름의 반응형 스타일 추가
- `sitemap.xml`
  - `https://www.bittercare.com/dog-personality-test.html` 등록
- `_worker.js`
  - 신규 페이지의 방문 집계를 허용하도록 경로 검증 규칙 추가
- `README.md`
  - V18 구성과 신규 SEO 페이지 설명 반영

## 유지된 항목

## 2026-10-04 캐시 오류 수정

- `index.html`의 안내 띠 CSS 버전값을 갱신해 중앙 정렬 스타일이 즉시 반영되도록 수정
- `admin/index.html`의 관리자 CSS·JS 버전값을 갱신해 이전 스크립트로 인한 `textContent` 오류를 해결
- `dog-personality-test.html`의 전용 CSS와 대표 이미지 버전값 갱신

## 2026-10-04 메인 영상 성격 테스트 배너

- `index.html` 메인 영상 위에 무료 강아지 성격 테스트 배너 추가
- `assets/css/layout-wide.css`에 PC 플로팅 카드와 모바일 가로형 카드 스타일 추가
- 기존 `assets/img/quiz-puppy-v10.png`를 배너 이미지로 재사용
- 배너 전체 클릭 시 `dog-personality-test.html`로 이동

## 2026-10-11 네이버 상품 구매 링크

- 전체 한국어·영어·일본어·베트남어·중국어 페이지의 구매 창에서 네이버 스마트스토어 항목을 5M과 10M 상품으로 분리
- 5M 상품을 `products/13634440161`로 연결
- 10M 상품을 `products/13634441238`로 연결
- 구매 창을 지원하지 않는 구형 브라우저의 기본 이동 주소는 5M 상품으로 변경

기존 랜딩 영상, 다국어 페이지, 관리자 기능, 문의 API, 제품 구매 기능과 V17의 기존 디자인 자산은 그대로 유지했습니다.
