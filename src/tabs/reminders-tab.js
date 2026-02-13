import { state, getClient } from '../state.js';
import { $, uid, esc, fmtMoney, now } from '../utils.js';
import { parseISO, fmtDE, isoToday } from '../date-utils.js';
import { debouncedSave } from '../storage/engine.js';

export function refreshRemindersTab() {
  // Populate client dropdown for reminders
  const sel = $("reminderClient");
  if (sel) {
    const prev = sel.value;
    sel.innerHTML = '<option value="">Alle / Allgemein</option>';
    state.clients.forEach(c => {
      const o = document.createElement("option");
      o.value = c.id;
      o.textContent = c.name || "(ohne Name)";
      sel.appendChild(o);
    });
    sel.value = prev;
  }

  renderRemindersPanel();
  renderAutoReminders();
}

function renderAutoReminders() {
  const cont = $("autoReminders");
  if (!cont) return;

  const today = new Date();
  const todayISO = isoToday();
  const currentDay = today.getUTCDate();
  const currentMonth = today.getUTCMonth();
  const currentYear = today.getUTCFullYear();

  // Analyze which clients need invoices
  const analysis = [];

  state.clients.forEach(c => {
    const clientHistory = state.history.filter(
      h => h.clientId === c.id && h.status !== "cancelled"
    );
    const activeAssignments = state.assignments.filter(
      a => a.clientId === c.id && a.isActive
    );

    if (!activeAssignments.length) return;

    // Find last invoice end date
    let lastEndDate = null;
    let lastInvoiceDate = null;
    let totalInvoiced = 0;
    let totalDays = 0;

    clientHistory.forEach(h => {
      const ed = parseISO(h.endDate);
      const id = parseISO(h.invoiceDate);
      if (ed && (!lastEndDate || ed > lastEndDate)) lastEndDate = ed;
      if (id && (!lastInvoiceDate || id > lastInvoiceDate)) lastInvoiceDate = id;
      totalInvoiced += h.grandTotal || 0;
      totalDays += h.days || 0;
    });

    // Determine invoice urgency
    let urgency = "ok";
    let message = "";
    let daysOverdue = 0;

    if (!lastEndDate) {
      urgency = "critical";
      message = "Noch nie eine Rechnung erstellt!";
      daysOverdue = 999;
    } else {
      const daysSinceLast = Math.floor((today - lastEndDate) / 864e5);
      if (daysSinceLast > 35) {
        urgency = "critical";
        message = `Letzte Rechnung endete am ${fmtDE(lastEndDate)} — ${daysSinceLast} Tage überfällig!`;
        daysOverdue = daysSinceLast;
      } else if (daysSinceLast > 25) {
        urgency = "warning";
        message = `Rechnung wird in ${28 - daysSinceLast} Tagen fällig (letzter Zeitraum endete ${fmtDE(lastEndDate)})`;
        daysOverdue = daysSinceLast;
      } else if (daysSinceLast > 20) {
        urgency = "soon";
        message = `Nächste Rechnung bald fällig — letzter Zeitraum endete ${fmtDE(lastEndDate)}`;
        daysOverdue = daysSinceLast;
      } else {
        urgency = "ok";
        message = `Aktuell — letzter Zeitraum endete ${fmtDE(lastEndDate)}`;
        daysOverdue = daysSinceLast;
      }
    }

    const personNames = activeAssignments.map(a => {
      const p = state.persons.find(x => x.id === a.personId);
      return p?.name || "?";
    });

    analysis.push({
      client: c,
      urgency,
      message,
      daysOverdue,
      lastEndDate,
      lastInvoiceDate,
      totalInvoiced,
      totalDays,
      personNames,
      assignmentCount: activeAssignments.length
    });
  });

  // Sort by urgency (critical first)
  const urgencyOrder = { critical: 0, warning: 1, soon: 2, ok: 3 };
  analysis.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency] || b.daysOverdue - a.daysOverdue);

  if (!analysis.length) {
    cont.innerHTML = '<div class="hint">Keine aktiven Kunden mit Zuweisungen gefunden.</div>';
    return;
  }

  let html = '';
  analysis.forEach(a => {
    const urgClass = a.urgency === "critical" ? "reminder-critical" :
                     a.urgency === "warning" ? "reminder-warning" :
                     a.urgency === "soon" ? "reminder-soon" : "reminder-ok";
    const urgIcon = a.urgency === "critical" ? "!!" :
                    a.urgency === "warning" ? "!" :
                    a.urgency === "soon" ? "~" : "OK";
    const urgBadge = a.urgency === "critical" ? "b-bad" :
                     a.urgency === "warning" ? "b-dirty" :
                     a.urgency === "soon" ? "b-info" : "b-ok";

    html += `<div class="reminder-card ${urgClass}">
      <div class="reminder-header">
        <div class="reminder-name">${esc(a.client.name)}</div>
        <span class="badge ${urgBadge}">${urgIcon}</span>
      </div>
      <div class="reminder-msg">${esc(a.message)}</div>
      <div class="reminder-meta">
        <span>Betreuer: ${a.personNames.map(esc).join(", ")}</span>
        <span>Gesamt: ${fmtMoney(a.totalInvoiced)} € / ${a.totalDays} Tage</span>
      </div>
    </div>`;
  });

  cont.innerHTML = html;
}

function renderRemindersPanel() {
  const cont = $("manualReminders");
  if (!cont) return;

  const todayISO = isoToday();
  const reminders = (state.reminders || []).slice();
  reminders.sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));

  if (!reminders.length) {
    cont.innerHTML = '<div class="hint">Keine manuellen Erinnerungen. Erstellen Sie eine neue Erinnerung.</div>';
    return;
  }

  let html = '';
  reminders.forEach(r => {
    const client = getClient(r.clientId);
    const isOverdue = r.dueDate && r.dueDate < todayISO && r.status !== "done";
    const isDone = r.status === "done";
    const statusClass = isDone ? "reminder-ok" : isOverdue ? "reminder-critical" : "reminder-soon";

    html += `<div class="reminder-card ${statusClass}" style="opacity:${isDone ? '0.5' : '1'}">
      <div class="reminder-header">
        <div class="reminder-name">${esc(client?.name || "Alle")}: ${esc(r.note || "")}</div>
        <span class="badge ${isDone ? 'b-ok' : isOverdue ? 'b-bad' : 'b-info'}">${isDone ? 'Erledigt' : isOverdue ? 'Überfällig' : 'Offen'}</span>
      </div>
      <div class="reminder-meta">
        <span>Fällig: ${r.dueDate ? fmtDE(parseISO(r.dueDate)) : "—"}</span>
        <span>Wiederholung: ${r.recurring === "monthly" ? "Monatlich" : "Einmalig"}</span>
      </div>
      <div class="btn-row" style="margin-top:6px">
        ${!isDone ? `<button class="btn btn-g" style="padding:3px 8px;font-size:10px" data-rid="${r.id}" data-raction="done">Erledigt</button>` : `<button class="btn" style="padding:3px 8px;font-size:10px" data-rid="${r.id}" data-raction="reopen">Wieder öffnen</button>`}
        <button class="btn btn-d" style="padding:3px 8px;font-size:10px" data-rid="${r.id}" data-raction="delete">Löschen</button>
      </div>
    </div>`;
  });

  cont.innerHTML = html;

  cont.querySelectorAll("button[data-rid]").forEach(btn => {
    btn.onclick = () => {
      const rid = btn.dataset.rid;
      const action = btn.dataset.raction;
      const rem = state.reminders.find(x => x.id === rid);
      if (!rem) return;

      if (action === "done") {
        rem.status = "done";
        if (rem.recurring === "monthly" && rem.dueDate) {
          // Create next month's reminder
          const d = parseISO(rem.dueDate);
          if (d) {
            d.setUTCMonth(d.getUTCMonth() + 1);
            state.reminders.push({
              id: uid(),
              clientId: rem.clientId,
              dueDate: d.toISOString().slice(0, 10),
              note: rem.note,
              status: "pending",
              recurring: "monthly",
              createdAt: now()
            });
          }
        }
      } else if (action === "reopen") {
        rem.status = "pending";
      } else if (action === "delete") {
        state.reminders = state.reminders.filter(x => x.id !== rid);
      }

      debouncedSave();
      renderRemindersPanel();
    };
  });
}

export function addReminder() {
  const clientId = $("reminderClient")?.value || "";
  const dueDate = $("reminderDue")?.value || "";
  const note = $("reminderNote")?.value?.trim() || "";
  const recurring = $("reminderRecurring")?.value || "none";

  if (!note) { alert("Bitte eine Notiz eingeben."); return; }
  if (!dueDate) { alert("Bitte ein Fälligkeitsdatum eingeben."); return; }

  if (!state.reminders) state.reminders = [];

  state.reminders.push({
    id: uid(),
    clientId: clientId || null,
    dueDate,
    note,
    status: "pending",
    recurring,
    createdAt: now()
  });

  debouncedSave();

  if ($("reminderNote")) $("reminderNote").value = "";
  if ($("reminderDue")) $("reminderDue").value = "";

  renderRemindersPanel();
}
