import { state, getPerson, getShared } from '../state.js';
import { uid, $ } from '../utils.js';
import { debouncedSave } from '../storage/engine.js';
import { createShared } from '../storage/migration.js';
import { enforceRI } from '../storage/validation.js';
import { refreshPersonsTab, loadPersonForm, parsePersonSel } from '../tabs/persons-tab.js';

export function newPerson() {
  const sid = uid();
  const curSel = parsePersonSel();
  const curEnt = curSel.type === "person" ? getPerson(curSel.id) : null;
  const curSh = curEnt ? getShared(curEnt.sharedId) : null;
  state.shared[sid] = createShared(curSh ? { logoData: curSh.logoData, logoFit: curSh.logoFit } : {});
  const p = { id: uid(), sharedId: sid, name: "Neue Person", email: "", phone: "" };
  state.persons.push(p);
  debouncedSave();
  refreshPersonsTab();
  $("selPerson").value = "person:" + p.id;
  loadPersonForm();
}

export function deletePerson() {
  const sel = parsePersonSel();
  if (!sel.id) return;
  if (sel.type === "team") {
    if (!confirm("Team wirklich löschen?")) return;
    state.teams = state.teams.filter(t => t.id !== sel.id);
  } else {
    if (state.persons.length <= 1) { alert("Mindestens 1 Person muss verbleiben."); return; }
    if (!confirm("Person wirklich löschen? Zugehörige Zuweisungen werden deaktiviert.")) return;
    state.persons = state.persons.filter(p => p.id !== sel.id);
    enforceRI(state);
  }
  debouncedSave();
  refreshPersonsTab();
}

export function newTeam() {
  if (state.persons.length < 2) { alert("Für ein Team werden mindestens 2 Personen benötigt."); return; }
  const names = state.persons.map((p, i) => `${i + 1}. ${p.name || "?"}`).join("\n");
  const input = prompt(`Mitglieder-Nummern kommagetrennt eingeben:\n\n${names}\n\nBeispiel: 1,2`, "1,2");
  if (!input) return;
  const idxs = input.split(",").map(s => parseInt(s.trim(), 10) - 1).filter(i => i >= 0 && i < state.persons.length);
  if (idxs.length < 2) { alert("Mindestens 2 Mitglieder."); return; }
  const mids = idxs.map(i => state.persons[i].id);
  const sharedId = state.persons[idxs[0]].sharedId;
  const t = {
    id: uid(), sharedId,
    name: "Team " + mids.map(id => getPerson(id)?.name || "?").join(" & "),
    memberIds: mids, activeMemberId: mids[0], email: "", phone: ""
  };
  state.teams.push(t);
  debouncedSave();
  refreshPersonsTab();
  $("selPerson").value = "team:" + t.id;
  loadPersonForm();
}
