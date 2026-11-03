# Implementation Tasks: Modern Next.js Full-Stack Architecture & Customization

Feature: E-Commerce Modernization, Hero Section, Branding & Fast Architecture
Branch: main

## Phase 1: Setup & Core Architecture
- [x] T001 Initialize Next.js App Router, Tailwind CSS, Lucide Icons, and TypeScript configuration in `package.json` and `next.config.js`
- [x] T002 Configure SQLite database access and service layers in `src/db/database.js` for server components and API routes
- [x] T003 Process and optimize user provided hero images (`hero imge/`) into `public/uploads/hero/`

## Phase 2: Core Components & Layout (Navbar & Footer)
- [x] T004 [P] Build modern responsive `components/Navbar.tsx` (brand logo, dynamic category menu, search input, cart trigger, contact info)
- [x] T005 [P] Build modern responsive `components/Footer.tsx` (store details, customer service, policies, payment badges, social links)
- [x] T006 Build root layout `app/layout.tsx` integrating fonts, metadata, Navbar, and Footer

## Phase 3: Hero Slider & Promotional Banners
- [x] T007 Build interactive `components/HeroSlider.tsx` using the 3 user-provided 2400x1040 images with auto-play, touch swipe, smooth transitions, and call-to-action buttons
- [x] T008 [P] Build `components/PromotionalBanners.tsx` for offer highlights, seasonal discounts, and category feature cards

## Phase 4: Product Catalog & Fast Checkout
- [x] T009 Build high-performance `components/ProductCard.tsx` and home product grid `components/HomeProductGrid.tsx`
- [x] T010 Build modern split-design checkout modal/page `components/CheckoutDrawer.tsx` with COD, Free shipping calculation, and Bangladesh district/thana cascading selectors

## Phase 5: Verification & Polish
- [x] T011 Verify Next.js build (`next build`), image optimization, and verify live rendering
- [x] T012 Git commit and push all newly implemented components to GitHub
