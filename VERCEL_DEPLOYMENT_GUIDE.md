# Vercel Deployment Guide - WoodlandSuite Frontend

## Overview
The frontend is now configured for Vercel hosting with environment-based API URL switching.

## Configuration Files Updated
- ✅ `.env` - Local development (http://localhost:5000)
- ✅ `.env.production` - Production environment (update with your API URL)
- ✅ `vercel.json` - Vercel-specific settings with build/rewrite configuration
- ✅ `vite.config.mjs` - Optimized build output and chunking for Vercel
- ✅ `src/api/auth.js` - Uses `import.meta.env.VITE_API_URL` for environment switching

## Deployment Steps

### 1. Connect Repository to Vercel
```bash
# Install Vercel CLI (optional, for local testing)
npm i -g vercel

# Deploy from command line
vercel

# Or connect via Vercel Dashboard
# - Go to https://vercel.com
# - Click "New Project"
# - Import your GitHub repository
# - Select the SIMS folder as root directory
```

### 2. Set Environment Variables on Vercel
In Vercel Dashboard → Settings → Environment Variables:

```
Name: VITE_API_URL
Value: https://your-api-domain.com
Environments: Production, Preview, Development
```

**Replace `https://your-api-domain.com` with your actual API endpoint**

### 3. Configure Project Settings
In Vercel Dashboard → Settings → General:

- **Framework**: Vite (auto-detected)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm ci`

### 4. Update .env.production
Edit `.env.production` and replace the placeholder:
```dotenv
VITE_API_URL=https://your-api-domain.com
```

## Local Development

### Running Locally
```bash
npm install
npm run dev
```

The app runs on `http://localhost:5173` with API calls to `http://localhost:5000`

### Building for Production
```bash
npm run build
npm run preview
```

Preview the production build at `http://localhost:4173`

## API Configuration

### How It Works
The API base URL is determined by:
1. Environment variable `VITE_API_URL` (set via .env files)
2. Fallback to `http://localhost:5000` if not set

### For Different Deployments
- **Local Dev**: Uses `.env` → `http://localhost:5000`
- **Vercel Production**: Uses `.env.production` + Vercel env var → Your API domain
- **Vercel Preview**: Uses Vercel environment variable → Your API domain

## Features Enabled

### ✅ Build Optimization
- Terser minification for smaller bundle size
- Manual code splitting for PrimeVue and Chart.js
- No source maps in production for faster deployment

### ✅ Caching Strategy
- Static assets cached for 1 year (immutable)
- Service worker compatible for offline support

### ✅ SPA Routing
- All routes redirect to `/index.html` for Vue Router
- Clean URLs without hash routing

### ✅ Development Experience
- Vite dev server on port 5173
- Hot module replacement (HMR) enabled
- Strict port disabled for flexibility

## Important Notes

### CORS Configuration
If your API is on a different domain:
1. Backend CORS must allow your Vercel domain
2. Update Flask CORS configuration:

```python
from flask_cors import CORS
CORS(app, origins=["https://your-domain.vercel.app"])
```

### API Endpoint Updates
After deployment, update any hardcoded API URLs:
- ❌ No hardcoded `http://127.0.0.1:5000`
- ✅ Use `import.meta.env.VITE_API_URL` everywhere

### JWT Token Handling
- Tokens are stored in localStorage
- Axios interceptors automatically attach JWT in `Authorization` header
- Verify CORS allows `Authorization` header on your API

## Troubleshooting

### Build Fails on Vercel
- Check `npm run build` locally first
- Ensure all environment variables are set in Vercel dashboard
- Check Node version compatibility in `package.json`

### API Calls Return 401/403
- Verify `VITE_API_URL` is set correctly
- Check backend CORS configuration
- Ensure JWT tokens are being stored/sent correctly

### Routing Issues (404 errors)
- Already configured in `vercel.json` with rewrite to `/index.html`
- If still issues, verify rewrite is enabled in Vercel dashboard

### Blank Page After Deployment
- Check browser console for errors
- Verify environment variables are set on Vercel
- Check API connectivity with network tab in DevTools

## Next Steps

1. **Update Backend API Domain**
   - Set your API backend to production URL
   - Enable CORS for Vercel domain

2. **Set Vercel Environment Variable**
   - Go to Vercel Dashboard
   - Add `VITE_API_URL` with your API domain

3. **Test Deployment**
   - Deploy to Vercel preview
   - Test API connectivity
   - Verify authentication flow

4. **Production Deployment**
   - Merge to main branch
   - Vercel auto-deploys
   - Monitor logs and performance

## Verification Checklist

- [ ] `.env.production` updated with API URL
- [ ] Environment variable set in Vercel dashboard
- [ ] Backend CORS configured for Vercel domain
- [ ] Local build works: `npm run build`
- [ ] Preview works: `npm run preview`
- [ ] API calls tested in production
- [ ] Authentication flow verified
