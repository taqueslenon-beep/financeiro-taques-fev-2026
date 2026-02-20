/**
 * Atualiza todas as retiradas de rateio (nível 2):
 *   - Status de 'aguardando' → 'pendente'
 *   - Descrição das retiradas Gilberto: adiciona "(descontado 5% imposto)"
 *
 * Rodar com: node scripts/fix-retiradas-status.js
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

const updates = [
  // Josmar — retiradas Gilberto
  {
    id: 992,
    updates: {
      status: 'pendente',
      description: 'Retirada Gilberto — Josmar Milcheski 1/2 (descontado 5% imposto)',
    },
  },
  {
    id: 993,
    updates: {
      status: 'pendente',
      description: 'Retirada Gilberto — Josmar Milcheski 2/2 (descontado 5% imposto)',
    },
  },
  // Schmidmeier — repasses D&F Projetos
  { id: 980, updates: { status: 'pendente' } },
  { id: 981, updates: { status: 'pendente' } },
  { id: 982, updates: { status: 'pendente' } },
  { id: 983, updates: { status: 'pendente' } },
  { id: 984, updates: { status: 'pendente' } },
]

async function run() {
  console.log('Atualizando retiradas de rateio...\n')

  for (const item of updates) {
    const ref = doc(db, 'entries', String(item.id))
    await setDoc(ref, item.updates, { merge: true })
    console.log(`  ✓ id ${item.id} → ${JSON.stringify(item.updates)}`)
  }

  console.log('\nPronto! Todas as retiradas de rateio agora são "pendente".')
  process.exit(0)
}

run().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
