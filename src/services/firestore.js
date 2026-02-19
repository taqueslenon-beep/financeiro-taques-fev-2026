import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '../firebase'

/* ── Helpers de coleção ────────────────────────────────────────── */

function entriesCollection(prefix = '') {
  return collection(db, prefix ? `${prefix}entries` : 'entries')
}

function settingsDocRef(docName, prefix = '') {
  const settingsCol = prefix ? `${prefix}settings` : 'settings'
  return doc(db, settingsCol, docName)
}

function accountsCollection(prefix = '') {
  return collection(db, prefix ? `${prefix}accounts` : 'accounts')
}

// ── Entries ───────────────────────────────────────────────────────

const entriesRef = collection(db, 'entries')

export function subscribeEntries(callback, prefix = '') {
  const ref = entriesCollection(prefix)
  return onSnapshot(ref, (snapshot) => {
    const entries = snapshot.docs.map((d) => ({ ...d.data(), _docId: d.id }))
    callback(entries)
  })
}

export async function fetchEntries(prefix = '') {
  const ref = entriesCollection(prefix)
  const snapshot = await getDocs(ref)
  return snapshot.docs.map((d) => ({ ...d.data(), _docId: d.id }))
}

export async function saveEntry(entry, prefix = '') {
  const docId = String(entry.id)
  const col = prefix ? `${prefix}entries` : 'entries'
  await setDoc(doc(db, col, docId), entry)
  return entry
}

export async function updateEntry(entry, prefix = '') {
  const docId = String(entry.id)
  const { _docId, ...data } = entry
  const col = prefix ? `${prefix}entries` : 'entries'
  await setDoc(doc(db, col, docId), data)
  return entry
}

export async function deleteEntry(entryId, prefix = '') {
  const col = prefix ? `${prefix}entries` : 'entries'
  await deleteDoc(doc(db, col, String(entryId)))
}

// ── Accounts ─────────────────────────────────────────────────────

const accountsRef = collection(db, 'accounts')

export function subscribeAccounts(callback, prefix = '') {
  const ref = accountsCollection(prefix)
  return onSnapshot(ref, (snapshot) => {
    const accounts = snapshot.docs.map((d) => ({ ...d.data() }))
    callback(accounts)
  })
}

export async function fetchAccounts(prefix = '') {
  const ref = accountsCollection(prefix)
  const snapshot = await getDocs(ref)
  return snapshot.docs.map((d) => ({ ...d.data() }))
}

// ── Categories ───────────────────────────────────────────────────

export async function fetchCategories(prefix = '') {
  const ref = settingsDocRef('categories', prefix)
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() : { receita: [], despesa: [] }
}

export function subscribeCategories(callback, prefix = '') {
  const ref = settingsDocRef('categories', prefix)
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? snap.data() : { receita: [], despesa: [] })
  })
}

// ── Invoice Data ─────────────────────────────────────────────────

export async function fetchInvoiceData(prefix = '') {
  const ref = settingsDocRef('invoiceData', prefix)
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() : {}
}

export async function saveInvoiceData(data, prefix = '') {
  const ref = settingsDocRef('invoiceData', prefix)
  await setDoc(ref, data)
}

// ── Helpers ──────────────────────────────────────────────────────

export function generateEntryId() {
  return Date.now() + Math.floor(Math.random() * 1000)
}
