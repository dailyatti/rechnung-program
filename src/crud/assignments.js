import { state, getPerson, getActiveAssignment } from '../state.js';
import { uid, clone, now, $ } from '../utils.js';
import { DEF_EXTRAS } from '../constants.js';
import { debouncedSave } from '../storage/engine.js';
import { refreshInvoiceTab } from '../tabs/invoice-tab.js';

export function openAssignModal() {
  const cid = state.ui.selectedClientId;
  if (!cid) { alert("Bitte wählen Sie zuerst einen Kunden aus."); return; }
  if (!state.persons.length) { alert("Bitte legen Sie zuerst einen Betreuer an."); return; }
  const sel = $("assignPersonSel");
  sel.innerHTML = "";
  state.persons.forEach(p => {
    const o = document.createElement("option");
    o.value = p.id;
    o.textContent = p.name || "(ohne Name)";
    sel.appendChild(o);
  });
  const m = $("modalAssign");
  m.classList.add("open");
  m.setAttribute("aria-hidden", "false");
}

export function closeAssignModal() {
  const m = $("modalAssign");
  m.classList.remove("open");
  m.setAttribute("aria-hidden", "true");
}

export function saveAssignModal() {
  const cid = state.ui.selectedClientId;
  const pid = $("assignPersonSel").value;
  if (!pid) { alert("Bitte Betreuer auswählen."); return; }
  if (state.assignments.some(a => a.clientId === cid && a.personId === pid && a.isActive)) {
    alert("Dieser Betreuer ist bereits zugewiesen."); return;
  }
  const a = { id: uid(), clientId: cid, personId: pid, dailyRate: 85, extras: clone(DEF_EXTRAS), isActive: true, createdAt: now(), notes: "" };
  state.assignments.push(a);
  state.currentInvoice.assignmentId = a.id;
  debouncedSave();
  closeAssignModal();
  refreshInvoiceTab();
}

export function newAssignment() {
  openAssignModal();
}

export function removeAssignment() {
  const a = getActiveAssignment();
  if (!a) return;
  if (!confirm(`Zuweisung von "${getPerson(a.personId)?.name || "?"}" wirklich entfernen?`)) return;
  a.isActive = false;
  state.currentInvoice.assignmentId = null;
  debouncedSave();
  refreshInvoiceTab();
}

export function bindAssignModal() {
  const m = $("modalAssign");
  if (!m) return;
  m.addEventListener("click", e => { if (e.target?.dataset?.close) closeAssignModal(); });
  $("btnCloseAssignModal").addEventListener("click", closeAssignModal);
  $("btnCancelAssignModal").addEventListener("click", closeAssignModal);
  $("btnSaveAssignModal").addEventListener("click", saveAssignModal);
  window.addEventListener("keydown", e => {
    if (e.key === "Escape" && m.classList.contains("open")) { e.preventDefault(); closeAssignModal(); }
  });
}
