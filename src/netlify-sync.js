import { state } from './state.js';
import { $ } from './utils.js';
import { SCHEMA_VER } from './constants.js';

let syncStatus = 'idle';

function setSyncUI(msg, ok) {
  const el = $("syncStatus");
  if (el) {
    el.textContent = msg;
    el.className = "badge " + (ok ? "b-ok" : "b-dirty");
  }
}

export async function syncToCloud() {
  if (syncStatus === 'syncing') return;
  syncStatus = 'syncing';
  setSyncUI("Synchronisiere...", false);
  try {
    const payload = {
      app: "RechnungEnterprise",
      schema: SCHEMA_VER,
      savedAt: new Date().toISOString(),
      state
    };
    const res = await fetch("/.netlify/functions/save-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    syncStatus = 'done';
    setSyncUI("Cloud OK", true);
  } catch (e) {
    console.warn("Cloud-Sync fehlgeschlagen:", e);
    syncStatus = 'error';
    setSyncUI("Offline", false);
  }
}

export async function loadFromCloud() {
  try {
    const res = await fetch("/.netlify/functions/load-data");
    if (!res.ok) return null;
    const data = await res.json();
    return data?.state || null;
  } catch {
    return null;
  }
}

export function initCloudSync() {
  // Periodic sync every 60 seconds
  setInterval(() => {
    if (syncStatus !== 'syncing') syncToCloud();
  }, 60000);

  // Initial sync attempt
  setTimeout(() => syncToCloud(), 3000);
}
