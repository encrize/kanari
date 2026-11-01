# Deployment Guide · Cloudflare Pages

This guide walks you through deploying **kanari** to **Cloudflare Pages** with high performance, edge caching, and automated CI/CD.

---

## Architecture Overview

- **Build Output:** Static SPA bundle (`dist/`)
- **SPA Routing:** Managed via `public/_redirects` (`/*  /index.html  200`)
- **Node Version:** 20.x or higher
- **Package Manager:** `pnpm` (or `npm`)

---

## Method 1: Git Integration via Cloudflare Dashboard (Recommended)

This method enables automatic preview deployments for pull requests and instant production deploys whenever you push to your `main` branch.

### Step 1: Push Code to GitHub / GitLab
Ensure your project is committed and pushed to your remote repository:
```bash
git init
git add .
git commit -m "feat: initial commit for kanari"
git branch -M main
git remote add origin https://github.com/<your-username>/kanari.git
git push -u origin main
```

### Step 2: Connect Repository to Cloudflare Pages
1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. In the left navigation, select **Workers & Pages**.
3. Click **Create Application** > **Pages** > **Connect to Git**.
4. Select your `kanari` repository and click **Begin setup**.

### Step 3: Configure Build & Deployment Settings
Fill in the configuration fields:

| Setting | Value |
|---|---|
| **Project name** | `kanari` (or your preferred subdomain) |
| **Production branch** | `main` |
| **Framework preset** | `Vite` |
| **Build command** | `pnpm build` *(or `npm run build`)* |
| **Build output directory** | `dist` |

### Step 4: Environment Variables (Crucial)
Under **Environment variables (advanced)**, add:
- `NODE_VERSION` = `20`
- `PNPM_VERSION` = `9` (if using pnpm)

### Step 5: Save and Deploy
Click **Save and Deploy**. Cloudflare Pages will fetch dependencies, execute tests/builds, and publish the static bundle globally across Cloudflare's edge network in seconds.

Your site will be live at:
`https://kanari.pages.dev`

---

## Method 2: Direct CLI Deployment using Wrangler

If you prefer deploying directly from your terminal or CI without connecting a Git repository:

### Step 1: Install Wrangler CLI
```bash
npm install -g wrangler
# or run directly with npx
```

### Step 2: Build the Production Bundle
```bash
pnpm install
pnpm build
```

### Step 3: Deploy to Cloudflare Pages
```bash
npx wrangler pages deploy dist --project-name kanari
```
On first run, Wrangler will prompt you to authenticate with your Cloudflare account.

---

## Custom Domain Setup

1. In the Cloudflare Dashboard, go to **Workers & Pages** > **kanari** > **Custom domains**.
2. Click **Set up a custom domain**.
3. Enter your apex domain or subdomain (e.g., `kanari.app` or `learn.yourdomain.com`).
4. If your domain's DNS is already on Cloudflare, DNS records and universal SSL certificates will be configured automatically.

---

## SPA Routing & Redirects

A `public/_redirects` file is included in the project:
```
/*    /index.html   200
```
When Vite builds the application, this file is copied directly into `dist/_redirects`, instructing Cloudflare Pages to route all deep links to `index.html` without 404 errors.

---

## Pre-deployment Verification Checklist

Run these commands locally prior to pushing changes:

```bash
# 1. Run all unit tests
pnpm test

# 2. Verify TypeScript typing
pnpm tsc --noEmit

# 3. Create production build
pnpm build

# 4. Preview locally
pnpm preview
```

When all checks pass, your deployment is ready for production.
