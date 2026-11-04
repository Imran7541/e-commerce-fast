# Implementation Tasks: Panjabi Brand Update & New Products Section Polish

Feature: Update Panjabi product images to "EM-BRAND", localize section title to "New Products" in English, and remove the star/sparkle badge icon
Branch: main

## Phase 1: Setup & Asset Backup
- [x] T001 Backup original Panjabi product images in `data/backup_original_panjabis/`
- [x] T002 Verify coordinate offsets and typography specifications for the 3 Panjabi variants (Green, Blue, White)

## Phase 2: User Story 1 - Garment Brand Update on Panjabi Images (P1)
- [x] T003 [P] [US1] Apply seamless fabric patch and render "EM-BRAND" on Green Panjabi in `src/public/uploads/1790641675186_3baf66_WhatsApp_Image_2026-09-23_at_10_04_11_PM.jpg` and `data/uploads/`
- [x] T004 [P] [US1] Apply seamless fabric patch, underline ornament, and render "EM-BRAND" on Navy Blue Panjabi in `src/public/uploads/1790641675628_fb6ead_WhatsApp_Image_2026-09-235_at_10_04_11_P.jpg` and `data/uploads/`
- [x] T005 [P] [US1] Apply seamless fabric patch and render "EM-BRAND" on White Panjabi in `src/public/uploads/1790641675919_40760c_WhatsApp_Image_20265-09-23_at_10_04_11_P.jpg` and `data/uploads/`

## Phase 3: User Story 2 - Section Title English Localization (P2)
- [x] T006 [US2] Update translation mapping for "New Arrivals" and "new arrivals" to "New Products" in `src/public/assets/bn-B9K_tnSb.js`
- [x] T007 [US2] Update default section title from "New Arrivals" to "New Products" in `src/public/assets/index-BIdHCx7F.js` and `src/public/assets/index.js`

## Phase 4: User Story 3 - Star / Sparkle Icon Removal (P3)
- [x] T008 [US3] Remove the star/sparkle icon container span from the New Products `<h2>` header in `src/public/assets/index-BIdHCx7F.js`
- [x] T009 [US3] Remove the star/sparkle icon container span from the New Products `<h2>` header in `src/public/assets/index.js`

## Phase 5: Verification & Quality Gate
- [x] T010 Verify HTTP 200 delivery and content length for updated Panjabi images via curl
- [x] T011 Run automated integration test suite (`npm test`) to confirm 13/13 tests pass
- [x] T012 Update `notes/PROJECT_STATE.md` and `notes/AGENT_HANDOVER.md`

## Phase 6: Version Control
- [x] T013 Git commit and push all changes to GitHub repository `origin main`
