# Familio Bazar - Enterprise E-Commerce & POS Platform

A high-performance, full-stack multi-channel e-commerce suite, point-of-sale (POS) terminal, and back-office management system engineered for scalable retail operations.

---

## 1. System Overview

Familio Bazar is an integrated retail platform built with a decoupled architecture comprising a responsive React 18 single-page application (SPA) and an Express.js REST API service. It features an automated database bootstrap engine, multi-language localization (Bengali, English, Arabic, Hindi, French), native courier fulfillment integrations, barcode-enabled printable invoices, and cash drawer management.

### Key Capabilities

- **Storefront & Customer Experience**: Mobile-first responsive UI, sliding cart drawer, single-page checkout, dynamic delivery charge calculation by shipping zone, real-time coupon validation, order status tracking, and multi-language support.
- **Administrative Control Center**: Role-based access control (RBAC), multi-variant product catalog management, hierarchical category reordering, fraud risk lookup, order assignment, courier dispatching, and system settings customization.
- **Printable Invoices**: Direct browser rendering of professional thermal and A4 packing slips featuring Code 39 barcodes for warehouse scanning.
- **POS Terminal**: Dedicated cashier workstation with keyboard shortcuts, barcode scanning support, custom line-item discounts, split payment methods, and cash drawer auditing.
- **Logistics Integration**: Pluggable courier adapters for Pathao, Steadfast, and Redx with automated consignment booking and delivery webhook receivers.
- **Payment Processing**: Support for Cash on Delivery (COD) alongside modular gateway integrations for bKash, Nagad, Rocket, Upay, and SSLCommerz.

---

## 2. Directory Architecture

The repository adheres to Spec-Driven Development (SDD) standards with strict separation of concerns:

```text
.
|-- .env.example                     # Environment template with [[PLACEHOLDER]] keys
|-- .gitignore                       # Git exclusion rules (ignores real .env and databases)
|-- package.json                     # Node.js project manifest and pinned dependencies
|
|-- specs/                           # Spec-Driven Development (SDD) source of truth
|   |-- ecommerce_platform_specification.md
|   |-- admin_panel_phase_roadmap.md
|   |-- admin_auth_and_user_management.md
|   |-- footer_contact_info_update.md
|   `-- panjabi_brand_and_new_products_header.md
|
|-- docs/                            # System architecture, schemas, and diagrams
|   `-- ARCHITECTURE.md              # Mermaid architecture and data flow diagrams
|
|-- notes/                           # Continuous state tracking and agent resume directives
|   |-- PROJECT_STATE.md             # Project ledger and completed milestone tracker
|   `-- AGENT_HANDOVER.md            # Session resumption context
|
|-- config/                          # Security policies and role mappings
|   `-- policies.yaml                # Zero-Trust RBAC and endpoint rate-limiting definitions
|
|-- data/                            # Database definitions and seed assets
|   |-- schema.sql                   # Relational database DDL schema (SQLite / PostgreSQL)
|   |-- seed.js                      # Programmatic catalog and settings seeder
|   |-- extracted_backend_data/      # Baseline JSON snapshots for clean deployment
|   |   |-- settings.json            # Global configuration (40 parameter groups)
|   |   |-- categories.json          # Root and nested categories hierarchy
|   |   |-- products_details.json    # Catalog items with attribute variations
|   |   |-- products_summary.json    # Summary index for quick browsing
|   |   |-- banners.json             # Carousel and hero promotional banners
|   |   |-- blog_posts.json          # Editorial content
|   |   `-- landing_pages.json       # High-converting campaign templates
|   `-- uploads/                     # Product catalog photography and branding assets
|
|-- src/                             # Core application backend source code
|   |-- server.js                    # Express application entrypoint and middleware orchestration
|   |-- db/
|   |   `-- database.js              # Database abstraction layer (node:sqlite)
|   |-- middleware/
|   |   `-- auth.js                  # JWT authentication, session handling, and RBAC guards
|   |-- services/
|   |   `-- orderService.js          # Order calculations, courier dispatch, and coupons
|   |-- routes/
|   |   |-- public.js                # Public catalog, categories, and settings endpoints
|   |   |-- orders.js                # Customer checkout, tracking, and cancellation
|   |   |-- auth.js                  # Dual-identifier login, signin, and registration
|   |   |-- admin.js                 # Admin management, staff CRUD, invoices, and couriers
|   |   `-- pos.js                   # POS terminal sales and cash drawer operations
|   `-- public/                      # Compiled frontend client distribution (HTML, JS, CSS)
|
`-- tests/                           # Integration and regression test suites
    `-- api.test.js                  # 15-suite comprehensive end-to-end API verification
```

---

## 3. Technology Stack

| Layer | Component | Version / Specification | Rationale |
| :--- | :--- | :--- | :--- |
| **Runtime** | Node.js | `>= 20.0.0` (LTS) | Native `node:sqlite` DatabaseSync module support without native C++ compilation bindings. |
| **Framework** | Express.js | `^4.21.2` | Minimalist, robust HTTP server pipeline with high throughput. |
| **Security** | Helmet & CORS | `^8.0.0` / `^2.8.5` | Strict HTTP security headers, CSP, and CORS policy enforcement. |
| **Authentication** | JWT & Bcrypt | `^9.0.2` / `^2.4.3` | Stateless signed bearer tokens with salted password hashing. |
| **Database** | SQLite (node:sqlite) | Embedded | Single-file, zero-latency relational engine with foreign key validation. DDL is PostgreSQL-compatible. |
| **Frontend** | React SPA | `^18.2.0` | Client-side reactive UI with component modularity and client routing. |
| **Styling** | Tailwind CSS | `^3.4.0` | Utility-first styling with responsive design tokens. |
| **File Handling** | Multer | `^2.5.0` | Multipart form-data parser with disk storage abstraction. |

---

## 4. Quickstart & Installation

### Prerequisites

- Node.js version 20.0.0 or higher
- Git

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Imran7541/e-commerce-fast.git
   cd e-commerce-fast
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file by copying the template:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to configure your preferred port and secrets (default port is `5050`).

4. **Start the application**:
   ```bash
   npm start
   ```

### Automated Database Initialization

The platform includes an automated bootstrap mechanism in `src/db/database.js`. On the initial run, if no database exists:
1. `data/schema.sql` automatically provisions all tables, indexes, and foreign keys.
2. `data/seed.js` seeds the catalog with 26 products, 9 categories, 3 promotional banners, 4 blog articles, and default configurations.
3. No manual database import or SQL commands are required.

Access points once running:
- **Storefront**: `http://localhost:5050/`
- **Admin Panel**: `http://localhost:5050/admin`
- **POS Terminal**: `http://localhost:5050/pos`

---

## 5. Security & Zero-Trust Governance

1. **Zero Secret Exposure**: Real credentials, API keys, and sensitive tokens are strictly kept in `.env` and excluded from version control via `.gitignore`.
2. **Customer Data Isolation**: The local runtime database (`data/ecommerce.sqlite`) is explicitly gitignored to guarantee that no test customer records, phone numbers, or addresses are ever pushed to GitHub.
3. **Dual-Identifier Authentication**: Both email addresses and phone numbers are accepted for authentication across storefront customers and administrative staff. Passwords are encrypted using salted Bcrypt hashes.
4. **Role-Based Authorization**: Protected routes enforce JWT verification with specific permissions for roles: `super_admin`, `admin`, `manager`, and `staff`.
5. **Printable Invoice Security**: Invoice print URLs require either an authenticated session token or an authorized one-time token query parameter.

---

## 6. API Routing Matrix

### Public Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/settings` | Returns store brand metadata, contacts, social links, and shipping rates. |
| `GET` | `/api/categories` | Returns category list or nested tree (`?tree=1`). |
| `GET` | `/api/products` | Returns catalog items with pagination, filtering, and search. |
| `GET` | `/api/products/:id` | Returns complete product dossier including variation matrices. |
| `GET` | `/api/products/browse` | Returns catalog items alongside dynamic category facets. |
| `POST` | `/api/coupons/validate` | Validates promotional discount code against cart totals. |
| `POST` | `/api/orders` | Places a new customer order with stock reservations. |
| `GET` | `/api/orders/track` | Retrieves live tracking status using order number. |
| `POST` | `/api/auth/login` | Authenticates administrative staff via email or phone. |
| `POST` | `/api/auth/signin` | Authenticates storefront customers via email or phone. |

### Protected Administrative Endpoints

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/users` | Bearer Token | Lists administrative staff and role assignments. |
| `POST` | `/api/admin/users` | Admin Role | Creates a new staff member with assigned permissions. |
| `GET` | `/api/admin/orders` | Staff Role | Queries orders with status, date, and courier filters. |
| `GET` | `/api/admin/orders/:id` | Staff Role | Retrieves detailed order history and fraud audit scores. |
| `PATCH` | `/api/admin/orders/:id/status` | Staff Role | Updates order lifecycle status (e.g., confirmed, shipped). |
| `PATCH` | `/api/admin/orders/:id/assign` | Staff Role | Assigns an order to a specific fulfillment team member. |
| `GET` | `/api/admin/orders/:id/invoice` | Token / Auth | Renders printable A4 / thermal invoice with barcode. |
| `GET` | `/api/admin/courier/pathao/cities` | Admin Role | Fetches available delivery hubs from courier API. |
| `POST` | `/api/admin/courier/test` | Admin Role | Dispatches a parcel consignment to Pathao / Steadfast / Redx. |
| `GET` | `/api/admin/payment-gateways` | Super Admin | Reads payment gateway credentials and toggle states. |

### POS Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/pos/sale` | Records counter checkout sale, calculates change, and decrements stock. |
| `GET` | `/api/pos/drawers` | Retrieves current shift cash drawer reconciliation status. |

---

## 7. Automated Testing Suite

The repository includes a comprehensive integration test suite verifying all critical business flows:

```bash
npm test
```

### Verified Test Assertions

- Store configuration, brand metadata, and customer reviews verification.
- Category tree generation and hierarchy consistency.
- Product catalog querying, pagination, and multi-attribute variation schemas.
- Single-page checkout order placement, coupon validation, and order tracking.
- Dual-identifier authentication for email and phone numbers.
- Administrative user creation, editing, and role assignment.
- Order assignment, lifecycle status updates, and printable invoice rendering.
- Courier dispatch simulation and delivery webhook ingestion.
- POS terminal sale recording and cash calculation.
- Static file and media asset serving verification.

---

## 8. License

This project is licensed under the MIT License.
