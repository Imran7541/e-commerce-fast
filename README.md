# Digital Bazar (Fast Commerce) - Full Reverse Engineered E-Commerce & POS Suite

Complete production-grade reverse engineered system reconstructed from `https://nodejs.topperit.com.bd/`.

This project contains:
- **Frontend**: Full React 18 SPA (Storefront, Cart Drawer, Checkout, Multi-Language `bn`/`en`/`ar`/`hi`/`fr`, Bangladesh Geo-Location cascading selectors, Landing Pages, Admin Panel, and POS Terminal) with 120 compiled JS & CSS bundles.
- **Backend**: Express.js REST API matching 100% of the target site's routes and endpoints.
- **Database**: Relational Database (`SQLite` standalone / `PostgreSQL` ready) with complete DDL schema and live seed data.
- **Data & Assets**: 100% of real store settings (40 config groups), 10 products with variations, 9 categories, 4 blog articles, 2 high-converting landing pages, and all 31 original images and media assets.
- **Business Logic**: Shipping rules engine (inside/outside Dhaka, free shipping threshold), promotional coupons, order creation with stock adjustment, courier shipping workflows (Pathao, Steadfast, Redx), and POS cash drawer management.

---

## 📁 Project Directory Structure

```text
E-commers rea/
├── .env.example                     # Environment template
├── .env                             # Active environment configuration
├── package.json                     # Dependencies & scripts
│
├── specs/
│   └── ecommerce_reverse_engineering_specification.md   # SDD Technical Spec
│
├── docs/
│   └── ARCHITECTURE.md              # System design & Mermaid architecture diagrams
│
├── notes/
│   ├── PROJECT_STATE.md             # Milestone ledger
│   └── AGENT_HANDOVER.md            # Resume directive
│
├── config/
│   └── policies.yaml                # Zero-Trust RBAC & rate limiting policies
│
├── data/
│   ├── schema.sql                   # SQL DDL database definition
│   ├── seed.js                      # Database seeder script
│   ├── ecommerce.sqlite             # Active populated SQLite database
│   ├── extracted_backend_data/      # Raw JSON snapshots from live site
│   │   ├── settings.json            # 40 configuration objects
│   │   ├── categories.json          # Category tree
│   │   ├── banners.json             # Hero sliders & banners
│   │   ├── products_summary.json    # Product list
│   │   ├── products_details.json    # Full dossiers with variations & reviews
│   │   ├── blog_summary.json        # Blog listing
│   │   ├── blog_posts.json          # 4 Bengali rich blog posts
│   │   └── landing_pages.json       # Landing page templates & configurations
│   └── uploads/                     # 31 original uploaded media files
│
├── src/
│   ├── server.js                    # Express master server entrypoint
│   ├── db/
│   │   └── database.js              # Database abstraction layer (node:sqlite)
│   ├── middleware/
│   │   └── auth.js                  # JWT Authentication & Role-Based Access Control
│   ├── services/
│   │   └── orderService.js          # Order calculations, shipping & coupons
│   ├── routes/
│   │   ├── public.js                # Public storefront & catalog endpoints
│   │   ├── orders.js                # Checkout & order tracking endpoints
│   │   ├── auth.js                  # User, Admin & Customer authentication
│   │   ├── admin.js                 # Admin management & catalog CRUD
│   │   └── pos.js                   # Point of Sale terminal endpoints
│   └── public/                      # Static web server root
│       ├── index.html               # SPA entrypoint
│       ├── assets/                  # 120 client JS & CSS bundles
│       └── uploads/                 # Static media uploads
│
└── tests/
    └── api.test.js                  # Automated 13-stage integration test suite
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v20+ or v22+ (Uses native built-in `node:sqlite`)
- **NPM**: v9+

### 2. Installation
```bash
npm install
```

### 3. Database Seeding
To re-seed the SQLite database with the live extracted data:
```bash
npm run seed
```

### 4. Running the Server
```bash
npm start
# or development watch mode:
npm run dev
```
The server will start on: **`http://localhost:5050`**
- Storefront: `http://localhost:5050/`
- Shop: `http://localhost:5050/shop`
- Landing Pages: `http://localhost:5050/lp/panjabi` or `http://localhost:5050/lp/test-product`
- Admin Panel: `http://localhost:5050/admin`
- POS Terminal: `http://localhost:5050/pos`

---

## 🔐 Default Administrative Credentials

| Account | Email / Phone | Password | Role |
|---|---|---|---|
| Super Admin | `admin@digitalbazar.com` | `admin123` | `super_admin` |
| POS Cashier | `pos@digitalbazar.com` | `staff123` | `pos_operator` |

---

## 🧪 Running Automated Tests

A comprehensive integration test suite is included in `tests/api.test.js` validating all 13 core systems:
```bash
npm test
```

Test coverage includes:
1. Public settings retrieval (`/api/settings`)
2. Categories nested tree (`/api/categories?tree=1`)
3. Products catalog retrieval (`/api/products`)
4. Single product dossier with variations (`/api/products/:id`)
5. Blog articles retrieval (`/api/blog`)
6. Landing page configuration (`/api/lp/panjabi`)
7. Promotional coupon validation (`/api/coupons/validate`)
8. Customer Order creation with inventory deduction (`/api/orders`)
9. Order tracking (`/api/orders/track`)
10. Admin authentication & JWT issuance (`/api/auth/login`)
11. Admin protected catalog summary (`/api/admin/catalog/summary`)
12. POS walk-in sale & receipt generation (`/api/pos/sale`)
13. Static media asset delivery (`/uploads/...`)

---

## 🛠️ Reverse Engineering Findings

1. **Framework & Architecture**:
   - The application frontend is a modern Vite + React 18 Single-Page Application with dynamic code-splitting across 118 route chunks.
   - The backend runs on Node.js / Express with JWT authentication and RESTful endpoints.
   - Built-in geo-database contains all 64 districts and all upazilas/thanas of Bangladesh (`bdGeo-Bz1oxGwR.js`).
2. **Business Engine**:
   - Free shipping thresholds (default ৳1500) and location-dependent shipping rates (Dhaka: ৳70, Outside Dhaka: ৳120).
   - In-store POS module with cash float tracking, hold orders, and walk-in sales receipts.
   - Courier integrations configured for Pathao, Steadfast, RedX, and CarryBee.
   - Multi-channel marketing support: Meta Conversions API (CAPI), GTM, and Pixel tracking.
