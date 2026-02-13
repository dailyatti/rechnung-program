import { fmtMoney } from '../utils.js';
import { fmtDE } from '../date-utils.js';
import { computeInvoiceSnapshot } from '../invoice/snapshot.js';

export function exportSheet(bt) {
  if (!window.XLSX) { alert("XLSX-Bibliothek nicht geladen."); return; }
  const XLSX = window.XLSX;
  const snap = computeInvoiceSnapshot();
  const { person, client, sh, inv, start, end, dateErr, days, rate, care, extras, total, invDate, deadline, monthLbl } = snap;

  const rows = [
    ["RECHNUNG"], [""],
    ["Rechnungs-Nr.:", inv.invoiceNo || ""],
    ["Rechnungsdatum:", fmtDE(invDate)],
    ["bezahlen bis:", fmtDE(deadline)],
    [""],
    ["Leistungserbringer:", person?.name || ""],
    ["Adresse:", (sh?.address || "").replace(/\n/g, ", ")],
    [""],
    ["Kunde:", client?.name || ""],
    ["Adresse:", (client?.address || "").replace(/\n/g, ", ")],
    [""],
    ["Leistungszeitraum", "Beschreibung", "Gesamtpreis"]
  ];

  if (!dateErr && start && end && snap.assignment) {
    rows.push([monthLbl, `${fmtDE(start)} bis ${fmtDE(end)} — ${days} Tage × ${fmtMoney(rate)} €`, `${fmtMoney(care)} €`]);
    extras.forEach(x => {
      rows.push(["", x.detail ? `${x.label} (${x.detail})` : x.label, `${fmtMoney(x.amount)} €`]);
    });
  }
  rows.push(
    [""],
    ["Rechnungsbetrag:", "", `${fmtMoney(total)} €`],
    [""],
    ["Bank:", sh?.bankName || ""],
    ["IBAN:", sh?.iban || ""],
    ["BIC:", sh?.bic || ""],
    ["Hinweis:", sh?.payNote || ""]
  );

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 26 }, { wch: 70 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws, "Rechnung");
  XLSX.writeFile(wb, `Rechnung_${inv.invoiceNo || "export"}.${bt}`.replace(/[^\w\-.]+/g, "_"), { bookType: bt });
}
