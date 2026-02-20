/**
 * Correções:
 *   1) Pedro Colasso → Pedro Colaço (grafia correta)
 *   2) Waldir Jantsch parcela 2/2: R$ 76.100 → R$ 70.000 / repasse D&F R$ 38.050 → R$ 35.000
 *
 * Rodar com: node scripts/fix-colaco-waldir.js
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, doc, updateDoc } from 'firebase/firestore'

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

const updates = [
  { id: '2001', data: { description: 'Honorários Pedro Colaço (Parcela 1/2)' } },
  { id: '2002', data: { description: 'Honorários Pedro Colaço (Parcela 2/2)' } },
  { id: '2012', data: { amount: 70000 } },
  { id: '2013', data: { amount: 35000 } },
]

async function run() {
  console.log('── Correções Pedro Colaço + Waldir Jantsch ──\n')

  for (const u of updates) {
    await updateDoc(doc(db, 'entries', u.id), u.data)
    console.log(`  ✓ id ${u.id} — ${JSON.stringify(u.data)}`)
  }

  console.log('\n✅ Correções aplicadas!')
  process.exit(0)
}

run().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
