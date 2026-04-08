import { TRIP_DATA, MEMBERS, EXCHANGE_RATE } from '../data/tripData'
import { DEFAULT_CHECKLIST } from '../data/checklistData'

export function initStorage() {
  if (!localStorage.getItem('trip_data'))      localStorage.setItem('trip_data', JSON.stringify(TRIP_DATA))
  if (!localStorage.getItem('members'))        localStorage.setItem('members', JSON.stringify(MEMBERS))
  if (!localStorage.getItem('exchange_rate'))  localStorage.setItem('exchange_rate', JSON.stringify(EXCHANGE_RATE))
  if (!localStorage.getItem('expenses'))       localStorage.setItem('expenses', JSON.stringify([]))
  if (!localStorage.getItem('checklist'))      localStorage.setItem('checklist', JSON.stringify(DEFAULT_CHECKLIST))
  if (!localStorage.getItem('documents'))      localStorage.setItem('documents', JSON.stringify([]))
  if (!localStorage.getItem('shopping'))       localStorage.setItem('shopping', JSON.stringify([]))
  if (!localStorage.getItem('current_member')) localStorage.setItem('current_member', 'YL')
}

export const getTripData    = () => { try { return JSON.parse(localStorage.getItem('trip_data'))   || TRIP_DATA        } catch(_) { return TRIP_DATA } }
export const saveTripData   = (d) => localStorage.setItem('trip_data', JSON.stringify(d))

export const getMembers     = () => { try { return JSON.parse(localStorage.getItem('members'))      || MEMBERS         } catch(_) { return MEMBERS } }
export const getExchangeRate= () => { try { return JSON.parse(localStorage.getItem('exchange_rate'))|| EXCHANGE_RATE   } catch(_) { return EXCHANGE_RATE } }

export const getStopNote    = (id) => localStorage.getItem(`stop_notes_${id}`) || ''
export const setStopNote    = (id, v) => localStorage.setItem(`stop_notes_${id}`, v)

export const getExpenses    = () => { try { return JSON.parse(localStorage.getItem('expenses') || '[]') } catch(_) { return [] } }
export const saveExpenses   = (d) => localStorage.setItem('expenses', JSON.stringify(d))

export const getChecklist   = () => { try { return JSON.parse(localStorage.getItem('checklist'))   || DEFAULT_CHECKLIST } catch(_) { return DEFAULT_CHECKLIST } }
export const saveChecklist  = (d) => localStorage.setItem('checklist', JSON.stringify(d))

export const getDocuments   = () => { try { return JSON.parse(localStorage.getItem('documents') || '[]') } catch(_) { return [] } }
export const saveDocuments  = (d) => localStorage.setItem('documents', JSON.stringify(d))

export const getShopping    = () => { try { return JSON.parse(localStorage.getItem('shopping') || '[]') } catch(_) { return [] } }
export const saveShopping   = (d) => localStorage.setItem('shopping', JSON.stringify(d))

export const getCurrentMember = () => localStorage.getItem('current_member') || 'YL'
export const setCurrentMember = (m) => localStorage.setItem('current_member', m)
