import { state } from '../state.js';
import { refreshInvoiceTab } from './invoice-tab.js';
import { refreshClientsTab } from './clients-tab.js';
import { refreshPersonsTab } from './persons-tab.js';
import { refreshHistoryTab } from './history-tab.js';
import { refreshRemindersTab } from './reminders-tab.js';
import { updateStorageInfo } from '../storage/engine.js';

export function switchTab(tabName) {
  const tab = document.querySelector(`.tab[data-tab="${tabName}"]`);
  if (tab) tab.click();
}

export function initTabs() {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      const id = "panel" + tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1);
      const panel = document.getElementById(id);
      if (panel) panel.classList.add("active");
      state.ui.activeTab = tab.dataset.tab;
      refreshCurrentTab();
    });
  });
}

export function refreshCurrentTab() {
  const t = state.ui.activeTab;
  if (t === "invoice") refreshInvoiceTab();
  if (t === "clients") refreshClientsTab();
  if (t === "persons") refreshPersonsTab();
  if (t === "history") refreshHistoryTab();
  if (t === "reminders") refreshRemindersTab();
  if (t === "settings") updateStorageInfo();
}
