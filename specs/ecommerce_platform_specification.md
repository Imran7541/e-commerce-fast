---
feature: Familio Bazar E-Commerce & POS Platform Specification
platform: Node.js / Express / React / SQLite / PostgreSQL
version: 1.0.0
status: approved
---

# Familio Bazar E-Commerce & POS Platform Technical Specification

## 1. System Overview & Executive Summary
This document specifies the technical architecture, data contracts, API endpoints, schema models, and operational workflows of the Familio Bazar multi-channel retail platform.

The platform provides a complete enterprise retail experience consisting of:
1. **Public Storefront**: Single Page Application (SPA) with server-assisted SEO prerendering, dynamic banners, category tree, multi-variation products, cart drawer, wishlists, flash sales, search, order tracking, and multi-language internationalization (`bn`, `en`, `ar`, `hi`, `fr`).
2. **Checkout & Conversion Engine**: Split-design high-converting checkout with cash-on-delivery (COD), online payment gateways (bKash, Nagad, SSLCommerz), discount coupons, automated shipping rate calculation (inside/outside Dhaka, free shipping threshold), district/thana cascading selectors (`bdGeo`), and analytics telemetry.
3. **High-Converting Landing Pages**: Dynamic marketing landing pages (`/lp/:slug`) with bespoke theme colors, hero sections, interactive review displays, video embeds, and one-click purchase flows.
4. **Administrative Control Suite**: Comprehensive management panel (`/admin`) for products, categories, attributes, variations, brands, orders, incomplete order recovery, customer CRM, sales reports, inventory ledger, courier shipping synchronization (Pathao, Steadfast, RedX, CarryBee), expenses, staff RBAC, SMS notifications, fraud mitigation, and theme customization.
5. **Point of Sale (POS) Terminal**: In-store sales terminal (`/pos`) supporting barcode scanning, cash drawer event auditing, held orders, customer/supplier ledgers, purchase returns, and thermal receipt printing.

---

## 2. API Contract & Endpoint Schema

### Public Customer Endpoints
- `GET /api/settings`: Comprehensive store parameters, theme options, navigation, checkout options, SEO, and payment configuration.
- `GET /api/categories`: Category taxonomy with `tree=1` nested parent-child hierarchy.
- `GET /api/banners`: Promotional sliders and image banners.
- `GET /api/brands`: Brand directory and product associations.
- `GET /api/products`: Filterable product catalog (`limit`, `page`, `category`, `search`, `featured`, `newArrival`, `onSale`, `bestSeller`).
- `GET /api/products/:id`: Full single-product dossier including attributes, variations, size guides, reviews, and rating breakdown.
- `GET /api/products/browse`: Paginated catalog with dynamic facets (`categories`, `brands`, `price`).
- `GET /api/blog`: Paginated blog articles and categories.
- `GET /api/blog/:slug`: Full blog post body, tags, and reading stats.
- `POST /api/blog/:slug/view`: Post read/view metric increment.
- `GET /api/lp/:slug`: Complete landing page schema and configuration.
- `POST /api/lp/:slug/view`: Landing page visitor telemetry.
- `POST /api/orders`: Order placement endpoint validating stock, discounts, and customer details.
- `GET /api/orders/track`: Order status tracking by phone or order number.
- `POST /api/coupons/validate`: Coupon validation checking expiry, order threshold, and usage limits.
- `GET /api/maintenance/status`: Maintenance window gating.
- `GET /api/cache-version`: Asset and cache invalidation timestamp.

### Customer & Staff Authentication
- `POST /api/auth/login`: Admin/Staff credential authentication via email or phone.
- `POST /api/auth/signin`: Storefront customer authentication via email or phone.
- `POST /api/auth/signup`: Customer account registration.
- `POST /api/auth/customer-login`: Mobile phone/password customer sign-in.
- `GET /api/auth/profile`: Authenticated user profile.
- `PUT /api/auth/change-password`: Self-service credential update.

### Point of Sale (POS) Endpoints
- `GET /api/pos/counter`: Current cash drawer counter status.
- `POST /api/pos/counter/open`: Open cash counter with initial cash float.
- `POST /api/pos/counter/close`: Reconcile end-of-day sales and cash float.
- `GET /api/pos/products`: Rapid barcode/SKU catalog lookup.
- `POST /api/pos/sale`: Instant POS order creation and receipt generation.
- `POST /api/pos/hold-order`: Store temporary customer cart state.
- `GET /api/pos/held-orders`: Retrieve unfinalized customer tickets.
- `GET /api/pos/drawer-events`: Audit cash additions, removals, and refunds.

### Administrative & Operations Endpoints
- `GET /api/admin/catalog/summary`: Catalog KPI dashboard.
- `GET /api/admin/users`: Staff member list and role configuration.
- `POST /api/admin/users`: Create staff account with role permissions.
- `CRUD /api/admin/products`: Product CRUD, image uploads, variation matrices.
- `CRUD /api/admin/categories`: Category management with reordering.
- `CRUD /api/admin/attributes`: Attribute definitions (Size, Color, etc.).
- `CRUD /api/admin/orders`: Order management, courier assignment, status workflows.
- `GET /api/admin/orders/:id/invoice`: Printable packing slip / thermal invoice with Code 39 barcode.
- `POST /api/admin/orders/:id/courier-ship`: Dispatch to Pathao/Steadfast/Redx API.
- `POST /api/admin/orders/:id/courier-sync`: Refresh real-time courier delivery state.
- `CRUD /api/admin/customers`: Customer CRM and blacklist status.
- `CRUD /api/admin/expenses`: Operations cost logging and category classification.
- `CRUD /api/admin/coupons`: Promotion codes and discount campaigns.
- `CRUD /api/admin/banners`: Banner slider management.
- `GET /api/admin/payment-gateways`: Masked payment gateway credentials.
- `CRUD /api/admin/settings`: Live system settings update with instant persistence.

---

## 3. Database Entity Relationship Model (ERD)

```mermaid
erDiagram
    CATEGORIES ||--o{ PRODUCTS : categorizes
    BRANDS ||--o{ PRODUCTS : manufactures
    PRODUCTS ||--o{ PRODUCT_VARIATIONS : contains
    PRODUCTS ||--o{ PRODUCT_ATTRIBUTES : defines
    PRODUCTS ||--o{ REVIEWS : receives
    ORDERS ||--|{ ORDER_ITEMS : contains
    PRODUCTS ||--o{ ORDER_ITEMS : ordered_as
    PRODUCT_VARIATIONS ||--o{ ORDER_ITEMS : variation_of
    CUSTOMERS ||--o{ ORDERS : places
    USERS ||--o{ ORDERS : manages
    EXPENSE_CATEGORIES ||--o{ EXPENSES : classifies
    SUPPLIERS ||--o{ PURCHASES : supplies
    POS_COUNTERS ||--o{ POS_DRAWER_EVENTS : logs
    LANDING_PAGES ||--o{ ORDERS : converts
```

---

## 4. Gherkin BDD Verification Scenarios

```gherkin
Feature: E-Commerce Storefront & Order Placement
  Scenario: Public visitor browse product and place Cash-On-Delivery order
    Given the backend server is running and database is seeded
    When a customer queries "GET /api/products?limit=10"
    Then the response status should be 200
    And the response should contain an array of products with prices, images, and stock
    When the customer submits an order via "POST /api/orders" with valid items and shipping address
    Then the response status should be 201
    And an order number should be generated
    And the order status should be "pending"
    And the product inventory stock should decrement accordingly

  Scenario: Discount coupon validation
    Given an active coupon "WELCOME10" with 10% discount and minimum order of 500 BDT
    When a customer checks "POST /api/coupons/validate" with subtotal 1000 BDT
    Then the coupon should be validated successfully
    And the discount amount should calculate to 100 BDT

  Scenario: POS cash counter session
    Given an authenticated POS cashier
    When the cashier opens a counter with opening cash 2000 BDT
    Then a new pos_counter session is created with status "open"
    When a walk-in sale of 1500 BDT is processed
    Then a drawer event of type "sale" is recorded
    And totalSales on the counter reflects 1500 BDT
```
