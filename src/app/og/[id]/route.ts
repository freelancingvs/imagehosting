import { NextRequest, NextResponse } from 'next/server';
import { getItem } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Escape HTML special characters to prevent broken meta tag attributes */
function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Truncate a string at word boundary and add ellipsis if needed */
function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const item = await getItem(id);

    if (!item) {
      return new NextResponse(
        `<!DOCTYPE html><html><head><title>Not Found</title></head><body><h1>404 – Link not found</h1></body></html>`,
        { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // Build the canonical page URL (always HTTPS in production)
    const proto = req.headers.get('x-forwarded-proto') || 'https';
    const host = req.headers.get('host') || req.nextUrl.host;
    const pageUrl = `${proto}://${host}/og/${id}`;

    // Ensure the image URL is absolute and uses HTTPS
    let imageUrl = item.imageUrl;
    if (imageUrl.startsWith('/')) {
      imageUrl = `${proto}://${host}${imageUrl}`;
    }
    // Upgrade http:// to https:// for production
    if (proto === 'https') {
      imageUrl = imageUrl.replace(/^http:\/\//i, 'https://');
    }

    // Escape raw strings for use inside HTML body
    const title = esc(item.title);
    const description = esc(item.description || '');
    // Truncated versions for meta tags (strict length limits for social crawlers)
    const metaTitle = esc(truncate(item.title, 60));
    const metaDescription = esc(truncate(item.description || '', 155));
    const siteName = 'ImageHost';

    // Inline SVG favicon as a data URI (fixes blurry 16x16 favicon warning)
    const faviconSvg = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'><rect width='48' height='48' rx='18' fill='%236366f1'/><text x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='17' font-weight='700' font-family='system-ui'>IH</text></svg>`;

    const html = `<!DOCTYPE html>
<html lang="en" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${metaTitle}</title>
  <meta name="description" content="${metaDescription}" />
  <meta name="author" content="${siteName}" />
  <link rel="icon" href="${faviconSvg}" type="image/svg+xml" />

  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${siteName}" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:title" content="${metaTitle}" />
  <meta property="og:description" content="${metaDescription}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:secure_url" content="${imageUrl}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${metaTitle}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="${siteName}" />
  <meta name="twitter:title" content="${metaTitle}" />
  <meta name="twitter:description" content="${metaDescription}" />
  <meta name="twitter:image" content="${imageUrl}" />
  <meta name="twitter:image:alt" content="${metaTitle}" />

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0a0a0a;
      color: #f5f5f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem 1rem;
    }

    /* ── Mobile: image left, text right ── */
    .card {
      background: #171717;
      border: 1px solid #262626;
      border-radius: 16px;
      overflow: hidden;
      width: 100%;
      max-width: 480px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8);
      display: flex;
      flex-direction: row;
      align-items: stretch;
      gap: 0;
    }
    .img-wrap {
      flex: 0 0 40%;
      max-width: 40%;
      overflow: hidden;
    }
    .img-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .content {
      flex: 1;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 0.5rem;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      background: #6366f1;
      color: white;
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 20px;
      width: fit-content;
    }
    h1 { font-size: 1rem; font-weight: 700; color: #fff; line-height: 1.3; }
    p { color: #a3a3a3; line-height: 1.5; font-size: 0.8rem; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }

    /* ── Desktop: stacked, centered, full image ── */
    @media (min-width: 640px) {
      body { padding: 2.5rem 1rem; align-items: flex-start; }
      .card {
        max-width: 680px;
        flex-direction: column;
        margin: 0 auto;
      }
      .img-wrap {
        flex: none;
        max-width: 100%;
        width: 100%;
      }
      .img-wrap img {
        width: 100%;
        height: auto;
        max-height: 80vh;
        object-fit: contain;
        background: #000;
      }
      .content {
        padding: 2rem;
        align-items: center;
        text-align: center;
        gap: 0.75rem;
      }
      .badge { margin: 0 auto; }
      h1 { font-size: 1.5rem; }
      p { font-size: 0.95rem; -webkit-line-clamp: unset; overflow: visible; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="img-wrap">
      <img src="${imageUrl}" alt="${title}" />
    </div>
    <div class="content">
      <div class="badge">ImageHost</div>
      <h1>${title}</h1>
      ${description ? `<p>${description}</p>` : ''}
    </div>
  </div>
</body>
</html>`;


    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        // Short cache: allow WhatsApp to re-fetch after 1 hour
        // Do NOT use long cache or immutable — crawlers won't refresh
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('OG Route Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
