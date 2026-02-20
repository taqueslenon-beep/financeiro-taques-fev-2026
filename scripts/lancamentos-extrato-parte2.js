/**
 * Lançamentos do extrato Sicoob Lenon — Itens #15 a #27
 * + parcelas restantes da placa do escritório (Herbst)
 * + receita pendente de estorno custas Casa do Lanche
 *
 * Rodar com: node scripts/lancamentos-extrato-parte2.js
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

const entries = [
  // #14 — Retirada sócio Lenon — 09/02
  {
    id: 914,
    description: 'Retirada sócio — Lenon',
    amount: -200.0,
    dueDate: '2026-02-09',
    settlementDate: '2026-02-09',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'retirada-socio',
  },

  // #15 — Mercado / Alimentação — Planalto Conveniência — 09/02
  {
    id: 915,
    description: 'Mercado / Alimentação — Planalto Conveniência',
    amount: -13.99,
    dueDate: '2026-02-09',
    settlementDate: '2026-02-09',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'mercado-alimentacao',
  },

  // #16 — Gasolina — Posto Planalto — 09/02
  {
    id: 916,
    description: 'Gasolina — Posto Planalto',
    amount: -199.88,
    dueDate: '2026-02-09',
    settlementDate: '2026-02-09',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'gasolina',
  },

  // #17 — Retirada sócio Gilberto — Honorários escritório Lemos — 09/02
  {
    id: 917,
    description: 'Retirada sócio — Gilberto (Honorários escritório Lemos)',
    amount: -100.0,
    dueDate: '2026-02-09',
    settlementDate: '2026-02-09',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'retirada-socio',
  },

  // #18 — Retirada sócio Gilberto — Honorários Tsunoda — 09/02
  {
    id: 918,
    description: 'Retirada sócio — Gilberto (Honorários Tsunoda)',
    amount: -120.0,
    dueDate: '2026-02-09',
    settlementDate: '2026-02-09',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'retirada-socio',
  },

  // #19 — Retirada sócio Gilberto — Honorários Kozowski — 09/02
  {
    id: 919,
    description: 'Retirada sócio — Gilberto (Honorários Kozowski)',
    amount: -270.83,
    dueDate: '2026-02-09',
    settlementDate: '2026-02-09',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'retirada-socio',
  },

  // #20 — Retirada sócio Lenon — 09/02
  {
    id: 920,
    description: 'Retirada sócio — Lenon',
    amount: -1200.0,
    dueDate: '2026-02-09',
    settlementDate: '2026-02-09',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'retirada-socio',
  },

  // #21 — Claude (tecnologia) — 09/02
  {
    id: 921,
    description: 'Claude — Ferramenta AI',
    amount: -600.0,
    dueDate: '2026-02-09',
    settlementDate: '2026-02-09',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'tecnologia',
  },

  // #22 — Pagamento de custas judiciais — Casa do Lanche — 09/02
  {
    id: 922,
    description: 'Custas judiciais — Recanto Casa do Lanche',
    amount: -723.53,
    dueDate: '2026-02-09',
    settlementDate: '2026-02-09',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'custas-judiciais',
  },

  // Receita pendente: Estorno custas judiciais — Casa do Lanche
  {
    id: 923,
    description: 'Estorno custas judiciais — Recanto Casa do Lanche',
    amount: 723.53,
    dueDate: '2026-02-09',
    settlementDate: '',
    type: 'Receita',
    status: 'pendente',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'custas-judiciais',
  },

  // #23 — Retirada sócio Lenon — 10/02
  {
    id: 924,
    description: 'Retirada sócio — Lenon',
    amount: -1000.0,
    dueDate: '2026-02-10',
    settlementDate: '2026-02-10',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'retirada-socio',
  },

  // #24 — Retirada sócio Lenon — 10/02
  {
    id: 925,
    description: 'Retirada sócio — Lenon',
    amount: -1500.0,
    dueDate: '2026-02-10',
    settlementDate: '2026-02-10',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'retirada-socio',
  },

  // #25 — Retirada sócio Lenon — 10/02
  {
    id: 926,
    description: 'Retirada sócio — Lenon',
    amount: -2000.0,
    dueDate: '2026-02-10',
    settlementDate: '2026-02-10',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'retirada-socio',
  },

  // #26 — Despesa não identificada — CPF ***587.149 — 10/02
  {
    id: 927,
    description: 'Despesa não identificada — CPF ***587.149',
    amount: -1000.0,
    dueDate: '2026-02-10',
    settlementDate: '2026-02-10',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'despesa-nao-identificada',
  },

  // #27 — Placa + película do escritório — Herbst (Parcela 4/6) — 10/02
  // Parcelamento: Nov/25 a Abr/26, vence dia 3, valor R$ 1.389,66
  {
    id: 928,
    description: 'Placa + película do escritório — Herbst (Parcela 4/6)',
    amount: -1389.66,
    dueDate: '2026-02-03',
    settlementDate: '2026-02-10',
    type: 'Despesa',
    status: 'pago',
    recurrence: 'Parcelamento',
    accountId: 'sicoob-lenon',
    categoryId: 'manutencao-escritorio',
  },

  // Parcela 5/6 — Março/2026
  {
    id: 929,
    description: 'Placa + película do escritório — Herbst (Parcela 5/6)',
    amount: -1389.66,
    dueDate: '2026-03-03',
    settlementDate: '',
    type: 'Despesa',
    status: 'pendente',
    recurrence: 'Parcelamento',
    accountId: 'sicoob-lenon',
    categoryId: 'manutencao-escritorio',
  },

  // Parcela 6/6 — Abril/2026
  {
    id: 930,
    description: 'Placa + película do escritório — Herbst (Parcela 6/6)',
    amount: -1389.66,
    dueDate: '2026-04-03',
    settlementDate: '',
    type: 'Despesa',
    status: 'pendente',
    recurrence: 'Parcelamento',
    accountId: 'sicoob-lenon',
    categoryId: 'manutencao-escritorio',
  },
]

async function run() {
  console.log('── Lançamentos Extrato Sicoob Lenon — Itens #14 a #27 ──\n')

  for (const entry of entries) {
    await setDoc(doc(db, 'entries', String(entry.id)), entry)
    const tipo = entry.amount > 0 ? '↑' : '↓'
    const valor = Math.abs(entry.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    console.log(`  ✓ id ${entry.id} — ${entry.description} — ${tipo} R$ ${valor}`)
  }

  console.log(`\n✅ ${entries.length} lançamentos criados!`)
  process.exit(0)
}

run().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
