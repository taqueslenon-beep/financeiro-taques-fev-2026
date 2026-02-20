/**
 * Lançamentos Honorários Schmidmeier — Parcelas 6 a 10 (Jan-Mai/2026)
 * Rateio com D&F Projetos Agrícolas & Ambientais
 *
 * Contrato: R$ 400.000 total, parcelas de R$ 30.000 no dia 25
 * Parceria: honorários rateados entre Taques Advogados e D&F Projetos
 *
 * Rodar com: node scripts/lancamentos-schmidmeier.js
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

const RATEIO_ID = 'rateio-schmidmeier-2026'
const BASE_RECEITA_ID = 970
const BASE_DESPESA_ID = 980

const parcelas = [
  { num: 6,  dueDate: '2026-01-25', mes: 'Jan/2026' },
  { num: 7,  dueDate: '2026-02-25', mes: 'Fev/2026' },
  { num: 8,  dueDate: '2026-03-25', mes: 'Mar/2026' },
  { num: 9,  dueDate: '2026-04-25', mes: 'Abr/2026' },
  { num: 10, dueDate: '2026-05-25', mes: 'Mai/2026' },
]

const entries = []

for (let i = 0; i < parcelas.length; i++) {
  const p = parcelas[i]
  const receitaId = BASE_RECEITA_ID + i

  // Receita (nível 1): R$ 30.000 recebidos do cliente Schmidmeier
  entries.push({
    id: receitaId,
    description: `Honorários Schmidmeier (Parcela ${p.num}/10)`,
    amount: 30000.0,
    dueDate: p.dueDate,
    settlementDate: '',
    type: 'Receita',
    status: 'pendente',
    recurrence: 'Parcelamento',
    accountId: 'sicoob-lenon',
    categoryId: 'honorarios',
    captador: 'lenon',
    owner: 'lenon',
    rateioId: RATEIO_ID,
    rateioLevel: 1,
  })

  // Despesa (nível 2): repasse D&F Projetos (parceiro)
  // Proporção a definir — criando como R$ 0 para o usuário ajustar
  entries.push({
    id: BASE_DESPESA_ID + i,
    description: `Repasse D&F Projetos — Schmidmeier (Parcela ${p.num}/10)`,
    amount: 0,
    dueDate: p.dueDate,
    settlementDate: '',
    type: 'Despesa',
    status: 'aguardando',
    recurrence: 'Parcelamento',
    accountId: 'sicoob-lenon',
    categoryId: 'honorarios',
    owner: 'lenon',
    rateioId: RATEIO_ID,
    rateioLevel: 2,
    rateioMasterId: receitaId,
  })
}

async function run() {
  console.log('── Honorários Schmidmeier — Parcelas 6 a 10 (Jan-Mai/2026) ──\n')

  for (const entry of entries) {
    await setDoc(doc(db, 'entries', String(entry.id)), entry)
    const tipo = entry.rateioLevel === 1 ? '↑ RECEITA' : '↓ REPASSE'
    const valor = Math.abs(entry.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    console.log(`  ✓ id ${entry.id} — ${entry.description} — ${tipo} R$ ${valor}`)
  }

  console.log(`\n✅ ${entries.length} lançamentos criados!`)
  console.log(`   → 5 receitas de R$ 30.000 (parcelas 6-10)`)
  console.log(`   → 5 repasses D&F Projetos (valor R$ 0 — ajustar manualmente)`)
  console.log(`\n⚠  Os repasses para D&F Projetos estão com valor R$ 0.`)
  console.log(`   Edite no sistema o valor de cada repasse conforme a proporção acordada.`)
  process.exit(0)
}

run().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
