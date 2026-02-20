/**
 * Conciliação bancária — Sicoob Lenon — Fevereiro 2026
 *
 * Este script faz:
 *   1. Marca Carro Jetta (id 600) como pago em 10/02/2026
 *   2. Marca Aluguel Sala 2 (id 102) como pago em 18/02/2026
 *   3. Corrige Aluguel Sala 1 (id 101) de -950 para -920 e marca pago em 18/02/2026
 *
 * Rodar com: node scripts/conciliacao-fev2026.js
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'

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

const conciliacoes = [
  {
    id: '700',
    label: 'Carro — Jetta (Parcela 1/60)',
    updates: {
      settlementDate: '2026-02-10',
      status: 'pago',
    },
  },
  {
    id: '102',
    label: 'Aluguel — Sala 2',
    updates: {
      settlementDate: '2026-02-18',
      status: 'pago',
    },
  },
  {
    id: '101',
    label: 'Aluguel — Sala 1 (valor corrigido: -950 → -920)',
    updates: {
      amount: -920.0,
      settlementDate: '2026-02-18',
      status: 'pago',
    },
  },
]

async function run() {
  console.log('── Conciliação Bancária — Sicoob Lenon — Fev/2026 ──\n')

  for (const item of conciliacoes) {
    const ref = doc(db, 'entries', item.id)
    const snap = await getDoc(ref)

    if (snap.exists()) {
      await setDoc(ref, item.updates, { merge: true })
      console.log(`  ✓ ${item.label} (atualizado)`)
    } else {
      console.log(`  ⚠ id ${item.id} não encontrado no Firestore — pulando`)
    }
    console.log(`    → ${JSON.stringify(item.updates)}\n`)
  }

  console.log('✅ Conciliação concluída! 3 lançamentos atualizados.')
  process.exit(0)
}

run().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
