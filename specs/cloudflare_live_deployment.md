---
title: Cloudflare Zero-Trust Live Deployment Specification
feature: cloudflare-live-deployment
status: draft
target_service: Cloudflare Tunnel (cloudflared)
local_upstream: http://localhost:5050
date: 2026-11-05
author: Antigravity Agent
---

# Feature Specification: Cloudflare Zero-Trust Live Deployment

## 1. Executive Summary
This specification defines the production-grade deployment of the Familio Bazar e-commerce platform onto Cloudflare's global edge network using Cloudflare Zero-Trust Tunnel (`cloudflared`).

This architecture connects the local Express backend, SQLite database, static React 18 SPA bundles, and media upload pipeline directly to Cloudflare without requiring open firewall ports, public IP exposure, or complex serverless database refactoring. The site gains instant global Anycast routing, DDoS protection, edge caching, and end-to-end HTTPS.

---

## 2. Architectural Architecture

```text
+-------------------------------------------------------------------------+
|                         Cloudflare Edge Network                         |
|   - Anycast DNS & Edge Caching                                          |
|   - Auto-SSL (Let's Encrypt / Cloudflare Edge TLS 1.3)                  |
|   - WAF, DDoS Mitigation & Rate Limiting                                |
+------------------------------------+------------------------------------+
                                     |
                                     | Secure Outbound QUIC/HTTP2 Tunnel
                                     v
+-------------------------------------------------------------------------+
|                     Local Machine / Production Host                     |
|                                                                         |
|   [ cloudflared daemon ] <---> Outbound connection to Cloudflare edge   |
|            |                                                            |
|            v HTTP/1.1 Loopback (127.0.0.1:5050)                         |
|   [ Familio Bazar Node.js Express Server ]                              |
|            |                                                            |
|            +---> SQLite DB (`data/ecommerce.sqlite`)                    |
|            +---> Media Storage (`data/uploads/`, `src/public/uploads/`) |
|            +---> React 18 SPA Client Bundles (`src/public/`)            |
|            +---> Order & Courier Service (`src/services/`)              |
|            +---> POS & Admin Suite (`/admin`, `/pos`)                   |
+-------------------------------------------------------------------------+
```

---

## 3. Gherkin BDD Scenarios

### Scenario 1: Cloudflared CLI Binary Installation & Verification
```gherkin
Scenario: Cloudflared daemon installation
  Given the host machine runs Linux x86_64
  When the cloudflared binary is installed to ~/.local/bin/cloudflared
  Then running `cloudflared --version` exits with code 0 and outputs the release version
```

### Scenario 2: Quick Tunnel Live Connection Initialization
```gherkin
Scenario: Quick Tunnel live session establishment
  Given the local e-commerce server is actively listening on port 5050
  When cloudflared launches a quick tunnel targeting http://127.0.0.1:5050
  Then cloudflared establishes an outbound connection to Cloudflare Edge
  And returns an active HTTPS URL with subdomain format `https://<unique-subdomain>.trycloudflare.com`
```

### Scenario 3: Storefront Delivery via Cloudflare Edge
```gherkin
Scenario: Public storefront accessibility via Cloudflare HTTPS
  Given the Cloudflare tunnel is running
  When an anonymous user requests `https://<tunnel-domain>/`
  Then the response status is 200 OK
  And the content contains the Familio Bazar React SPA shell
  And static assets and images resolve with 200 OK over HTTPS
```

### Scenario 4: Admin, Checkout and API Operation over Tunnel
```gherkin
Scenario: Dynamic API, Checkout, and Admin Panel functionality
  Given the Cloudflare tunnel is active
  When a user places an order or admin logs in via the Cloudflare HTTPS domain
  Then the request is securely proxied to the local Express backend
  And order tracking, auth tokens, and media requests execute identically to local environment
  And sensitive credentials and PII remain masked
```

---

## 4. Operational Requirements & Security Boundaries
1. Zero Secrets in Git: Tunnel credentials or runtime tokens must never be committed to source control.
2. Protocol Support: Cloudflare Tunnel operates outbound over port 7844 (UDP/QUIC) or port 443 (TCP/HTTPS), requiring no inbound router port forwarding.
3. Zero Emojis: Strict compliance with repository-wide zero-emoji constraint across all documentation, scripts, and commit messages.
4. Daemon Resilience: Cloudflared process managed as a background service or script with health checks and graceful restart capability.
