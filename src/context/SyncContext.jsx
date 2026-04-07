import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  collection, doc, onSnapshot,
  setDoc, deleteDoc, getDoc,
} from 'firebase/firestore'
import { db, TRIP_ID } from '../firebase'
import {
  getTripData, saveTripData,
  getExpenses, saveExpenses,
  getChecklist, saveChecklist,
  getDocuments, saveDocuments,
  getMembers, initStorage,
} from '../utils/storage'

const SyncContext = createContext(null)
export const useSync = () => useContext(SyncContext)

// Write initial data to Firestore if this is the first time
async function bootstrap() {
  const ref = doc(db, 'trips', TRIP_ID, 'config', 'tripData')
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, getTripData())
    await setDoc(doc(db, 'trips', TRIP_ID, 'config', 'checklist'), getChecklist())
    const localExpenses = getExpenses()
    for (const exp of localExpenses) {
      await setDoc(doc(db, 'trips', TRIP_ID, 'expenses', exp.id), exp)
    }
    const localDocs = getDocuments().filter(d => d.type === 'link')
    for (const d of localDocs) {
      await setDoc(doc(db, 'trips', TRIP_ID, 'documents', d.id), d)
    }
  }
}

export function SyncProvider({ children }) {
  const [expenses,  setExpenses]  = useState(getExpenses)
  const [checklist, setChecklist] = useState(getChecklist)
  const [tripData,  setTripData]  = useState(getTripData)
  const [documents, setDocuments] = useState(getDocuments)
  const [synced,    setSynced]    = useState(false)

  useEffect(() => {
    initStorage()
    bootstrap().catch(console.error)

    const unsubs = []

    // ── Expenses ──────────────────────────────────────────
    unsubs.push(onSnapshot(
      collection(db, 'trips', TRIP_ID, 'expenses'),
      snap => {
        const data = snap.docs.map(d => ({ ...d.data(), id: d.id }))
        data.sort((a, b) => (a.date || '').localeCompare(b.date || ''))
        setExpenses(data)
        saveExpenses(data)
        setSynced(true)
      },
      err => console.error('expenses:', err)
    ))

    // ── Checklist ─────────────────────────────────────────
    unsubs.push(onSnapshot(
      doc(db, 'trips', TRIP_ID, 'config', 'checklist'),
      snap => {
        if (snap.exists()) { setChecklist(snap.data()); saveChecklist(snap.data()) }
      }
    ))

    // ── Trip data (stops + descriptions) ──────────────────
    unsubs.push(onSnapshot(
      doc(db, 'trips', TRIP_ID, 'config', 'tripData'),
      snap => {
        if (snap.exists()) { setTripData(snap.data()); saveTripData(snap.data()) }
      }
    ))

    // ── Documents ─────────────────────────────────────────
    unsubs.push(onSnapshot(
      collection(db, 'trips', TRIP_ID, 'documents'),
      snap => {
        const remote = snap.docs.map(d => ({ ...d.data(), id: d.id }))
        // Merge with local base64 images (too large for Firestore)
        const localImages = getDocuments().filter(d => d.type === 'image')
        setDocuments([...remote, ...localImages])
      }
    ))

    return () => unsubs.forEach(u => u())
  }, [])

  // ── Write helpers ────────────────────────────────────────
  const addExpense = useCallback(async (exp) => {
    setExpenses(prev => { const u = [...prev, exp]; saveExpenses(u); return u })
    try { await setDoc(doc(db, 'trips', TRIP_ID, 'expenses', exp.id), exp) }
    catch (e) { console.error(e) }
  }, [])

  const updateExpense = useCallback(async (exp) => {
    setExpenses(prev => { const u = prev.map(e => e.id === exp.id ? exp : e); saveExpenses(u); return u })
    try { await setDoc(doc(db, 'trips', TRIP_ID, 'expenses', exp.id), exp) }
    catch (e) { console.error(e) }
  }, [])

  const deleteExpense = useCallback(async (id) => {
    setExpenses(prev => { const u = prev.filter(e => e.id !== id); saveExpenses(u); return u })
    try { await deleteDoc(doc(db, 'trips', TRIP_ID, 'expenses', id)) }
    catch (e) { console.error(e) }
  }, [])

  const updateTripData = useCallback(async (updated) => {
    setTripData(updated); saveTripData(updated)
    try { await setDoc(doc(db, 'trips', TRIP_ID, 'config', 'tripData'), updated) }
    catch (e) { console.error(e) }
  }, [])

  const updateChecklist = useCallback(async (updated) => {
    setChecklist(updated); saveChecklist(updated)
    try { await setDoc(doc(db, 'trips', TRIP_ID, 'config', 'checklist'), updated) }
    catch (e) { console.error(e) }
  }, [])

  const addDocument = useCallback(async (docItem) => {
    setDocuments(prev => [docItem, ...prev])
    if (docItem.type === 'link') {
      try { await setDoc(doc(db, 'trips', TRIP_ID, 'documents', docItem.id), docItem) }
      catch (e) { console.error(e) }
    } else {
      // base64 — local only
      const local = getDocuments()
      saveDocuments([docItem, ...local])
    }
  }, [])

  const deleteDocument = useCallback(async (id) => {
    setDocuments(prev => prev.filter(d => d.id !== id))
    const local = getDocuments().filter(d => d.id !== id)
    saveDocuments(local)
    try { await deleteDoc(doc(db, 'trips', TRIP_ID, 'documents', id)) } catch (_) {}
  }, [])

  return (
    <SyncContext.Provider value={{
      expenses, checklist, tripData, documents, synced,
      members: tripData?.members || getMembers(),
      addExpense, updateExpense, deleteExpense,
      updateTripData, updateChecklist,
      addDocument, deleteDocument,
    }}>
      {children}
    </SyncContext.Provider>
  )
}
