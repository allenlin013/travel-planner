import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyArDVQpGD7qDDkGFe4Og3i4CnC-r3Swv2M",
  authDomain: "japan-trip-2026-6036c.firebaseapp.com",
  projectId: "japan-trip-2026-6036c",
  storageBucket: "japan-trip-2026-6036c.firebasestorage.app",
  messagingSenderId: "939400541612",
  appId: "1:939400541612:web:afe2090d3ee026c89fb609"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const TRIP_ID = 'osaka2026'
