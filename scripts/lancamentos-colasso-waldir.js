/**
 * Lançamentos:
 *   1) Pedro Colasso — Parcela 1/2 R$ 5.000 + Parcela 2/2 R$ 10.000
 *   2) Waldir Jantsch e Patrícia — R$ 32.400 (assinatura) + R$ 76.100 (jun/2026) — 50% D&F
 *   3) Waldir Jantsch — R$ 50.000 (mai/2026) — 50% D&F — verificar valor real
 *
 * Rodar com: node scripts/lancamentos-colasso-waldir.js
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
  /* ── Pedro Colasso ─────────────────────────────────────────── */
  {
    id: '2001',
    description: 'Honorários Pedro Colasso (Parcela 1/2)',
    amount: 5000,
    dueDate: '2026-02-19',
    settlementDate: '',
    type: 'Receita',
    status: 'pendente',
    recurrence: 'Parcelamento',
    accountId: 'sicoob-lenon',
    categoryId: 'honorarios',
    owner: 'lenon',
    captador: 'lenon',
  },
  {
    id: '2002',
    description: 'Honorários Pedro Colasso (Parcela 2/2)',
    amount: 10000,
    dueDate: '2026-04-05',
    settlementDate: '',
    type: 'Receita',
    status: 'pendente',
    recurrence: 'Parcelamento',
    accountId: 'sicoob-lenon',
    categoryId: 'honorarios',
    owner: 'lenon',
    captador: 'lenon',
  },

  /* ── Waldir Jantsch e Patrícia — Parcela 1/2 (assinatura) ── */
  {
    id: '2010',
    description: 'Honorários Waldir Jantsch e Patrícia (Parcela 1/2)',
    amount: 32400,
    dueDate: '2026-02-19',
    settlementDate: '',
    type: 'Receita',
    status: 'pendente',
    recurrence: 'Parcelamento',
    accountId: 'sicoob-lenon',
    categoryId: 'honorarios',
    owner: 'lenon',
    captador: 'lenon',
    rateioId: 'rateio-waldir-p1',
    rateioLevel: 1,
  },
  {
    id: '2011',
    description: 'Repasse D&F Projetos — Waldir Jantsch e Patrícia (Parcela 1/2)',
    amount: 16200,
    dueDate: '2026-02-19',
    settlementDate: '',
    type: 'Despesa',
    status: 'pendente',
    recurrence: 'Variável',
    accountId: 'sicoob-lenon',
    categoryId: 'honorarios',
    owner: 'lenon',
    rateioId: 'rateio-waldir-p1',
    rateioLevel: 2,
    rateioMasterId: '2010',
  },

  /* ── Waldir Jantsch e Patrícia — Parcela 2/2 (jun/2026) ──── */
  {
    id: '2012',
    description: 'Honorários Waldir Jantsch e Patrícia (Parcela 2/2)',
    amount: 76100,
    dueDate: '2026-06-30',
    settlementDate: '',
    type: 'Receita',
    status: 'pendente',
    recurrence: 'Parcelamento',
    accountId: 'sicoob-lenon',
    categoryId: 'honorarios',
    owner: 'lenon',
    captador: 'lenon',
    rateioId: 'rateio-waldir-p2',
    rateioLevel: 1,
  },
  {
    id: '2013',
    description: 'Repasse D&F Projetos — Waldir Jantsch e Patrícia (Parcela 2/2)',
    amount: 38050,
    dueDate: '2026-06-30',
    settlementDate: '',
    type: 'Despesa',
    status: 'pendente',
    recurrence: 'Variável',
    accountId: 'sicoob-lenon',
    categoryId: 'honorarios',
    owner: 'lenon',
    rateioId: 'rateio-waldir-p2',
    rateioLevel: 2,
    rateioMasterId: '2012',
  },

  /* ── Waldir Jantsch — contrato separado (mai/2026) ────────── */
  {
    id: '2020',
    description: 'Honorários Waldir Jantsch (verificar valor real)',
    amount: 50000,
    dueDate: '2026-05-31',
    settlementDate: '',
    type: 'Receita',
    status: 'pendente',
    recurrence: 'Variável',
    accountId: 'sicoob-lenon',
    categoryId: 'honorarios',
    owner: 'lenon',
    captador: 'lenon',
    rateioId: 'rateio-waldir-mai',
    rateioLevel: 1,
  },
  {
    id: '2021',
    description: 'Repasse D&F Projetos — Waldir Jantsch (verificar valor real)',
    amount: 25000,
    dueDate: '2026-05-31',
    settlementDate: '',
    type: 'Despesa',
    status: 'pendente',
    recurrence: 'Variável',
    accountId: 'sicoob-lenon',
    categoryId: 'honorarios',
    owner: 'lenon',
    rateioId: 'rateio-waldir-mai',
    rateioLevel: 2,
    rateioMasterId: '2020',
  },
]

async function run() {
  console.log('── Lançamentos Pedro Colasso + Waldir Jantsch ──\n')

  for (const entry of entries) {
    await setDoc(doc(db, 'entries', String(entry.id)), entry)
    const tipo = entry.type === 'Receita' ? '↑ RECEITA' : '↓ REPASSE'
    const valor = Math.abs(entry.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    console.log(`  ✓ id ${entry.id} — ${entry.description} — ${tipo} R$ ${valor}`)
  }

  console.log(`\n✅ ${entries.length} lançamentos criados!`)
  console.log(`   → Pedro Colasso: 2 parcelas (R$ 5.000 + R$ 10.000)`)
  console.log(`   → Waldir Jantsch e Patrícia: 2 parcelas com repasse D&F 50%`)
  console.log(`   → Waldir Jantsch (outro contrato): R$ 50.000 com repasse D&F 50% — verificar valor`)
  process.exit(0)
}

run().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
