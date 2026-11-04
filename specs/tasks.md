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

## Phase 13: Blog Post Image & Topic Alignment + Halal Enforcement (P1)
- [x] T051 Backup current blog posts from SQLite and JSON in `data/backup_blog_posts/`
- [x] T052 [P] [US5] Deploy new baby blanket image (`baby_blanket_care_guide.jpg`) to `src/public/uploads/` and `data/uploads/`
- [x] T053 [US5] Update Post 4 (Men's Jacket): Change title to "পুরুষদের ফ্যাশনে স্টাইলিশ জ্যাকেট ও উইন্টার ট্রেন্ড গাইড", slug to "পুরুষদের-ফ্যাশনে-স্টাইলিশ-জ্যাকেট-ও-উইন্টার-ট্রেন্ড-গাইড", category to "Men's Fashion", and update content to match men's jacket fashion in SQLite and JSONs
- [x] T054 [US5] Update Post 3 (Saree): Update cover image to 100% Halal 3D Ghost Mannequin `/uploads/saree_3d_ghost_32_purple.jpg` (removing old girl image), category to "Women's Fashion" in SQLite and JSONs
- [x] T055 [US5] Update Post 2 (Baby Blanket): Update cover image to `/uploads/baby_blanket_care_guide.jpg` (removing old saree girl image), change category from "Osan" to "Baby Care" in SQLite and JSONs
- [x] T056 [US5] Update `data/extracted_backend_data/blog_summary.json` and `blog_posts.json` to keep seed data in sync
- [x] T057 Verify `/api/blog` and `/api/blog/:slug` endpoints return all 4 updated, matched, Halal blog articles via curl
- [x] T058 Update and run automated integration test suite (`npm test`) to ensure all 15 tests pass
- [x] T059 Update `notes/PROJECT_STATE.md` and `notes/AGENT_HANDOVER.md`
- [x] T060 Git commit and push all changes to GitHub repository `origin main`

## Phase 14: Store Brand Migration to "FAMILIO BAZAR" (P1)
- [x] T061 Backup current logo and settings in `data/backup_brand_settings/`
- [x] T062 [P] [US6] Deploy new 803x311 transparent logo (`familio_bazar_logo.png`) and overwrite `1791364808818_7eef93_DIGITA_BAZAR_Fast_Commerce_Logo-removebg.png` in `src/public/uploads/` and `data/uploads/`
- [x] T063 [US6] Update SQLite `settings` table (`general`, `logo_config`, `seo_config`, `footer_config`) to "Familio Bazar - Best Online Shop", updated logo URLs, and "© 2026 Familio Bazar. All Rights Reserved."
- [x] T064 [US6] Update `data/extracted_backend_data/settings.json` to keep seed data in sync
- [x] T065 [US6] Update `src/public/index.html` (SSR metadata, title `<title>Familio Bazar - Best Online Shop</title>`, meta og/twitter tags, boot logo, Schema.org JSON-LD, SEO snapshot, and `window.__PHARMA_BOOT__`)
- [x] T066 [US6] Update SQLite `blog_posts` table and seed files `blog_posts.json` & `blog_summary.json` author attribution from "Digital Bazar Team" to "Familio Bazar Team"
- [x] T067 Update automated test suite in `tests/api.test.js` to assert "Familio Bazar" in store settings and blog responses
- [x] T068 Run automated test suite (`npm test`) to ensure all 15 tests pass
- [x] T069 Verify HTTP 200 delivery for the new logo and check `/api/settings` response via curl
- [x] T070 Update `notes/PROJECT_STATE.md` and `notes/AGENT_HANDOVER.md`
- [x] T071 Git commit and push all changes to GitHub repository `origin main`

## Phase 15: Media Upload & Admin Catalog Pipeline + Kid's Fashion Products Population (P1)
- [x] T072 Implement `/api/media` router (`src/routes/media.js`) supporting `GET /api/media`, `POST /api/media/upload-bulk`, `POST /api/media/upload`, and `DELETE /api/media/:id`
- [x] T073 Mount `/api/media` in `src/server.js` and configure upload storage
- [x] T074 Enhance `src/routes/admin.js` with `GET /api/admin/products/list` and ensure `image`, `images`, `brand_id` are saved in product CRUD
- [x] T075 [P] [US7] Generate and deploy 4 authentic, 100% Halal Kid's Fashion product images (`kids_panjabi_sky_blue.jpg`, `kids_panjabi_mint_green.jpg`, `kids_polo_navy.jpg`, `kids_full_tshirt.jpg`) to `src/public/uploads/` and `data/uploads/`
- [x] T076 [US7] Insert 4 Kid's Fashion products (Category 38, Brand 1 EM-BRAND) into SQLite `products` table
- [x] T077 [US7] Update `data/extracted_backend_data/products_summary.json` and `products_details.json` to keep seed data in sync
- [x] T078 Verify `/api/products/browse?category=kid-s-fashion` and `/api/media` return HTTP 200 with all products and media
- [x] T079 Update and run automated integration test suite (`npm test`) to verify 15+ tests pass
- [x] T080 Update `notes/PROJECT_STATE.md` and `notes/AGENT_HANDOVER.md`
- [x] T081 Git commit and push all changes to GitHub repository `origin main`

## Phase 16: Beauty & Care Catalog Population & Halal Product Media (P1)
- [x] T082 [P] [US8] Generate 4 high-res, 100% Halal cosmetic product images for Beauty & Care (`beauty_aloevera_gel.jpg`, `beauty_vitaminc_serum.jpg`, `beauty_teatree_facewash.jpg`, `beauty_rose_water.jpg`) and deploy to `src/public/uploads/` and `data/uploads/`
- [x] T083 [US8] Insert 4 Beauty & Care products (IDs 45, 46, 47, 48) into SQLite `products` table under Category 41 and Brand 1 ("EM-BRAND")
- [x] T084 [US8] Update `data/extracted_backend_data/products_summary.json` and `products_details.json` to keep seed data synchronized
- [x] T085 [US8] Update automated test suite in `tests/api.test.js` to assert Beauty & Care catalog browsing and 19 total products
- [x] T086 Run automated test suite (`npm test`) to verify all tests pass
- [x] T087 Verify `/api/products/browse?category=beauty-care` returns HTTP 200 with 4 products via curl
- [x] T088 Update `notes/PROJECT_STATE.md` and `notes/AGENT_HANDOVER.md`
- [x] T089 Git commit and push all changes to GitHub repository `origin main`

## Phase 17: Health & Wellness Catalog Population & Halal Product Media (P1)
- [x] T090 [P] [US9] Generate 4 high-res, 100% Halal wellness product images (`health_raw_honey.jpg`, `health_blackseed_oil.jpg`, `health_moringa_powder.jpg`, `health_chia_seeds.jpg`) and deploy to `src/public/uploads/` and `data/uploads/`
- [x] T091 [US9] Insert 4 Health & Wellness products (IDs 49, 50, 51, 52) into SQLite `products` table under Category 42 and Brand 1 ("EM-BRAND")
- [x] T092 [US9] Update `data/extracted_backend_data/products_summary.json` and `products_details.json` to keep seed data synchronized
- [x] T093 [US9] Update automated test suite in `tests/api.test.js` to assert Health & Wellness catalog browsing and 23 total products
- [x] T094 Run automated test suite (`npm test`) to verify all tests pass
- [x] T095 Verify `/api/products/browse?category=health-wellness` returns HTTP 200 with 4 products via curl
- [x] T096 Update `notes/PROJECT_STATE.md` and `notes/AGENT_HANDOVER.md`
- [x] T097 Git commit and push all changes to GitHub repository `origin main`





