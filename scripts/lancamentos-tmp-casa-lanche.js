/**
 * TMP — Casa do Lanche (Taxa de Manutenção Mensal)
 * Receita fixa de R$ 100,00/mês — Honorários Lenon
 * Fev/2026 a Dez/2026
 *
 * Rodar com: node scripts/lancamentos-tmp-casa-lanche.js
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

const BASE_ID = 2030
const meses = [
  { dueDate: '2026-02-01', ref: 'fev/2026' },
  { dueDate: '2026-03-01', ref: 'mar/2026' },
  { dueDate: '2026-04-01', ref: 'abr/2026' },
  { dueDate: '2026-05-01', ref: 'mai/2026' },
  { dueDate: '2026-06-01', ref: 'jun/2026' },
  { dueDate: '2026-07-01', ref: 'jul/2026' },
  { dueDate: '2026-08-01', ref: 'ago/2026' },
  { dueDate: '2026-09-01', ref: 'set/2026' },
  { dueDate: '2026-10-01', ref: 'out/2026' },
  { dueDate: '2026-11-01', ref: 'nov/2026' },
  { dueDate: '2026-12-01', ref: 'dez/2026' },
]

const entries = meses.map((m, i) => ({
  id: String(BASE_ID + i),
  description: `TMP — Casa do Lanche (ref. ${m.ref})`,
  amount: 100,
  dueDate: m.dueDate,
  settlementDate: '',
  type: 'Receita',
  status: 'pendente',
  recurrence: 'Fixa',
  accountId: 'sicoob-lenon',
  categoryId: 'honorarios',
  owner: 'lenon',
  captador: 'lenon',
}))

async function run() {
  console.log('── TMP — Casa do Lanche (Fev-Dez/2026) ──\n')

  for (const entry of entries) {
    await setDoc(doc(db, 'entries', entry.id), entry)
    console.log(`  ✓ id ${entry.id} — ${entry.description} — R$ 100,00`)
  }

  console.log(`\n✅ ${entries.length} lançamentos criados!`)
  process.exit(0)
}

run().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
