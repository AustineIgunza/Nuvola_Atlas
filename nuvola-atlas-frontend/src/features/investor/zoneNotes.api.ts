/**
 * Investor per-zone private notes. Persist per (firmId, zoneId) to
 * localStorage. When Phase F backend lands this swaps for
 * /investor/notes endpoints. Notes are private to the investor's firm
 * — never leak across firms.
 */

const STORAGE_KEY = "nuvola_zone_notes_v1";

export interface ZoneNote {
  firmId: string;
  zoneId: string;
  body: string;
  updatedAt: string;
  updatedBy: string;
}

function loadAll(): ZoneNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ZoneNote[]) : [];
  } catch {
    return [];
  }
}

function saveAll(notes: ZoneNote[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export const zoneNotesApi = {
  get(firmId: string, zoneId: string): ZoneNote | null {
    return loadAll().find((n) => n.firmId === firmId && n.zoneId === zoneId) ?? null;
  },
  save(note: ZoneNote): void {
    const all = loadAll();
    const idx = all.findIndex((n) => n.firmId === note.firmId && n.zoneId === note.zoneId);
    const next = [...all];
    if (idx >= 0) next[idx] = note;
    else next.push(note);
    saveAll(next);
  },
  delete(firmId: string, zoneId: string): void {
    const next = loadAll().filter((n) => !(n.firmId === firmId && n.zoneId === zoneId));
    saveAll(next);
  },
};
