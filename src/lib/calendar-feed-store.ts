/**
 * Server-side storage for subscribeable calendar feeds.
 * Calendar apps (Google / Outlook / Apple) poll the HTTPS .ics URL periodically.
 */
import { promises as fs } from "fs";
import path from "path";

export type FeedRecord = {
  token: string;
  ics: string;
  updatedAt: string;
  eventCount: number;
};

const DIR = path.join(process.cwd(), "data", "calendar-feeds");

// In-memory fallback (e.g. serverless without writable FS)
const memory = new Map<string, FeedRecord>();

async function ensureDir() {
  try {
    await fs.mkdir(DIR, { recursive: true });
  } catch {
    /* ignore */
  }
}

function filePath(token: string) {
  // token is uuid-like; strip path chars
  const safe = token.replace(/[^a-zA-Z0-9_-]/g, "");
  return path.join(DIR, `${safe}.json`);
}

export async function saveFeed(record: FeedRecord): Promise<void> {
  memory.set(record.token, record);
  try {
    await ensureDir();
    await fs.writeFile(
      filePath(record.token),
      JSON.stringify(record),
      "utf8"
    );
  } catch (err) {
    console.warn("calendar feed file write failed, using memory only", err);
  }
}

export async function loadFeed(token: string): Promise<FeedRecord | null> {
  const safe = token.replace(/[^a-zA-Z0-9_-]/g, "");
  if (memory.has(safe) || memory.has(token)) {
    return memory.get(safe) || memory.get(token) || null;
  }
  try {
    const raw = await fs.readFile(filePath(safe), "utf8");
    const rec = JSON.parse(raw) as FeedRecord;
    memory.set(safe, rec);
    return rec;
  } catch {
    return null;
  }
}
