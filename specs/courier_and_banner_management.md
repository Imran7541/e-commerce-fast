# Feature Specification: Courier Integration & Banner Management (Phase 5)

```yaml
feature: courier_and_banner_management
phase: 5
status: approved
priority: P1
endpoints:
  - "GET /api/admin/banners"
  - "POST /api/admin/banners"
  - "PUT /api/admin/banners/:id"
  - "DELETE /api/admin/banners/:id"
  - "GET /api/admin/courier/pathao/cities"
  - "GET /api/admin/courier/pathao/zones/:id"
  - "GET /api/admin/courier/pathao/areas/:id"
  - "GET /api/admin/courier/redx/areas"
  - "GET /api/admin/courier/carrybee/cities"
  - "GET /api/admin/courier/carrybee/zones/:id"
  - "GET /api/admin/courier/carrybee/areas/:id"
  - "POST /api/admin/orders/:id/courier-ship"
  - "POST /api/admin/orders/:id/courier-sync"
  - "POST /api/admin/courier/sync-all"
  - "POST /api/admin/courier/test"
  - "POST /api/webhooks/steadfast"
  - "POST /api/webhooks/pathao"
  - "POST /api/webhooks/redx"
```

## 1. Overview
Phase 5 empowers the store admin to manage dynamic visual banners and automated courier logistics:
1. **Banner Control Engine**:
   - Manage promotional banners across hero sections, popups, and sidebar grids.
   - Dynamic sorting, badge customisation, CTA buttons, and status toggles.
2. **Automated Courier Dispatch (Pathao, Steadfast, RedX, Carrybee)**:
   - City, Zone, and Area cascading lookups across Bangladesh.
   - One-click parcel booking with consignment tracking generation (`TRK-PAT-...`, `TRK-STF-...`).
   - Automated parcel status synchronisation with webhooks for real-time delivery tracking.

## 2. Gherkin BDD Scenarios

```gherkin
Feature: Courier & Banner Management

  Scenario: Admin manages hero banners
    Given an authenticated request with Admin JWT
    When a GET request is sent to "/api/admin/banners"
    Then the response status should be 200
    And the response body should be an array of banners

  Scenario: Admin queries Pathao geography
    Given an authenticated request with Admin JWT
    When a GET request is sent to "/api/admin/courier/pathao/cities"
    Then the response status should be 200
    And the response body should include "Dhaka"
```
