---
title: 24/7 Cloud Platform Production Deployment Specification
feature: cloud-platform-24-7-deployment
status: ready
target_platforms:
  - Render (Render Web Service / Blueprint)
  - Railway / Koyeb / Docker Container
date: 2026-11-06
author: Antigravity Agent
---

# Feature Specification: 24/7 Cloud Platform Production Deployment

## 1. Executive Summary
This specification defines the production deployment of the Familio Bazar e-commerce platform to a permanent 24/7 cloud container environment (such as Render.com or Railway.app).

Unlike local development tunnels (such as Cloudflare Quick Tunnels) which depend on the user's personal computer being powered on, cloud container hosting runs persistently in datacenter infrastructure. The application maintains 100% uptime independently of the developer's workstation, with automated SSL certificates, health monitoring, zero-downtime rolling deploys upon Git push, and compatibility with custom domains and Cloudflare CDN.

---

## 2. Architecture Comparison

### A. Ephemeral Local Tunnel (Previous Prototype)
- Upstream: Local workstation (`/home/emran/Documents/E-commers rea`)
- Availability: Only while PC is powered on, awake, and process is running.
- Failure Mode: PC shutdown or sleep drops tunnel; domain record is purged by Cloudflare (`NXDOMAIN`).

### B. Permanent 24/7 Cloud Container (Production)
- Upstream: Cloud Datacenter (Render / Railway / Container Host)
- Availability: 99.9%+ SLA, 24/7/365 independent of developer workstation.
- Storage & Bootstrap: Auto-seeds SQLite database from `data/schema.sql` and `data/seed.js` on clean container initialization.
- Network Edge: Cloudflare Anycast CDN or host-managed Edge SSL with automatic TLS 1.3 certificates.

---

## 3. Gherkin BDD Scenarios

### Scenario 1: Container Build & Runtime Verification
```gherkin
Scenario: Standalone Docker container initialization
  Given the codebase contains Dockerfile and package.json with Node 22 engines
  When the container image is built using `docker build`
  Then the build completes successfully with production dependencies
  And the container starts and responds to HTTP GET /api/settings with status 200
```

### Scenario 2: Zero-Configuration Fresh Database Bootstrap
```gherkin
Scenario: Automatic database initialization on fresh cloud clone
  Given a fresh deployment without existing SQLite database file
  When the application server boots
  Then src/db/database.js detects empty database
  And executes schema definition from data/schema.sql
  And populates catalog and admin accounts from data/seed.js
```

### Scenario 3: Persistent Edge Delivery & Uptime
```gherkin
Scenario: Uninterrupted public storefront accessibility
  Given the application is deployed to cloud platform
  When the developer turns off or disconnects their local computer
  Then public requests to the cloud HTTPS domain resolve with status 200
  And the storefront, shopping cart, admin panel, and POS terminal remain functional
```

---

## 4. Platform Deployment Configuration

### 4.1 Render Blueprint (`render.yaml`)
- Runtime: Node.js 22.14.0
- Build Command: `npm install`
- Start Command: `npm start`
- Auto-Deploy: Enabled on push to `main`

### 4.2 Universal Dockerfile
- Base Image: `node:22-alpine`
- Expose: Port 5000 (binds to `process.env.PORT`)
- Optimized `.dockerignore` excluding `.git`, `node_modules`, and local test runs.
