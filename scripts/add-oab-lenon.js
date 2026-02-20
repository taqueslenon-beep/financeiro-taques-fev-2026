/**
 * Adiciona as 11 parcelas da Anuidade OAB — Lenon ao Firestore.
 *
 * Rodar com: node scripts/add-oab-lenon.js
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

const parcelas = [
  { parcela: 1,  dueDate: '2026-02-10', amount: 98.57  },
  { parcela: 2,  dueDate: '2026-03-10', amount: 47.72  },
  { parcela: 3,  dueDate: '2026-04-10', amount: 95.45  },
  { parcela: 4,  dueDate: '2026-05-11', amount: 95.45  },
  { parcela: 5,  dueDate: '2026-06-10', amount: 95.45  },
  { parcela: 6,  dueDate: '2026-07-10', amount: 95.45  },
  { parcela: 7,  dueDate: '2026-08-10', amount: 95.45  },
  { parcela: 8,  dueDate: '2026-09-10', amount: 95.45  },
  { parcela: 9,  dueDate: '2026-10-13', amount: 95.45  },
  { parcela: 10, dueDate: '2026-11-10', amount: 95.45  },
  { parcela: 11, dueDate: '2026-12-10', amount: 95.50  },
]

const BASE_ID = 800

async function run() {
  console.log('── Adicionando Anuidade OAB — Lenon (11 parcelas) ──')

  for (const p of parcelas) {
    const entry = {
      id: BASE_ID + p.parcela,
      description: `Anuidade OAB — Lenon (Parcela ${p.parcela}/11)`,
      amount: -p.amount,
      dueDate: p.dueDate,
      settlementDate: '',
      type: 'Despesa',
      status: 'pendente',
      recurrence: 'Parcelamento',
      accountId: 'sicoob-lenon',
      categoryId: 'anuidade-oab',
    }

    await setDoc(doc(db, 'entries', String(entry.id)), entry)
    console.log(`  ✓ Parcela ${p.parcela}/11 — ${p.dueDate} — R$ ${p.amount.toFixed(2)}`)
  }

  console.log(`\n✅ 11 parcelas da OAB adicionadas!`)
  process.exit(0)
}

run().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
