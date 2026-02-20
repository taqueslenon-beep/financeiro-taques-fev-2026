/**
 * Adiciona: assessoria de marketing, salário Berna e limpeza.
 * Rodar com: node scripts/add-more-entries.js
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

// ── Assessoria de Marketing — R$ 1.700 (último dia do mês) ───────
const marketingDates = [
  '2026-02-28', '2026-03-31', '2026-04-30', '2026-05-31',
  '2026-06-30', '2026-07-31', '2026-08-31', '2026-09-30',
  '2026-10-31', '2026-11-30', '2026-12-31',
]

const marketing = marketingDates.map((date, i) => ({
  id: 300 + i,
  description: 'Assessoria de marketing',
  amount: -1700.0,
  dueDate: date,
  settlementDate: '',
  type: 'Despesa',
  status: 'pendente',
  recurrence: 'Fixa',
  accountId: 'sicoob-lenon',
  responsible: 'lenon',
  categoryId: 'marketing',
}))

// ── Salário Berna (Administrativo) — R$ 1.000 (5º dia útil, a partir de março)
const salaryDates = [
  '2026-03-06', '2026-04-07', '2026-05-07', '2026-06-05',
  '2026-07-07', '2026-08-07', '2026-09-07', '2026-10-07',
  '2026-11-06', '2026-12-07',
]

const salary = salaryDates.map((date, i) => ({
  id: 400 + i,
  description: 'Salário — Berna (Administrativo)',
  amount: -1000.0,
  dueDate: date,
  settlementDate: '',
  type: 'Despesa',
  status: 'pendente',
  recurrence: 'Fixa',
  accountId: 'sicoob-lenon',
  responsible: 'lenon',
  categoryId: 'folha-pagamento',
}))

// ── Limpeza — R$ 300 (5º dia útil, a partir de março) ────────────
const cleaning = salaryDates.map((date, i) => ({
  id: 500 + i,
  description: 'Limpeza',
  amount: -300.0,
  dueDate: date,
  settlementDate: '',
  type: 'Despesa',
  status: 'pendente',
  recurrence: 'Fixa',
  accountId: 'sicoob-lenon',
  responsible: 'lenon',
  categoryId: 'manutencao-escritorio',
}))

const allEntries = [...marketing, ...salary, ...cleaning]

async function run() {
  console.log('Adicionando lançamentos...\n')

  console.log('→ Assessoria de marketing (11 meses)...')
  for (const e of marketing) {
    await setDoc(doc(db, 'entries', String(e.id)), e)
  }
  console.log(`  ✓ ${marketing.length} lançamentos criados`)

  console.log('→ Salário Berna — Administrativo (10 meses)...')
  for (const e of salary) {
    await setDoc(doc(db, 'entries', String(e.id)), e)
  }
  console.log(`  ✓ ${salary.length} lançamentos criados`)

  console.log('→ Limpeza (10 meses)...')
  for (const e of cleaning) {
    await setDoc(doc(db, 'entries', String(e.id)), e)
  }
  console.log(`  ✓ ${cleaning.length} lançamentos criados`)

  console.log(`\n✅ Total: ${allEntries.length} lançamentos adicionados!`)
  process.exit(0)
}

run().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
