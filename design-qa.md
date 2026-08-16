# BitterCare V56 design QA

- source visual truth paths:
  - `/workspace/scratch/faae2733530b/upload/57851268-2263-478c-83a9-4033a6c779c2.png`
  - `/workspace/scratch/faae2733530b/upload/5c9b1401-32a8-4885-9938-53581a07d8a5.png`
  - `/workspace/scratch/faae2733530b/upload/c315acc4-feed-4346-ac15-a3176db7eb35.png`
  - `/workspace/scratch/faae2733530b/upload/9a648b73-93b0-45a4-a7cb-1d00c5e1506b.png`
  - `/workspace/scratch/faae2733530b/upload/0399ed1c-e3a2-48ed-9f01-9b94fb819f95.png`
- implementation screenshot: cloud-browser inline capture of the live agent preview, captured 2026-08-15 UTC (`browser://bittercare-v56/home`)
- viewport: browser 1363 × 936 CSS px, app shell rendered at 430 CSS px, deviceScaleFactor 1
- source pixels: incremental references range from 460 × 116 to 512 × 318
- implementation pixels: viewport 1363 × 936; compared against the centered 430px app region at 1× density
- state: Korean home with saved Maltese profile “보리”; language control closed/open; 3-day gate

## Full-view comparison evidence

The browser-rendered home was visually inspected against the request references. The notification bell is absent. The four feature cards render in one vertical column and measured exactly 384 × 124 CSS px each. Their artwork is normalized to the same visual footprint. The tip character is fully visible and the date appears next to the tip title. The header shows the saved dog portrait/name and current language.

## Focused region comparison evidence

- Header: saved dog profile measured 80px wide on inner screens and visibly showed “보리”; language trigger measured about 96 × 40px and the opened menu listed 한국어, English, 中文, 日本語.
- Feature cards: all four DOM rectangles measured 384 × 124px; OX artwork was reduced to the same footprint as the other illustrations.
- Program gate: the full dog/logo art remained contained inside its panel, including the lower wordmark; computed animation was `bittercare-dog-wave`, duration `2.8s`, `object-fit: contain`.
- Console: no app-origin error was present. The only error was emitted by the browser inspection extension itself.

## Findings

- No actionable P0, P1, or P2 visual mismatch remains for the requested changes.
- P3: the supplied references use several crops and densities, so tiny optical differences in shadow softness remain acceptable.

## Required fidelity surfaces

- Fonts and typography: Noto Sans KR hierarchy is consistent; profile and language labels remain readable without truncating the Korean pet name.
- Spacing and layout rhythm: four cards share exact dimensions and aligned artwork/copy columns; mobile shell remains within 430px.
- Colors and visual tokens: blue, mint, violet, and pale-blue card tokens remain consistent with the supplied references.
- Image quality and asset fidelity: existing raster artwork and BitterCare logo assets are reused; no substitute inline illustration was introduced.
- Copy and content: bell copy/control removed, today date added, customer-selected pet name and image exposed in headers.

## Comparison history

1. Initial V56 preview: feature cards aligned, but the step-header profile compressed to the avatar only.
2. Fix: assigned an 80px fixed profile width (72px below 380px) and reduced competing header widths.
3. Post-fix evidence: browser capture visibly showed the dog portrait and “보리” together; all card measurements remained unchanged.

## Primary interactions tested

- Opened and closed the language selector; verified all four language choices.
- Entered a pet name, selected Maltese, started the temperament check, and verified the profile in the next screen header.
- Opened the 3-day program gate and verified contained artwork plus active animation.
- Verified the persisted pet selection survives page reload.

## Implementation checklist

- [x] Remove notification bell and modal.
- [x] Equalize all four home feature cards.
- [x] Add today’s localized date and fix tip-dog crop.
- [x] Add four-language dropdown with flags and names.
- [x] Persist and display selected dog/name across screens.
- [x] Preserve full program-gate wordmark and add reduced-motion-safe animation.
- [x] Add D1 assessment storage and admin inspection UI.

final result: passed
