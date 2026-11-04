# Feature Specification: Panjabi Brand Update & New Products Section Polish

```yaml
feature: panjabi_brand_and_new_products_header
version: 1.0.0
status: approved
created_at: 2026-11-04T10:55:00+06:00
priority: P1
authors:
  - Antigravity AI Pair Programmer
```

## 1. Overview & Context
The user requested three specific updates to the storefront's "New Products" section:
1. **Garment Brand Customization**: Update the 3 single Panjabi product images displayed under New Products (Green, Navy Blue, White) to feature the brand name **"EM-BRAND"** instead of "S BRAND" on the chest embroidery/print area.
2. **Section Title English Localization**: Replace the Bengali header text (`"নতুন পণ্য"`) with clean English (`"New Products"`).
3. **Badge Logo Removal**: Remove the star-like sparkle badge icon (`[ ✦ ]`) preceding the section title.

---

## 2. User Stories & Acceptance Criteria

### User Story 1 (P1): Garment Brand Update on Panjabi Images
As a store owner, I want the Panjabi product images to feature "EM-BRAND" on the chest so that the items accurately represent my custom brand identity.
- **Criteria 1.1**: The Green Panjabi image (`1790641675186_3baf66...jpg`) displays `EM-BRAND` in champagne gold metallic lettering on the left chest with seamless fabric background.
- **Criteria 1.2**: The Navy Blue Panjabi image (`1790641675628_fb6ead...jpg`) displays `EM-BRAND` in warm gold lettering with an elegant underline ornament on the left chest.
- **Criteria 1.3**: The White Panjabi image (`1790641675919_40760c...jpg`) displays `EM-BRAND` in bronze embroidery lettering on the left chest.
- **Criteria 1.4**: All updated images maintain their exact 1086x1448 resolution, high quality, and original file names across both `src/public/uploads/` and `data/uploads/`.
- **Criteria 1.5**: Original images are preserved in `data/backup_original_panjabis/`.

### User Story 2 (P2): Section Title English Localization
As a visitor, I want the section header to read "New Products" in English.
- **Criteria 2.1**: The title rendered in the DOM reads `"New Products"` instead of `"নতুন পণ্য"`.
- **Criteria 2.2**: The Bengali locale mapping in `src/public/assets/bn-B9K_tnSb.js` translates `New Arrivals` / `new arrivals` / `*New* Arrivals` to `"New Products"`.
- **Criteria 2.3**: Fallback defaults in `index-BIdHCx7F.js` and `index.js` render `"New Products"`.

### User Story 3 (P3): Star / Sparkle Icon Removal
As a store owner, I want the star-like sparkle badge removed from the New Products header for a sleek, minimalist aesthetic.
- **Criteria 3.1**: The `<span aria-hidden="true" ...><Sparkles /></span>` icon container preceding the header text is removed/hidden.
- **Criteria 3.2**: The `<h2>` heading cleanly aligns the `"New Products"` text without any star or sparkle badge.

---

## 3. BDD Scenarios (Gherkin)

```gherkin
Feature: New Products Section Customization

  Scenario: Panjabi images feature EM-BRAND
    Given the storefront is running on port 5050
    When a visitor browses the New Products section
    Then the green, navy blue, and white Panjabi images display "EM-BRAND" on the chest
    And the images load with HTTP 200 from /uploads/

  Scenario: New Products title displays English without star icon
    Given a visitor loads the home page
    When the New Products section renders
    Then the header text displays "New Products"
    And no star or sparkle icon badge is visible next to the heading
```
