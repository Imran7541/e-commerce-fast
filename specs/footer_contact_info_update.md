# Feature Specification: Footer & Site-wide Contact Information Update

```yaml
feature: footer_contact_info_update
status: approved
priority: P1
contact_details:
  phone: "01787877362"
  email: "imrandt2001@gmail.com"
  location: "House #24, Road #03, Sector #11, Uttara, Dhaka-1230"
  description: "Familio Bazar একটি বিশ্বস্ত অনলাইন শপিং প্ল্যাটফর্ম। ফ্যাশন, লাইফস্টাইল ও নিত্যপ্রয়োজনীয় পণ্য সহজে অর্ডার এবং সুবিধাজনকভাবে ডেলিভারি পাওয়ার জন্য আমরা আন্তরিকতার সাথে সেবা দিয়ে থাকি।"
affected_entities:
  - sqlite: "settings (keys: footer_config, general, topbar, product_contact_config, chat_config, social_config, pages)"
  - json_seed: "data/extracted_backend_data/settings.json"
  - html: "src/public/index.html (SEO snapshot footer and contact links)"
  - test: "tests/api.test.js"
```

## 1. Overview
The user requested updating the footer contact information:
- Phone number: `01787877362`
- Email: `imrandt2001@gmail.com`
- Location: Dhaka address (`House #24, Road #03, Sector #11, Uttara, Dhaka-1230`)

To ensure 100% architectural consistency and zero broken or stale contact references across the entire e-commerce application, the contact details must be updated systematically in the SQLite `settings` table (`footer_config`, `general`, `topbar`, `product_contact_config`, `chat_config`, `social_config`, `pages`), the JSON seed file (`data/extracted_backend_data/settings.json`), and the boot-shell SEO snapshot in `src/public/index.html`. In addition, the footer description text must be updated from legacy medicine text to Familio Bazar e-commerce branding.

---

## 2. Gherkin BDD Scenarios

```gherkin
Feature: Contact Information Management

  Scenario: Public API settings returns updated footer contact info
    Given the Express server is running on port 5050
    When a client sends a GET request to "/api/settings"
    Then the response status code should be 200
    And "footer_config.phone" should equal "01787877362"
    And "footer_config.email" should equal "imrandt2001@gmail.com"
    And "footer_config.address" should contain "Uttara, Dhaka"
    And "general.phone" should equal "01787877362"
    And "general.address" should contain "Uttara, Dhaka"
    And "topbar.phoneText" should equal "01787877362"
    And "product_contact_config.callNumber" should equal "01787877362"

  Scenario: Contact & Location page reflects Dhaka address and new phone
    Given the SQLite settings table contains the updated "pages" configuration
    When a user visits "/page/contact" or inspects the contact page in settings
    Then the content should contain "01787877362"
    And the content should contain "imrandt2001@gmail.com"
    And the content should contain "Uttara, Dhaka"
    And legacy Chuadanga address should not be present

  Scenario: SEO HTML snapshot contains new contact info
    Given the static HTML file "src/public/index.html"
    When inspecting the footer SEO snapshot inside the root boot-shell
    Then it should contain "tel:+8801787877362"
    And it should display address "House #24, Road #03, Sector #11, Uttara, Dhaka-1230"
```
