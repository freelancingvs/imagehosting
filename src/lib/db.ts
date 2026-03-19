import { kv } from '@vercel/kv';
import fs from 'fs/promises';
import path from 'path';

export interface Item {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: number;
}

const isKVEnabled = !!process.env.KV_REST_API_URL;
const localDbPath = path.join(process.cwd(), 'data.json');

async function getLocalData(): Promise<Item[]> {
  try {
    const data = await fs.readFile(localDbPath, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveLocalData(data: Item[]) {
  await fs.writeFile(localDbPath, JSON.stringify(data, null, 2), 'utf8');
}

export async function getItems(): Promise<Item[]> {
  if (isKVEnabled) {
    const items = await kv.get<Item[]>('og_items');
    return items || [];
  } else {
    return getLocalData();
  }
}

export async function getItem(id: string): Promise<Item | null> {
  const items = await getItems();
  return items.find((item) => item.id === id) || null;
}

export async function saveItem(item: Item): Promise<void> {
  const items = await getItems();
  items.unshift(item);
  if (isKVEnabled) {
    await kv.set('og_items', items);
  } else {
    await saveLocalData(items);
  }
}

export async function updateItem(id: string, updates: Partial<Item>): Promise<Item | null> {
  const items = await getItems();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return null;
  
  items[index] = { ...items[index], ...updates };
  
  if (isKVEnabled) {
    await kv.set('og_items', items);
  } else {
    await saveLocalData(items);
  }
  
  return items[index];
}

export async function deleteItem(id: string): Promise<void> {
  const items = await getItems();
  const filtered = items.filter((item) => item.id !== id);
  if (isKVEnabled) {
    await kv.set('og_items', filtered);
  } else {
    await saveLocalData(filtered);
  }
}
