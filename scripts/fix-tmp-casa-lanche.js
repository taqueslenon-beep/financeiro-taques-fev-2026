/**
 * TMP Casa do Lanche:
 *   - Adicionar janeiro/2026
 *   - Ajustar datas para último dia do mês (fev-dez)
 *
 * Rodar com: node scripts/fix-tmp-casa-lanche.js
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, updateDoc } from 'firebase/firestore'

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

const newEntry = {
  id: '2029',
  description: 'TMP — Casa do Lanche (ref. jan/2026)',
  amount: 100,
  dueDate: '2026-01-31',
  settlementDate: '',
  type: 'Receita',
  status: 'pendente',
  recurrence: 'Fixa',
  accountId: 'sicoob-lenon',
  categoryId: 'honorarios',
  owner: 'lenon',
  captador: 'lenon',
}

const dateUpdates = [
  { id: '2030', dueDate: '2026-02-28' },
  { id: '2031', dueDate: '2026-03-31' },
  { id: '2032', dueDate: '2026-04-30' },
  { id: '2033', dueDate: '2026-05-31' },
  { id: '2034', dueDate: '2026-06-30' },
  { id: '2035', dueDate: '2026-07-31' },
  { id: '2036', dueDate: '2026-08-31' },
  { id: '2037', dueDate: '2026-09-30' },
  { id: '2038', dueDate: '2026-10-31' },
  { id: '2039', dueDate: '2026-11-30' },
  { id: '2040', dueDate: '2026-12-31' },
]

async function run() {
  console.log('── TMP Casa do Lanche — ajustes ──\n')

  await setDoc(doc(db, 'entries', newEntry.id), newEntry)
  console.log(`  ✓ id ${newEntry.id} — ${newEntry.description} — ${newEntry.dueDate}`)

  for (const u of dateUpdates) {
    await updateDoc(doc(db, 'entries', u.id), { dueDate: u.dueDate })
    console.log(`  ✓ id ${u.id} — vencimento → ${u.dueDate}`)
  }

  console.log('\n✅ Pronto! Janeiro adicionado + todas as datas no último dia do mês.')
  process.exit(0)
}

run().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
