# Hostinger VPS Deployment (Next.js)

This app can run on your Hostinger Business VPS with a standard Node.js + PM2 + Nginx setup.

## 1) Prepare server

```bash
ssh root@YOUR_VPS_IP
apt update && apt upgrade -y
apt install -y git nginx
```

Install Node.js LTS (recommended: Node 22 via `nvm`):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
npm i -g pm2
```

## 2) Pull app and install deps

```bash
mkdir -p /var/www
cd /var/www
git clone YOUR_REPO_URL pragya-pravah-ui
cd pragya-pravah-ui
npm ci
```

## 3) Add production environment

Create `.env.production` (or use system env vars) with all required keys from your app, for example:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEON_DATABASE_URL` (if using Neon path)
- Any other API secrets used by server routes

## 4) Build and run with PM2

```bash
cd /var/www/pragya-pravah-ui
npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Health check:

```bash
curl -I http://127.0.0.1:3000
```

## 5) Configure Nginx reverse proxy

Create `/etc/nginx/sites-available/pragya-pravah-ui`:

```nginx
server {
  listen 80;
  server_name your-domain.com www.your-domain.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Enable site:

```bash
ln -s /etc/nginx/sites-available/pragya-pravah-ui /etc/nginx/sites-enabled/pragya-pravah-ui
nginx -t
systemctl reload nginx
```

## 6) Add SSL (Let’s Encrypt)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com -d www.your-domain.com
```

## 7) Update workflow (after each push)

```bash
cd /var/www/pragya-pravah-ui
git pull
npm ci
npm run build
pm2 restart pragya-pravah-ui
```

## Optional: Hostinger hPanel Node app deploy

If you later choose managed hosting instead of VPS operations, Hostinger also supports GitHub-based Node.js deployment from hPanel on eligible plans.
