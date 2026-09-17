// Penyimpanan rekaman suara di browser (IndexedDB). Kunci = path suara tanpa ekstensi.
const DB = 'bdbk-suara';
const STORE = 'voices';
let dbp = null;

function db() {
  if (!dbp) {
    dbp = new Promise((resolve, reject) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }
  return dbp;
}

function run(mode, fn) {
  return db().then((d) => new Promise((resolve, reject) => {
    const t = d.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(req ? req.result : undefined);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

const hasIDB = () => typeof indexedDB !== 'undefined';

export const getVoice = (key) => (hasIDB() ? run('readonly', (s) => s.get(key)).then((v) => v ?? null).catch(() => null) : Promise.resolve(null));
export const putVoice = (key, blob) => run('readwrite', (s) => s.put({ blob, at: Date.now() }, key));
export const deleteVoice = (key) => run('readwrite', (s) => s.delete(key));
export const listVoiceKeys = () => (hasIDB() ? run('readonly', (s) => s.getAllKeys()).then((v) => v || []).catch(() => []) : Promise.resolve([]));
