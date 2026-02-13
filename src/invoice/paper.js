import { $, esc, fmtMoney } from '../utils.js';
import { fmtDE } from '../date-utils.js';
import { computeInvoiceSnapshot } from './snapshot.js';
import { state } from '../state.js';

export function renderPaper() {
  const snap = computeInvoiceSnapshot();
  const { assignment: a, person, client, sh, inv, start, end, dateErr, days, rate, care, extras, total, invDate, deadline, monthLbl } = snap;

  $("dateError").style.display = dateErr ? "block" : "none";

  // Client address (right)
  const adr = [];
  if (client?.name) adr.push(client.name);
  if (client?.address) adr.push(...String(client.address).split("\n"));
  $("paperAddrRight").innerHTML = adr.map(esc).join("<br>");

  // Sender
  $("paperFromBlock").innerHTML = `<b>Leistungserbringer / Betreuer/in:</b><br><br><b>${esc(person?.name || "")}</b><br>${esc(sh?.address || "").replace(/\n/g, "<br>")}`;

  // Meta
  $("paperMetaLeft").innerHTML = `<b>Rechnungs-Nr.:</b> ${esc(inv.invoiceNo || "")}`;
  $("paperMetaRight").innerHTML = `<b>Rechnungsdatum:</b> ${esc(fmtDE(invDate))}`;

  // Logo — global logo takes precedence, then per-person logo
  const pl = $("paperLogo");
  const globalLogo = state.globalLogo;
  const logoData = sh?.logoData || globalLogo?.data || null;
  const logoFit = sh?.logoData ? (sh.logoFit === "cover" ? "cover" : "contain") : (globalLogo?.fit === "cover" ? "cover" : "contain");
  if (logoData) {
    pl.src = logoData;
    pl.style.display = "block";
    pl.style.objectFit = logoFit;
  } else {
    pl.removeAttribute("src");
    pl.style.display = "none";
  }

  // Table
  const tbody = $("paperTbody");
  tbody.innerHTML = "";

  if (!dateErr && a) {
    tbody.appendChild(mkRow(
      `<div><b>${esc(monthLbl)}</b></div>`,
      `<div>${esc(fmtDE(start))} – ${esc(fmtDE(end))}</div><br><div>${days} Tage × ${esc(fmtMoney(rate))} € = <b>${esc(fmtMoney(care))} €</b></div>`,
      `${esc(fmtMoney(care))} €`
    ));
    extras.forEach(x => {
      tbody.appendChild(mkRow("", `<div>${esc(x.label)}${x.detail ? " (" + esc(x.detail) + ")" : ""}</div>`, `${esc(fmtMoney(x.amount))} €`));
    });
  } else if (dateErr) {
    tbody.appendChild(mkRow("", `<span style="color:#b00020"><b>Fehler:</b> Leistungsende liegt vor Leistungsbeginn.</span>`, ""));
  } else {
    tbody.appendChild(mkRow("", "<span style='color:#888'>Bitte wählen Sie einen Betreuer aus.</span>", ""));
  }

  $("paperPayLine").textContent = `bezahlen bis ${fmtDE(deadline)}`;
  $("paperTotalBox").textContent = `${fmtMoney(total)} €`;

  const bk = [];
  bk.push("<b>Bankverbindung:</b>");
  if (sh?.bankName) bk.push(`Bank: ${esc(sh.bankName)}`);
  if (sh?.iban) bk.push(`IBAN: ${esc(sh.iban)}`);
  if (sh?.bic) bk.push(`BIC: ${esc(sh.bic)}`);
  bk.push("");
  if (sh?.payNote) bk.push(esc(sh.payNote));
  $("paperBank").innerHTML = bk.join("<br>");
}

export function mkRow(c1, c2, c3) {
  const tr = document.createElement("tr");
  ["col1", "col2", "col3"].forEach((cls, i) => {
    const td = document.createElement("td");
    td.className = cls;
    td.innerHTML = [c1, c2, c3][i] || "";
    tr.appendChild(td);
  });
  return tr;
}
