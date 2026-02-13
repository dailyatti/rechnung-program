import { state } from './state.js';
import { $ } from './utils.js';
import { debouncedSave } from './storage/engine.js';
import { createShared } from './storage/migration.js';
import { loadPersonForm, parsePersonSel, commitPersonForm } from './tabs/persons-tab.js';
import { getPerson, getShared } from './state.js';
import { renderPaper } from './invoice/paper.js';

export async function fileToDataUrl(file) {
  return new Promise((r, j) => {
    const f = new FileReader();
    f.onload = () => r(String(f.result));
    f.onerror = j;
    f.readAsDataURL(file);
  });
}

export async function downscaleImageToDataUrl(file, maxW = 900, quality = 0.85, mime = "image/jpeg") {
  const img = new Image();
  const url = URL.createObjectURL(file);
  await new Promise((r, j) => { img.onload = r; img.onerror = j; img.src = url; });
  const scale = Math.min(1, maxW / img.width);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  c.getContext("2d").drawImage(img, 0, 0, w, h);
  URL.revokeObjectURL(url);
  return c.toDataURL(mime, quality);
}

export function setLogoData(dataUrl) {
  const sel = parsePersonSel();
  const isTeam = sel.type === "team";
  const ent = isTeam ? state.teams.find(t => t.id === sel.id) : getPerson(sel.id);
  if (!ent) return;
  const sh = state.shared[ent.sharedId] || (state.shared[ent.sharedId] = createShared());
  sh.logoData = dataUrl || null;
  debouncedSave();
  loadPersonForm();
  renderPaper();
}

export function setupLogo() {
  $("logoFile").addEventListener("change", async e => {
    const f = e.target.files?.[0];
    if (f) setLogoData(await downscaleImageToDataUrl(f, 900, 0.85, "image/jpeg"));
  });

  const drop = $("logoDrop");
  drop.addEventListener("dragover", e => { e.preventDefault(); drop.classList.add("dragover"); });
  drop.addEventListener("dragleave", () => drop.classList.remove("dragover"));
  drop.addEventListener("drop", async e => {
    e.preventDefault();
    drop.classList.remove("dragover");
    const f = e.dataTransfer?.files?.[0];
    if (f?.type?.startsWith("image/")) setLogoData(await downscaleImageToDataUrl(f, 900, 0.85, "image/jpeg"));
  });

  window.addEventListener("paste", async e => {
    for (const i of (e.clipboardData?.items || [])) {
      if (i.type?.startsWith("image/")) {
        const f = i.getAsFile();
        if (f) { setLogoData(await downscaleImageToDataUrl(f, 900, 0.85, "image/jpeg")); break; }
      }
    }
  });

  $("logoFit").addEventListener("change", commitPersonForm);
}
