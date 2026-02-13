import { clone } from '../utils.js';

export function mergeStates(base, inc) {
  const out = clone(base);

  function mergeArrById(key) {
    const a = Array.isArray(out[key]) ? out[key] : [];
    const b = Array.isArray(inc[key]) ? inc[key] : [];
    const map = new Map(a.map(x => [x.id, x]));
    for (const item of b) {
      const prev = map.get(item.id);
      map.set(item.id, prev ? ({ ...prev, ...item }) : item);
    }
    out[key] = [...map.values()];
  }

  mergeArrById("clients");
  mergeArrById("persons");
  mergeArrById("teams");
  mergeArrById("assignments");
  mergeArrById("invoices");

  out.shared = { ...(out.shared || {}), ...(inc.shared || {}) };
  if (!out.ui || Object.keys(out.ui || {}).length === 0) out.ui = inc.ui || out.ui;
  if (!out.currentInvoice && inc.currentInvoice) out.currentInvoice = inc.currentInvoice;

  return out;
}
