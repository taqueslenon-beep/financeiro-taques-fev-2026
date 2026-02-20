/**
 * Conciliação Janeiro 2026 — Parte 1
 *
 * Itens migrados:
 *   #4  — Tarifa bancária Sicoob (R$ 30, fixa, dia 5, jan–dez 2026)
 *   #7  — Instalações elétricas Osvaldo Borguezam (R$ 50, variável, jan/2026)
 *   #9  — Seguro do Jetta (R$ 511,19, 12 parcelas, dia 5, jan–dez 2026)
 *
 * Rodar com: node scripts/lancamentos-conciliacao-jan-parte1.js
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

const entries = []

// ── #4 — Tarifa bancária Sicoob — R$ 30 (fixa, dia 5) ─────────────
const TARIFA_BASE_ID = 850
for (let i = 0; i < 12; i++) {
  const mes = i + 1
  const mm = String(mes).padStart(2, '0')
  entries.push({
    id: TARIFA_BASE_ID + i,
    description: 'Tarifa bancária — Sicoob',
    amount: -30.0,
    dueDate: `2026-${mm}-05`,
    settlementDate: mes === 1 ? '2026-01-05' : null,
    type: 'Despesa',
    status: mes === 1 ? 'pago' : 'pendente',
    recurrence: 'Fixa',
    accountId: 'sicoob-lenon',
    categoryId: 'tarifas-bancarias',
    owner: 'lenon',
  })
}

// ── #7 — Instalações elétricas — Osvaldo Borguezam (variável) ──────
entries.push({
  id: 870,
  description: 'Instalações elétricas — Osvaldo Borguezam',
  amount: -50.0,
  dueDate: '2026-01-05',
  settlementDate: '2026-01-05',
  type: 'Despesa',
  status: 'pago',
  recurrence: 'Variável',
  accountId: 'sicoob-lenon',
  categoryId: 'manutencao-escritorio',
  owner: 'lenon',
})

// ── #9 — Seguro do Jetta — R$ 511,19 (12 parcelas, dia 5) ─────────
const SEGURO_BASE_ID = 880
for (let i = 0; i < 12; i++) {
  const mes = i + 1
  const mm = String(mes).padStart(2, '0')
  entries.push({
    id: SEGURO_BASE_ID + i,
    description: `Seguro do Jetta (Parcela ${i + 1}/12)`,
    amount: -511.19,
    dueDate: `2026-${mm}-05`,
    settlementDate: mes === 1 ? '2026-01-05' : null,
    type: 'Despesa',
    status: mes === 1 ? 'pago' : 'pendente',
    recurrence: 'Parcelamento',
    accountId: 'sicoob-lenon',
    categoryId: 'seguro-veiculo',
    owner: 'lenon',
  })
}

async function run() {
  console.log('Conciliação Jan/2026 — Parte 1\n')
  console.log('Lançando Tarifa bancária, Instalações elétricas e Seguro do Jetta...\n')

  for (const entry of entries) {
    await setDoc(doc(db, 'entries', String(entry.id)), entry)
    const status = entry.status === 'pago' ? '✓ PAGO' : '○ pendente'
    console.log(`  ${status}  ${entry.description} — R$ ${Math.abs(entry.amount).toFixed(2)} — venc. ${entry.dueDate}`)
  }

  console.log(`\nPronto! ${entries.length} entries criadas/atualizadas.`)
  process.exit(0)
}

run().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
