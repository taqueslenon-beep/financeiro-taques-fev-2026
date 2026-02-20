/**
 * Lançamentos pró-labore — Sicoob Lenon — Janeiro 2026
 * 11 retiradas do sócio Lenon (itens #1, 2, 3, 23, 27, 30, 36, 38, 41, 42, 49)
 * Total: R$ 6.651,00
 *
 * Rodar com: node scripts/lancamentos-prolabore-jan2026.js
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

const entries = [
  // #1 — 02/01 — Retirada sócio Lenon — R$ 1.000
  {
    id: 800,
    description: 'Retirada sócio — Lenon',
    amount: -1000.0,
    dueDate: '2026-01-02',
    settlementDate: '2026-01-02',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'retirada-socio',
  },

  // #2 — 02/01 — Compra débito PamelaRussiBacca (pró-labore) — R$ 373
  {
    id: 801,
    description: 'Retirada sócio — Lenon (compra débito PJ)',
    amount: -373.0,
    dueDate: '2026-01-02',
    settlementDate: '2026-01-02',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'retirada-socio',
  },

  // #3 — 02/01 — Retirada sócio Lenon — R$ 300
  {
    id: 802,
    description: 'Retirada sócio — Lenon',
    amount: -300.0,
    dueDate: '2026-01-02',
    settlementDate: '2026-01-02',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'retirada-socio',
  },

  // #23 — 13/01 — Retirada sócio Lenon (3x R$100) — R$ 300
  {
    id: 803,
    description: 'Retirada sócio — Lenon (3 transferências)',
    amount: -300.0,
    dueDate: '2026-01-13',
    settlementDate: '2026-01-13',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'retirada-socio',
  },

  // #27 — 26/01 — Retirada sócio Lenon — R$ 1.000
  {
    id: 804,
    description: 'Retirada sócio — Lenon',
    amount: -1000.0,
    dueDate: '2026-01-26',
    settlementDate: '2026-01-26',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'retirada-socio',
  },

  // #30 — 26/01 — Retirada sócio Lenon — R$ 1.000
  {
    id: 805,
    description: 'Retirada sócio — Lenon',
    amount: -1000.0,
    dueDate: '2026-01-26',
    settlementDate: '2026-01-26',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'retirada-socio',
  },

  // #36 — 26/01 — Retirada sócio Lenon — R$ 100
  {
    id: 806,
    description: 'Retirada sócio — Lenon',
    amount: -100.0,
    dueDate: '2026-01-26',
    settlementDate: '2026-01-26',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'retirada-socio',
  },

  // #38 — 26/01 — Retirada sócio Lenon — R$ 200
  {
    id: 807,
    description: 'Retirada sócio — Lenon',
    amount: -200.0,
    dueDate: '2026-01-26',
    settlementDate: '2026-01-26',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'retirada-socio',
  },

  // #41 — 27/01 — Retirada sócio Lenon — R$ 1.608
  {
    id: 808,
    description: 'Retirada sócio — Lenon',
    amount: -1608.0,
    dueDate: '2026-01-27',
    settlementDate: '2026-01-27',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'retirada-socio',
  },

  // #42 — 27/01 — Retirada sócio Lenon — R$ 270
  {
    id: 809,
    description: 'Retirada sócio — Lenon',
    amount: -270.0,
    dueDate: '2026-01-27',
    settlementDate: '2026-01-27',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'retirada-socio',
  },

  // #49 — 30/01 — Retirada sócio Lenon — R$ 500
  {
    id: 810,
    description: 'Retirada sócio — Lenon',
    amount: -500.0,
    dueDate: '2026-01-30',
    settlementDate: '2026-01-30',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'retirada-socio',
  },
]

async function run() {
  console.log('── Lançamentos Pró-labore — Sicoob Lenon — Janeiro 2026 ──\n')

  for (const entry of entries) {
    await setDoc(doc(db, 'entries', String(entry.id)), entry)
    const valor = Math.abs(entry.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    console.log(`  ✓ id ${entry.id} — ${entry.description} — ↓ R$ ${valor} — ${entry.settlementDate}`)
  }

  console.log(`\n✅ ${entries.length} lançamentos de pró-labore criados!`)
  console.log(`   → Total: R$ 6.651,00`)
  process.exit(0)
}

run().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
