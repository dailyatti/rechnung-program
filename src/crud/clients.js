import { state, getClient } from '../state.js';
import { uid, norm1, $ } from '../utils.js';
import { debouncedSave } from '../storage/engine.js';
import { enforceRI } from '../storage/validation.js';
import { refreshClientsTab, loadClientForm } from '../tabs/clients-tab.js';
import { refreshInvoiceTab } from '../tabs/invoice-tab.js';

export function newClient() {
  const c = { id: uid(), name: "Neuer Kunde", address: "", email: "", phone: "", phone2: "", notes: "" };
  state.clients.push(c);
  state.ui.selectedClientId = c.id;
  debouncedSave();
  refreshClientsTab();
  refreshInvoiceTab();
}

export function deleteClient() {
  if (state.clients.length <= 1) { alert("Mindestens 1 Kunde muss verbleiben."); return; }
  const cid = $("selClientMgmt").value;
  if (!cid) return;
  const c = getClient(cid);
  if (!confirm(`"${c?.name || ""}" wirklich löschen? Zugehörige Zuweisungen werden deaktiviert.`)) return;
  state.clients = state.clients.filter(x => x.id !== cid);
  enforceRI(state);
  state.ui.selectedClientId = state.clients[0]?.id || null;
  debouncedSave();
  refreshClientsTab();
  refreshInvoiceTab();
}

// Quick Client Modal
export function openQuickClientModal() {
  ["qcName", "qcAddress", "qcEmail", "qcPhone", "qcPhone2", "qcNotes"].forEach(id => {
    const el = $(id);
    if (el) el.value = "";
  });
  const m = $("modalClient");
  if (!m) return;
  m.classList.add("open");
  m.setAttribute("aria-hidden", "false");
  setTimeout(() => { $("qcName")?.focus?.(); }, 0);
}

export function closeQuickClientModal() {
  const m = $("modalClient");
  if (!m) return;
  m.classList.remove("open");
  m.setAttribute("aria-hidden", "true");
}

export function saveQuickClientModal() {
  const name = norm1($("qcName").value);
  if (!name) { alert("Bitte einen Namen eingeben."); $("qcName").focus(); return; }
  const c = {
    id: uid(),
    name,
    address: $("qcAddress").value || "",
    email: norm1($("qcEmail").value),
    phone: norm1($("qcPhone").value),
    phone2: norm1($("qcPhone2").value),
    notes: $("qcNotes").value || ""
  };
  state.clients.push(c);
  state.ui.selectedClientId = c.id;
  debouncedSave();

  closeQuickClientModal();

  refreshInvoiceTab();
  refreshClientsTab();
  $("selClientMgmt").value = c.id;
  loadClientForm(c.id);
}

export function bindQuickClientModal() {
  const m = $("modalClient");
  if (!m) return;

  m.addEventListener("click", (e) => { if (e.target?.dataset?.close) closeQuickClientModal(); });
  $("btnCloseClientModal").addEventListener("click", closeQuickClientModal);
  $("btnCancelClientModal").addEventListener("click", closeQuickClientModal);
  $("btnSaveClientModal").addEventListener("click", saveQuickClientModal);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && m.classList.contains("open")) {
      e.preventDefault();
      closeQuickClientModal();
    }
  });
}
