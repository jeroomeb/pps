# Amenity Op's — Production Server & Infrastructure Documentation

This document serves as the complete operational, architectural, and deployment runbook for the **Amenity Op's** production environment hosted on **Hostinger VPS**.

---

## 1. Server & Host Specifications

| Parameter | Value |
| :--- | :--- |
| **Hosting Provider** | Hostinger VPS |
| **Server IP Address** | `148.230.108.195` |
| **Operating System** | Ubuntu 22.04.5 LTS (GNU/Linux 5.15.0-191-generic x86_64) |
| **Primary Domain** | `https://amenityops.app` |
| **Subdomain / Alternate** | `https://www.amenityops.app`, `https://portal.amenityops.app` |
| **Web Root Directory** | `/var/www/amenityops` |
| **Default SSH User** | `root` |
| **Default SSH Port** | `22` |
| **Node.js Runtime** | Node.js v20.x LTS |
| **Process Manager** | PM2 (Daemonized with Systemd auto-restart) |
| **Reverse Proxy** | Nginx |
| **SSL / HTTPS Provider** | Let's Encrypt (Certbot with auto-renewal) |

---

## 2. Architecture Map & Request Flow

```
                              [ User / Client Browser ]
                                          │
                                          │ (Port 80 / 443 HTTPS - SSL)
                                          ▼
                            ┌───────────────────────────┐
                            │    Nginx Reverse Proxy    │
                            │  (/etc/nginx/sites-*)     │
                            └─────────────┬─────────────┘
                                          │
                                          │ (Port 3000 HTTP internal proxy)
                                          ▼
                            ┌───────────────────────────┐
                            │   PM2 Process Manager     │
                            │    ("amenityops" app)     │
                            └─────────────┬─────────────┘
                                          │
                                          ▼
                            ┌───────────────────────────┐
                            │    Next.js Production     │
                            │   (/var/www/amenityops)   │
                            └─────────────┬─────────────┘
                                          │
                     ┌────────────────────┴────────────────────┐
                     ▼                                         ▼
        ┌──────────────────────────┐              ┌──────────────────────────┐
        │   Supabase Cloud DB      │              │       OpenAI API         │
        │   (Auth, Postgres, RAG)  │              │ (text-embedding-3-small, │
        │                          │              │       gpt-4o-mini)       │
        └──────────────────────────┘              └──────────────────────────┘
```

---

## 3. Connecting to the Server via SSH

From PowerShell, macOS Terminal, or Linux terminal:

```bash
ssh root@148.230.108.195
```

---

## 4. Directory Structure on VPS

```
/var/www/amenityops/
├── .env.local                  # Production environment variables (Secrets)
├── .github/workflows/deploy.yml# CI/CD automated deployment script
├── package.json                # Project dependencies and run scripts
├── public/                     # Static assets, PWA icons, Service Worker
│   ├── apple-touch-icon.png
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── icon-maskable-512.png
│   ├── logo-sm.png
│   └── sw.js
├── src/                        # Next.js App Router source code
│   ├── app/                    # Routes, APIs, Server Components
│   ├── components/             # Reusable UI & Client Components
│   └── lib/                    # Supabase DAL, Actions, PDF/Email generators, RAG
└── supabase/                   # Migrations & schema definitions
```

---

## 5. Environment Configuration (`/var/www/amenityops/.env.local`)

The production server uses `/var/www/amenityops/.env.local` to store secrets and configurations.

```ini
# Supabase Cloud Database & Auth
NEXT_PUBLIC_SUPABASE_URL=https://lxihknznkiarqyqfulgm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application Domain
NEXT_PUBLIC_SITE_URL=https://amenityops.app

# Email Sending (Resend)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=Amenity Op's <reports@amenityops.app>
EMAIL_FROM_ASSIGNMENTS=Amenity Op's <inspections@amenityops.app>
ADMIN_EMAIL=reports@amenityops.app

# Business Operating Timezone
APP_TIMEZONE=America/New_York

# OpenAI (Specialist RAG Knowledge Base & Embeddings)
OPENAI_API_KEY=your_openai_api_key
```

---

## 6. Process Management with PM2

PM2 manages the Next.js production process, keeping it alive continuously and restarting it automatically upon server reboot.

### Common PM2 Commands:

```bash
# Check status of the running app (CPU, Memory, Uptime)
pm2 status

# View live real-time output and error logs
pm2 logs amenityops

# View last 100 log lines
pm2 logs amenityops --lines 100

# Restart the application
pm2 restart amenityops

# Zero-downtime reload
pm2 reload amenityops

# Stop the application
pm2 stop amenityops

# Save current PM2 process list (must run after adding new processes)
pm2 save
```

---

## 7. Nginx Reverse Proxy Configuration

Nginx receives web traffic on port 80 (HTTP) and 443 (HTTPS), terminates SSL, and forwards requests internally to Next.js on port 3000.

### Configuration Path:
`/etc/nginx/sites-available/amenityops` (symlinked to `/etc/nginx/sites-enabled/amenityops`)

### Configuration Details:
```nginx
server {
    server_name amenityops.app www.amenityops.app portal.amenityops.app 148.230.108.195;

    client_max_body_size 50M; # Accommodates high-resolution photo uploads

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    listen 443 ssl; # Managed by Certbot
    # SSL certificates managed automatically by Certbot
}

server {
    if ($host = www.amenityops.app) {
        return 301 https://$host$request_uri;
    }
    if ($host = amenityops.app) {
        return 301 https://$host$request_uri;
    }

    listen 80;
    server_name amenityops.app www.amenityops.app portal.amenityops.app 148.230.108.195;
    return 404; # Managed by Certbot
}
```

### Nginx Maintenance Commands:
```bash
# Test Nginx configuration for syntax errors
nginx -t

# Reload Nginx without disconnecting existing users
systemctl reload nginx

# Restart Nginx service
systemctl restart nginx

# View Nginx access & error logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

---

## 8. SSL / HTTPS Certificates (Certbot)

SSL certificates are provided free by Let's Encrypt and renewed automatically via systemd timer.

```bash
# Check SSL certificate expiration and status
certbot certificates

# Test automated certificate renewal (dry run)
certbot renew --dry-run

# Manually renew certificates
certbot renew
```

---

## 9. Firewall & Security (UFW)

The server enforces strict firewall rules:

```bash
# View active firewall rules and open ports
ufw status verbose

# Expected open ports:
# 22/tcp (OpenSSH)          -> ALLOW IN
# 80/tcp (Nginx HTTP)       -> ALLOW IN
# 443/tcp (Nginx HTTPS)     -> ALLOW IN
```

---

## 10. Automated CI/CD Deployment (GitHub Actions)

Deployments are automated through `.github/workflows/deploy.yml`. 

### How It Works:
1. Every time a commit is pushed to the `main` branch on GitHub (`https://github.com/jeroomeb/pps`), GitHub Actions triggers.
2. It connects securely to the VPS via SSH using stored secrets (`VPS_HOST`, `VPS_USERNAME`, `VPS_SSH_KEY`).
3. It performs:
   - `git reset --hard HEAD` (Cleans any untracked diffs)
   - `git pull origin main` (Fetches latest commits)
   - `npm install` (Installs new dependencies)
   - `npm run build` (Compiles Next.js production bundle)
   - `pm2 reload amenityops` (Reloads app with zero downtime)

### Required GitHub Repository Secrets:
- `VPS_HOST`: `148.230.108.195`
- `VPS_USERNAME`: `root`
- `VPS_SSH_KEY`: Private SSH Key generated on the VPS

---

## 11. Manual Deployment & Rollback Runbook

If you ever need to manually update or roll back on the VPS without GitHub Actions:

```bash
# 1. Connect to VPS
ssh root@148.230.108.195

# 2. Navigate to project directory
cd /var/www/amenityops

# 3. Pull latest changes
git pull origin main

# 4. Install dependencies
npm install

# 5. Build the application
npm run build

# 6. Restart PM2 process
pm2 restart amenityops
```

### To Roll Back to a Previous Git Commit:
```bash
cd /var/www/amenityops
git reset --hard <COMMIT_HASH>
npm install
npm run build
pm2 restart amenityops
```

---

## 12. Troubleshooting & Diagnostic Commands

| Problem | Diagnosis Command | Solution |
| :--- | :--- | :--- |
| **502 Bad Gateway** | `pm2 status` and `pm2 logs` | Next.js process crashed or is down. Run `npm run build && pm2 restart amenityops`. |
| **Changes not showing** | `pm2 logs` and `git status` | Code pulled but build was skipped. Run `npm run build && pm2 reload amenityops`. |
| **Database connection error** | `cat /var/www/amenityops/.env.local` | Check Supabase URL, Anon Key, and Service Role Key in `.env.local`. |
| **Port 3000 collision** | `netstat -tulnp \| grep :3000` | Identify rogue Node process and kill via `kill -9 <PID>`. |
| **Disk space running out** | `df -h` | Clean old build artifacts: `rm -rf /var/www/amenityops/.next/cache`. |
