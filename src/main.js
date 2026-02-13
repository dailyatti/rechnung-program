// CSS imports (Vite handles bundling)
import '../styles/variables.css';
import '../styles/base.css';
import '../styles/layout.css';
import '../styles/components.css';
import '../styles/paper.css';
import '../styles/print.css';
import '../styles/auth.css';
import '../styles/reminders.css';

// Module imports
import { initState } from './state.js';
import { initTabs } from './tabs/navigation.js';
import { bind } from './bindings.js';
import { setupLogo } from './logo.js';
import { bindQuickClientModal } from './crud/clients.js';
import { bindAssignModal } from './crud/assignments.js';
import { refreshInvoiceTab } from './tabs/invoice-tab.js';
import { refreshClientsTab } from './tabs/clients-tab.js';
import { refreshPersonsTab } from './tabs/persons-tab.js';
import { refreshHistoryTab } from './tabs/history-tab.js';
import { refreshRemindersTab } from './tabs/reminders-tab.js';
import { updateStorageInfo, setSaveState } from './storage/engine.js';
import { setLoadAll } from './exports/json-backup.js';
import { initAuth } from './auth.js';
import { initClock } from './clock.js';
import { initCloudSync } from './netlify-sync.js';

// Initialize auth first
initAuth();

// Initialize state from localStorage
initState();

// loadAll function (used by reset + import)
function loadAll() {
  refreshInvoiceTab();
  refreshClientsTab();
  refreshPersonsTab();
  refreshHistoryTab();
  refreshRemindersTab();
  updateStorageInfo();
  setSaveState(false);
}

// Register loadAll for json-backup module
setLoadAll(loadAll);

// Init sequence
initTabs();
bind(loadAll);
setupLogo();
bindQuickClientModal();
bindAssignModal();
initClock();
initCloudSync();

// Initial render
loadAll();
