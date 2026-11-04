# Feature Specification: Order Management, Printable Invoice & Status Workflow (Phase 3)

```yaml
feature: order_management_and_invoice_engine
phase: 3
status: approved
priority: P1
endpoints:
  - "GET /api/admin/orders"
  - "GET /api/admin/orders/:id"
  - "POST /api/admin/orders"
  - "PUT /api/admin/orders/:id"
  - "PATCH /api/admin/orders/:id/status"
  - "PUT /api/admin/orders/:id/status"
  - "PATCH /api/admin/orders/:id/assign"
  - "PUT /api/admin/orders/:id/assign"
  - "DELETE /api/admin/orders/:id"
  - "POST /api/admin/orders/bulk"
  - "GET /api/admin/orders-staff"
  - "GET /api/admin/orders-customer-lookup"
  - "GET /api/admin/orders/invoices"
  - "GET /api/admin/orders/:id/invoice"
```

## 1. Overview
Phase 3 establishes the complete order lifecycle and invoicing workflow for FAMILIO BAZAR:
1. **Order Processing & Status Engine**:
   - Order filtering by status (`pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`, `returned`), search (order number, phone, customer name), and pagination.
   - Live order editing (updating customer address, changing items/quantities, applying custom shipping or discount).
   - Staff assignment to orders for delegated customer confirmation and packing.
   - Customer lookup with previous order history, success delivery rate, and fraud check.
   - Bulk actions (bulk status change, bulk delete).
2. **Professional Invoice & Packing Slip Engine**:
   - Multi-order batch invoice loader (`/api/admin/orders/invoices?ids=...`) for the admin printing queue.
   - Detailed single order dossier (`/api/admin/orders/:id`) containing store branding, full itemization, and totals.
   - Ready-to-print branded HTML invoice / memo view (`/api/admin/orders/:id/invoice`) with store header, QR/barcode, customer shipping details, items table, and signature footer.

## 2. Gherkin BDD Scenarios

```gherkin
Feature: Order Management & Invoice Engine

  Scenario: Admin inspects and updates single order
    Given an authenticated request with Admin JWT
    When a GET request is sent to "/api/admin/orders/1"
    Then the response status should be 200
    And "order.orderNumber" should be present
    And "order.items" should be an array of order items

  Scenario: Admin changes order status
    Given an authenticated request with Admin JWT
    When a PATCH request is sent to "/api/admin/orders/1/status" with:
      | status | confirmed |
    Then the response status should be 200
    And the order status in database should be "confirmed"

  Scenario: Admin assigns staff to order
    Given an authenticated request with Admin JWT
    When a PATCH request is sent to "/api/admin/orders/1/assign" with:
      | assignedTo | 2 |
    Then the response status should be 200
    And the order "assigned_to" should be 2

  Scenario: Admin loads batch invoices for printing
    Given an authenticated request with Admin JWT
    When a GET request is sent to "/api/admin/orders/invoices?ids=1"
    Then the response status should be 200
    And the response body should be an array of printable invoice objects
```
