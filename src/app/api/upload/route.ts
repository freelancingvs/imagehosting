import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { saveItem, Item } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    if (!file || !title) {
      return NextResponse.json(
        { error: 'File and title are required' },
        { status: 400 }
      );
    }

    let imageUrl = '';

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(file.name, file, { access: 'public' });
      imageUrl = blob.url;
    } else {
      // Local fallback if Vercel Blob is not configured
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch {
        // directory might already exist
      }
      
      await writeFile(join(uploadDir, filename), buffer);
      
      // Get the absolute url if possible, otherwise use relative path
      const host = req.headers.get('host') || 'localhost:3000';
      const protocol = req.headers.get('x-forwarded-proto') || 'http';
      imageUrl = `${protocol}://${host}/uploads/${filename}`;
    }

    const id = crypto.randomUUID();
    const item: Item = {
      id,
      title,
      description: description || '',
      imageUrl,
      createdAt: Date.now(),
    };

    await saveItem(item);

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const shareUrl = `${protocol}://${host}/og/${id}`;

    return NextResponse.json({
      success: true,
      item,
      shareUrl,
    });
  } catch (error) {
    console.error('Upload Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
