import { NextRequest, NextResponse } from 'next/server';
import { updateItem, deleteItem } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // In Next.js 15 App router, params is a promise
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await req.json();
    
    // Only allow updating title and description
    const updates: { title?: string; description?: string } = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;

    const updated = await updateItem(id, updates);
    
    if (!updated) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    console.error('Update Item Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // Deleting from DB. 
    // We could optionally delete the image from Vercel Blob here too, 
    // but the requirements say "(Optional: delete image from Blob)", 
    // so we'll just delete the DB record.
    await deleteItem(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete Item Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
