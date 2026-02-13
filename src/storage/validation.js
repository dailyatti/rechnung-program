export function validate(s) {
  if (!s || typeof s !== "object") return false;
  if (!Array.isArray(s.persons) || !Array.isArray(s.clients) || !Array.isArray(s.assignments)) return false;
  if (typeof s.shared !== "object") return false;
  return true;
}

export function enforceRI(s) {
  const pids = new Set(s.persons.map(p => p.id));
  const cids = new Set(s.clients.map(c => c.id));
  s.assignments = s.assignments.filter(a => pids.has(a.personId) && cids.has(a.clientId));
  s.teams.forEach(t => {
    t.memberIds = (t.memberIds || []).filter(id => pids.has(id));
    if (t.activeMemberId && !pids.has(t.activeMemberId)) t.activeMemberId = t.memberIds[0] || null;
  });
  s.teams = s.teams.filter(t => t.memberIds.length >= 2);
  return s;
}
