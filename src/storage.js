// Persist imported store data in the browser so it survives a refresh.
// We store the fully-derived stores (plain JSON) under a versioned key.
const KEY = 'dunkin.stores.v1'

export function loadStores() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    return Array.isArray(data) && data.length ? data : null
  } catch {
    return null
  }
}

export function saveStores(stores) {
  try {
    localStorage.setItem(KEY, JSON.stringify(stores))
  } catch {
    /* quota / private-mode — ignore, data just won't persist */
  }
}

export function clearStores() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
