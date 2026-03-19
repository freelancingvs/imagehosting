import { NextResponse } from 'next/server';
import { getItems, deleteItem } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/cleanup
 * Removes all items whose imageUrl points to localhost (old local dev uploads).
 * Safe to call multiple times.
 */
export async function DELETE() {
  try {
    const items = await getItems();
    const broken = items.filter((item) =>
      item.imageUrl.startsWith('http://localhost') ||
      item.imageUrl.startsWith('https://localhost')
    );

    for (const item of broken) {
      await deleteItem(item.id);
    }

    return NextResponse.json({
      success: true,
      removed: broken.length,
      message: `Removed ${broken.length} broken localhost item(s).`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
