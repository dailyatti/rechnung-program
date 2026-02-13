import { state, setState } from './state.js';
import { $, norm1 } from './utils.js';
import { STORAGE_KEY } from './constants.js';
import { debouncedSave, updateStorageInfo } from './storage/engine.js';
import { bootstrap } from './storage/bootstrap.js';
import { switchTab } from './tabs/navigation.js';
import { refreshInvoiceTab, commitInvoiceForm } from './tabs/invoice-tab.js';
import { refreshClientsTab, loadClientForm, commitClientForm, renderClientStats } from './tabs/clients-tab.js';
import { refreshPersonsTab, loadPersonForm, commitPersonForm, parsePersonSel } from './tabs/persons-tab.js';
import { renderHistoryTable } from './tabs/history-tab.js';
import { addReminder, refreshRemindersTab } from './tabs/reminders-tab.js';
import { newAssignment, removeAssignment } from './crud/assignments.js';
import { newPerson, deletePerson, newTeam } from './crud/persons.js';
import { newClient, deleteClient, openQuickClientModal } from './crud/clients.js';
import { finalizeInvoice } from './invoice/finalize.js';
import { renderPaper } from './invoice/paper.js';
import { exportPDF } from './exports/pdf.js';
import { exportSheet } from './exports/sheet.js';
import { exportJSON, importJSON } from './exports/json-backup.js';
import { openMailto, sendBackend } from './exports/email.js';
import { syncToCloud, loadFromCloud } from './netlify-sync.js';
import { logout } from './auth.js';
import { downscaleImageToDataUrl } from './logo.js';

export function bind(loadAll) {
  // Tab: Invoice
  $("selClient").addEventListener("change", () => {
    state.ui.selectedClientId = $("selClient").value;
    debouncedSave();
    refreshInvoiceTab();
  });
  $("btnQuickClient").addEventListener("click", openQuickClientModal);
  $("btnGoClients").addEventListener("click", () => switchTab("clients"));
  $("btnNewAssign").addEventListener("click", newAssignment);
  $("btnRemoveAssign").addEventListener("click", removeAssignment);
  $("btnFinalize").addEventListener("click", finalizeInvoice);

  ["invoiceDate", "invoiceNo", "startDate", "endDate", "dayCount", "dailyRate", "payDays"].forEach(id =>
    $(id).addEventListener("input", () => commitInvoiceForm(id))
  );
  $("includeLastDay").addEventListener("change", () => commitInvoiceForm("includeLastDay"));
  ["xmasOn", "xmasVal", "newyearOn", "newyearVal", "easterOn", "easterVal",
   "travelOn", "travelVal", "svsOn", "svsVal",
   "adminFeeOn", "adminFeeVal", "entryFeeOn", "entryFeeVal",
   "depositOn", "depositVal", "cancelFeeOn", "cancelFeeVal"].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener(el.type === "checkbox" ? "change" : "input", () => commitInvoiceForm(id));
  });

  // Tab: Clients
  $("selClientMgmt").addEventListener("change", () => {
    loadClientForm($("selClientMgmt").value);
    renderClientStats($("selClientMgmt").value);
  });
  ["clientName", "clientAddress", "clientEmail", "clientPhone", "clientPhone2", "clientNotes"].forEach(id => {
    $(id).addEventListener("input", commitClientForm);
    $(id).addEventListener("blur", () => {
      if (["clientName", "clientEmail", "clientPhone", "clientPhone2"].includes(id)) $(id).value = norm1($(id).value);
      commitClientForm();
    });
  });
  // Pflegestufe fields
  ["clientPflegestufe", "clientNetIncome"].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener("input", commitClientForm);
  });
  ["clientSecondPerson", "clientNightWork", "clientNoBreak", "clientHasPet",
   "clientNeedsDriver", "clientGoodGerman", "clientFoerderung"].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener("change", commitClientForm);
  });

  $("btnNewClient").addEventListener("click", newClient);
  $("btnDeleteClient").addEventListener("click", deleteClient);

  // Tab: Persons
  $("selPerson").addEventListener("change", loadPersonForm);
  ["personName", "personEmail", "personPhone", "personAddress", "bankName", "iban", "bic", "payNote"].forEach(id => {
    $(id).addEventListener("input", commitPersonForm);
    $(id).addEventListener("blur", () => {
      if (["personName", "personEmail", "personPhone", "bankName", "iban", "bic", "payNote"].includes(id)) $(id).value = norm1($(id).value);
      commitPersonForm();
    });
  });
  $("teamMemberSel").addEventListener("change", () => {
    const sel = parsePersonSel();
    if (sel.type !== "team") return;
    const t = state.teams.find(x => x.id === sel.id);
    if (t) t.activeMemberId = $("teamMemberSel").value;
    debouncedSave();
    renderPaper();
  });
  $("btnNewPerson").addEventListener("click", newPerson);
  $("btnDeletePerson").addEventListener("click", deletePerson);
  $("btnNewTeam").addEventListener("click", newTeam);

  // Tab: History filters
  ["histFilterClient", "histFilterPerson", "histFrom", "histTo", "histByInvDate"].forEach(id =>
    $(id).addEventListener("change", renderHistoryTable)
  );

  // Tab: Settings
  $("btnExportJSON").addEventListener("click", exportJSON);
  $("btnImportJSON").addEventListener("click", importJSON);
  $("btnBackendMail").addEventListener("click", sendBackend);
  $("btnResetAll").addEventListener("click", async () => {
    if (!confirm("ACHTUNG: Alle Daten werden unwiderruflich gelöscht! Fortfahren?")) return;
    if (!confirm("Sind Sie absolut sicher? Erstellen Sie vorher ein Backup!")) return;
    localStorage.removeItem(STORAGE_KEY);
    setState(bootstrap());
    // Clear cloud data too
    syncToCloud();
    loadAll();
    alert("Alle Daten wurden gelöscht.");
  });

  // Reminders
  const btnAddReminder = $("btnAddReminder");
  if (btnAddReminder) btnAddReminder.addEventListener("click", addReminder);

  // Cloud sync
  const btnCloudSync = $("btnCloudSync");
  if (btnCloudSync) btnCloudSync.addEventListener("click", syncToCloud);

  const btnCloudLoad = $("btnCloudLoad");
  if (btnCloudLoad) btnCloudLoad.addEventListener("click", async () => {
    const data = await loadFromCloud();
    if (!data) { alert("Keine Cloud-Daten gefunden."); return; }
    if (confirm("Cloud-Daten laden? Lokale Daten werden überschrieben.")) {
      const { migrate } = await import('./storage/migration.js');
      const { enforceRI } = await import('./storage/validation.js');
      setState(enforceRI(migrate(data)));
      debouncedSave();
      loadAll();
      alert("Cloud-Daten geladen.");
    }
  });

  // Logout
  const btnLogout = $("btnLogout");
  if (btnLogout) btnLogout.addEventListener("click", logout);

  // Global Logo
  const globalLogoFile = $("globalLogoFile");
  if (globalLogoFile) globalLogoFile.addEventListener("change", async e => {
    const f = e.target.files?.[0];
    if (f) {
      const data = await downscaleImageToDataUrl(f, 900, 0.85, "image/jpeg");
      state.globalLogo = { data, fit: $("globalLogoFit")?.value || "contain" };
      debouncedSave();
      renderPaper();
      updateGlobalLogoPreview();
    }
  });
  const globalLogoFit = $("globalLogoFit");
  if (globalLogoFit) globalLogoFit.addEventListener("change", () => {
    if (state.globalLogo) {
      state.globalLogo.fit = globalLogoFit.value;
      debouncedSave();
      renderPaper();
    }
  });
  const btnRemoveGlobalLogo = $("btnRemoveGlobalLogo");
  if (btnRemoveGlobalLogo) btnRemoveGlobalLogo.addEventListener("click", () => {
    state.globalLogo = null;
    debouncedSave();
    renderPaper();
    updateGlobalLogoPreview();
  });

  updateGlobalLogoPreview();

  // Exports
  $("btnPdf").addEventListener("click", exportPDF);
  $("btnXlsx").addEventListener("click", () => exportSheet("xlsx"));
  $("btnOds").addEventListener("click", () => exportSheet("ods"));
  $("btnMailto").addEventListener("click", openMailto);
}

function updateGlobalLogoPreview() {
  const img = $("globalLogoPreview");
  if (!img) return;
  if (state.globalLogo?.data) {
    img.src = state.globalLogo.data;
    img.style.display = "block";
  } else {
    img.removeAttribute("src");
    img.style.display = "none";
  }
}
