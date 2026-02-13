import { state, getClient, getInvoicePerson, getShared } from '../state.js';
import { fmtMoney } from '../utils.js';
import { fmtDE } from '../date-utils.js';
import { computeInvoiceSnapshot } from '../invoice/snapshot.js';

/**
 * Improved mailto — PhD-level email draft with full invoice summary
 */
export function openMailto() {
  const snap = computeInvoiceSnapshot();
  const { client, person, sh, inv, start, end, days, rate, care, extras, total, deadline } = snap;

  if (!client?.email) {
    alert("Keine E-Mail-Adresse beim Kunden gespeichert.");
    return;
  }

  const subject = `Rechnung ${inv.invoiceNo || ""} — ${person?.name || ""}`;

  let body = `Guten Tag${client?.name ? " " + client.name : ""},\n\n`;
  body += `anbei erhalten Sie die Rechnung Nr. ${inv.invoiceNo || ""}.\n\n`;
  body += `--- Rechnungsübersicht ---\n`;
  body += `Leistungszeitraum: ${fmtDE(start)} – ${fmtDE(end)}\n`;
  body += `Tage: ${days} × ${fmtMoney(rate)} € = ${fmtMoney(care)} €\n`;
  if (extras.length) {
    extras.forEach(x => {
      body += `${x.label}: ${fmtMoney(x.amount)} €\n`;
    });
  }
  body += `\nGesamtbetrag: ${fmtMoney(total)} €\n`;
  body += `Zahlungsfrist: ${fmtDE(deadline)}\n\n`;
  body += `Bankverbindung:\n`;
  if (sh?.bankName) body += `Bank: ${sh.bankName}\n`;
  if (sh?.iban) body += `IBAN: ${sh.iban}\n`;
  if (sh?.bic) body += `BIC: ${sh.bic}\n`;
  body += `\nBitte exportieren Sie die PDF und fügen Sie sie manuell als Anhang hinzu.\n\n`;
  body += `Mit freundlichen Grüßen\n${person?.name || ""}`;

  const params = new URLSearchParams({ subject, body });
  const mailtoUrl = `mailto:${encodeURIComponent(client.email)}?${params.toString()}`;

  window.location.href = mailtoUrl;
}

export async function sendBackend() {
  const client = getClient(state.ui.selectedClientId);
  if (!client?.email) { alert("Kunde hat keine E-Mail-Adresse."); return; }
  try {
    const res = await fetch("/send-invoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: client.email,
        subject: `Rechnung ${state.currentInvoice.invoiceNo || ""}`,
        message: "Bitte finden Sie die Rechnung im Anhang.",
        invoiceNo: state.currentInvoice.invoiceNo
      })
    });
    if (!res.ok) { alert("Backend-Fehler: " + res.status); return; }
    alert("Anfrage gesendet.");
  } catch {
    alert("Backend nicht verfügbar.");
  }
}
