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

## Phase 7: Shop Page Catalog & /api/products/browse Restoration (P1)
- [x] T014 Diagnose `/shop` "0 products" root cause in `ShopView-DFBAFI87.js` (unmatched `/api/products/browse` route returning 404)
- [x] T015 Download missing 11th product asset (`1793700384053_7d66cf_1792562397380_a5c3d7_IMG_8455.webp`) into `src/public/uploads/` and `data/uploads/`
- [x] T016 Insert "Test Prodcut" (ID 39, Groceries ID 40, price ৳230, salePrice ৳190) into SQLite database, `products_summary.json`, and `products_details.json`
- [x] T017 Implement `/api/products/browse` route with pagination, filtering (category, brand, search, price range, inStock, flashSale, newArrival, sorting) and dynamic facets calculation (`total`, `categories`, `brands`, `price`) in `src/routes/public.js` before `/api/products/:id`
- [x] T018 Fix `data/seed.js` foreign key handling during re-seeding (`PRAGMA foreign_keys = OFF / ON`)
- [x] T019 Add automated test for `/api/products/browse` in `tests/api.test.js` (14/14 tests passing)
- [x] T020 Verify `/api/products/browse` and `/shop` on live server (`http://localhost:5050`) via curl and browser checks
- [x] T021 Update `notes/PROJECT_STATE.md` and `notes/AGENT_HANDOVER.md`

## Phase 8: Foundational & Database Brand Entity (US1)
- [x] T022 [US1] Create active brand entity "EM-BRAND" (slug: "em-brand") in SQLite database `brands` table and update `data/extracted_backend_data/brands.json`
- [x] T023 [US1] Associate all 5 Men's Fashion products (IDs 22, 24, 25, 26, 30) and 5 Women's Fashion products (IDs 31, 32, 33, 34, 35) with `brand_id = 1` in `data/ecommerce.sqlite`
- [x] T024 [US1] Update `data/extracted_backend_data/products_summary.json` and `products_details.json` with `brandId: 1`, `brandName: "EM-BRAND"`, and `brandSlug: "em-brand"`

## Phase 9: Garment Image Customization on Men's T-Shirts (US2)
- [x] T025 [P] [US2] Backup original T-shirt product images in `data/backup_original_tshirts/`
- [x] T026 [P] [US2] Patch legacy "S BRAND" chest embroidery on Product 25 (Blue zip polo) and render "EM-BRAND" in `src/public/uploads/1790641672220_1233d5_WhatsApp_Image_2026-09-23_at_10_04_06_PM.jpg` and `data/uploads/`
- [x] T027 [P] [US2] Patch legacy "S BRAND" chest pocket text & collar label on Product 26 (Maroon shirt) and render "EM-BRAND" in `src/public/uploads/1790641670782_328974_WhatsApp_Image_2026-09-23_6at_10_04_09_P.jpg` and `data/uploads/`

## Phase 10: Verification & Quality Gate
- [x] T028 Verify `/api/brands` and `/api/products/browse` facet counts (`brands: { "1": 10 }`) via curl
- [x] T029 Update and run automated integration test suite (`npm test`) to verify EM-BRAND attribution
- [x] T030 Update `notes/PROJECT_STATE.md` and `notes/AGENT_HANDOVER.md`
- [x] T031 Git commit and push all changes to GitHub repository `origin main`

## Phase 11: Halal 3D Ghost Mannequin Saree Enforcement & Cache Busting (P1)
- [x] T032 [US3] Copy pristine 3D ghost mannequin images to new unique paths (`saree_3d_ghost_31_blue.jpg` to `35_maroon.jpg` and `gallery.jpg`) in `src/public/uploads/` and `data/uploads/`
- [x] T033 [US3] Overwrite all legacy saree filenames (`imgi_9_4`, `imgi_18_3-1`, `imgi_19_4-1`, `imgi_12`, `imgi_16`, `imgi_21_6`) with the full-res 3D ghost mannequin images
- [x] T034 [US3] Update SQLite database `products` table for Category 37 (IDs 31-35) with the new 3D ghost mannequin paths in both `image` and `images` array (removing any secondary girl images)
- [x] T035 [US3] Update `data/extracted_backend_data/products_summary.json` and `products_details.json` with the new 3D ghost mannequin image paths
- [x] T036 [US3] Configure `src/server.js` static `/uploads` handler with `Cache-Control: no-cache, no-store, must-revalidate` to prevent any browser cache persistence
- [x] T037 Run automated test suite (`npm test`) to verify all 15 tests pass with new image paths
- [x] T038 Verify HTTP 200 delivery for all 3D ghost mannequin images and verify `/api/products/browse`
- [x] T039 Update `notes/PROJECT_STATE.md` and `notes/AGENT_HANDOVER.md`
- [x] T040 Git commit and push all changes to GitHub repository `origin main`

## Phase 12: Customer Reviews Customization with Real User Imagery (P1)
- [x] T041 Backup original review card images in `data/backup_original_reviews/`
- [x] T042 [P] [US4] Process and generate 4 high-resolution (1200x1201) Customer Review Cards featuring user's real customer photos (`customer_review_1.jpg` to `4.jpg`)
- [x] T043 [P] [US4] Deploy raw customer avatars and composited review cards to `src/public/uploads/` and `data/uploads/`
- [x] T044 [US4] Overwrite legacy review image files (`imgi_302`, `imgi_304`, `imgi_303`, `imgi_306`, `imgi_307`) with the new customer review card assets
- [x] T045 [US4] Update `review_images_config` in SQLite database `settings` table with the 4 new customer review items
- [x] T046 [US4] Update `data/extracted_backend_data/settings.json` and SSR hydration script in `src/public/index.html`
- [x] T047 Verify HTTP 200 delivery of all review card images and check `/api/settings` response
- [x] T048 Update automated test in `tests/api.test.js` to verify 4 customer reviews in `/api/settings` and run `npm test`
- [x] T049 Update `notes/PROJECT_STATE.md` and `notes/AGENT_HANDOVER.md`
- [x] T050 Git commit and push all changes to GitHub repository `origin main`
