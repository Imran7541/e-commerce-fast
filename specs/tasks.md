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

## Phase 18: Homepage Catalog Curation, Men's & Woman's Fashion Priority & Deduplication (P1)
- [x] T098 [US10] Update SQLite `products` table `is_new_arrival` flags so that 10 curated flagship items (IDs 35, 32, 30, 26, 41, 43, 45, 46, 49, 50) have `is_new_arrival = 1` and other products have `is_new_arrival = 0`
- [x] T099 [US10] Update `src/routes/public.js`:
  - Enhance `/api/products` ordering: sort by category priority (Fashion first: 37, 36, 38, 41, 42, then others), and deduplicate "All Products" against "New Products"
  - Enhance `/api/products/browse` default ordering to prioritize fashion categories
- [x] T100 [US10] Update `data/extracted_backend_data/products_summary.json` and `products_details.json` to reflect updated `isNewArrival` flags
- [x] T101 [US10] Update automated tests in `tests/api.test.js` to assert homepage deduplication and fashion priority in both sections
- [x] T102 Run automated test suite (`npm test`) to verify all tests pass
- [x] T103 Verify `/api/products?newArrival=true&limit=10` and `/api/products?limit=10` return distinct, fashion-first product sets via curl
- [x] T104 Update `notes/PROJECT_STATE.md` and `notes/AGENT_HANDOVER.md`
- [x] T105 Git commit and push all changes to GitHub repository `origin main`

## Phase 19: Footer & Site-wide Contact Information Update (P1)
- [x] T106 [US11] Update SQLite `settings` table (`footer_config`, `general`, `topbar`, `product_contact_config`, `chat_config`, `social_config`, `pages`) with new phone `01787877362`, email `imrandt2001@gmail.com`, and Dhaka location `House #24, Road #03, Sector #11, Uttara, Dhaka-1230`, and update `footer_config.description` to Familio Bazar e-commerce branding
- [x] T107 [US11] Update `data/extracted_backend_data/settings.json` to keep seed data synchronized with the new contact details
- [x] T108 [US11] Update `src/public/index.html` SEO snapshot footer with `01787877362` and the Dhaka address
- [x] T109 [US11] Update automated tests in `tests/api.test.js` to assert the new contact details in `GET /api/settings`
- [x] T110 Run automated test suite (`npm test`) to ensure all 15 tests pass
- [x] T111 Verify live `/api/settings` response via curl with `--noproxy '*'`
- [x] T112 Update `notes/PROJECT_STATE.md` and `notes/AGENT_HANDOVER.md`
- [x] T113 Git commit and push all changes to GitHub repository `origin main`

## Phase 20: Admin Authentication & Staff User Management (P1)
- [x] T114 [US12] Update Super Admin user (id: 1) in SQLite `users` table: set email to `imrandt2001@gmail.com`, phone to `01787877362`, name to `Imran (Super Admin)`
- [x] T115 [US12] Enhance `POST /api/auth/login` in `src/routes/auth.js` to support dual login (either email `imrandt2001@gmail.com` OR phone `01787877362` or legacy `admin@digitalbazar.com`)
- [x] T116 [US12] Implement `/api/auth/profile` (PUT) and `/api/auth/change-password` (PUT) in `src/routes/auth.js` for self-service profile and password changes
- [x] T117 [US12] Implement Staff & User Management CRUD in `src/routes/admin.js` (`GET /api/admin/users`, `POST /api/admin/users`, `PUT /api/admin/users/:id`, `DELETE /api/admin/users/:id`, `PUT /api/admin/users/:id/password`)
- [x] T118 [US12] Update `data/seed.js` to seed admin user with `imrandt2001@gmail.com` and `01787877362`
- [x] T119 [US12] Update automated tests in `tests/api.test.js` to verify login with `imrandt2001@gmail.com`, login with phone `01787877362`, and test `GET /api/admin/users` and user creation
- [x] T120 Run automated test suite (`npm test`) to ensure all tests pass
- [x] T121 Verify live `/api/auth/login` and `/api/admin/users` via curl
- [x] T122 Update `notes/PROJECT_STATE.md` and `notes/AGENT_HANDOVER.md`
- [x] T123 Git commit and push all changes to GitHub repository `origin main`

## Phase 21: Product Variations, Attributes & Category Management (Phase 2) (P1)
- [x] T124 [US13] Seed standard fashion attributes ("Size", "Color", "Kids Size") into SQLite `product_attributes` table and update `data/seed.js`
- [x] T125 [US13] Implement full Attributes CRUD endpoints in `src/routes/admin.js` (`GET /api/admin/attributes`, `POST /api/admin/attributes`, `PUT /api/admin/attributes/:id`, `DELETE /api/admin/attributes/:id`)
- [x] T126 [US13] Implement Product Variations endpoints in `src/routes/admin.js` (`GET /api/admin/products/:id/variations`, `PUT /api/admin/products/:id/variations`) with automatic product stock recalculation
- [x] T127 [US13] Implement Category Management CRUD & Reorder endpoints in `src/routes/admin.js` (`GET /api/admin/categories` with product_count, `POST /api/admin/categories`, `PUT /api/admin/categories/:id`, `DELETE /api/admin/categories/:id`, `PUT /api/admin/categories/reorder`)
- [x] T128 [US13] Implement Brands Management endpoints in `src/routes/admin.js` (`GET /api/admin/brands/product-counts`, `POST /api/admin/brands`, `PUT /api/admin/brands/:id`, `DELETE /api/admin/brands/:id`)
- [x] T129 [US13] Update public product dossier endpoint `GET /api/products/:id` in `src/routes/public.js` to return dynamic `attributes` and `combination` objects for interactive variation selectors
- [x] T130 [US13] Populate realistic size variations (40, 42, 44 or M, L, XL) for fashion garments (Panjabis, T-Shirts, Kids wear) in SQLite `product_variations` table
- [x] T131 [US13] Update automated test suite in `tests/api.test.js` to verify attributes CRUD, variations management, and category reorder
- [x] T132 Run automated test suite (`npm test`) to ensure all tests pass
- [x] T133 Verify live endpoints via curl, update `notes/PROJECT_STATE.md`, `notes/AGENT_HANDOVER.md`, and commit/push to GitHub `origin main`

## Phase 22: Order Management, Printable Invoice & Status Workflow (Phase 3) (P1)
- [x] T134 [US14] Implement `GET /api/admin/orders/:id` (returns full order object with items, customer details, and invoice formatting) in `src/routes/admin.js`
- [x] T135 [US14] Implement `PATCH` & `PUT /api/admin/orders/:id/status` (updates order status) and `PATCH` & `PUT /api/admin/orders/:id/assign` (assigns staff member) in `src/routes/admin.js`
- [x] T136 [US14] Implement `PUT /api/admin/orders/:id` (edits order address, customer name, items, recalculates totals) and `DELETE /api/admin/orders/:id` in `src/routes/admin.js`
- [x] T137 [US14] Implement `POST /api/admin/orders/bulk` (bulk status update and bulk deletion) in `src/routes/admin.js`
- [x] T138 [US14] Implement `GET /api/admin/orders-staff` (lists active staff for assignment) and `GET /api/admin/orders-customer-lookup` (customer history & delivery rate lookup) in `src/routes/admin.js`
- [x] T139 [US14] Implement `GET /api/admin/orders/invoices` (batch invoice data) and `GET /api/admin/orders/:id/invoice` (HTML printable memo / invoice view with Familio Bazar branding) in `src/routes/admin.js`
- [x] T140 [US14] Add automated tests for Phase 3 in `tests/api.test.js` and run `npm test`
- [x] T141 [US14] Verify live Phase 3 endpoints via curl

## Phase 23: Payment Gateways (bKash, Nagad, SSLCommerz) Configuration (Phase 4) (P1)
- [x] T142 [US15] Implement `GET /api/admin/payment-gateways` (returns configurations with masked secrets) in `src/routes/admin.js`
- [x] T143 [US15] Implement `PUT /api/admin/payment-gateways/:id` (saves bKash, Nagad, SSLCommerz credentials into SQLite `settings` table safely) in `src/routes/admin.js`
- [x] T144 [US15] Implement `POST /api/admin/payment-gateways/:id/test` (simulates/validates gateway connectivity) and `GET /api/admin/payment-transactions` in `src/routes/admin.js`
- [x] T145 [US15] Add automated tests for Phase 4 in `tests/api.test.js` and run `npm test`

## Phase 24: Courier Integration & Banner Control (Phase 5) (P1)
- [x] T146 [US16] Implement Banner Management CRUD in `src/routes/admin.js` (`GET /api/admin/banners`, `POST /api/admin/banners`, `PUT /api/admin/banners/:id`, `DELETE /api/admin/banners/:id`)
- [x] T147 [US16] Implement Courier Area/Zone/City endpoints in `src/routes/admin.js` (`/api/admin/courier/pathao/cities`, `zones/:id`, `areas/:id`, `redx/areas`, `carrybee/...`)
- [x] T148 [US16] Implement `POST /api/admin/orders/:id/courier-ship` and `POST /api/admin/orders/:id/courier-sync` and `POST /api/admin/courier/sync-all` in `src/routes/admin.js`
- [x] T149 [US16] Implement Courier Webhook endpoints (`/api/webhooks/steadfast`, `/api/webhooks/pathao`, `/api/webhooks/redx`)
- [x] T150 [US16] Add automated tests for Phase 5 in `tests/api.test.js` and run `npm test`
- [x] T151 [US16] Restart server daemon on port 5050, verify live endpoints, update `notes/PROJECT_STATE.md`, `notes/AGENT_HANDOVER.md`, commit and push to GitHub `origin main`

## Phase 25: Platform Identity Sanitation & Attribution Polish (P1)
- [x] T152 [US17] Update `package.json` description to "Enterprise E-Commerce, POS & Admin Suite"
- [x] T153 [US17] Update startup banner in `src/server.js` to "Familio Bazar E-Commerce & POS Server Running!"
- [x] T154 [US17] Update integration test completion banner in `tests/api.test.js` to "ALL 15 TESTS PASSED! FULL PLATFORM VERIFIED!"
- [x] T155 [US17] Clean all external domain URLs, schema identifiers, and developer credits in `src/public/index.html`
- [x] T156 [US17] Update footer credit settings (`companyCredit: "Powered By"`, `developerName: "Familio Bazar"`, `creditUrl: "/"`) in `data/extracted_backend_data/settings.json` and SQLite database
- [x] T157 [US17] Migrate specification to `specs/ecommerce_platform_specification.md` and archive legacy draft
- [x] T158 [US17] Update `README.md` and `notes/PROJECT_STATE.md` to remove any third-party target references
- [x] T159 [US17] Run verification scanner to confirm clean attribution and zero emojis across repository

## Phase 26: Hero Section Banner Replacement & Continuous Auto-Slide (P1)
- [x] T160 [US18] Identify target hero banner image for Premium Polo Collection in SQLite database and asset folders (`1790641227090_97daaa_S-BRAND2-01_jpg.jpg`, banner ID 2)
- [x] T161 [US18] Resample user uploaded polo image (`media_1793804888808_1331cc34.jpg`) to native dimensions 2400x1040 and overwrite banner assets in `src/public/uploads/`, `data/uploads/`, and `hero imge/`
- [x] T162 [US18] Update hero slider transition interval from 5500ms to 3200ms in `src/public/assets/index-BIdHCx7F.js` and `src/public/assets/index.js`
- [x] T163 [US18] Prevent desktop mouse hover from freezing carousel auto-slide (`onMouseEnter: ()=>{}, onMouseLeave: ()=>{}`)
- [x] T164 [US18] Add cache-busting version query parameter (`?v=hero-slide-2`) to main client script tag in `src/public/index.html`
- [x] T165 [US18] Verify HTTP 200 delivery for banner image, updated script bundle, and homepage
- [x] T166 [US18] Verify continuous automated sliding via headless browser and ensure 15/15 tests pass (`npm test`)
- [x] T167 [US18] Update documentation and project notes (`notes/PROJECT_STATE.md`, `notes/AGENT_HANDOVER.md`), verifying zero emojis across repository

## Phase 27: Autonomous Security & Functional Auditing via Strix (P1)
- [x] T168 [US19] Verify Strix CLI (v1.7.0) environment, Docker daemon connectivity, and sandbox image initialization (`ghcr.io/usestrix/strix-sandbox:1.3.0`)
- [x] T169 [US19] Target live e-commerce server at `http://localhost:5050` and `http://localhost:5050/page/`
- [x] T170 [US19] Execute Strix autonomous security scan testing OWASP Top 10, Auth/Admin access control, IDOR in order tracking, and Checkout business logic
- [x] T171 [US19] Verify Strix execution status, agent turns, and inspect generated scan report in `strix_runs/`
- [x] T172 [US19] Analyze findings and PoCs, proposing surgical code fixes for any verified vulnerabilities (masked customer PII on public tracking `/api/orders/track`, added authentication and MIME/path traversal validation to `/api/media`)
- [x] T173 [US19] Run automated regression test suite (`npm test`, 16/16 passing) to guarantee zero regressions
- [x] T174 [US19] Update `notes/PROJECT_STATE.md` and `notes/AGENT_HANDOVER.md` with audit status, adhering strictly to zero emojis
