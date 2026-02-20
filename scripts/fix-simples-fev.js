/**
 * Remove a entry 1100 (Simples Nacional Fev/2026 auto-calculado)
 * pois já existe a entry 107 com o valor real (R$ 4.255,14).
 *
 * Rodar com: node scripts/fix-simples-fev.js
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
  console.log('Removendo Simples Nacional Fev/2026 duplicado (id 1100)...')
  await deleteDoc(doc(db, 'entries', '1100'))
  console.log('  ✓ Entry 1100 removida.')
  console.log('  → Entry 107 (R$ 4.255,14) permanece como o valor real de fevereiro.')
  process.exit(0)
}

run().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
