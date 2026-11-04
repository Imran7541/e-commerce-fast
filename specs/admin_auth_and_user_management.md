# Feature Specification: Admin Authentication & Staff User Management (Phase 1)

```yaml
feature: admin_auth_and_user_management
phase: 1
status: approved
priority: P1
admin_credentials:
  email: "imrandt2001@gmail.com"
  phone: "01787877362"
  name: "Imran (Super Admin)"
  password_default: "admin123"
  login_modes:
    - "email: imrandt2001@gmail.com"
    - "phone: 01787877362"
    - "legacy_alias: admin@digitalbazar.com"
endpoints:
  - "POST /api/auth/login" (dual identifier login: email or phone)
  - "GET /api/auth/me" (current authenticated admin user)
  - "PUT /api/auth/profile" (update self profile name, email, phone)
  - "PUT /api/auth/change-password" (update password with verification)
  - "GET /api/admin/users" (list all admin & staff members)
  - "POST /api/admin/users" (create staff member)
  - "PUT /api/admin/users/:id" (update staff member)
  - "DELETE /api/admin/users/:id" (delete staff member)
```

## 1. Overview
As requested by the user ("phase 1 theke suro koro"), Phase 1 establishes the admin identity, authentication security, and staff management system:
1. Transition Super Admin credentials from placeholder `admin@digitalbazar.com` to the user's authentic contact credentials:
   - Primary Email: `imrandt2001@gmail.com`
   - Primary Phone: `01787877362`
   - Name: `Imran (Super Admin)`
2. Enable modern dual-identifier login: allowing the administrator to sign in using either their email (`imrandt2001@gmail.com`) OR their phone number (`01787877362`), while maintaining backward compatibility for automated tests.
3. Provide complete staff user management endpoints (`/api/admin/users` GET, POST, PUT, DELETE) required by the `AdminStaffPage` UI in the React client, allowing the administrator to add managers, POS cashiers, and support staff with granular permissions.
4. Provide password change and profile update endpoints with bcrypt encryption.

---

## 2. Gherkin BDD Scenarios

```gherkin
Feature: Admin Authentication & Staff Management

  Scenario: Admin logs in using primary email
    Given the admin user exists with email "imrandt2001@gmail.com" and password "admin123"
    When a POST request is sent to "/api/auth/login" with:
      | email    | imrandt2001@gmail.com |
      | password | admin123              |
    Then the response status should be 200
    And the response should contain a valid JWT "token"
    And "user.email" should equal "imrandt2001@gmail.com"
    And "user.role" should equal "super_admin"

  Scenario: Admin logs in using phone number
    Given the admin user has phone number "01787877362"
    When a POST request is sent to "/api/auth/login" with:
      | email    | 01787877362 |
      | password | admin123    |
    Then the response status should be 200
    And the response should contain a valid JWT "token"
    And "user.phone" should equal "01787877362"

  Scenario: Admin views staff list
    Given an authenticated request with Super Admin JWT
    When a GET request is sent to "/api/admin/users"
    Then the response status should be 200
    And the response body should be an array of users
    And password hashes must NOT be exposed in the response
    And the list should include user with email "imrandt2001@gmail.com"

  Scenario: Admin creates a new staff member
    Given an authenticated request with Super Admin JWT
    When a POST request is sent to "/api/admin/users" with:
      | name        | Sales Staff           |
      | email       | staff@familiobazar.com|
      | phone       | 01711223355           |
      | role        | manager               |
      | permissions | ["products", "orders"]|
      | password    | staffpass123          |
    Then the response status should be 201
    And the new user should be stored with a bcrypt password hash
```
