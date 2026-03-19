import { NextResponse } from 'next/server';
import { getItems } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await getItems();
    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Fetch Items Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
