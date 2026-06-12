import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), 'data-cache.json');
const DEFAULT_TTL = 3600 * 1000; // 1 hour in milliseconds

interface CacheEntry {
  timestamp: number;
  value: any;
}

interface Customizations {
  roadmapItems?: any[];
  developerPerformance?: Record<string, {
    notes?: string;
    leadershipRating?: string;
    techRating?: string;
    role?: string;
    team?: string;
    type?: string;
    baseTickets?: number;
    baseUsp?: number;
    baseSprints?: number;
  }>;
}

interface CacheStore {
  entries: Record<string, CacheEntry>;
  customizations: Customizations;
}

// Initial default empty store structure
const initialStore: CacheStore = {
  entries: {},
  customizations: {
    roadmapItems: undefined, // undefined indicates we should populate from API first, then let user override
    developerPerformance: {}
  }
};

function readStore(): CacheStore {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      fs.writeFileSync(CACHE_FILE, JSON.stringify(initialStore, null, 2), 'utf-8');
      return initialStore;
    }
    const data = fs.readFileSync(CACHE_FILE, 'utf-8');
    return JSON.parse(data) as CacheStore;
  } catch (err) {
    console.error('Error reading cache file:', err);
    return initialStore;
  }
}

function writeStore(store: CacheStore): void {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to cache file:', err);
  }
}

export const Cache = {
  get<T>(key: string, ttlMs: number = DEFAULT_TTL): T | null {
    const store = readStore();
    const entry = store.entries[key];
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > ttlMs) {
      // TTL expired
      return null;
    }
    return entry.value as T;
  },

  set(key: string, value: any): void {
    const store = readStore();
    store.entries[key] = {
      timestamp: Date.now(),
      value
    };
    writeStore(store);
  },

  clear(key?: string): void {
    const store = readStore();
    if (key) {
      delete store.entries[key];
    } else {
      store.entries = {};
    }
    writeStore(store);
  },

  // Customizations methods (persisted indefinitely)
  getCustomizations(): Customizations {
    const store = readStore();
    return store.customizations || { developerPerformance: {} };
  },

  saveCustomizations(customizations: Partial<Customizations>): void {
    const store = readStore();
    store.customizations = {
      ...store.customizations,
      ...customizations
    };
    writeStore(store);
  }
};
