---
feature: "Homepage Catalog Curation, Men's & Woman's Fashion Priority & Deduplication"
status: "planned"
version: "1.0.0"
---

# Feature Specification: Homepage Catalog Curation & Fashion Priority

## Problem Statement
On the storefront homepage (`http://localhost:5050/`), both the "New Products" section and the "All Products" section rendered the exact same 10 products (Toys, Smart Watch, Earbuds, Superfoods, and Cosmetics), completely hiding core Men's Fashion (Panjabis, T-Shirts) and Woman's Fashion (Halal 3D Ghost Mannequin Sarees) from view. The homepage appeared as two identical duplicate rows of non-apparel items.

## Objectives
1. **Curated New Arrivals**: Configure `is_new_arrival = 1` for 10 flagship products representing the finest selection across Women's Fashion (Pakistani & Jamdani Sarees), Men's Fashion (Smart Panjabi & T-Shirt), Kid's Fashion (Festive Panjabi & Polo), Beauty & Care (Aloe Vera & Vitamin C Serum), and Health & Wellness (Sundarban Honey & Black Seed Oil).
2. **Fashion-First All Products Catalog**: Ensure `/api/products` (feeding "All Products" on the homepage) prioritizes Men's and Women's Fashion (Categories 36 & 37) and surfaces items with `is_new_arrival = 0` first, ensuring **zero duplicate images** between "New Products" and "All Products".
3. **Storefront Browse Priority**: Ensure default `/shop` browsing showcases Men's Fashion, Woman's Fashion, and Kid's Fashion first before non-apparel categories.

## Gherkin BDD Scenarios

```gherkin
Scenario: "New Products" section showcases curated fashion and lifestyle new arrivals
  Given the database is updated with curated is_new_arrival flags
  When a request is made to "GET /api/products?newArrival=true&limit=10"
  Then the response must contain 10 products
  And Woman's Fashion (Sarees) and Men's Fashion (Panjabi/T-shirt) must appear among the first items
  And none of the items should be generic toys or electronic accessories

Scenario: "All Products" section showcases Men's and Woman's Fashion without duplicating "New Products"
  Given "All Products" queries "GET /api/products?limit=100"
  When the first 10 products are inspected (f.slice(0, 10))
  Then all 10 items must be Men's Fashion (Category 36) and Woman's Fashion (Category 37)
  And there must be zero duplicate products between the first 10 of All Products and New Products
```
