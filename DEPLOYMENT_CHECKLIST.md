# PaperPal IQ - Deployment Checklist

## 1. Logo & Branding

### Favicon and App Icons
Place your logo files in the `app/` directory with these exact names:

```
app/
├── favicon.ico          # 32x32 or 48x48 ICO file
├── icon.png            # 512x512 PNG (for PWA)
├── apple-icon.png      # 180x180 PNG (for iOS)
└── opengraph-image.png # 1200x630 PNG (for social sharing)
```

Next.js will automatically detect and use these files.

### Alternative: Using icon.tsx
You can also generate an icon dynamically:

```typescript
// app/icon.tsx
import { ImageResponse } from 'next/og'

export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: 'linear-gradient(to bottom right, #2563eb, #3b82f6)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '20%',
        }}
      >
        PP
      </div>
    ),
    { ...size }
  )
}
```

### Logo in Header
Add logo to dashboard header in `app/dashboard/page.tsx`:

```tsx
import Image from "next/image"

// In the header section:
<div className="flex items-center gap-3">
  <Image src="/logo.png" alt="PaperPal IQ" width={40} height={40} />
  <h1 className="text-2xl font-bold text-gray-900">PaperPal IQ</h1>
</div>
```

Place `logo.png` in the `public/` directory.

## 2. Environment Variables

### Update .env.local for Production
Before deploying, you'll need to update:

```bash
# Production URL (update after deployment)
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Keep these secure and add to Vercel environment variables
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
```

**SECURITY WARNING**: Your `.env.local` file contains sensitive API keys. These should be:
1. Added to Vercel environment variables (not committed to git)
2. .env.local should be in .gitignore (it already is)
3. Remove the password comment on line 3

## 3. Security Issues to Fix

### Remove Sensitive Data from .env.local
```bash
# Remove this line from .env.local:
#password: gogineni123
```

### Check .gitignore
Ensure these are in `.gitignore`:
```
.env.local
.env*.local
.env.production
```

## 4. Production Configuration

### Add Vercel Configuration
Create `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "env": {
    "NEXT_PUBLIC_APP_URL": "@app-url"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Update Metadata
In `app/layout.tsx`, add more SEO metadata:

```typescript
export const metadata: Metadata = {
  title: "PaperPal IQ - AI Paper Summarizer",
  description: "Upload research papers and get intelligent summaries tailored to your audience",
  keywords: ["AI", "research papers", "summarization", "academic", "PDF"],
  authors: [{ name: "Your Name" }],
  openGraph: {
    title: "PaperPal IQ - AI Paper Summarizer",
    description: "Upload research papers and get intelligent summaries tailored to your audience",
    url: "https://your-domain.vercel.app",
    siteName: "PaperPal IQ",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PaperPal IQ - AI Paper Summarizer",
    description: "Upload research papers and get intelligent summaries tailored to your audience",
    images: ["/opengraph-image.png"],
  },
}
```

## 5. Supabase Configuration

### Update Redirect URLs
In Supabase Dashboard → Authentication → URL Configuration:

Add production URLs:
```
https://your-domain.vercel.app/auth/callback
https://your-domain.vercel.app/**
```

### Configure Storage CORS
In Supabase Dashboard → Storage → Configuration:

Add allowed origins:
```
https://your-domain.vercel.app
```

### Review RLS Policies
Verify all Row Level Security policies are working:
- `documents` table
- `summaries` table
- `rate_limits` table
- `papers` storage bucket

## 6. Performance Optimizations

### Add Loading Optimization
Already implemented:
- ✓ Skeleton loaders for document list
- ✓ Upload progress indicators
- ✓ Loading states on buttons

### Image Optimization
If you add images, use Next.js Image component:
```tsx
import Image from "next/image"
<Image src="/logo.png" alt="Logo" width={200} height={200} priority />
```

## 7. Monitoring & Analytics (Optional)

### Add Error Tracking
Consider adding Sentry:
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### Add Analytics
Consider adding:
- Vercel Analytics (built-in)
- Google Analytics
- PostHog (privacy-friendly)

## 8. Testing Before Deployment

### Run Production Build Locally
```bash
npm run build
npm start
```

### Test Critical Flows
- [ ] User signup and email confirmation
- [ ] User login
- [ ] File upload (various sizes, including near 10MB limit)
- [ ] Summary generation for all 5 audience levels
- [ ] Rate limiting (try generating 6 summaries in one day)
- [ ] Error states (try uploading wrong file type)
- [ ] 404 page (visit invalid URL)
- [ ] Mobile responsiveness

### Check for Console Errors
Open browser DevTools and verify:
- No console errors
- No 404s for resources
- No CORS errors

## 9. Deployment Steps

### Deploy to Vercel

1. **Push to GitHub**:
```bash
git add .
git commit -m "Ready for production deployment"
git push origin main
```

2. **Connect to Vercel**:
- Go to [vercel.com](https://vercel.com)
- Import your GitHub repository
- Vercel will auto-detect Next.js

3. **Configure Environment Variables**:
Add these in Vercel dashboard:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
NEXT_PUBLIC_APP_URL (use your vercel.app URL)
```

4. **Deploy**:
- Click "Deploy"
- Wait for build to complete
- Test your live site

5. **Update Supabase**:
- Add your Vercel URL to Supabase redirect URLs
- Update CORS settings

## 10. Post-Deployment

### Update Production URL
Once deployed, update:
- `NEXT_PUBLIC_APP_URL` in Vercel environment variables
- Supabase redirect URLs
- Any marketing materials

### Monitor Usage
- Check Supabase dashboard for user activity
- Monitor OpenAI API usage
- Watch for errors in Vercel logs

### Set Up Custom Domain (Optional)
In Vercel:
- Settings → Domains
- Add your custom domain
- Update DNS records
- Update all URLs in environment variables

## 11. Cost Monitoring

### Free Tier Limits
- Vercel: Unlimited bandwidth for hobby projects
- Supabase: 500MB database, 1GB file storage, 50,000 monthly active users
- OpenAI: Pay-per-use (with rate limiting at 5/day, costs should be minimal)

### Monitor Costs
- OpenAI dashboard: Track token usage
- Supabase dashboard: Monitor database and storage usage
- Vercel dashboard: Check bandwidth and build minutes

## 12. Backup & Recovery

### Database Backups
Supabase provides automatic backups, but consider:
- Exporting important data periodically
- Testing restore procedures

### Code Backups
- Keep GitHub repository updated
- Tag releases: `git tag v1.0.0 && git push --tags`

## Checklist Summary

- [ ] Add logo files to `app/` directory
- [ ] Remove password comment from .env.local
- [ ] Create vercel.json with security headers
- [ ] Update metadata in app/layout.tsx
- [ ] Run production build locally and test
- [ ] Push to GitHub
- [ ] Deploy to Vercel
- [ ] Add environment variables to Vercel
- [ ] Update Supabase redirect URLs
- [ ] Test live deployment
- [ ] Monitor costs and usage

## Need Help?

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify environment variables are set correctly
4. Ensure Supabase URLs are updated
5. Check RLS policies in Supabase
