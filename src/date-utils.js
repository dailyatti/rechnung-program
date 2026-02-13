export function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

export function isoFOM() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export function isoLOM() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
}

export function parseISO(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return isNaN(dt) ? null : dt;
}

export function fmtDE(d) {
  if (!d) return "";
  return String(d.getUTCDate()).padStart(2, "0") + "." +
    String(d.getUTCMonth() + 1).padStart(2, "0") + "." +
    d.getUTCFullYear();
}

export function dayDiff(a, b, incl) {
  if (!a || !b) return 0;
  const ms = 864e5;
  return (incl ? 1 : 0) + Math.round((b - a) / ms);
}

export function monthLabel(a, b) {
  const m1 = String(a.getUTCMonth() + 1).padStart(2, "0");
  const m2 = String(b.getUTCMonth() + 1).padStart(2, "0");
  if (a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth())
    return `Monat ${m1}.${a.getUTCFullYear()}`;
  if (a.getUTCFullYear() !== b.getUTCFullYear())
    return `Zeitraum ${m1}.${a.getUTCFullYear()} – ${m2}.${b.getUTCFullYear()}`;
  return `Monat ${m1}-${m2}.${a.getUTCFullYear()}`;
}
