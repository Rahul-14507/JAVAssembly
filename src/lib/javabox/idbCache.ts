// IndexedDB storage utility for caching large WASM binaries and runtime data images
const DB_NAME = "javassembly_cache_v1";
const STORE_NAME = "runtime_assets";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      return reject(new Error("IndexedDB not supported"));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getCachedAsset(key: string): Promise<ArrayBuffer | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        resolve(req.result instanceof ArrayBuffer ? req.result : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function setCachedAsset(key: string, buffer: ArrayBuffer): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(buffer, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // IndexedDB quota or access errors should not crash the app
  }
}

/**
 * Fetch asset with transparent IndexedDB caching.
 * If present in IndexedDB, returns instantly from local storage (0 network requests).
 * If not present, downloads over network, saves to IndexedDB, and returns.
 */
export async function fetchWithIndexedDBCache(
  url: string,
  key: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<ArrayBuffer> {
  // 1. Check IndexedDB first
  const cached = await getCachedAsset(key);
  if (cached && cached.byteLength > 0) {
    onProgress?.(cached.byteLength, cached.byteLength);
    return cached;
  }

  // 2. Fetch from network
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (HTTP ${response.status})`);
  }

  const contentLength = Number(response.headers.get("Content-Length") || 0);
  let arrayBuffer: ArrayBuffer;

  if (response.body && onProgress) {
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      onProgress(received, contentLength || received);
    }

    const merged = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    arrayBuffer = merged.buffer;
  } else {
    arrayBuffer = await response.arrayBuffer();
  }

  // 3. Save to IndexedDB asynchronously in background
  setCachedAsset(key, arrayBuffer).catch(() => {});

  return arrayBuffer;
}

