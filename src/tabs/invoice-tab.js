import { state, getActiveAssignment, getAssignmentsForClient, getPerson } from '../state.js';
import { $, esc, fmtMoney, parseMoneyInput } from '../utils.js';
import { isoToday, isoFOM, isoLOM, parseISO, dayDiff } from '../date-utils.js';
import { debouncedSave } from '../storage/engine.js';
import { renderPaper } from '../invoice/paper.js';

export function refreshInvoiceTab() {
  const sel = $("selClient");
  sel.innerHTML = "";
  state.clients.forEach(c => {
    const o = document.createElement("option");
    o.value = c.id;
    o.textContent = c.name || "(ohne Name)";
    sel.appendChild(o);
  });
  sel.value = state.ui.selectedClientId || "";
  if (!sel.value && state.clients[0]) sel.value = state.clients[0].id;
  state.ui.selectedClientId = sel.value;

  refreshAssignmentList();
  loadInvoiceForm();
  renderPaper();
}

export function refreshAssignmentList() {
  const cid = state.ui.selectedClientId;
  const assigns = getAssignmentsForClient(cid);
  const list = $("assignList");
  list.innerHTML = "";

  if (!assigns.length) {
    list.innerHTML = '<div class="hint">Keine Betreuer zugewiesen. Erstellen Sie eine neue Zuweisung.</div>';
    $("cardInvData").style.display = "none";
    return;
  }

  assigns.forEach(a => {
    const p = getPerson(a.personId);
    const div = document.createElement("div");
    div.className = "assign-card" + (state.currentInvoice.assignmentId === a.id ? " selected" : "");
    div.innerHTML = `<div class="name">${esc(p?.name || "Unbekannt")}</div><div class="meta">Tagessatz: ${fmtMoney(a.dailyRate)} € · Seit: ${a.createdAt?.slice(0, 10) || "—"}</div>`;
    div.onclick = () => {
      state.currentInvoice.assignmentId = a.id;
      debouncedSave();
      refreshAssignmentList();
      loadInvoiceForm();
      renderPaper();
    };
    list.appendChild(div);
  });

  const cur = getActiveAssignment();
  if (!cur && assigns.length) {
    state.currentInvoice.assignmentId = assigns[0].id;
    refreshAssignmentList();
  }

  $("cardInvData").style.display = cur ? "block" : "none";
}

export function loadInvoiceForm() {
  const inv = state.currentInvoice;
  const a = getActiveAssignment();
  if (!a) return;

  $("invoiceDate").value = inv.invoiceDate || isoToday();
  $("invoiceNo").value = inv.invoiceNo || "";
  $("startDate").value = inv.startDate || isoFOM();
  $("endDate").value = inv.endDate || isoLOM();
  $("includeLastDay").checked = inv.includeLastDay !== false;
  $("payDays").value = inv.payDays ?? 3;
  $("dailyRate").value = a.dailyRate ?? 85;

  const s = parseISO(inv.startDate), e = parseISO(inv.endDate);
  if (s && e) $("dayCount").value = dayDiff(s, e, inv.includeLastDay);

  const ex = a.extras || {};
  $("xmasOn").checked = !!ex.xmasOn; $("xmasVal").value = ex.xmasVal ?? 100;
  $("newyearOn").checked = !!ex.newyearOn; $("newyearVal").value = ex.newyearVal ?? 100;
  $("easterOn").checked = !!ex.easterOn; $("easterVal").value = ex.easterVal ?? 100;
  $("travelOn").checked = !!ex.travelOn; $("travelVal").value = ex.travelVal ?? 300;
  $("svsOn").checked = !!ex.svsOn; $("svsVal").value = ex.svsVal ?? 341.70;
  $("adminFeeOn").checked = !!ex.adminFeeOn; $("adminFeeVal").value = ex.adminFeeVal ?? 192;
  $("entryFeeOn").checked = !!ex.entryFeeOn; $("entryFeeVal").value = ex.entryFeeVal ?? 480;
  $("depositOn").checked = !!ex.depositOn; $("depositVal").value = ex.depositVal ?? 0;
  $("cancelFeeOn").checked = !!ex.cancelFeeOn; $("cancelFeeVal").value = ex.cancelFeeVal ?? 800;
}

export function commitInvoiceForm(src) {
  const inv = state.currentInvoice;
  const a = getActiveAssignment();
  if (!a) return;

  inv.invoiceDate = $("invoiceDate").value || isoToday();
  inv.invoiceNo = $("invoiceNo").value.trim();
  inv.includeLastDay = $("includeLastDay").checked;
  inv.payDays = Math.max(0, parseInt($("payDays").value || "0", 10));

  const startVal = $("startDate").value;
  const endVal = $("endDate").value;
  const dayVal = parseInt($("dayCount").value || "0", 10);
  const incl = inv.includeLastDay;

  if (src === "dayCount") {
    const s = parseISO(startVal);
    if (s && dayVal > 0) {
      const e = new Date(s);
      e.setUTCDate(e.getUTCDate() + (incl ? dayVal - 1 : dayVal));
      inv.endDate = e.toISOString().slice(0, 10);
      $("endDate").value = inv.endDate;
    }
  } else {
    inv.startDate = startVal;
    inv.endDate = endVal;
    const s = parseISO(startVal), e = parseISO(endVal);
    if (s && e) $("dayCount").value = dayDiff(s, e, incl);
  }

  a.dailyRate = parseMoneyInput($("dailyRate").value);
  a.extras = {
    xmasOn: $("xmasOn").checked, xmasVal: parseMoneyInput($("xmasVal").value),
    newyearOn: $("newyearOn").checked, newyearVal: parseMoneyInput($("newyearVal").value),
    easterOn: $("easterOn").checked, easterVal: parseMoneyInput($("easterVal").value),
    travelOn: $("travelOn").checked, travelVal: parseMoneyInput($("travelVal").value),
    svsOn: $("svsOn").checked, svsVal: parseMoneyInput($("svsVal").value),
    adminFeeOn: $("adminFeeOn").checked, adminFeeVal: parseMoneyInput($("adminFeeVal").value),
    entryFeeOn: $("entryFeeOn").checked, entryFeeVal: parseMoneyInput($("entryFeeVal").value),
    depositOn: $("depositOn").checked, depositVal: parseMoneyInput($("depositVal").value),
    cancelFeeOn: $("cancelFeeOn").checked, cancelFeeVal: parseMoneyInput($("cancelFeeVal").value)
  };

  debouncedSave();
  renderPaper();
}
