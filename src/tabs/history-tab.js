import { state } from '../state.js';
import { $, esc, fmtMoney } from '../utils.js';
import { parseISO, fmtDE } from '../date-utils.js';
import { debouncedSave } from '../storage/engine.js';

export function refreshHistoryTab() {
  const fc = $("histFilterClient");
  const prevC = fc.value;
  fc.innerHTML = '<option value="">Alle Kunden</option>';
  state.clients.forEach(c => {
    const o = document.createElement("option");
    o.value = c.id;
    o.textContent = c.name;
    fc.appendChild(o);
  });
  fc.value = prevC;

  const fp = $("histFilterPerson");
  const prevP = fp.value;
  fp.innerHTML = '<option value="">Alle Betreuer</option>';
  state.persons.forEach(p => {
    const o = document.createElement("option");
    o.value = p.id;
    o.textContent = p.name;
    fp.appendChild(o);
  });
  fp.value = prevP;

  renderHistoryTable();
}

export function renderHistoryTable() {
  const clientFilter = $("histFilterClient").value;
  const personFilter = $("histFilterPerson").value;
  const fromDate = parseISO($("histFrom").value);
  const toDate = parseISO($("histTo").value);
  const byInvDate = $("histByInvDate").checked;

  let filtered = state.history.slice();
  if (clientFilter) filtered = filtered.filter(h => h.clientId === clientFilter);
  if (personFilter) filtered = filtered.filter(h => h.personId === personFilter);
  if (byInvDate) {
    if (fromDate) filtered = filtered.filter(h => { const d = parseISO(h.invoiceDate); return d && d >= fromDate; });
    if (toDate) filtered = filtered.filter(h => { const d = parseISO(h.invoiceDate); return d && d <= toDate; });
  } else {
    if (fromDate) filtered = filtered.filter(h => { const d = parseISO(h.startDate); return d && d >= fromDate; });
    if (toDate) filtered = filtered.filter(h => { const d = parseISO(h.endDate); return d && d <= toDate; });
  }

  filtered.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  $("histCount").textContent = filtered.length;

  // Stats
  const active = filtered.filter(h => h.status !== "cancelled");
  const totalAmount = active.reduce((s, h) => s + h.grandTotal, 0);
  const totalDays = active.reduce((s, h) => s + h.days, 0);
  const paid = active.filter(h => h.status === "paid");
  $("histStats").innerHTML = `
    <div class="stat-box"><div class="stat-val">${active.length}</div><div class="stat-label">Rechnungen</div></div>
    <div class="stat-box"><div class="stat-val">${fmtMoney(totalAmount)} €</div><div class="stat-label">Gesamtbetrag</div></div>
    <div class="stat-box"><div class="stat-val">${totalDays}</div><div class="stat-label">Betreuungstage</div></div>
    <div class="stat-box"><div class="stat-val">${paid.length}</div><div class="stat-label">Bezahlt</div></div>`;

  // Table
  const tbody = $("histBody");
  tbody.innerHTML = "";
  if (!filtered.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="9" class="hint" style="text-align:center;padding:20px">Keine Einträge gefunden.</td>';
    tbody.appendChild(tr);
    return;
  }

  filtered.forEach(h => {
    const tr = document.createElement("tr");
    const stClass = h.status === "paid" ? "st-paid" : h.status === "cancelled" ? "st-cancel" : "st-final";
    const stLabel = h.status === "paid" ? "Bezahlt" : h.status === "cancelled" ? "Storniert" : "Offen";
    const sDate = parseISO(h.startDate), eDate = parseISO(h.endDate);
    tr.innerHTML = `
      <td class="mono">${esc(h.invoiceNo)}</td>
      <td>${esc(h.invoiceDate ? fmtDE(parseISO(h.invoiceDate)) : "")}</td>
      <td>${esc(h.clientName)}</td>
      <td>${esc(h.personName)}</td>
      <td>${sDate ? fmtDE(sDate) : ""}–${eDate ? fmtDE(eDate) : ""}</td>
      <td class="mono">${h.days}</td>
      <td class="mono">${fmtMoney(h.grandTotal)} €</td>
      <td><span class="status-pill ${stClass}">${stLabel}</span></td>
      <td>
        <button class="btn" style="padding:4px 8px;font-size:10px" data-hid="${h.id}" data-action="toggle">${h.status === "paid" ? "↩ Öffnen" : "✓ Bezahlt"}</button>
        <button class="btn btn-d" style="padding:4px 8px;font-size:10px" data-hid="${h.id}" data-action="cancel">${h.status === "cancelled" ? "Wiederherstellen" : "Stornieren"}</button>
      </td>`;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("button[data-hid]").forEach(btn => {
    btn.onclick = () => {
      const hid = btn.dataset.hid;
      const action = btn.dataset.action;
      const entry = state.history.find(h => h.id === hid);
      if (!entry) return;
      if (action === "toggle") {
        entry.status = entry.status === "paid" ? "finalized" : "paid";
      } else if (action === "cancel") {
        entry.status = entry.status === "cancelled" ? "finalized" : "cancelled";
      }
      debouncedSave();
      renderHistoryTable();
    };
  });
}
