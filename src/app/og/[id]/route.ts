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

    const title = esc(item.title);
    const description = esc(item.description || '');
    const siteName = 'ImageHost';

    const html = `<!DOCTYPE html>
<html lang="en" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${description}" />

  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${siteName}" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:secure_url" content="${imageUrl}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${title}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="${siteName}" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${imageUrl}" />
  <meta name="twitter:image:alt" content="${title}" />

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0a0a0a;
      color: #f5f5f5;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
    }
    .card {
      background: #171717;
      border: 1px solid #262626;
      border-radius: 16px;
      overflow: hidden;
      max-width: 600px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8);
    }
    .card img {
      width: 100%;
      height: 340px;
      object-fit: cover;
      display: block;
    }
    .content { padding: 1.75rem; }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #6366f1;
      color: white;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 20px;
      margin-bottom: 1rem;
    }
    h1 { font-size: 1.5rem; font-weight: 700; color: #fff; line-height: 1.3; margin-bottom: 0.75rem; }
    p { color: #a3a3a3; line-height: 1.6; margin-bottom: 1.5rem; font-size: 0.95rem; }
    .btn {
      display: inline-block;
      background: #6366f1;
      color: white;
      text-decoration: none;
      padding: 0.65rem 1.4rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      transition: background 0.2s;
    }
    .btn:hover { background: #4f46e5; }
  </style>
</head>
<body>
  <div class="card">
    <img src="${imageUrl}" alt="${title}" />
    <div class="content">
      <div class="badge">ImageHost</div>
      <h1>${title}</h1>
      ${description ? `<p>${description}</p>` : ''}
      <a href="/" class="btn">Open ImageHost</a>
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
