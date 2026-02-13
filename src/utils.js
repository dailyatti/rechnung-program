export const uid = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);

export const $ = id => document.getElementById(id);

export function setSelectOptionText(selectId, value, label) {
  const sel = $(selectId);
  if (!sel) return;
  const opt = [...sel.options].find(o => o.value === value);
  if (opt) opt.textContent = label;
}

export function norm1(s) {
  return String(s ?? "")
    .replace(/[\t\u00A0]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]);

export const clone = o => JSON.parse(JSON.stringify(o));

export const now = () => new Date().toISOString();

export function fmtMoney(n) {
  return Number(n || 0).toLocaleString("de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function parseMoneyInput(s) {
  const t = String(s ?? "").trim().replace(/\./g, "").replace(",", ".");
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}
