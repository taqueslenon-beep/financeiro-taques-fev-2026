/**
 * Cria entries mensais do Simples Nacional (Fev/2026 a Dez/2026).
 * O valor será calculado automaticamente pelo App.jsx com base no
 * faturamento previsto do mês anterior × 5%.
 *
 * Aqui salvamos com amount: 0 e categoryId: 'simples-nacional'.
 * O App.jsx detecta essa categoria e sobrescreve o valor dinamicamente.
 *
 * Vencimento fixo: dia 20 de cada mês.
 *
 * Rodar com: node scripts/criar-simples-nacional.js
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

const BASE_ID = 1100
const MESES = [
  { num: 2,  label: 'Fev/2026' },
  { num: 3,  label: 'Mar/2026' },
  { num: 4,  label: 'Abr/2026' },
  { num: 5,  label: 'Mai/2026' },
  { num: 6,  label: 'Jun/2026' },
  { num: 7,  label: 'Jul/2026' },
  { num: 8,  label: 'Ago/2026' },
  { num: 9,  label: 'Set/2026' },
  { num: 10, label: 'Out/2026' },
  { num: 11, label: 'Nov/2026' },
  { num: 12, label: 'Dez/2026' },
]

async function run() {
  console.log('Criando entries mensais do Simples Nacional...\n')

  for (let i = 0; i < MESES.length; i++) {
    const m = MESES[i]
    const mm = String(m.num).padStart(2, '0')
    const id = BASE_ID + i

    const entry = {
      id,
      description: `Simples Nacional — ${m.label}`,
      amount: 0,
      dueDate: `2026-${mm}-20`,
      settlementDate: null,
      type: 'Despesa',
      status: 'pendente',
      recurrence: 'Mensal',
      accountId: 'sicoob-lenon',
      categoryId: 'simples-nacional',
      owner: 'lenon',
    }

    await setDoc(doc(db, 'entries', String(id)), entry)
    console.log(`  ✓ ${entry.description} — venc. ${entry.dueDate} (valor automático)`)
  }

  console.log('\nPronto! 11 entries do Simples Nacional criadas.')
  console.log('O valor será calculado automaticamente: faturamento do mês anterior × 5%.')
  process.exit(0)
}

run().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
