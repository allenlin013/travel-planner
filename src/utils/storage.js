import { TRIP_DATA, MEMBERS, EXCHANGE_RATE } from '../data/tripData'
import { DEFAULT_CHECKLIST } from '../data/checklistData'

export function initStorage() {
  if (!localStorage.getItem('trip_data')) {
    localStorage.setItem('trip_data', JSON.stringify(TRIP_DATA))
  }
  if (!localStorage.getItem('members')) {
    localStorage.setItem('members', JSON.stringify(MEMBERS))
  }
  if (!localStorage.getItem('exchange_rate')) {
    localStorage.setItem('exchange_rate', JSON.stringify(EXCHANGE_RATE))
  }
  if (!localStorage.getItem('expenses')) {
    localStorage.setItem('expenses', JSON.stringify([]))
  }
  if (!localStorage.getItem('checklist')) {
    localStorage.setItem('checklist', JSON.stringify(DEFAULT_CHECKLIST))
  }
  if (!localStorage.getItem('documents')) {
    localStorage.setItem('documents', JSON.stringify([]))
  }
  if (!localStorage.getItem('current_member')) {
    localStorage.setItem('current_member', 'YL')
  }
}

export function getTripData() {
  return JSON.parse(localStorage.getItem('trip_data') || 'null') || TRIP_DATA
}

export function getMembers() {
  return JSON.parse(localStorage.getItem('members') || 'null') || MEMBERS
}

export function getExchangeRate() {
  return JSON.parse(localStorage.getItem('exchange_rate') || 'null') || EXCHANGE_RATE
}

export function getStopNote(stopId) {
  return localStorage.getItem(`stop_notes_${stopId}`) || ''
}

export function setStopNote(stopId, note) {
  localStorage.setItem(`stop_notes_${stopId}`, note)
}

export function getExpenses() {
  return JSON.parse(localStorage.getItem('expenses') || '[]')
}

export function saveExpenses(expenses) {
  localStorage.setItem('expenses', JSON.stringify(expenses))
}

export function getChecklist() {
  return JSON.parse(localStorage.getItem('checklist') || 'null') || DEFAULT_CHECKLIST
}

export function saveChecklist(checklist) {
  localStorage.setItem('checklist', JSON.stringify(checklist))
}

export function getDocuments() {
  return JSON.parse(localStorage.getItem('documents') || '[]')
}

export function saveDocuments(docs) {
  localStorage.setItem('documents', JSON.stringify(docs))
}

export function getCurrentMember() {
  return localStorage.getItem('current_member') || 'YL'
}

export function setCurrentMember(member) {
  localStorage.setItem('current_member', member)
}
