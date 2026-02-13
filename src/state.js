import { loadState } from './storage/engine.js';

export let state = null;

export async function initState() {
  state = await loadState();
}

export function setState(newState) {
  state = newState;
}

// Entity getters
export function getClient(id) {
  return state.clients.find(c => c.id === (id || state.ui.selectedClientId)) || null;
}

export function getPerson(id) {
  return state.persons.find(p => p.id === id) || null;
}

export function getShared(sid) {
  return state.shared[sid] || null;
}

export function getAssignment(id) {
  return state.assignments.find(a => a.id === id) || null;
}

export function getAssignmentsForClient(cid) {
  return state.assignments.filter(a => a.clientId === cid && a.isActive);
}

export function getActiveAssignment() {
  return getAssignment(state.currentInvoice.assignmentId);
}

export function getInvoicePerson() {
  const a = getActiveAssignment();
  if (!a) return null;
  return getPerson(a.personId);
}
