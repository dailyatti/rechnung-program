import { STORAGE_KEY, MAX_STORAGE_MB, DEBOUNCE_MS } from '../constants.js';
import { $ } from '../utils.js';
import { bootstrap } from './bootstrap.js';
import { migrate } from './migration.js';
import { validate, enforceRI } from './validation.js';
import { state } from '../state.js';
import { loadFromCloud, syncToCloud } from '../netlify-sync.js';

export async function loadState() {
  // 1. Try cloud first (3 sec timeout)
  try {
    const cloudData = await Promise.race([
      loadFromCloud(),
      new Promise((_, rej) => setTimeout(() => rej('timeout'), 3000))
    ]);
    if (cloudData && validate(cloudData)) {
      const migrated = enforceRI(migrate(cloudData));
      // Cache to localStorage
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated)); } catch {}
      console.log("Daten aus Cloud geladen.");
      return migrated;
    }
  } catch (e) {
    console.warn("Cloud-Load fehlgeschlagen, verwende localStorage:", e);
  }

  // 2. Fallback: localStorage
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    // Migrate from v3 key if v4 not found
    if (!raw) {
      raw = localStorage.getItem("ab24_enterprise_v3");
      if (raw) localStorage.removeItem("ab24_enterprise_v3");
    }
    if (!raw) return bootstrap();
    const parsed = JSON.parse(raw);
    if (!validate(parsed)) { console.warn("Ungültige Daten"); return bootstrap(); }
    return enforceRI(migrate(parsed));
  } catch (e) {
    console.error("Ladefehler:", e);
    return bootstrap();
  }
}

export function saveState() {
  try {
    const json = JSON.stringify(state);
    const sizeMB = json.length / (1024 * 1024);
    if (sizeMB > MAX_STORAGE_MB) {
      console.warn(`Datengröße: ${sizeMB.toFixed(2)} MB — nahe am Limit`);
    }
    localStorage.setItem(STORAGE_KEY, json);
    setSaveState(false);
    updateStorageInfo();
    // Sync to cloud in background
    syncToCloud();
  } catch (e) {
    console.error("Speicherfehler:", e);
    if (e.name === "QuotaExceededError") {
      alert("Speicherplatz voll! Bitte entfernen Sie große Logos oder erstellen Sie ein JSON-Backup und löschen Sie alte Historieneinträge.");
    }
  }
}

let _st = null;
export function debouncedSave() {
  setSaveState(true);
  clearTimeout(_st);
  _st = setTimeout(saveState, DEBOUNCE_MS);
}

export function setSaveState(dirty) {
  const el = $("saveState");
  if (!el) return;
  el.textContent = dirty ? "Ungespeichert" : "Gespeichert";
  el.className = "badge " + (dirty ? "b-dirty" : "b-ok");
}

export function updateStorageInfo() {
  const raw = localStorage.getItem(STORAGE_KEY) || "";
  const kb = (raw.length / 1024).toFixed(1);
  const mb = (raw.length / (1024 * 1024)).toFixed(2);
  const hc = state.history.length;
  const ac = state.assignments.length;
  const pc = state.persons.length;
  const cc = state.clients.length;
  const el = $("storageInfo");
  if (el) {
    el.innerHTML =
      `<b>Speicherverbrauch:</b> ${kb} KB (${mb} MB)<br>` +
      `<b>Personen:</b> ${pc} | <b>Kunden:</b> ${cc} | <b>Zuweisungen:</b> ${ac} | <b>Historie:</b> ${hc} Einträge`;
  }
}
