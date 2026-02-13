import { state, getPerson, getShared } from '../state.js';
import { $, esc, setSelectOptionText } from '../utils.js';
import { debouncedSave } from '../storage/engine.js';
import { createShared } from '../storage/migration.js';
import { renderPaper } from '../invoice/paper.js';

export function refreshPersonsTab() {
  const sel = $("selPerson");
  sel.innerHTML = "";

  if (state.persons.length) {
    const g = document.createElement("optgroup");
    g.label = "Einzelpersonen";
    state.persons.forEach(p => {
      const o = document.createElement("option");
      o.value = "person:" + p.id;
      o.textContent = p.name || "(ohne Name)";
      g.appendChild(o);
    });
    sel.appendChild(g);
  }
  if (state.teams.length) {
    const g = document.createElement("optgroup");
    g.label = "Teams";
    state.teams.forEach(t => {
      const o = document.createElement("option");
      o.value = "team:" + t.id;
      o.textContent = t.name || "(Team)";
      g.appendChild(o);
    });
    sel.appendChild(g);
  }

  if (sel.options.length && !sel.value) sel.selectedIndex = 0;
  loadPersonForm();
}

export function parsePersonSel() {
  const v = $("selPerson").value || "";
  const [type, id] = v.split(":");
  return { type: type || "person", id: id || "" };
}

export function loadPersonForm() {
  const sel = parsePersonSel();
  const isTeam = sel.type === "team";
  const ent = isTeam ? state.teams.find(t => t.id === sel.id) : getPerson(sel.id);
  if (!ent) return;
  const sh = getShared(ent.sharedId);

  $("personName").value = ent.name || "";
  $("personEmail").value = ent.email || "";
  $("personPhone").value = ent.phone || "";
  $("personAddress").value = sh?.address || "";
  $("bankName").value = sh?.bankName || "";
  $("iban").value = sh?.iban || "";
  $("bic").value = sh?.bic || "";
  $("payNote").value = sh?.payNote || "";
  $("logoFit").value = sh?.logoFit || "contain";

  const data = sh?.logoData;
  const fit = sh?.logoFit === "cover" ? "cover" : "contain";
  const mini = $("miniLogoImg"), plogo = $("paperLogo");
  if (data) {
    mini.src = data;
    mini.style.display = "block";
    mini.style.objectFit = fit;
  } else {
    mini.removeAttribute("src");
    mini.style.display = "none";
  }

  // Team members
  const tw = $("teamMemberWrap");
  const tl = $("personTeamsList");
  if (isTeam && ent.memberIds?.length) {
    tw.style.display = "block";
    const ms = $("teamMemberSel");
    ms.innerHTML = "";
    ent.memberIds.forEach(mid => {
      const p = getPerson(mid);
      if (!p) return;
      const o = document.createElement("option");
      o.value = p.id;
      o.textContent = p.name || "?";
      ms.appendChild(o);
    });
    ms.value = ent.activeMemberId || ent.memberIds[0];
    tl.innerHTML = "<b>Mitglieder:</b> " + ent.memberIds.map(id => esc(getPerson(id)?.name || "?")).join(", ");
  } else {
    tw.style.display = "none";
    const myTeams = state.teams.filter(t => t.memberIds?.includes(sel.id));
    tl.innerHTML = myTeams.length ? myTeams.map(t => `<div style="margin:4px 0">• ${esc(t.name)}</div>`).join("") : "Keine Teams.";
  }
}

export function commitPersonForm() {
  const sel = parsePersonSel();
  const isTeam = sel.type === "team";
  const ent = isTeam ? state.teams.find(t => t.id === sel.id) : getPerson(sel.id);
  if (!ent) return;

  ent.name = $("personName").value;
  ent.email = $("personEmail").value;
  ent.phone = $("personPhone").value;

  const sh = state.shared[ent.sharedId] || (state.shared[ent.sharedId] = createShared());
  sh.address = $("personAddress").value;
  sh.bankName = $("bankName").value;
  sh.iban = $("iban").value;
  sh.bic = $("bic").value;
  sh.payNote = $("payNote").value;
  sh.logoFit = $("logoFit").value === "cover" ? "cover" : "contain";

  debouncedSave();

  const label = ent.name || "(ohne Name)";
  setSelectOptionText("selPerson", isTeam ? ("team:" + ent.id) : ent.id, label);

  renderPaper();
}
