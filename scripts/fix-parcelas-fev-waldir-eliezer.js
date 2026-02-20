/**
 * Correções:
 *   1) Apagar parcelas 1 de fev (IDs 2001, 2010, 2011)
 *   2) Waldir Jantsch (2012/2013) → Maio, R$ 70.000, Parcela 2/2
 *   3) Antigo "Waldir verificar" (2020/2021) → Eliezer Jantsch, 30/06, R$ 76.100, Parcela 2/2
 *
 * Rodar com: node scripts/fix-parcelas-fev-waldir-eliezer.js
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, doc, deleteDoc, updateDoc } from 'firebase/firestore'

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

const toDelete = ['2001', '2010', '2011']

const toUpdate = [
  {
    id: '2012',
    data: {
      description: 'Honorários Waldir Jantsch (Parcela 2/2)',
      amount: 70000,
      dueDate: '2026-05-31',
    },
  },
  {
    id: '2013',
    data: {
      description: 'Repasse D&F Projetos — Waldir Jantsch (Parcela 2/2)',
      amount: 35000,
      dueDate: '2026-05-31',
      rateioId: 'rateio-waldir-p2',
    },
  },
  {
    id: '2020',
    data: {
      description: 'Honorários Eliezer Jantsch (Parcela 2/2)',
      amount: 76100,
      dueDate: '2026-06-30',
      rateioId: 'rateio-eliezer',
    },
  },
  {
    id: '2021',
    data: {
      description: 'Repasse D&F Projetos — Eliezer Jantsch (Parcela 2/2)',
      amount: 38050,
      dueDate: '2026-06-30',
      rateioId: 'rateio-eliezer',
    },
  },
]

async function run() {
  console.log('── Correções: apagar fev + ajustar Waldir/Eliezer ──\n')

  for (const id of toDelete) {
    await deleteDoc(doc(db, 'entries', id))
    console.log(`  🗑 id ${id} — apagado`)
  }

  for (const u of toUpdate) {
    await updateDoc(doc(db, 'entries', u.id), u.data)
    console.log(`  ✓ id ${u.id} — ${u.data.description} — R$ ${u.data.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  }

  console.log('\n✅ Pronto!')
  console.log('   → 3 entradas de fevereiro apagadas')
  console.log('   → Waldir Jantsch: R$ 70.000 em 31/mai (Parcela 2/2) + repasse D&F R$ 35.000')
  console.log('   → Eliezer Jantsch: R$ 76.100 em 30/jun (Parcela 2/2) + repasse D&F R$ 38.050')
  process.exit(0)
}

run().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
