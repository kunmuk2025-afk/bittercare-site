# 2026-10-12 첨부 디자인 반영 및 소비자 사용성 검토

## 수정 파일

- index.html: 영상 섹션의 제목·설명·사용 단계·버튼 문구를 첨부 디자인에 맞춤. 재생 버튼 및 표지 이미지 추가. CSS·JS 캐시 버전 갱신.
- assets/css/review-story.css: 큰 제목, 민트 배경, 3개 단계 카드, 둥근 영상 프레임, 원형 재생 버튼, PC 2열·모바일 세로 배치.
- design-qa.md: 이번 참조 디자인 비교 및 검증 기록.

## 추가 파일

- assets/js/review-story.js: 재생 버튼, 재생 상태에 따른 버튼 표시, 원본 영상 비율 유지.
- assets/img/review-background-v18.jpg
- assets/img/review-poster-design-v18.jpg
- assets/img/review-step-paw-v18.jpg
- assets/img/review-step-cut-v18.jpg
- assets/img/review-step-press-v18.jpg
- assets/img/review-icon-paw-v18.jpg
- assets/img/review-icon-cut-v18.jpg
- assets/img/review-icon-press-v18.jpg
- assets/img/review-play-v18.jpg
- UPDATE_20261012_DESIGN.md

## 자산 제작

참조: 사용자가 제공한 비터케어 가구 케어 영상 섹션.png.
내장 이미지 생성 도구로 UI 글자·버튼·제어 표시를 제거한 자산 마스터와 배경을 제작하고, 영상 표지·단계 카드·아이콘을 추출했습니다. 재생 아이콘은 참조에서 추출했습니다.
프롬프트 요약 1: 원래 좌표와 색을 유지하고 모든 텍스트·버튼·영상 제어 표시를 제거, 사진·단계 아이콘·장식 보존.
프롬프트 요약 2: 사진 프레임과 단계 카드를 제거, 민트·크림 배경과 잎·발바닥·하트 장식만 보존.
원본 생성 파일은 사용자 .codex/generated_images 경로에 보관됩니다. 실제 홈페이지 자산은 위 assets/img 경로에 저장했습니다.
표지는 실제 광고영상의 첫 프레임이 아니므로 연출 이미지임을 캡션으로 안내합니다. 재생 파일 assets/video/bittercare-review-v18.mp4는 이전에 제공받은 실제 광고영상을 유지합니다.

## 검증

PC 1536px, 모바일 390px·320px에서 확인. 신규 영역 가로 넘침 없음. 재생 버튼·네이버 5M/10M 구매 모달·제품 자세히 보기·사용 가이드 이동 확인. 영상 720×1280, 11.51초 재생, 콘솔 오류 없음.
첨부 이미지와 실제 구현을 나란히 비교한 자료는 V18_UX_검토_20261012/14-reference-comparison.jpg에 기록했습니다.

## 소비자 사용성 검토

홈 첫 화면·성향 체크·FAQ·구매 창·제품 이야기·사용 가이드·사용 전 확인 화면을 확인했습니다.
전체 보고서 및 화면은 상위 홈페이지 폴더의 V18_UX_검토_20261012/소비자_사용성_검토.md에 있습니다.
주요 개선안: FAQ·적합성 판단을 구매 전에, 성향 체크를 구매 선택 뒤 짧은 선택 안내로 배치. 반복 검사 진입점 정리. 실제 규격에 근거한 5M/10M 선택 안내.
전체 섹션 순서 변경은 이번 디자인 수정에 포함하지 않았습니다. 사용자 요청의 검토 결과로 제시합니다.
