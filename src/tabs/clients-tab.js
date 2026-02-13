import { state, getClient } from '../state.js';
import { $, esc, setSelectOptionText, fmtMoney } from '../utils.js';
import { debouncedSave } from '../storage/engine.js';
import { renderPaper } from '../invoice/paper.js';
import { PFLEGESTUFE_CONFIG } from '../constants.js';

export function refreshClientsTab() {
  const sel = $("selClientMgmt");
  sel.innerHTML = "";
  state.clients.forEach(c => {
    const o = document.createElement("option");
    o.value = c.id;
    o.textContent = c.name || "(ohne Name)";
    sel.appendChild(o);
  });
  if (state.ui.selectedClientId) sel.value = state.ui.selectedClientId;
  if (!sel.value && state.clients[0]) sel.value = state.clients[0].id;
  loadClientForm(sel.value);
  renderClientStats(sel.value);
}

export function loadClientForm(cid) {
  const c = getClient(cid);
  if (!c) return;
  $("clientName").value = c.name || "";
  $("clientAddress").value = c.address || "";
  $("clientEmail").value = c.email || "";
  $("clientPhone").value = c.phone || "";
  $("clientPhone2").value = c.phone2 || "";
  $("clientNotes").value = c.notes || "";

  // Pflegestufe fields
  $("clientPflegestufe").value = c.pflegestufe ?? 1;
  $("clientSecondPerson").checked = !!c.secondPerson;
  $("clientNightWork").checked = !!c.nightWork;
  $("clientNoBreak").checked = !!c.noBreak;
  $("clientHasPet").checked = !!c.hasPet;
  $("clientNeedsDriver").checked = !!c.needsDriver;
  $("clientGoodGerman").checked = !!c.goodGerman;
  $("clientFoerderung").checked = !!c.foerderung;
  $("clientNetIncome").value = c.netIncome ?? 0;

  updateRateCalculation(c);

  const pa = $("clientPhoneActions");
  pa.innerHTML = "";
  if (c.phone) {
    pa.innerHTML += `<a href="tel:${esc(c.phone)}" class="btn btn-a phone-link"><span class="phone-icon">📞</span> ${esc(c.phone)} anrufen</a>`;
  }
  if (c.phone2) {
    pa.innerHTML += `<a href="tel:${esc(c.phone2)}" class="btn phone-link"><span class="phone-icon">📞</span> ${esc(c.phone2)} anrufen</a>`;
  }
}

export function updateRateCalculation(c) {
  if (!c) return;
  const cfg = PFLEGESTUFE_CONFIG;
  let rate = cfg.baseRate + (c.pflegestufe - 1) * cfg.perStufe;
  if (c.secondPerson) rate += cfg.secondPerson;
  if (c.nightWork) rate += cfg.nightWork;
  if (c.noBreak) rate += cfg.noBreak;
  if (c.hasPet) rate += cfg.pet;
  if (c.needsDriver) rate += cfg.driverLicense;
  if (c.goodGerman && rate < cfg.goodGermanMin) rate = cfg.goodGermanMin;

  const el = $("rateCalculation");
  if (el) {
    let html = `<b>Empfohlener Tagessatz: ${fmtMoney(rate)} €</b><br>`;
    html += `<span style="font-size:10px">Basis ${cfg.baseRate}€ + Stufe ${c.pflegestufe} (+${(c.pflegestufe-1)*cfg.perStufe}€)`;
    if (c.secondPerson) html += ` + 2. Person (+${cfg.secondPerson}€)`;
    if (c.nightWork) html += ` + Nachtarbeit (+${cfg.nightWork}€)`;
    if (c.noBreak) html += ` + Pausenausfall (+${cfg.noBreak}€)`;
    if (c.hasPet) html += ` + Haustier (+${cfg.pet}€)`;
    if (c.needsDriver) html += ` + Führerschein (+${cfg.driverLicense}€)`;
    if (c.goodGerman) html += ` (mind. ${cfg.goodGermanMin}€ für gute Deutschkenntnisse)`;
    html += `</span>`;
    if (c.foerderung) {
      const eligible = (c.netIncome || 0) <= 2500;
      html += `<br><span style="color:${eligible ? 'var(--good)' : 'var(--bad)'}"><b>Förderung:</b> ${eligible ? 'Berechtigt (Netto ≤ 2.500€)' : 'Nicht berechtigt (Netto > 2.500€)'}</span>`;
    }
    el.innerHTML = html;
  }
}

export function commitClientForm() {
  const cid = $("selClientMgmt").value;
  const c = getClient(cid);
  if (!c) return;

  c.name = $("clientName").value;
  c.address = $("clientAddress").value;
  c.email = $("clientEmail").value;
  c.phone = $("clientPhone").value;
  c.phone2 = $("clientPhone2").value;
  c.notes = $("clientNotes").value;

  // Pflegestufe
  c.pflegestufe = parseInt($("clientPflegestufe").value) || 1;
  c.secondPerson = $("clientSecondPerson").checked;
  c.nightWork = $("clientNightWork").checked;
  c.noBreak = $("clientNoBreak").checked;
  c.hasPet = $("clientHasPet").checked;
  c.needsDriver = $("clientNeedsDriver").checked;
  c.goodGerman = $("clientGoodGerman").checked;
  c.foerderung = $("clientFoerderung").checked;
  c.netIncome = parseFloat($("clientNetIncome").value) || 0;

  updateRateCalculation(c);
  debouncedSave();

  setSelectOptionText("selClient", cid, c.name || "(ohne Name)");
  setSelectOptionText("selClientMgmt", cid, c.name || "(ohne Name)");
  renderPaper();
}

export function renderClientStats(cid) {
  const hist = state.history.filter(h => h.clientId === cid && h.status !== "cancelled");
  const cont = $("clientStatsContent");
  if (!hist.length) {
    cont.innerHTML = '<div class="hint">Noch keine Rechnungen für diesen Kunden.</div>';
    return;
  }
  const totalAmount = hist.reduce((s, h) => s + h.grandTotal, 0);
  const totalDays = hist.reduce((s, h) => s + h.days, 0);
  const persons = [...new Set(hist.map(h => h.personName))];
  cont.innerHTML = `
    <div class="stat-grid">
      <div class="stat-box"><div class="stat-val">${hist.length}</div><div class="stat-label">Rechnungen</div></div>
      <div class="stat-box"><div class="stat-val">${fmtMoney(totalAmount)} €</div><div class="stat-label">Gesamtbetrag</div></div>
      <div class="stat-box"><div class="stat-val">${totalDays}</div><div class="stat-label">Betreuungstage</div></div>
      <div class="stat-box"><div class="stat-val">${persons.length}</div><div class="stat-label">Betreuer</div></div>
    </div>
    <div style="margin-top:10px" class="hint"><b>Bisherige Betreuer:</b> ${persons.map(esc).join(", ")}</div>`;
}
