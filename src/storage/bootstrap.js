import { uid, clone, now } from '../utils.js';
import { DEF_EXTRAS, createDefaultState } from '../constants.js';
import { createShared } from './migration.js';

export function bootstrap() {
  const s = clone(createDefaultState());
  const sid = uid();
  s.shared[sid] = createShared({
    address: "Personenbetreuung\nZuckerhutsiedlung 7\n2640 Gloggnitz",
    bankName: "Bank",
    iban: "AT..",
    bic: "SPNGAT21XXX"
  });
  const p1 = { id: uid(), sharedId: sid, name: "Regina Zack", email: "", phone: "" };
  s.persons.push(p1);
  const c1 = { id: uid(), name: "Frau Palma Szőcs", address: "Zuckerhutsiedlung 7\n2640 Gloggnitz", email: "", phone: "", phone2: "", notes: "" };
  s.clients.push(c1);
  const a1 = { id: uid(), clientId: c1.id, personId: p1.id, dailyRate: 85, extras: clone(DEF_EXTRAS), isActive: true, createdAt: now(), notes: "" };
  s.assignments.push(a1);
  s.ui.selectedClientId = c1.id;
  s.currentInvoice.assignmentId = a1.id;
  return s;
}
