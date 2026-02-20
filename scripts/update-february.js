/**
 * Remove lançamentos de fevereiro e insere os dados reais.
 * Rodar com: node scripts/update-february.js
 */

import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
} from 'firebase/firestore'

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

// ── 1. Deletar lançamentos de fevereiro ───────────────────────────
async function deleteFebEntries() {
  console.log('→ Removendo lançamentos de fevereiro...')

  const entriesSnap = await getDocs(collection(db, 'entries'))
  let deletedEntries = 0
  for (const d of entriesSnap.docs) {
    const data = d.data()
    if (data.dueDate && data.dueDate.startsWith('2026-02')) {
      await deleteDoc(doc(db, 'entries', d.id))
      deletedEntries++
    }
  }
  console.log(`  ✓ ${deletedEntries} lançamentos removidos`)

  const ccSnap = await getDocs(collection(db, 'creditCardEntries'))
  let deletedCC = 0
  for (const d of ccSnap.docs) {
    const data = d.data()
    if (data.date && data.date.startsWith('2026-02')) {
      await deleteDoc(doc(db, 'creditCardEntries', d.id))
      deletedCC++
    }
  }
  console.log(`  ✓ ${deletedCC} lançamentos de cartão removidos`)
}

// ── 2. Novos lançamentos de fevereiro ─────────────────────────────
const newFebEntries = [
  {
    id: 100,
    description: 'Internet',
    amount: -120.0,
    dueDate: '2026-02-15',
    settlementDate: '',
    type: 'Despesa',
    status: 'pendente',
    recurrence: 'Fixa',
    accountId: 'sicoob-lenon',
    responsible: 'lenon',
  },
  {
    id: 101,
    description: 'Aluguel — Sala 1',
    amount: -950.0,
    dueDate: '2026-02-15',
    settlementDate: '',
    type: 'Despesa',
    status: 'pendente',
    recurrence: 'Fixa',
    accountId: 'sicoob-lenon',
    responsible: 'lenon',
  },
  {
    id: 102,
    description: 'Aluguel — Sala 2',
    amount: -990.0,
    dueDate: '2026-02-15',
    settlementDate: '',
    type: 'Despesa',
    status: 'pendente',
    recurrence: 'Fixa',
    accountId: 'sicoob-lenon',
    responsible: 'lenon',
  },
  {
    id: 103,
    description: 'Energia elétrica — Sala 1',
    amount: -100.0,
    dueDate: '2026-02-15',
    settlementDate: '',
    type: 'Despesa',
    status: 'pendente',
    recurrence: 'Variável',
    accountId: 'sicoob-lenon',
    responsible: 'lenon',
  },
  {
    id: 104,
    description: 'Energia elétrica — Sala 2',
    amount: -100.0,
    dueDate: '2026-02-15',
    settlementDate: '',
    type: 'Despesa',
    status: 'pendente',
    recurrence: 'Variável',
    accountId: 'sicoob-lenon',
    responsible: 'lenon',
  },
  {
    id: 105,
    description: 'Plano de celular — Vivo',
    amount: -54.99,
    dueDate: '2026-02-03',
    settlementDate: '',
    type: 'Despesa',
    status: 'pendente',
    recurrence: 'Fixa',
    accountId: 'sicoob-lenon',
    responsible: 'lenon',
  },
  {
    id: 106,
    description: 'Contador',
    amount: -200.0,
    dueDate: '2026-02-10',
    settlementDate: '',
    type: 'Despesa',
    status: 'pendente',
    recurrence: 'Fixa',
    accountId: 'sicoob-lenon',
    responsible: 'lenon',
  },
  {
    id: 107,
    description: 'Simples Nacional',
    amount: -4255.14,
    dueDate: '2026-02-20',
    settlementDate: '',
    type: 'Despesa',
    status: 'pendente',
    recurrence: 'Fixa',
    accountId: 'sicoob-lenon',
    responsible: 'lenon',
  },
]

// ── 3. Parcelamento do Simples Nacional (12x R$ 924,97) ──────────
// Primeira parcela: 30/01/2026 — conforme mensagem da Berna
const parcelamento = []
const parcelaDates = [
  '2026-01-30', '2026-02-28', '2026-03-30', '2026-04-30',
  '2026-05-30', '2026-06-30', '2026-07-30', '2026-08-30',
  '2026-09-30', '2026-10-30', '2026-11-30', '2026-12-30',
]

for (let i = 0; i < 12; i++) {
  parcelamento.push({
    id: 200 + i,
    description: `Parcelamento Simples Nacional (Parcela ${i + 1}/12)`,
    amount: -924.97,
    dueDate: parcelaDates[i],
    settlementDate: '',
    type: 'Despesa',
    status: 'pendente',
    recurrence: 'Parcelamento',
    accountId: 'sicoob-lenon',
    responsible: 'lenon',
  })
}

// ── Executar ──────────────────────────────────────────────────────
async function run() {
  console.log('Atualizando Firestore...\n')

  await deleteFebEntries()

  console.log('\n→ Inserindo lançamentos de fevereiro...')
  for (const entry of newFebEntries) {
    await setDoc(doc(db, 'entries', String(entry.id)), entry)
  }
  console.log(`  ✓ ${newFebEntries.length} lançamentos de fevereiro criados`)

  console.log('→ Inserindo parcelamento do Simples Nacional (12x)...')
  for (const p of parcelamento) {
    await setDoc(doc(db, 'entries', String(p.id)), p)
  }
  console.log(`  ✓ ${parcelamento.length} parcelas criadas`)

  console.log('\n✅ Firestore atualizado com sucesso!')
  process.exit(0)
}

run().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
