# Feature Specification: Product Variations, Attributes & Category Management (Phase 2)

```yaml
feature: product_variations_and_category_management
phase: 2
status: approved
priority: P1
entities:
  - product_attributes:
      schema: "id, name, values_json, created_at"
      standard_attributes:
        - name: "Size"
          values: ["40", "42", "44", "46", "M", "L", "XL", "XXL"]
        - name: "Color"
          values: ["White", "Black", "Navy Blue", "Maroon", "Sky Blue", "Mint Green", "Purple", "Red"]
        - name: "Kids Size"
          values: ["2-3Y", "4-5Y", "6-7Y", "8-9Y", "10-12Y"]
  - product_variations:
      schema: "id, product_id, name, sku, price, sale_price, stock, image, attribute_values, created_at"
      combination_format: '{"Size": "42", "Color": "Navy Blue"}'
  - categories:
      schema: "id, name, slug, parent_id, image, icon, banner, sort_order, is_featured, status, created_at"
  - brands:
      schema: "id, name, slug, logo, is_featured, status, created_at"
endpoints:
  - "GET /api/admin/attributes"
  - "POST /api/admin/attributes"
  - "PUT /api/admin/attributes/:id"
  - "DELETE /api/admin/attributes/:id"
  - "GET /api/admin/products/:id/variations"
  - "PUT /api/admin/products/:id/variations"
  - "GET /api/admin/categories"
  - "POST /api/admin/categories"
  - "PUT /api/admin/categories/:id"
  - "DELETE /api/admin/categories/:id"
  - "PUT /api/admin/categories/reorder"
  - "GET /api/admin/brands/product-counts"
  - "POST /api/admin/brands"
  - "PUT /api/admin/brands/:id"
  - "DELETE /api/admin/brands/:id"
  - "GET /api/products/:id" (public product dossier with parsed combination and attributes)
```

## 1. Overview
Phase 2 implements the core catalog configuration engine for FAMILIO BAZAR:
1. **Attributes & Variations Engine**:
   - Enables defining reusable attributes ("Size", "Color", "Kids Size") with their possible values.
   - Enables creating and editing product variations for garments (Panjabi, T-Shirts, Kids wear) with unique SKUs, pricing, stock levels, and attribute combinations.
   - Automatically synchronizes parent product stock with the sum of its variations (`total_stock = SUM(variation.stock)`).
   - Formats public product endpoints (`GET /api/products/:id` and `/api/products/:slug`) so the React storefront renders interactive Size/Color selectors with instant price and stock feedback.
2. **Category Management Engine**:
   - Implements full category CRUD (`/api/admin/categories`) with tree parent/child relationships, product counters, and drag-and-drop sort reordering (`/api/admin/categories/reorder`).
3. **Brand Management Engine**:
   - Implements brand CRUD and brand product count tracking (`/api/admin/brands/product-counts`).

---

## 2. Gherkin BDD Scenarios

```gherkin
Feature: Product Variations & Category Management

  Scenario: Admin manages attributes
    Given an authenticated request with Admin JWT
    When a GET request is sent to "/api/admin/attributes"
    Then the response status should be 200
    And the response body should be an array of attributes with parsed "values"
    And attribute "Size" should contain values "40", "42", "44"

  Scenario: Admin retrieves and updates product variations
    Given an authenticated request with Admin JWT for product 22 (Panjabi)
    When a GET request is sent to "/api/admin/products/22/variations"
    Then the response status should be 200
    And each variation item should contain a valid "combination" object
    When a PUT request is sent to "/api/admin/products/22/variations" with:
      | variations | [{"sku": "PANJ-40", "price": 550, "stock": 25, "combination": {"Size": "40"}}, {"sku": "PANJ-42", "price": 550, "stock": 25, "combination": {"Size": "42"}}] |
    Then the response status should be 200
    And the parent product total stock should equal 50
    And the parent product "has_variations" flag should be 1

  Scenario: Public storefront serves interactive variation combinations
    Given product 22 has variations for sizes "40" and "42"
    When a public GET request is sent to "/api/products/22"
    Then the response status should be 200
    And "hasVariations" should be true
    And "variations[0].combination.Size" should be present
    And "attributes[0].name" should be "Size"

  Scenario: Admin reorders categories
    Given an authenticated request with Admin JWT
    When a PUT request is sent to "/api/admin/categories/reorder" with:
      | categories | [{"id": 36, "sortOrder": 1}, {"id": 37, "sortOrder": 2}] |
    Then the response status should be 200
    And category 36 should have sort_order 1
```
