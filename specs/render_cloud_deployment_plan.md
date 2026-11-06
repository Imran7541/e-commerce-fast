---
title: Render Cloud 24/7 Deployment Plan (Option 1)
feature: render-cloud-deployment
status: approved
platform: Render.com Free Web Service
region: Singapore (ap-southeast-1)
runtime: Node.js 22.x
github_repo: https://github.com/Imran7541/e-commerce-fast
branch: main
date: 2026-11-06
author: Antigravity Agent
---

# Implementation Plan: 24/7 Cloud Platform Deployment via Render

## 1. Technical Context
- Upstream Codebase: Node.js 22 + Express 4.21 + SQLite (node:sqlite) + React 18 SPA.
- Source Repository: `https://github.com/Imran7541/e-commerce-fast` (Public GitHub repository on branch `main`).
- Auto-seeding: `src/db/database.js` automatically detects a missing SQLite file on fresh deployment, runs `data/schema.sql`, and executes `data/seed.js` to populate store settings, categories, products, and admin credentials.
- Container Port: Dynamic binding via `process.env.PORT` (defaults to 10000 on Render).

---

## 2. Phased Action Plan

### Phase 1: Authentication & Repository Connection (User Browser Action)
1. Open Render dashboard at `https://dashboard.render.com`.
2. Select "Sign in with GitHub" using the authenticated GitHub profile (`Imran7541`).
3. Authorize Render to access the repository `e-commerce-fast`.

### Phase 2: Web Service Provisioning
Option A (Direct Web Service UI):
- Click "New +" -> "Web Service".
- Select `Imran7541/e-commerce-fast`.
- Settings:
  - Name: `familio-bazar` (or desired slug)
  - Region: `Singapore`
  - Branch: `main`
  - Runtime: `Node`
  - Build Command: `npm install`
  - Start Command: `npm start`
  - Instance Type: `Free`
  - Environment Variable: `NODE_VERSION` = `22.14.0`

Option B (Blueprint Deployment via render.yaml):
- Click "New +" -> "Blueprint".
- Select `Imran7541/e-commerce-fast`.
- Render automatically provisions the service defined in `render.yaml`.

### Phase 3: Deployment Monitoring & Cold-Start Validation
1. Render clones the repository and runs `npm install`.
2. Render launches `npm start` (`node src/server.js`).
3. `src/db/database.js` detects the clean filesystem and auto-seeds all 26 catalog items and store configurations.
4. Render performs an HTTP health check and marks the service "Live".
5. A permanent public HTTPS URL is assigned: `https://<service-name>.onrender.com`.

### Phase 4: Verification & Smoke Testing
1. Storefront Verification: Visit `https://<service-name>.onrender.com/` to verify React 18 SPA, hero slider continuous auto-slide, and product browsing.
2. API Verification: Request `https://<service-name>.onrender.com/api/settings` and `/api/products` (expecting status 200 with catalog data).
3. Admin Verification: Log in at `https://<service-name>.onrender.com/admin` using `imrandt2001@gmail.com` / `admin123`.
4. Order Verification: Test public tracking at `https://<service-name>.onrender.com/api/orders/track` verifying PII masking.

### Phase 5: Cloudflare Custom Domain Integration (Optional Post-Deploy)
1. In Render Web Service settings, go to "Custom Domains".
2. Add custom domain (e.g., `store.yourdomain.com`).
3. In Cloudflare DNS dashboard, add a CNAME record pointing to Render's assigned host.
4. Cloudflare provides Anycast CDN caching, WAF, and edge SSL proxying in front of Render.

---

## 3. Risk Mitigation & Quality Gates
- Node Version Gate: Node `>=22.5.0` is strictly enforced via `package.json` engines and `NODE_VERSION=22.14.0` environment variable to ensure `node:sqlite` DatabaseSync is natively available.
- Zero Secrets in Git: Credentials remain safely resolved via runtime defaults and SQLite seed; no private keys exist in version control.
- Zero Emojis Constraint: Strictly maintained across all documentation, commits, and reports.
