# Architecture Blueprint: Familio Bazar E-Commerce & POS Platform

---

## 1. System Architecture Overview

Familio Bazar is architected as an event-driven, decoupled modular web application designed for high-concurrency retail transactions, counter sales, and warehousing fulfillment. The system separates presentation, domain services, persistence, and external third-party integrations into distinct, loosely coupled layers.

```mermaid
flowchart TD
    Client["Client Devices: Web Browser / Mobile / POS Barcode Scanner"]
    EdgeProxy["Edge / Reverse Proxy: Nginx or Cloudflare (SSL & Caching)"]
    Express["Express Application Gateway (src/server.js)"]
    
    subgraph SecurityMiddleware["Security & Traffic Middleware"]
        Helmet["Helmet Security Headers"]
        Cors["CORS Policy Guard"]
        AuthMiddleware["JWT Authentication & RBAC (src/middleware/auth.js)"]
    end
    
    subgraph RouteControllers["Controller Domain Layer"]
        PublicRoutes["Public Catalog & Settings (src/routes/public.js)"]
        AuthRoutes["Dual-Identifier Auth (src/routes/auth.js)"]
        OrderRoutes["Order & Checkout Engine (src/routes/orders.js)"]
        AdminRoutes["Admin & Staff Operations (src/routes/admin.js)"]
        PosRoutes["POS Sales & Cash Drawers (src/routes/pos.js)"]
    end
    
    subgraph DomainServices["Service Business Logic"]
        OrderService["Order Calculation & Shipping Engine (src/services/orderService.js)"]
        InvoiceGenerator["Printable Invoice & Barcode Engine"]
        CourierService["Courier Dispatch & Webhook Receiver"]
    end
    
    subgraph PersistenceLayer["Data Persistence"]
        DB[(Embedded Relational DB: node:sqlite / PostgreSQL)]
        AutoBoot["Auto-Bootstrap Engine (Schema & Seed)"]
        StaticStorage["Asset Storage: /uploads & /assets"]
    end
    
    subgraph ExternalGateways["Third-Party Integrations"]
        CourierAPIs["Courier APIs: Pathao, Steadfast, Redx"]
        PaymentAPIs["Payment Gateways: bKash, Nagad, SSLCommerz"]
        SMSGateways["SMS Gateways: Greenweb, BulkSMS"]
    end

    Client --> EdgeProxy
    EdgeProxy --> Express
    Express --> Helmet --> Cors --> AuthMiddleware
    AuthMiddleware --> RouteControllers
    RouteControllers --> DomainServices
    DomainServices --> PersistenceLayer
    DomainServices --> ExternalGateways
    AutoBoot -.-> DB
```

---

## 2. Order Lifecycle State Machine

Orders transition through strict state transitions from creation to final delivery reconciliation.

```mermaid
stateDiagram-v2
    [*] --> Pending: Customer Checkout (COD / Gateway)
    Pending --> Confirmed: Staff Order Review & Fraud Verification
    Pending --> Cancelled: Customer or Staff Cancellation
    Confirmed --> Processing: Warehouse Allocation & Packing Slip
    Processing --> HandedOverToCourier: Parcel Consignment Booked (Pathao / Steadfast)
    HandedOverToCourier --> Shipped: Courier Pickup & Tracking ID Issued
    Shipped --> Delivered: Courier Delivery Webhook
    Shipped --> Returned: Delivery Failure / Customer Refusal
    Returned --> Restocked: Warehouse Intake & Inventory Reversal
    Delivered --> [*]
    Cancelled --> [*]
    Restocked --> [*]
```

---

## 3. Dual-Identifier Authentication Flow

The platform supports seamless dual-identifier sign-in, allowing users and staff to authenticate using either an email address or a valid Bangladeshi mobile number (`01XXXXXXXXX`).

```mermaid
sequenceDiagram
    autonumber
    actor User as User or Staff
    participant Client as Frontend SPA
    participant AuthRouter as /api/auth/login or /api/auth/signin
    participant DB as Relational Database
    participant JWT as Token Signer

    User->>Client: Enters Identifier (Email or Phone) and Password
    Client->>AuthRouter: POST { identifier, password }
    AuthRouter->>DB: Query user by email OR phone
    alt User Not Found
        DB-->>AuthRouter: Null Record
        AuthRouter-->>Client: 401 Unauthorized (Invalid credentials)
    else User Exists
        DB-->>AuthRouter: User Record (Hashed Password & Role)
        AuthRouter->>AuthRouter: Compare Bcrypt Salted Hash
        alt Password Mismatch
            AuthRouter-->>Client: 401 Unauthorized (Invalid credentials)
        else Password Valid
            AuthRouter->>JWT: Generate Signed JWT Token (User ID, Role, Permissions)
            JWT-->>AuthRouter: Signed Bearer Token
            AuthRouter-->>Client: 200 OK { token, user: { id, name, role, email, phone } }
            Client->>Client: Persist Token in Secure Local Session
        end
    end
```

---

## 4. Courier Logistics & Webhook Dispatch Pipeline

The logistics pipeline bridges internal warehouse fulfillment with external delivery carriers using normalized consignment structures.

```mermaid
flowchart LR
    subgraph InternalSystem["Familio Bazar Fulfillment"]
        AdminStaff["Fulfillment Staff"]
        OrderRecord["Order #DB-XXXX (Confirmed)"]
        DispatchEngine["Courier Dispatch Engine (orderService.js)"]
    end

    subgraph CourierNetwork["Courier APIs (Pathao / Steadfast / Redx)"]
        CourierAPI["Carrier Consignment Gateway"]
        CourierDelivery["Courier Field Rider"]
        WebhookNotifier["Carrier Webhook System"]
    end

    subgraph WebhookConsumer["Inbound Webhook Listener"]
        WebhookRoute["POST /api/webhooks/pathao"]
        StatusUpdater["Order Status & Tracking Sync"]
    end

    AdminStaff -->|Trigger Dispatch| DispatchEngine
    OrderRecord --> DispatchEngine
    DispatchEngine -->|Create Consignment POST| CourierAPI
    CourierAPI -->>|Return Consignment ID & Tracking URL| DispatchEngine
    DispatchEngine -->|Update Order Status to Shipped| OrderRecord
    CourierAPI --> CourierDelivery
    CourierDelivery -->|Customer Accepts Parcel| WebhookNotifier
    WebhookNotifier -->|POST Webhook Event: DELIVERED| WebhookRoute
    WebhookRoute --> StatusUpdater
    StatusUpdater -->|Mark Order as Delivered| OrderRecord
```

---

## 5. Database Entity-Relationship Model (ERD)

The relational schema is defined in `data/schema.sql`. It enforces referential integrity through foreign keys and cascading delete rules.

```mermaid
erDiagram
    USERS ||--o{ ORDERS : "places / manages"
    CATEGORIES ||--o{ CATEGORIES : "parent-child hierarchy"
    CATEGORIES ||--o{ PRODUCTS : "contains"
    BRANDS ||--o{ PRODUCTS : "manufactures"
    PRODUCTS ||--o{ PRODUCT_VARIATIONS : "has variants"
    ORDERS ||--o{ ORDER_ITEMS : "contains"
    PRODUCTS ||--o{ ORDER_ITEMS : "ordered as"
    COUPONS ||--o{ ORDERS : "applied to"
    POS_DRAWERS ||--o{ POS_SALES : "reconciles"

    USERS {
        int id PK
        string name
        string email UK
        string phone UK
        string password
        string role
        string status
        datetime created_at
    }

    CATEGORIES {
        int id PK
        string name
        string slug UK
        int parent_id FK
        string image
        int sort_order
        boolean is_featured
    }

    BRANDS {
        int id PK
        string name
        string slug UK
        string logo
    }

    PRODUCTS {
        int id PK
        string name
        string slug UK
        string sku UK
        int category_id FK
        int brand_id FK
        decimal regular_price
        decimal sale_price
        int stock_quantity
        boolean is_active
        json images
    }

    PRODUCT_VARIATIONS {
        int id PK
        int product_id FK
        string sku UK
        string attribute_values
        decimal price
        int stock_quantity
    }

    ORDERS {
        int id PK
        string order_number UK
        int user_id FK
        string customer_name
        string phone
        string address
        string district
        decimal subtotal
        decimal shipping_charge
        decimal discount
        decimal total
        string payment_method
        string payment_status
        string order_status
        string courier_name
        string tracking_id
        datetime created_at
    }

    ORDER_ITEMS {
        int id PK
        int order_id FK
        int product_id FK
        int variation_id FK
        string product_name
        decimal unit_price
        int quantity
        decimal total_price
    }

    COUPONS {
        int id PK
        string code UK
        string type
        decimal value
        decimal min_order_amount
        decimal max_discount
        int usage_limit
        int used_count
        string status
    }

    SETTINGS {
        string key PK
        text value
        datetime updated_at
    }

    POS_DRAWERS {
        int id PK
        int staff_id FK
        decimal opening_cash
        decimal closing_cash
        string status
        datetime opened_at
        datetime closed_at
    }

    POS_SALES {
        int id PK
        int drawer_id FK
        int order_id FK
        decimal paid_amount
        decimal change_amount
        string payment_type
        datetime created_at
    }
```

---

## 6. Zero-Trust Security & Threat Mitigation Standards

### Secrets Management
- No production secrets, private keys, or credentials are hardcoded into application source files or database seed artifacts.
- Credentials must be supplied via the environment (`.env`). The `.env.example` file uses standardized `[[VARIABLE_NAME]]` placeholders.
- The repository `.gitignore` strictly excludes `.env` and all SQLite database binary files (`*.sqlite`, `*.db`, `*.sqlite3`).

### Client-Side Trust Minimization
- Financial calculations (cart subtotal, coupon discounts, shipping rates, and taxes) are recomputed deterministically on the server inside `src/services/orderService.js`.
- Client-supplied line item prices are discarded in favor of current database catalog records to prevent price tampering attacks.

### Principle of Least Privilege
- Administrative APIs verify JWT signatures and extract user permissions on every request.
- Role checks prevent staff users from accessing super-admin configurations, payment gateway keys, or system-level settings.
