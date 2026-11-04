---
feature: "Beauty & Care Catalog Population with Halal Model-Free Product Imagery"
category_id: 41
category_slug: "beauty-care"
brand_id: 1
brand_name: "EM-BRAND"
status: "planned"
version: "1.0.0"
---

# Feature Specification: Beauty & Care Catalog Population

## Problem Statement
When a user navigates to `http://localhost:5050/shop?category=beauty-care`, the catalog renders `0 products • Beauty & Care` with `No products found`. The store requires authentic, 100% Halal cosmetic and skincare products featuring high-resolution model-free product photography (bottles, jars, droppers, packaging — zero female faces, skin, or human models) attributed to the store brand `EM-BRAND`.

## Product Catalog Additions
1. **EM-BRAND Organic Aloe Vera Soothing Gel** (ID 45)
   - Category: Beauty & Care (41)
   - Price: ৳320, Sale Price: ৳250
   - Image: `/uploads/beauty_aloevera_gel.jpg`
2. **EM-BRAND Herbal Vitamin C Glow Face Serum** (ID 46)
   - Category: Beauty & Care (41)
   - Price: ৳550, Sale Price: ৳450
   - Image: `/uploads/beauty_vitaminc_serum.jpg`
3. **EM-BRAND Tea Tree Purifying Foaming Face Wash** (ID 47)
   - Category: Beauty & Care (41)
   - Price: ৳380, Sale Price: ৳290
   - Image: `/uploads/beauty_teatree_facewash.jpg`
4. **EM-BRAND Natural Rose Water Hydrating Mist** (ID 48)
   - Category: Beauty & Care (41)
   - Price: ৳290, Sale Price: ৳220
   - Image: `/uploads/beauty_rose_water.jpg`

## Gherkin BDD Scenarios

```gherkin
Scenario: Browsing Beauty & Care category returns active products
  Given the store database is seeded with Beauty & Care products under category ID 41
  When a user requests "GET /api/products/browse?category=beauty-care"
  Then the response status should be 200 OK
  And the response "total" should be 4
  And every item should have brand "EM-BRAND"
  And every item should have a valid high-resolution image URL in "/uploads/"

Scenario: Halal model-free product image delivery
  Given the Beauty & Care product images are deployed in "src/public/uploads/"
  When an image asset such as "/uploads/beauty_aloevera_gel.jpg" is requested via HTTP GET
  Then the HTTP status must be 200 OK
  And the Content-Type header must be "image/jpeg"
  And the image must contain zero human faces, female models, or skin
```
