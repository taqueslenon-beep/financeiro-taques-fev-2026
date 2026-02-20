/**
 * Lançamentos Honorários Josmar Milcheski
 * Advogado responsável: Gilberto
 * Contrato: R$ 11.597,00 em 2 parcelas de R$ 5.798,50
 * Vencimentos: 09/03/2026 e 09/04/2026
 *
 * Rodar com: node scripts/lancamentos-josmar.js
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
  {
    id: 990,
    description: 'Honorários Josmar Milcheski — Parcela 1/2',
    amount: 5798.50,
    dueDate: '2026-03-09',
    settlementDate: null,
    type: 'Receita',
    status: 'pendente',
    recurrence: 'parcelada',
    accountId: 'sicoob-lenon',
    categoryId: 'honorarios',
    owner: 'gilberto',
    captador: 'gilberto',
  },
  {
    id: 991,
    description: 'Honorários Josmar Milcheski — Parcela 2/2',
    amount: 5798.50,
    dueDate: '2026-04-09',
    settlementDate: null,
    type: 'Receita',
    status: 'pendente',
    recurrence: 'parcelada',
    accountId: 'sicoob-lenon',
    categoryId: 'honorarios',
    owner: 'gilberto',
    captador: 'gilberto',
  },
]

async function run() {
  console.log('Lançando honorários Josmar Milcheski...\n')

  for (const entry of entries) {
    const ref = doc(db, 'entries', String(entry.id))
    await setDoc(ref, entry)
    console.log(`  ✓ ${entry.description} — R$ ${entry.amount.toFixed(2)} — venc. ${entry.dueDate}`)
  }

  console.log('\nPronto! 2 parcelas lançadas.')
  process.exit(0)
}

run().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
