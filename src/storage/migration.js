import { SCHEMA_VER, DEF_EXTRAS } from '../constants.js';
import { clone, now } from '../utils.js';
import { createDefaultState } from '../constants.js';

export function createShared(src) {
  return {
    address: src?.address || "",
    bankName: src?.bankName || "",
    iban: src?.iban || "",
    bic: src?.bic || "",
    payNote: src?.payNote || "Zahlbar sofort nach Rechnungserhalt ohne Abzug.",
    logoData: src?.logoData || null,
    logoFit: src?.logoFit || "contain"
  };
}

export function migrate(raw) {
  const s = Object.assign(clone(createDefaultState()), raw || {});
  s.shared = s.shared || {};
  s.globalLogo = s.globalLogo || null;
  s.persons = s.persons || [];
  s.teams = s.teams || [];
  s.clients = s.clients || [];
  s.assignments = s.assignments || [];
  s.history = s.history || [];
  s.reminders = s.reminders || [];
  s.currentInvoice = Object.assign(clone(createDefaultState().currentInvoice), s.currentInvoice || {});
  s.ui = Object.assign(clone(createDefaultState().ui), s.ui || {});

  for (const id in s.shared) {
    const sh = s.shared[id];
    sh.address = sh.address || "";
    sh.bankName = sh.bankName || "";
    sh.iban = sh.iban || "";
    sh.bic = sh.bic || "";
    sh.payNote = sh.payNote || "Zahlbar sofort nach Rechnungserhalt ohne Abzug.";
    sh.logoFit = sh.logoFit || "contain";
  }

  s.clients.forEach(c => {
    c.phone = c.phone || "";
    c.phone2 = c.phone2 || "";
    c.notes = c.notes || "";
    c.pflegestufe = c.pflegestufe ?? 1;
    c.secondPerson = c.secondPerson ?? false;
    c.nightWork = c.nightWork ?? false;
    c.noBreak = c.noBreak ?? false;
    c.hasPet = c.hasPet ?? false;
    c.needsDriver = c.needsDriver ?? false;
    c.goodGerman = c.goodGerman ?? false;
    c.foerderung = c.foerderung ?? false;
    c.netIncome = c.netIncome ?? 0;
  });

  s.assignments.forEach(a => {
    a.dailyRate = a.dailyRate ?? 85;
    a.extras = Object.assign(clone(DEF_EXTRAS), a.extras || {});
    if (a.isActive === undefined) a.isActive = true;
    a.createdAt = a.createdAt || now();
    a.notes = a.notes || "";
  });

  s.teams.forEach(t => {
    if (!t.activeMemberId && t.memberIds?.length) t.activeMemberId = t.memberIds[0];
  });

  s.history.forEach(h => {
    h.status = h.status || "finalized";
  });

  s.reminders.forEach(r => {
    r.status = r.status || "pending";
    r.recurring = r.recurring || "none";
  });

  s.version = SCHEMA_VER;
  return s;
}
