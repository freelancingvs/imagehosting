import { NextRequest, NextResponse } from 'next/server';
import { getItem } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const item = await getItem(id);

    if (!item) {
      return new NextResponse('Not found', { status: 404 });
    }

    // Required HTML structure with OG tags
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${item.title}</title>
    <meta property="og:title" content="${item.title}" />
    <meta property="og:description" content="${item.description}" />
    <meta property="og:image" content="${item.imageUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${req.nextUrl.href}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${item.title}" />
    <meta name="twitter:description" content="${item.description}" />
    <meta name="twitter:image" content="${item.imageUrl}" />
    
    <style>
      body {
        font-family: system-ui, -apple-system, sans-serif;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
        background-color: #f3f4f6;
        padding: 2rem;
      }
      .card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        overflow: hidden;
        max-width: 600px;
        width: 100%;
      }
      .image {
        width: 100%;
        height: auto;
        display: block;
      }
      .content {
        padding: 1.5rem;
      }
      .title {
        margin: 0 0 0.5rem 0;
        font-size: 1.5rem;
        color: #111827;
      }
      .description {
        margin: 0 0 1.5rem 0;
        color: #4b5563;
        line-height: 1.5;
      }
      .btn {
        display: inline-block;
        background: #000;
        color: white;
        text-decoration: none;
        padding: 0.75rem 1.5rem;
        border-radius: 6px;
        font-weight: 500;
      }
    </style>
    <!-- Optional redirect to main app -->
    <script>
      // Redirect to main app after a split second
      // setTimeout(() => { window.location.href = '/'; }, 3000);
    </script>
</head>
<body>
    <div class="card">
      <img src="${item.imageUrl}" alt="${item.title}" class="image" />
      <div class="content">
        <h1 class="title">${item.title}</h1>
        <p class="description">${item.description}</p>
        <a href="/" class="btn">View App Dashboard</a>
      </div>
    </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
      status: 200,
    });
  } catch (error) {
    console.error('OG Route Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
