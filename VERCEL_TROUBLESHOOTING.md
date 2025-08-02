# Vercel Deployment Troubleshooting Guide

## Problem: Products Not Showing on Vercel

### 1. Check Database Connection

First, test your database connection using the new API endpoint:

```bash
# Visit this URL in your browser or use curl
curl https://your-vercel-app.vercel.app/api/test-db
```

### 2. Environment Variables

Make sure your environment variables are set correctly in Vercel:

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add/update these variables:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `NODE_ENV` - Set to `production`

### 3. Database Migration

Run database migrations on your production database:

```bash
# Set your production DATABASE_URL
export DATABASE_URL="your-production-database-url"

# Run migrations
npm run migrate-deploy
```

### 4. Check Database Content

Use the database check script:

```bash
# Set your production DATABASE_URL
export DATABASE_URL="your-production-database-url"

# Run the check
npm run check-db
```

### 5. Common Issues and Solutions

#### Issue 1: Database Connection Failed
**Symptoms:** API returns empty arrays or errors
**Solutions:**
- Check if DATABASE_URL is correct
- Ensure database is accessible from Vercel's servers
- Verify database credentials

#### Issue 2: No Products in Database
**Symptoms:** Database connects but no products found
**Solutions:**
- Check if products exist in your production database
- Verify products have `isActive: true`
- Import products to production database

#### Issue 3: Prisma Client Issues
**Symptoms:** Build errors or runtime errors
**Solutions:**
- Run `npx prisma generate` before deployment
- Ensure Prisma schema is up to date
- Check for migration conflicts

### 6. Debugging Steps

1. **Check Vercel Logs:**
   - Go to Vercel dashboard → Functions
   - Check for errors in `/api/products` function

2. **Test API Endpoints:**
   ```bash
   # Test products API
   curl https://your-app.vercel.app/api/products
   
   # Test database connection
   curl https://your-app.vercel.app/api/test-db
   ```

3. **Check Browser Console:**
   - Open browser developer tools
   - Check for JavaScript errors
   - Look at network requests to `/api/products`

### 7. Quick Fixes

#### Fix 1: Force Rebuild
```bash
# In Vercel dashboard, go to Deployments
# Click "Redeploy" with "Clear cache and deploy"
```

#### Fix 2: Update Environment Variables
```bash
# In Vercel dashboard, update DATABASE_URL
# Redeploy the application
```

#### Fix 3: Check Database Content
```sql
-- Run this in your database
SELECT COUNT(*) FROM products WHERE "isActive" = true;
SELECT * FROM products LIMIT 5;
```

### 8. Production Checklist

- [ ] DATABASE_URL is set correctly in Vercel
- [ ] Database migrations are applied
- [ ] Products exist in production database
- [ ] Products have `isActive: true`
- [ ] Categories exist and are linked to products
- [ ] No JavaScript errors in browser console
- [ ] API endpoints return data (not empty arrays)

### 9. Emergency Solutions

If products still don't show:

1. **Temporary Fix:** Add sample products directly to production database
2. **Fallback:** Show a message when no products are available
3. **Debug Mode:** Add more logging to identify the exact issue

### 10. Contact Support

If none of the above works:
1. Check Vercel status page
2. Review Vercel documentation
3. Contact Vercel support with your deployment logs 