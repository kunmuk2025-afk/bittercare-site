# V18 변경 파일 목록

V17을 기준으로 한 변경 내역입니다.

## 추가 파일

- `dog-personality-test.html` — 강아지 성격 테스트·기질 검사 전용 검색 페이지
- `assets/css/personality-seo.css` — 신규 페이지 전용 반응형 스타일
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
- `assets/css/admin-v14.css`
  - 운영 체크 카드와 긴 인기 페이지 이름의 반응형 스타일 추가
- `sitemap.xml`
  - `https://www.bittercare.com/dog-personality-test.html` 등록
- `_worker.js`
  - 신규 페이지의 방문 집계를 허용하도록 경로 검증 규칙 추가
- `README.md`
  - V18 구성과 신규 SEO 페이지 설명 반영

## 유지된 항목

기존 랜딩 영상, 다국어 페이지, 관리자 기능, 문의 API, 제품 구매 기능과 V17의 기존 디자인 자산은 그대로 유지했습니다.
