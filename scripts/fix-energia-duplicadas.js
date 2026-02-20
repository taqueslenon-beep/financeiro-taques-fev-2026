/**
 * Remove entries antigas duplicadas de energia elétrica (R$ 100)
 * IDs 103 (Sala 1) e 104 (Sala 2)
 *
 * Rodar com: node scripts/fix-energia-duplicadas.js
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, doc, deleteDoc } from 'firebase/firestore'

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

async function run() {
  console.log('Removendo entries duplicadas de energia elétrica...\n')

  await deleteDoc(doc(db, 'entries', '103'))
  console.log('  ✓ id 103 — Energia elétrica Sala 1 (R$ 100) removida')

  await deleteDoc(doc(db, 'entries', '104'))
  console.log('  ✓ id 104 — Energia elétrica Sala 2 (R$ 100) removida')

  console.log('\nPronto!')
  process.exit(0)
}

run().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
