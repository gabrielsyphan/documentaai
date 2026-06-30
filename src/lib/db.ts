import Database from "@tauri-apps/plugin-sql";
import type { Page } from "../types";

let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load("sqlite:documentaai.db");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS pages (
        id          TEXT PRIMARY KEY,
        parent_id   TEXT REFERENCES pages(id) ON DELETE CASCADE,
        title       TEXT NOT NULL DEFAULT 'Sem título',
        emoji       TEXT,
        content     TEXT,
        order_index REAL NOT NULL DEFAULT 0,
        is_favorite INTEGER NOT NULL DEFAULT 0,
        created_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL
      )
    `);
    // Migração: adiciona is_favorite em bancos existentes
    try {
      await db.execute("ALTER TABLE pages ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0");
    } catch {
      // Coluna já existe — ignora
    }
  }
  return db;
}

export async function fetchAllPages(): Promise<Page[]> {
  const database = await getDb();
  return database.select<Page[]>("SELECT * FROM pages ORDER BY order_index ASC");
}

export async function upsertPage(page: Page): Promise<void> {
  const database = await getDb();
  await database.execute(
    `INSERT INTO pages (id, parent_id, title, emoji, content, order_index, is_favorite, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT(id) DO UPDATE SET
       parent_id   = excluded.parent_id,
       title       = excluded.title,
       emoji       = excluded.emoji,
       content     = excluded.content,
       order_index = excluded.order_index,
       is_favorite = excluded.is_favorite,
       updated_at  = excluded.updated_at`,
    [
      page.id,
      page.parent_id,
      page.title,
      page.emoji,
      page.content,
      page.order_index,
      page.is_favorite,
      page.created_at,
      page.updated_at,
    ]
  );
}

export async function removePage(id: string): Promise<void> {
  const database = await getDb();
  await database.execute("DELETE FROM pages WHERE id = $1", [id]);
}
