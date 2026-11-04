# Feature Specification: Men's & Women's Brand Update to "EM-BRAND"

```yaml
feature: brand_em_brand_update
version: 1.0.0
status: approved
created_at: 2026-11-04T11:42:00+06:00
priority: P1
authors:
  - Antigravity AI Pair Programmer
```

## 1. Overview & Context
The user requested that all Men's Fashion (Category 36) and Women's Fashion (Category 37) products have their brand name set to **"EM-BRAND"**:
- If a product or garment already has "EM-BRAND" (such as the 3 Panjabi items updated earlier), keep it.
- If it has no brand (currently `brand_id = null`), or if it has another brand name (such as "S BRAND" on T-shirts 25 and 26), set the brand name to **"EM-BRAND"**.
- This applies both to store database/catalog metadata (enabling the `/shop` Brands facet and product details specification) and visual garment image branding (replacing legacy "S BRAND" with "EM-BRAND" on shirts).

---

## 2. User Stories & Acceptance Criteria

### User Story 1 (P1): Store Catalog & Database Brand Entity Setup
As a store visitor and administrator, I want Men's and Women's products to display "EM-BRAND" as their brand so that catalog filtering and product specifications accurately reflect our store brand.
- **Criteria 1.1**: The `brands` table contains an active record for `EM-BRAND` (`name: "EM-BRAND"`, `slug: "em-brand"`, `status: "active"`).
- **Criteria 1.2**: All 5 Men's Fashion products (IDs 22, 24, 25, 26, 30) and 5 Women's Fashion products (IDs 31, 32, 33, 34, 35) are associated with `brand_id` pointing to `EM-BRAND`.
- **Criteria 1.3**: The Groceries product ("Test Prodcut", ID 39) remains unaffected (`brand_id: null`).
- **Criteria 1.4**: `/api/brands` returns `EM-BRAND` with HTTP 200.
- **Criteria 1.5**: `/api/products/browse` facet `brands` includes `{ "1": 10 }` and returns `brandName: "EM-BRAND"` on all 10 items.
- **Criteria 1.6**: Seeder data (`brands.json`, `products_summary.json`, `products_details.json`) is kept in sync for reproducible deployments.

### User Story 2 (P2): Garment Brand Image Update on Men's T-Shirts
As a shopper viewing product cards and galleries, I want the garment images of Men's T-shirts to display "EM-BRAND" instead of "S BRAND".
- **Criteria 2.1**: Product 25 (Blue zip polo) has its left chest "S BRAND" text replaced with "EM-BRAND" in crisp white matching the polo fabric texture.
- **Criteria 2.2**: Product 26 (Maroon shirt) has its left chest "S BRAND" text and collar label updated to "EM-BRAND".
- **Criteria 2.3**: Original images are backed up in `data/backup_original_tshirts/`.
- **Criteria 2.4**: Updated images preserve exact 1254x1254 dimensions and quality across `src/public/uploads/` and `data/uploads/`.

---

## 3. BDD Scenarios (Gherkin)

```gherkin
Feature: Men's and Women's Products EM-BRAND Attribution

  Scenario: Catalog and browse API returns EM-BRAND for Men's and Women's products
    Given the server is running on port 5050
    When a request is sent to GET /api/products/browse
    Then the facets.brands contains count 10 for EM-BRAND
    And every product in category 36 and 37 returns brandName "EM-BRAND"
    And the groceries product returns null for brandName

  Scenario: T-shirt product images feature EM-BRAND
    Given the storefront static upload assets
    When a visitor inspects product 25 and product 26 images
    Then the chest branding displays "EM-BRAND"
    And no trace of legacy "S BRAND" remains visible
```
