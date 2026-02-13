import { state, getActiveAssignment, getInvoicePerson, getClient, getShared } from '../state.js';
import { parseISO, dayDiff, monthLabel } from '../date-utils.js';

export function computeInvoiceSnapshot() {
  const a = getActiveAssignment();
  const person = getInvoicePerson();
  const client = getClient(state.ui.selectedClientId);
  const sh = person ? getShared(person.sharedId) : null;
  const inv = state.currentInvoice;

  const start = parseISO(inv.startDate), end = parseISO(inv.endDate);
  const dateErr = !start || !end || end < start;
  const incl = inv.includeLastDay;
  const days = dateErr ? 0 : dayDiff(start, end, incl);
  const rate = Number(a?.dailyRate || 0);
  const care = days * rate;

  let total = care;
  const extras = [];
  if (!dateErr && a) {
    const ex = a.extras || {};
    const addE = (on, label, val, detail) => {
      if (!on) return;
      const v = Number(val || 0);
      total += v;
      extras.push({ label, amount: v, detail: detail || "" });
    };
    addE(ex.xmasOn, "Weihnachtsgeld", ex.xmasVal, "");
    addE(ex.newyearOn, "Silvestergeld", ex.newyearVal, "");
    addE(ex.easterOn, "Ostergeld", ex.easterVal, "");
    addE(ex.travelOn, "Fahrtkosten", ex.travelVal, "Hin- und Rückfahrt");
    addE(ex.svsOn, "SVS", ex.svsVal, `für ${days} Tage`);
    addE(ex.adminFeeOn, "Verwaltungskostenbeitrag", ex.adminFeeVal, "monatlich inkl. MwSt.");
    addE(ex.entryFeeOn, "Einstiegsgebühr", ex.entryFeeVal, "inkl. MwSt.");
    addE(ex.depositOn, "Kaution", ex.depositVal, "wird rückerstattet");
    addE(ex.cancelFeeOn, "Kündigungsgebühr", ex.cancelFeeVal, "Nichteinhaltung Kündigungsfrist");
  }

  const invDate = parseISO(inv.invoiceDate) || new Date();
  const payDays = Math.max(0, parseInt(inv.payDays || 0, 10));
  const deadline = new Date(invDate);
  deadline.setUTCDate(deadline.getUTCDate() + payDays);

  return {
    assignment: a, person, client, sh, inv,
    start, end, dateErr, incl, days, rate, care,
    extras, total,
    invDate, payDays, deadline,
    monthLbl: (!dateErr && start && end) ? monthLabel(start, end) : ""
  };
}
