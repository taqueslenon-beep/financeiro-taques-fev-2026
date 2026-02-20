/**
 * Lançamentos:
 * 1. MacBook — 10x R$ 749,99 a partir de Jan/2026 (tecnologia)
 * 2. Sofá para o escritório — Mercado Livre — 10x R$ 232,89 a partir de Fev/2026
 * 3. Alvará do escritório — R$ 96,88 anual, venc. 27/02/2026 e 27/02/2027
 *
 * Rodar com: node scripts/lancamentos-macbook-sofa-alvara.js
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDA9TYgWwSQpfE-ZEJG6dwzmeWg5oOy554',
  authDomain: 'financeiro-taques-fev-2026.firebaseapp.com',
  projectId: 'financeiro-taques-fev-2026',
  storageBucket: 'financeiro-taques-fev-2026.firebasestorage.app',
  messagingSenderId: '861102822919',
  appId: '1:861102822919:web:eb04f3b887fb8d326cfca2',
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const entries = []

// ── 1. MacBook — 10x R$ 749,99 a partir de Jan/2026 ──
const MACBOOK_BASE_ID = 1300
for (let i = 0; i < 10; i++) {
  const mes = i + 1 // Jan=1 ... Oct=10
  const mm = String(mes).padStart(2, '0')
  entries.push({
    id: MACBOOK_BASE_ID + i,
    description: `MacBook — Parcela ${i + 1}/10`,
    amount: -749.99,
    dueDate: `2026-${mm}-15`,
    settlementDate: null,
    type: 'Despesa',
    status: 'pendente',
    recurrence: 'Parcelamento',
    accountId: 'sicoob-lenon',
    categoryId: 'tecnologia',
    owner: 'lenon',
  })
}

// ── 2. Sofá para o escritório — 10x R$ 232,89 a partir de 16/Fev/2026 ──
const SOFA_BASE_ID = 1320
for (let i = 0; i < 10; i++) {
  const mes = i + 2 // Fev=2 ... Nov=11
  const ano = mes > 12 ? 2027 : 2026
  const mm = String(mes > 12 ? mes - 12 : mes).padStart(2, '0')
  entries.push({
    id: SOFA_BASE_ID + i,
    description: `Sofá para o escritório — Mercado Livre — Parcela ${i + 1}/10`,
    amount: -232.89,
    dueDate: `${ano}-${mm}-16`,
    settlementDate: null,
    type: 'Despesa',
    status: 'pendente',
    recurrence: 'Parcelamento',
    accountId: 'sicoob-lenon',
    categoryId: 'custos-estrutura',
    owner: 'lenon',
  })
}

// ── 3. Alvará do escritório — anual ──
entries.push({
  id: 1340,
  description: 'Alvará do Escritório — 2026',
  amount: -96.88,
  dueDate: '2026-02-27',
  settlementDate: null,
  type: 'Despesa',
  status: 'pendente',
  recurrence: 'Anual',
  accountId: 'sicoob-lenon',
  categoryId: 'impostos',
  owner: 'lenon',
})

entries.push({
  id: 1341,
  description: 'Alvará do Escritório — 2027',
  amount: -96.88,
  dueDate: '2027-02-27',
  settlementDate: null,
  type: 'Despesa',
  status: 'pendente',
  recurrence: 'Anual',
  accountId: 'sicoob-lenon',
  categoryId: 'impostos',
  owner: 'lenon',
})

async function run() {
  console.log('Lançando MacBook, Sofá e Alvará...\n')

  for (const entry of entries) {
    await setDoc(doc(db, 'entries', String(entry.id)), entry)
    console.log(`  ✓ ${entry.description} — R$ ${Math.abs(entry.amount).toFixed(2)} — venc. ${entry.dueDate}`)
  }

  console.log(`\nPronto! ${entries.length} entries criadas.`)
  process.exit(0)
}

run().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
