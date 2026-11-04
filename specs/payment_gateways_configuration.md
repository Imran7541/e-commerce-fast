# Feature Specification: Payment Gateways (bKash, Nagad, SSLCommerz) Configuration (Phase 4)

```yaml
feature: payment_gateways_configuration
phase: 4
status: approved
priority: P1
endpoints:
  - "GET /api/admin/payment-gateways"
  - "PUT /api/admin/payment-gateways"
  - "PUT /api/admin/payment-gateways/:id"
  - "POST /api/admin/payment-gateways/:id/test"
  - "GET /api/admin/payment-transactions"
gateways:
  - id: "bkash"
    name: "bKash Tokenized Checkout"
    fields: [appKey, appSecret, username, password]
  - id: "nagad"
    name: "Nagad Online Payment"
    fields: [merchantId, merchantNumber, merchantPrivateKey, pgPublicKey]
  - id: "sslcommerz"
    name: "SSLCommerz Multi-Gateway"
    fields: [storeId, storePassword]
```

## 1. Overview
Phase 4 provides full payment gateway administration and secure credential management:
1. **Secure Credential Storage & Masking**:
   - Stores payment gateway keys and configuration safely inside SQLite `settings` table (`payment_gateways_config`).
   - Masks sensitive secrets (`appSecret`, `password`, `merchantPrivateKey`, `storePassword`) when returning data to the frontend so private keys are never exposed in browser inspectors or logs.
   - When updating settings, if secret fields are sent empty, existing stored credentials are preserved without accidental overwrite.
   - Strictly enforces Zero Ambient Authority: no credentials or secrets are ever hardcoded or committed to git repository.
2. **Gateway Verification & Transaction Audit**:
   - Validates gateway readiness via test endpoint (`POST /api/admin/payment-gateways/:id/test`).
   - Exposes transaction auditing ledger (`GET /api/admin/payment-transactions`).

## 2. Gherkin BDD Scenarios

```gherkin
Feature: Payment Gateways Configuration

  Scenario: Admin retrieves payment gateway configurations
    Given an authenticated request with Admin JWT
    When a GET request is sent to "/api/admin/payment-gateways"
    Then the response status should be 200
    And the response body should contain "bkash", "nagad", and "sslcommerz"
    And sensitive secrets should be masked or empty for security

  Scenario: Admin saves gateway settings
    Given an authenticated request with Admin JWT
    When a PUT request is sent to "/api/admin/payment-gateways" with:
      | bkash | {"enabled": true, "appKey": "test_app_key", "mode": "sandbox"} |
    Then the response status should be 200
    And the configuration should be persisted in database

  Scenario: Admin tests gateway connectivity
    Given an authenticated request with Admin JWT
    When a POST request is sent to "/api/admin/payment-gateways/bkash/test"
    Then the response status should be 200
    And the response body should indicate successful verification
```
