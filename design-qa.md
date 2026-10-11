# V18 Hero Personality Banner — Design QA

- Source visual truth: `C:\Users\ADMIN\Downloads\비터케어 강아지 습관 케어 랜딩페이지.png`
- Implementation: `http://127.0.0.1:4175/index.html`
- Viewports: desktop 1680×940 CSS px; mobile 390×844 CSS px
- Source pixels: 1680×940
- Implementation capture: in-app browser at 1680×940, device scale 1
- State: hero visible, video playing, personality banner at default state

## Full-view comparison evidence

The reference and browser-rendered implementation were reviewed together at 1680×940. The implementation preserves the reference hierarchy: centered announcement strip, left hero copy, full-bleed video, upper-right white personality banner, and four supporting cards below. The banner sits clear of the hero title and the video subject.

## Focused region comparison evidence

The hero banner was checked at desktop and mobile breakpoints. Desktop size is 394×170 px at the upper right. Mobile size is 343×115 px and overlaps the video edge by 24 px, matching the intended floating-card treatment without hiding controls or causing horizontal overflow.

## Required fidelity surfaces

- Fonts and typography: existing Pretendard hierarchy retained; banner uses a clear badge, title, supporting copy, and arrow with no truncation.
- Spacing and layout rhythm: banner radius, padding, image-to-copy gap, elevation, and responsive overlap match the reference direction.
- Colors and visual tokens: warm white card, dark navy text, and green free badge align with the BitterCare palette.
- Image quality and asset fidelity: uses the existing high-resolution `quiz-puppy-v10.png` asset; circular crop remains sharp at both breakpoints.
- Copy and content: banner clearly communicates that the test is free and covers 16 personality types plus chewing tendencies.

## Findings

- No actionable P0, P1, or P2 findings.
- P3: the existing puppy asset differs from the white puppy shown in the reference, but it is an intentional reuse of the current BitterCare asset set and remains visually consistent.

## Interaction verification

- Entire banner is keyboard-focusable and clickable.
- Banner navigates to `dog-personality-test.html` successfully.
- Desktop and mobile horizontal overflow: none.
- Browser console warnings/errors: none.

## Comparison history

- Initial implementation passed the blocking comparison. No P0/P1/P2 correction loop was required.

final result: passed
