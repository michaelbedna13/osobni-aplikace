import { supabase } from "./supabase";

/** Jednoduché úložiště jedné tabulky: Supabase, nebo (v ukázkovém režimu) localStorage. */
export interface Store<T extends { id: string }> {
  /** Řádky, kde `column` >= `since`, od nejnovějších. */
  list(since: string): Promise<T[]>;
  insert(row: T): Promise<void>;
  /** Vloží řádky; řádky s už existujícím id přeskočí (import je tak opakovatelný). */
  insertMissing(rows: T[]): Promise<void>;
  /** Vloží nové řádky a existující (podle id) přepíše. */
  upsert(rows: T[]): Promise<void>;
  update(id: string, patch: Partial<T>): Promise<void>;
  remove(id: string): Promise<void>;
}

export function createStore<T extends { id: string }>(table: string, column: keyof T & string): Store<T> {
  if (supabase) {
    const db = supabase;
    return {
      async list(since) {
        const { data, error } = await db.from(table).select("*").gte(column, since).order(column, { ascending: false }).limit(5000);
        if (error) throw error;
        return data as T[];
      },
      async insert(row) {
        const { error } = await db.from(table).insert(row);
        if (error) throw error;
      },
      async insertMissing(rows) {
        for (let i = 0; i < rows.length; i += 500) {
          const { error } = await db.from(table).upsert(rows.slice(i, i + 500), { onConflict: "id", ignoreDuplicates: true });
          if (error) throw error;
        }
      },
      async upsert(rows) {
        for (let i = 0; i < rows.length; i += 500) {
          const { error } = await db.from(table).upsert(rows.slice(i, i + 500), { onConflict: "id" });
          if (error) throw error;
        }
      },
      async update(id, patch) {
        const { error } = await db.from(table).update(patch as Record<string, unknown>).eq("id", id);
        if (error) throw error;
      },
      async remove(id) {
        const { error } = await db.from(table).delete().eq("id", id);
        if (error) throw error;
      },
    };
  }

  const key = `db:${table}`;
  const read = (): T[] => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  };
  const write = (rows: T[]) => {
    try {
      localStorage.setItem(key, JSON.stringify(rows));
    } catch {
      // bez úložiště se data v ukázkovém režimu nezapamatují
    }
  };
  return {
    async list(since) {
      return read()
        .filter((r) => String(r[column]) >= since)
        .sort((a, b) => String(b[column]).localeCompare(String(a[column])));
    },
    async insert(row) {
      write([...read(), row]);
    },
    async insertMissing(rows) {
      const existing = read();
      const ids = new Set(existing.map((r) => r.id));
      write([...existing, ...rows.filter((r) => !ids.has(r.id))]);
    },
    async upsert(rows) {
      const ids = new Set(rows.map((r) => r.id));
      write([...read().filter((r) => !ids.has(r.id)), ...rows]);
    },
    async update(id, patch) {
      write(read().map((r) => (r.id === id ? { ...r, ...patch } : r)));
    },
    async remove(id) {
      write(read().filter((r) => r.id !== id));
    },
  };
}
