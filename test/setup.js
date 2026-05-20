// Provide a deterministic in-memory localStorage for tests.
//
// Node 22+ exposes a native experimental `localStorage` global that returns
// undefined unless `--localstorage-file` is passed, which shadows any polyfill.
// We override it with a simple Map-backed stub so storage tests are hermetic.
class MemoryStorage {
  #m = new Map();
  getItem(k) {
    return this.#m.has(k) ? this.#m.get(k) : null;
  }
  setItem(k, v) {
    this.#m.set(String(k), String(v));
  }
  removeItem(k) {
    this.#m.delete(k);
  }
  clear() {
    this.#m.clear();
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  value: new MemoryStorage(),
  configurable: true,
  writable: true,
});
