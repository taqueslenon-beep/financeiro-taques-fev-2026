/**
 * Cria entries de Energia Elétrica — Sala 1 (Celesc)
 * De abril a dezembro/2026, com valor médio de R$ 184,53
 * baseado nas faturas de 2025 (10 meses disponíveis).
 *
 * Vencimento fixo: dia 15 de cada mês.
 * Badge "Estimativa" aparece automaticamente via categoryId.
 *
 * Rodar com: node scripts/criar-energia-sala1.js
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

const MEDIA = 184.53
const BASE_ID = 1200

const MESES = [
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
  console.log(`Criando Energia Elétrica — Sala 1 (média R$ ${MEDIA.toFixed(2)})...\n`)

  for (let i = 0; i < MESES.length; i++) {
    const m = MESES[i]
    const mm = String(m.num).padStart(2, '0')
    const id = BASE_ID + i

    const entry = {
      id,
      description: `Energia Elétrica — Sala 1 (Celesc) — ${m.label}`,
      amount: -MEDIA,
      dueDate: `2026-${mm}-15`,
      settlementDate: null,
      type: 'Despesa',
      status: 'pendente',
      recurrence: 'Mensal',
      accountId: 'sicoob-lenon',
      categoryId: 'energia-eletrica',
      owner: 'lenon',
      _isEstimativa: true,
    }

    await setDoc(doc(db, 'entries', String(id)), entry)
    console.log(`  ✓ ${entry.description} — R$ ${MEDIA.toFixed(2)} — venc. ${entry.dueDate}`)
  }

  console.log(`\nPronto! 9 entries criadas (Abr-Dez/2026).`)
  console.log(`Média baseada em 10 faturas de 2025: R$ ${MEDIA.toFixed(2)}/mês.`)
  process.exit(0)
}

run().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
