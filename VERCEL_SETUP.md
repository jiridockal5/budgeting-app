# Vercel Environment Variables Setup Guide

## Required Environment Variables

Copy and paste these exact values into your Vercel project settings:

### 1. NEXT_PUBLIC_SUPABASE_URL
```
https://puiswljpjrodpnflopdp.supabase.co
```
**Important:** No trailing slash, no typos

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
Get this from: Supabase Dashboard → Settings → API → anon/public key

It should be a long JWT token starting with `eyJ...`

### 3. DATABASE_URL (Session Pooler - Recommended for Vercel)
```
postgresql://postgres.puiswljpjrodpnflopdp:CT5ya4CB3dSB%24X%21@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?sslmode=require
```

**Password encoding:**
- `$` = `%24`
- `!` = `%21`

**Why Session Pooler?**
- IPv4 compatible (required for Vercel)
- Better for serverless functions
- Handles connection pooling automatically

## How to Set in Vercel

1. Go to: https://vercel.com/dashboard
2. Select your project: `budgeting-app`
3. Go to: **Settings** → **Environment Variables**
4. Add each variable:
   - Click "Add New"
   - Enter the **Name** (exactly as shown above)
   - Paste the **Value**
   - Select **"All Environments"**
   - Click **"Save"**

## After Setting Variables

1. **Redeploy your app:**
   - Go to **Deployments** tab
   - Click the **"..."** menu on the latest deployment
   - Select **"Redeploy"**
   - Or wait for auto-deployment from next git push

2. **Verify the setup:**
   - Visit: `https://budgeting-app-ruddy-seven.vercel.app/verify`
   - All variables should show "SET" (green badges)
   - Connection tests should show "✓ Connected" and "✓ Working"

3. **Test login:**
   - Visit: `https://budgeting-app-ruddy-seven.vercel.app/login`
   - Try logging in with your credentials

## Troubleshooting

### "Failed to fetch" error
- Check that `NEXT_PUBLIC_SUPABASE_URL` is exactly: `https://puiswljpjrodpnflopdp.supabase.co`
- Verify no trailing slash or typos
- Make sure Supabase project is not paused

### Database connection errors
- Verify `DATABASE_URL` uses Session Pooler (port 6543, not 5432)
- Check password is URL-encoded correctly
- Ensure region is `eu-north-1` (or your actual region)

### Variables not updating
- After changing variables, you MUST redeploy
- Environment variables are only loaded during build time
- Check deployment logs for errors

## Alternative: Use Supabase Integration

Instead of manually setting variables, you can use the Supabase + Vercel integration:

1. Go to: https://supabase.com/dashboard/project/puiswljpjrodpnflopdp/integrations/vercel
2. Select your Vercel project
3. Click "Connect project"
4. This will automatically set all variables

**Note:** The integration sets `POSTGRES_PRISMA_URL` instead of `DATABASE_URL`, which is fine - our code supports both.
