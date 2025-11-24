# Logo & Branding Guide for PaperPal IQ

## Where to Place Your Logo Files

### 1. App Icons & Favicon (Automatic Detection by Next.js)

Place these files directly in the `app/` directory:

```
app/
├── favicon.ico          # Browser tab icon (32x32 or 48x48 ICO format)
├── icon.png            # General app icon (512x512 PNG)
├── apple-icon.png      # iOS home screen icon (180x180 PNG)
└── opengraph-image.png # Social media preview (1200x630 PNG)
```

**Important**: Next.js 14 automatically detects these files. Just drop them in the `app/` folder with these exact names, and they'll work immediately.

### 2. Logo for UI (Header, etc.)

Place in the `public/` directory:

```
public/
└── logo.png            # Your logo for use in the app UI (any size, recommend 200x200 minimum)
```

Then use in components:
```tsx
import Image from "next/image"

<Image src="/logo.png" alt="PaperPal IQ" width={40} height={40} />
```

## Logo Specifications

### Favicon (favicon.ico)
- **Format**: ICO
- **Size**: 32x32 or 48x48 pixels
- **Purpose**: Shows in browser tabs
- **Background**: Can be transparent

### App Icon (icon.png)
- **Format**: PNG
- **Size**: 512x512 pixels (will be scaled as needed)
- **Purpose**: General purpose icon for PWA, bookmarks
- **Background**: Should have background color (not transparent)

### Apple Icon (apple-icon.png)
- **Format**: PNG
- **Size**: 180x180 pixels
- **Purpose**: iOS home screen when app is saved
- **Background**: Should have background color (not transparent)
- **Corners**: Don't round - iOS does this automatically

### Open Graph Image (opengraph-image.png)
- **Format**: PNG or JPG
- **Size**: 1200x630 pixels (exact size for best results)
- **Purpose**: Shows when sharing on social media (Twitter, Facebook, LinkedIn)
- **Content**: Should include logo + text explaining what PaperPal IQ does
- **Safe zone**: Keep important content in the center 1200x600 area

## Recommended Logo Design

For PaperPal IQ, consider:

### Color Palette
- Primary: Blue (#2563eb) - represents intelligence and trust
- Secondary: Light blue (#3b82f6) - modern and friendly
- Accent: White or gray for text

### Icon Suggestions
- Graduation cap + document/paper
- Brain + document
- Letters "PP" in a modern design
- Book with AI circuit lines
- Lightbulb + paper

### Style Guidelines
- Keep it simple and recognizable at small sizes
- Works well in both light and dark backgrounds
- Minimal detail (will be scaled down to favicon size)
- Modern and professional

## Quick Start: No Logo Yet?

If you don't have a logo yet, you can create a simple text-based icon using code:

Create `app/icon.tsx`:

```tsx
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
          fontSize: 20,
          background: 'linear-gradient(to bottom right, #2563eb, #3b82f6)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
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

This creates a simple "PP" icon with your brand colors.

## Free Logo Creation Tools

If you need to create a logo:

1. **Canva** (canva.com) - Free templates, easy to use
2. **Figma** (figma.com) - Professional design tool, free tier
3. **Hatchful by Shopify** (hatchful.shopify.com) - Free logo generator
4. **LogoMakr** (logomakr.com) - Simple online editor
5. **DALL-E or Midjourney** - AI-generated logos

## Export Guidelines

When exporting your logo:

### For favicon.ico
1. Start with a square design
2. Export at 48x48px
3. Use a favicon generator: https://realfavicongenerator.net/

### For PNG files
1. Export at exact sizes mentioned above
2. Use transparent background for logo.png
3. Use solid background for icon.png and apple-icon.png
4. Export at 2x resolution then scale down for sharpness

## Testing Your Logo

After adding logos:

1. **Clear browser cache**: Hard refresh (Cmd/Ctrl + Shift + R)
2. **Check browser tab**: Should show favicon
3. **Check mobile**: Test "Add to Home Screen" on iOS/Android
4. **Check social sharing**: Use https://www.opengraph.xyz/ to preview

## Current Status

As of now, the app is ready for deployment but **does not have custom logos**. You can:

1. Deploy now and add logos later (they'll just use defaults)
2. Add logos before deployment using the guide above

The app will work perfectly without custom logos - they just improve branding.

## Example File Structure

```
paperpal_iq/
├── app/
│   ├── favicon.ico          ← Add your favicon here
│   ├── icon.png            ← Add your app icon here
│   ├── apple-icon.png      ← Add your iOS icon here
│   └── opengraph-image.png ← Add your social preview here
├── public/
│   └── logo.png            ← Add your UI logo here (optional)
└── ...
```

## Need Help?

- Design questions: Consider hiring a designer on Fiverr or Upwork ($5-50)
- Technical questions: Check Next.js docs on metadata: https://nextjs.org/docs/app/api-reference/file-conventions/metadata
