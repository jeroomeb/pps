# Production Infrastructure & Deployment Runbook: Coolify on Hostinger VPS

**Application:** Amenity Op's (`https://amenityops.app`)  
**Deployment Engine:** Coolify (v4.x) with Docker & Traefik Reverse Proxy  
**Hosting Infrastructure:** Hostinger VPS (`187.124.132.193`)  
**Date Configured:** November 2026  
**Status:** Live, Fully Operational & Verified with Automated CI/CD  

---

## 1. Architecture Overview

Amenity Op's has transitioned from legacy standalone PM2 + manual Nginx to an enterprise-grade containerized infrastructure managed by **Coolify**.

```
                           [ User / Client Browser ]
                                       │
                                       │ (Port 80 / 443 HTTPS - SSL)
                                       ▼
                     ┌───────────────────────────────────┐
                     │   Traefik v3.7 (Coolify Proxy)    │
                     │  - Automatic Let's Encrypt SSL    │
                     │  - HTTP -> HTTPS Auto Redirect    │
                     └─────────────────┬─────────────────┘
                                       │
                                       │ Internal Docker Network (Bridge)
                                       ▼
                     ┌───────────────────────────────────┐
                     │      Amenity Op's Container       │
                     │  - Image: Nixpacks / Railpack     │
                     │  - Runtime: Node.js (Next.js 16)  │
                     │  - Internal Port: 3000            │
                     └─────────────────┬─────────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
  ┌───────────────────────────┐                 ┌───────────────────────────┐
  │    Supabase Cloud DB      │                 │      Resend Email API     │
  │  (Postgres, Auth, RAG)    │                 │  (reports@amenityops.app) │
  └───────────────────────────┘                 └───────────────────────────┘
```

---

## 2. Server & Service Inventory

| Parameter | Specification / Value |
| :--- | :--- |
| **Server IP** | `187.124.132.193` |
| **Coolify Dashboard URL** | `http://187.124.132.193:8000` |
| **Production Domains** | `https://amenityops.app`, `https://www.amenityops.app` |
| **GitHub Source Repository** | `https://github.com/jeroomeb/pps.git` |
| **Active Production Branch** | `main` |
| **Internal Application Port** | `3000` |
| **Buildpack** | Railpack / Nixpacks (Next.js App Router optimized) |
| **SSL Provider** | Let's Encrypt (Automated issuance via Coolify Traefik) |

---

## 3. What Was Done: Root Cause Analysis & Resolution

### The Problem Encountered
1. **Accidental Server Wipe & Traefik Conflict:**
   - The VPS OS had been wiped and restored by the client, installing a Hostinger container template containing Coolify.
   - Coolify's default proxy (Traefik) bound to ports `80` and `443`.
   - Browsers navigating to `https://amenityops.app` encountered `NET::ERR_CERT_AUTHORITY_INVALID` ("Your connection is not private") because Traefik was serving its fallback untrusted `TRAEFIK DEFAULT CERT` before the domain had been mapped to an application in Coolify.
2. **Internal Server Error on `/login`:**
   - When the project was initially deployed in Coolify, the client-side/server-side environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, etc.) had not been provided or baked into the container, causing Next.js App Router Server Components to fail during initial render.

### The Resolution Applied
1. **Domain & Route Configuration in Coolify:**
   - Created/configured the `amenityops-app` production resource under the `AmenityOps` project.
   - Assigned primary and secondary domains: `https://amenityops.app,https://www.amenityops.app`.
   - Traefik automatically completed ACME HTTP-01 challenges with Let's Encrypt, securing the site with trusted HTTPS and resolving all browser warnings.
2. **Environment Variable Injection:**
   - Added all production environment secrets to the Coolify resource.
   - Marked public variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`) as **Build Variables** so Next.js embeds them into the production output at compile-time.
3. **Container Rollout:**
   - Triggered container build via Railpack, verified Next.js compilation, and executed a rolling zero-downtime container update.
   - Tested live `/login`, dashboard, and inspection modules — all returning HTTP 200 OK.

---

## 4. Production Environment Variables Reference

These variables are securely stored in the Coolify resource configuration:

```ini
# Supabase Database & Auth (Required at Build Time & Runtime)
NEXT_PUBLIC_SUPABASE_URL=https://lxihknznkiarqyqfulgm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[REDACTED_PUBLIC_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[REDACTED_SERVICE_ROLE_KEY]

# Application Canonical URL
NEXT_PUBLIC_SITE_URL=https://amenityops.app

# Email Infrastructure (Resend)
RESEND_API_KEY=[REDACTED_RESEND_API_KEY]
EMAIL_FROM=Amenity Op's <reports@amenityops.app>
EMAIL_FROM_ASSIGNMENTS=Amenity Op's <inspections@amenityops.app>
ADMIN_EMAIL=admin@amenityops.com
EMAIL_REPLY_TO=hello@amenityops.com

# AI Operations & Specialist Assistant
OPENAI_API_KEY=[REDACTED_OPENAI_API_KEY]
```

---

## 5. Automated CI/CD (Continuous Deployment via GitHub)

Coolify automatically deploys updates whenever code is pushed to GitHub:

### How Continuous Deployment Works
1. A developer pushes commits to `origin/main` on GitHub (`git push`).
2. GitHub sends a webhook POST payload to Coolify's Webhook endpoint (`http://187.124.132.193:8000/webhooks/...`).
3. Coolify triggers a new background build:
   - Clones latest commit from `main`.
   - Runs `npm install` and `npm run build`.
   - Starts the new Docker container.
   - Verifies container health on port `3000`.
   - Switches Traefik routing to the new container and shuts down the old container (Zero-downtime rolling update).

### Manual Redeploy via Coolify UI
If a rebuild is needed without pushing code:
1. Open Coolify: `http://187.124.132.193:8000`.
2. Navigate to **AmenityOps** -> **production** -> **amenityops.app**.
3. Click the purple **Redeploy** button in the top-right corner.

---

## 6. Daily Operations & Troubleshooting Runbook

### How to Check Logs
- **Option 1 (Coolify Web UI):**
  - Go to the application in Coolify.
  - Click **Runtime Logs** to see live Next.js server console logs and API errors.
  - Click **Deployment Logs** to see container build and compile history.
- **Option 2 (VPS Terminal CLI):**
  - SSH into VPS: `ssh root@187.124.132.193`
  - Find container ID: `docker ps | grep amenityops`
  - View live logs: `docker logs -f <CONTAINER_ID> --tail 100`

### How to Restart the App
- In Coolify, click **Restart** (or trigger **Redeploy**).
- Via CLI: `docker restart <CONTAINER_ID>`.

### If SSL Ever Lapses or Needs Renewal
Coolify and Traefik handle Let's Encrypt renewals automatically 30 days before expiration. If manual renewal is ever needed:
- In Coolify, navigate to application **Domains**.
- Click **Save / Update** or click **Force SSL Renewal** in the Traefik proxy settings.

