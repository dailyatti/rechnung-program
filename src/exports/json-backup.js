import { SCHEMA_VER, STORAGE_KEY } from '../constants.js';
import { state, setState } from '../state.js';
import { isoToday } from '../date-utils.js';
import { debouncedSave } from '../storage/engine.js';
import { migrate } from '../storage/migration.js';
import { validate, enforceRI } from '../storage/validation.js';
import { mergeStates } from '../storage/merge.js';

// Forward declaration — will be set by bindings
let _loadAll = null;
export function setLoadAll(fn) { _loadAll = fn; }

export function exportJSON() {
  const payload = {
    app: "RechnungEnterprise",
    schema: SCHEMA_VER,
    exportedAt: new Date().toISOString(),
    state
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `rechnung_backup_${isoToday()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function importJSON() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => {
      try {
        const raw = JSON.parse(String(ev.target.result || ""));
        const incoming = (raw && raw.app === "RechnungEnterprise" && raw.state) ? raw.state : raw;

        if (!validate(incoming)) throw new Error("Ungültiges Format / Schema");

        const mode = confirm(
          "Import-Modus auswählen:\n\n" +
          "OK = ERSETZEN (alles wird durch die Datei ersetzt)\n" +
          "Abbrechen = MERGEN (bestehende Daten bleiben, neue/aktualisierte werden hinzugefügt)"
        ) ? "replace" : "merge";

        if (mode === "replace") {
          setState(enforceRI(migrate(incoming)));
        } else {
          setState(enforceRI(mergeStates(state, migrate(incoming))));
        }

        debouncedSave();
        if (_loadAll) _loadAll();
        alert("Import abgeschlossen ✅");
      } catch (er) {
        alert("Fehler beim Import: " + (er?.message || String(er)));
      }
    };
    r.readAsText(file);
  };
  input.click();
}
