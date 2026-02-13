import { state } from '../state.js';
import { uid, now, $ } from '../utils.js';
import { debouncedSave } from '../storage/engine.js';
import { computeInvoiceSnapshot } from './snapshot.js';
import { refreshHistoryTab } from '../tabs/history-tab.js';

export function isValidEmail(s) {
  const v = String(s || "").trim();
  return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function isLikelyIBAN(s) {
  const v = String(s || "").replace(/\s+/g, "").toUpperCase();
  return !v || /^[A-Z]{2}[0-9A-Z]{13,32}$/.test(v);
}

export function finalizeInvoice() {
  const snap = computeInvoiceSnapshot();
  const { assignment: a, person, client, sh, inv, start, end, dateErr, incl, days, rate, care, extras, total } = snap;

  if (!a) return;
  if (dateErr) { alert("Ungültiger Leistungszeitraum."); return; }
  if (!inv.invoiceNo) { alert("Bitte Rechnungsnummer eingeben."); return; }
  if (!client?.name || !client?.address) { alert("Kunde: Name und Adresse erforderlich."); return; }
  if (!sh?.address) { alert("Betreuer: Adresse erforderlich."); return; }
  if (!isLikelyIBAN(sh?.iban)) { alert("IBAN scheint ungültig."); return; }
  if (!isValidEmail(client?.email)) { alert("E-Mail scheint ungültig."); return; }

  if (state.history.some(h => h.invoiceNo === inv.invoiceNo && h.status !== "cancelled")) {
    if (!confirm(`Rechnungsnummer "${inv.invoiceNo}" existiert bereits. Trotzdem fortfahren?`)) return;
  }

  const entry = {
    id: uid(),
    createdAt: now(),
    invoiceNo: inv.invoiceNo,
    invoiceDate: inv.invoiceDate,
    clientId: client?.id || "", clientName: client?.name || "", clientAddress: client?.address || "",
    personId: person?.id || "", personName: person?.name || "", personAddress: sh?.address || "",
    startDate: inv.startDate, endDate: inv.endDate,
    days, includeLastDay: incl, dailyRate: rate, careTotal: care,
    extras: extras.map(x => ({ label: x.label, amount: x.amount })), grandTotal: total,
    bankSnapshot: { bankName: sh?.bankName || "", iban: sh?.iban || "", bic: sh?.bic || "" },
    payDays: inv.payDays, payNote: sh?.payNote || "",
    status: "finalized"
  };

  state.history.push(entry);

  // Auto-increment invoice number
  const match = inv.invoiceNo.match(/(\d+)$/);
  if (match) {
    const num = parseInt(match[1], 10) + 1;
    const prefix = inv.invoiceNo.slice(0, inv.invoiceNo.length - match[1].length);
    inv.invoiceNo = prefix + String(num).padStart(match[1].length, "0");
    $("invoiceNo").value = inv.invoiceNo;
  }

  debouncedSave();
  alert(`Rechnung ${entry.invoiceNo} wurde in der Historie gespeichert.`);
  refreshHistoryTab();
}
