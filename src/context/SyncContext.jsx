import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import {
  collection, doc, onSnapshot,
  setDoc, deleteDoc, getDoc, writeBatch,
} from 'firebase/firestore'
import { db, TRIP_ID } from '../firebase'
import {
  getTripData, saveTripData,
  getExpenses, saveExpenses,
  getChecklist, saveChecklist,
  getDocuments, saveDocuments,
  getShopping, saveShopping,
  getMembers, initStorage,
} from '../utils/storage'
import { TRIP_DATA } from '../data/tripData'

const SyncContext = createContext(null)
export const useSync = () => useContext(SyncContext)

// Write / update Firestore with canonical trip data.
// Re-writes tripData if the version in Firestore is behind the local version.
async function bootstrap() {
  const ref  = doc(db, 'trips', TRIP_ID, 'config', 'tripData')
  const snap = await getDoc(ref)

  const remoteVersion = snap.exists() ? (snap.data().version ?? 0) : 0
  const localVersion  = TRIP_DATA.version ?? 0

  if (!snap.exists() || remoteVersion < localVersion) {
    const batch = writeBatch(db)
    batch.set(ref, TRIP_DATA)
    if (!snap.exists()) {
      batch.set(doc(db, 'trips', TRIP_ID, 'config', 'checklist'), getChecklist())
      batch.set(doc(db, 'trips', TRIP_ID, 'config', 'shopping'), { items: getShopping() })
    }
    await batch.commit()

    if (!snap.exists()) {
      const localExpenses = getExpenses()
      if (localExpenses.length > 0) {
        const expBatch = writeBatch(db)
        for (const exp of localExpenses) {
          expBatch.set(doc(db, 'trips', TRIP_ID, 'expenses', exp.id), exp)
        }
        await expBatch.commit()
      }
    }
  }
}

export function SyncProvider({ children }) {
  const [expenses,    setExpenses]    = useState(getExpenses)
  const [checklist,   setChecklist]   = useState(getChecklist)
  const [tripData,    setTripData]    = useState(getTripData)
  const [documents,   setDocuments]   = useState(getDocuments)
  const [shopping,    setShopping]    = useState(getShopping)
  const [synced,      setSynced]      = useState(false)
  const [coverImage,  setCoverImage]  = useState(() => {
    // seed from localStorage while Firestore loads
    try { return localStorage.getItem('trip_cover_img') || null } catch (_) { return null }
  })

  // Debounce timers for large documents (avoid Firestore write per keystroke)
  const tripDataTimer   = useRef(null)
  const checklistTimer  = useRef(null)
  const shoppingTimer   = useRef(null)

  useEffect(() => {
    initStorage()
    bootstrap().catch(console.error)

    const unsubs = []

    // ── Expenses ─────────────────────────────────────────
    unsubs.push(onSnapshot(
      collection(db, 'trips', TRIP_ID, 'expenses'),
      snap => {
        const data = snap.docs.map(d => ({ ...d.data(), id: d.id }))
        data.sort((a, b) => (a.date || '').localeCompare(b.date || ''))
        setExpenses(data); saveExpenses(data); setSynced(true)
      },
      err => console.error('expenses:', err)
    ))

    // ── Checklist ────────────────────────────────────────
    unsubs.push(onSnapshot(
      doc(db, 'trips', TRIP_ID, 'config', 'checklist'),
      snap => { if (snap.exists()) { setChecklist(snap.data()); saveChecklist(snap.data()) } }
    ))

    // ── Trip data ────────────────────────────────────────
    unsubs.push(onSnapshot(
      doc(db, 'trips', TRIP_ID, 'config', 'tripData'),
      snap => { if (snap.exists()) { setTripData(snap.data()); saveTripData(snap.data()) } }
    ))

    // ── Shopping list ────────────────────────────────────
    unsubs.push(onSnapshot(
      doc(db, 'trips', TRIP_ID, 'config', 'shopping'),
      snap => {
        if (snap.exists()) {
          const items = snap.data().items || []
          setShopping(items); saveShopping(items)
        }
      }
    ))

    // ── Cover image ──────────────────────────────────────
    unsubs.push(onSnapshot(
      doc(db, 'trips', TRIP_ID, 'config', 'coverImage'),
      snap => {
        if (snap.exists()) {
          const dataUrl = snap.data().dataUrl || null
          setCoverImage(dataUrl)
          // cache locally so it loads instantly on next open
          try {
            if (dataUrl) localStorage.setItem('trip_cover_img', dataUrl)
            else         localStorage.removeItem('trip_cover_img')
          } catch (_) {}
        }
      }
    ))

    // ── Documents ────────────────────────────────────────
    unsubs.push(onSnapshot(
      collection(db, 'trips', TRIP_ID, 'documents'),
      snap => {
        const remote     = snap.docs.map(d => ({ ...d.data(), id: d.id }))
        const localImages = getDocuments().filter(d => d.type === 'image')
        setDocuments([...remote, ...localImages])
      }
    ))

    return () => {
      unsubs.forEach(u => u())
      // Flush any pending debounced writes before unmount
      if (tripDataTimer.current)  clearTimeout(tripDataTimer.current)
      if (checklistTimer.current) clearTimeout(checklistTimer.current)
      if (shoppingTimer.current)  clearTimeout(shoppingTimer.current)
    }
  }, [])

  // ── Write helpers ────────────────────────────────────
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

  // Debounced: update locally immediately, Firestore after 1.5s idle
  const updateTripData = useCallback((updated) => {
    setTripData(updated); saveTripData(updated)
    if (tripDataTimer.current) clearTimeout(tripDataTimer.current)
    tripDataTimer.current = setTimeout(async () => {
      try { await setDoc(doc(db, 'trips', TRIP_ID, 'config', 'tripData'), updated) }
      catch (e) { console.error('tripData write:', e) }
    }, 1500)
  }, [])

  const updateChecklist = useCallback((updated) => {
    setChecklist(updated); saveChecklist(updated)
    if (checklistTimer.current) clearTimeout(checklistTimer.current)
    checklistTimer.current = setTimeout(async () => {
      try { await setDoc(doc(db, 'trips', TRIP_ID, 'config', 'checklist'), updated) }
      catch (e) { console.error('checklist write:', e) }
    }, 1500)
  }, [])

  const addDocument = useCallback(async (docItem) => {
    setDocuments(prev => [docItem, ...prev])
    // 'link' and 'drive' types are small metadata → sync via Firestore
    // 'image' type is base64 binary → local only
    if (docItem.type === 'link' || docItem.type === 'drive') {
      try { await setDoc(doc(db, 'trips', TRIP_ID, 'documents', docItem.id), docItem) }
      catch (e) { console.error(e) }
    } else {
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

  // ── Shopping list (stored as one Firestore doc: {items:[...]}) ──
  const _writeShopping = useCallback((items) => {
    if (shoppingTimer.current) clearTimeout(shoppingTimer.current)
    shoppingTimer.current = setTimeout(async () => {
      try { await setDoc(doc(db, 'trips', TRIP_ID, 'config', 'shopping'), { items }) }
      catch (e) { console.error('shopping write:', e) }
    }, 1500)
  }, [])

  const addShoppingItem = useCallback((item) => {
    setShopping(prev => {
      const next = [item, ...prev]; saveShopping(next); _writeShopping(next); return next
    })
  }, [_writeShopping])

  const updateShoppingItem = useCallback((item) => {
    setShopping(prev => {
      const next = prev.map(s => s.id === item.id ? item : s)
      saveShopping(next); _writeShopping(next); return next
    })
  }, [_writeShopping])

  const deleteShoppingItem = useCallback((id) => {
    setShopping(prev => {
      const next = prev.filter(s => s.id !== id)
      saveShopping(next); _writeShopping(next); return next
    })
  }, [_writeShopping])

  const updateCoverImage = useCallback(async (dataUrl) => {
    setCoverImage(dataUrl)
    try {
      if (dataUrl) {
        localStorage.setItem('trip_cover_img', dataUrl)
        await setDoc(doc(db, 'trips', TRIP_ID, 'config', 'coverImage'), { dataUrl })
      } else {
        localStorage.removeItem('trip_cover_img')
        await setDoc(doc(db, 'trips', TRIP_ID, 'config', 'coverImage'), { dataUrl: null })
      }
    } catch (e) { console.error('coverImage write:', e) }
  }, [])

  return (
    <SyncContext.Provider value={{
      expenses, checklist, tripData, documents, shopping, synced, coverImage,
      members: tripData?.members || getMembers(),
      addExpense, updateExpense, deleteExpense,
      updateTripData, updateChecklist,
      addDocument, deleteDocument,
      addShoppingItem, updateShoppingItem, deleteShoppingItem,
      updateCoverImage,
    }}>
      {children}
    </SyncContext.Provider>
  )
}
