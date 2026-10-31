# Deploying Alimenture (single VPS: Nginx + Node)

```
Browser ──HTTPS──> Nginx (alimenture.in)
                    ├─ /            static storefront  /var/www/alimenture/frontend/current  (pre-rendered)
                    ├─ /api/        → Node API  127.0.0.1:3000  (PM2)
                    └─ /socket.io/  → Node API  (WebSocket chat)
```

Storefront and API share one origin, which is what makes the httpOnly session
cookies (`alim_id`, `alim_rt`) work. Do not move the API to another domain
without revisiting `lib/session.js` in the backend.

## 1. One-time server setup

```bash
# Node 20 (matches .nvmrc / "engines"; Node 26 is not supported)
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 20 && nvm alias default 20
npm i -g pm2

sudo mkdir -p /var/www/alimenture/{frontend,backend} /var/www/certbot
sudo chown -R $USER /var/www/alimenture
git clone <frontend repo> /var/www/alimenture/frontend/repo
git clone <backend repo>  /var/www/alimenture/backend
```

## 2. Backend (API)

```bash
cd /var/www/alimenture/backend
cp .env.example .env      # fill in every value — see the comments in the file
npm ci --omit=dev
npm test                  # 42 tests, no network or database needed
```

Production `.env` must include at least:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` (also set by PM2) |
| `CORS_ORIGIN` | `https://alimenture.in` |
| `API_PUBLIC_URL` | `https://alimenture.in` |
| `TRUST_PROXY_HOPS` | `1` (Nginx only) or `2` (Cloudflare → Nginx) |
| `FIREBASE_SERVICE_ACCOUNT_JSON`, `FIREBASE_WEB_API_KEY` | from Firebase |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | live keys |
| `OTP_PEPPER`, `RESERVATION_CLEANUP_SECRET` | long random strings |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | transactional mail |
| `SITE_REBUILD_COMMAND` | `bash /var/www/alimenture/frontend/repo/deploy/rebuild-frontend.sh` |
| `ERROR_WEBHOOK_URL` | Slack/Discord webhook for error alerts |

**Once, when first deploying this version** (accounts are now required to have a
verified email; every existing account already proved it with an emailed code):

```bash
node scripts/backfill-email-verified.js           # dry run
node scripts/backfill-email-verified.js --apply
```

Start and persist:

```bash
pm2 start deploy/ecosystem.config.js --env production
pm2 save && pm2 startup          # follow the printed command
```

Stock reserved by abandoned checkouts is released every 5 minutes by the API
itself (no external cron needed).

## 3. Storefront

```bash
cd /var/www/alimenture/frontend/repo
cp .env.production.example .env.production
npm ci
bash deploy/rebuild-frontend.sh   # build → pre-render → SEO check → atomic switch
```

Let the API user reload Nginx after a build (redirects are regenerated):

```bash
echo "$USER ALL=(root) NOPASSWD: /usr/bin/systemctl reload nginx" | sudo tee /etc/sudoers.d/alimenture-reload
```

## 4. Nginx + TLS

```bash
sudo cp deploy/nginx/security-headers.conf /etc/nginx/snippets/alimenture-security-headers.conf
sudo cp deploy/nginx/alimenture.conf /etc/nginx/sites-available/alimenture.conf
sudo ln -sf /etc/nginx/sites-available/alimenture.conf /etc/nginx/sites-enabled/
sudo certbot certonly --webroot -w /var/www/certbot -d alimenture.in -d www.alimenture.in
sudo nginx -t && sudo systemctl reload nginx
```

`www.alimenture.in` needs a DNS A record pointing at the server before certbot.

TLS renewal: certbot installs a systemd timer. Confirm it and that Nginx reloads
after renewal:

```bash
systemctl list-timers | grep certbot
sudo certbot renew --dry-run
echo -e '#!/bin/sh\nsystemctl reload nginx' | sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

## 5. Firebase security rules

The site never uses the Firebase client SDK, so all direct access is denied:

```bash
cd /var/www/alimenture/backend
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules,storage --project <project-id>
```

## 6. After every deploy — verify

```bash
curl -sI https://alimenture.in | grep -iE 'strict-transport|content-security|x-frame'
curl -sI https://alimenture.in/product/<old-id> | grep -i location   # 301 → /products/<slug>
curl -s -o /dev/null -w '%{http_code}\n' https://alimenture.in/no-such-page   # 404
curl -s https://alimenture.in/api/health                                         # {"status":"ok",...}
curl -s https://alimenture.in/robots.txt | grep Sitemap                          # alimenture.in
```

Then in Google Search Console: add `alimenture.in`, submit `/sitemap.xml`, and
run a product URL through the Rich Results Test.

## Updating

```bash
cd /var/www/alimenture/backend && git pull && npm ci --omit=dev && npm test && pm2 reload alimenture-api
cd /var/www/alimenture/frontend/repo && git pull && npm ci && bash deploy/rebuild-frontend.sh
```

Rollback the storefront instantly:
`ln -sfn /var/www/alimenture/frontend/releases/<previous> /var/www/alimenture/frontend/current`
