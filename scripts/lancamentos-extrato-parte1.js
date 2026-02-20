/**
 * Lançamentos do extrato Sicoob Lenon — Itens #1 a #13
 * Inclui 12 parcelas do Capital de Giro (contrato 95644548)
 *
 * Rodar com: node scripts/lancamentos-extrato-parte1.js
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
  // #1 — Retirada sócio Lenon — 02/02
  {
    id: 900,
    description: 'Retirada sócio — Lenon',
    amount: -200.0,
    dueDate: '2026-02-02',
    settlementDate: '2026-02-02',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'retirada-socio',
  },

  // #2 — Salário Berna (R$1.000) + Bonificação (R$200) — 02/02
  {
    id: 901,
    description: 'Salário — Berna (Jan/2026)',
    amount: -1000.0,
    dueDate: '2026-01-31',
    settlementDate: '2026-02-02',
    type: 'Despesa',
    status: 'pago',
    recurrence: 'Fixa',
    accountId: 'sicoob-lenon',
    categoryId: 'folha-pagamento',
  },
  {
    id: 902,
    description: 'Bonificação — Berna',
    amount: -200.0,
    dueDate: '2026-02-02',
    settlementDate: '2026-02-02',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'folha-pagamento',
  },

  // #3 — Assessoria marketing (referente a Janeiro, pago atrasado em 02/02)
  {
    id: 903,
    description: 'Assessoria de marketing (Jan/2026)',
    amount: -1735.13,
    dueDate: '2026-01-31',
    settlementDate: '2026-02-02',
    type: 'Despesa',
    status: 'pago',
    recurrence: 'Fixa',
    accountId: 'sicoob-lenon',
    categoryId: 'marketing',
  },

  // #4 — Limpeza escritório — 02/02 (concilia com despesa fixa)
  {
    id: 904,
    description: 'Limpeza (Fev/2026)',
    amount: -300.0,
    dueDate: '2026-02-02',
    settlementDate: '2026-02-02',
    type: 'Despesa',
    status: 'pago',
    recurrence: 'Fixa',
    accountId: 'sicoob-lenon',
    categoryId: 'manutencao-escritorio',
  },

  // #5 — Retirada sócio Lenon — 02/02
  {
    id: 905,
    description: 'Retirada sócio — Lenon',
    amount: -1000.0,
    dueDate: '2026-02-02',
    settlementDate: '2026-02-02',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'retirada-socio',
  },

  // #6 — Honorários Luiz Ricardo Selenko (receita) — 03/02
  {
    id: 906,
    description: 'Honorários advocacia — Luiz Ricardo Selenko',
    amount: 100.0,
    dueDate: '2026-02-03',
    settlementDate: '2026-02-03',
    type: 'Receita',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'honorarios',
    captador: 'lenon',
  },

  // #7 — Retirada sócio Lenon — 03/02
  {
    id: 907,
    description: 'Retirada sócio — Lenon',
    amount: -250.0,
    dueDate: '2026-02-03',
    settlementDate: '2026-02-03',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'retirada-socio',
  },

  // #8 — Honorários Fauri Batista (receita) — 05/02
  {
    id: 908,
    description: 'Honorários advocacia — Fauri Batista',
    amount: 120.0,
    dueDate: '2026-02-05',
    settlementDate: '2026-02-05',
    type: 'Receita',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'honorarios',
    captador: 'lenon',
  },

  // #9 — Retirada sócio Lenon — 05/02
  {
    id: 909,
    description: 'Retirada sócio — Lenon',
    amount: -200.0,
    dueDate: '2026-02-05',
    settlementDate: '2026-02-05',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'retirada-socio',
  },

  // #10 — Tarifa bancária Sicoob (despesa fixa) — 05/02
  {
    id: 910,
    description: 'Tarifa bancária — Sicoob',
    amount: -30.0,
    dueDate: '2026-02-05',
    settlementDate: '2026-02-05',
    type: 'Despesa',
    status: 'pago',
    recurrence: 'Fixa',
    accountId: 'sicoob-lenon',
    categoryId: 'tarifas-bancarias',
  },

  // #11 — Honorários Jeferson Kozowski (receita) — 06/02
  {
    id: 911,
    description: 'Honorários advocacia — Jeferson Kozowski',
    amount: 541.66,
    dueDate: '2026-02-06',
    settlementDate: '2026-02-06',
    type: 'Receita',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'honorarios',
    captador: 'lenon',
  },

  // #12 — Hiper Off / Pagar.me (despesa carro) — 06/02
  {
    id: 912,
    description: 'Despesa veículo — Hiper Off',
    amount: -20.0,
    dueDate: '2026-02-06',
    settlementDate: '2026-02-06',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'transporte',
  },

  // #13 — Capital de giro Sicoob (crédito recebido) — 09/02
  {
    id: 913,
    description: 'Capital de giro — Sicoob (contrato 95644548)',
    amount: 17000.0,
    dueDate: '2026-02-09',
    settlementDate: '2026-02-09',
    type: 'Receita',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'emprestimo-bancario',
  },
]

// 12 parcelas do Capital de Giro — R$ 1.877,45 cada
const parcelasCapitalGiro = [
  { parcela: 1,  dueDate: '2026-04-15' },
  { parcela: 2,  dueDate: '2026-05-15' },
  { parcela: 3,  dueDate: '2026-06-15' },
  { parcela: 4,  dueDate: '2026-07-15' },
  { parcela: 5,  dueDate: '2026-08-17' },
  { parcela: 6,  dueDate: '2026-09-15' },
  { parcela: 7,  dueDate: '2026-10-15' },
  { parcela: 8,  dueDate: '2026-11-16' },
  { parcela: 9,  dueDate: '2026-12-15' },
  { parcela: 10, dueDate: '2027-01-15' },
  { parcela: 11, dueDate: '2027-02-15' },
  { parcela: 12, dueDate: '2027-03-15' },
]

const BASE_PARCELA_ID = 950

for (const p of parcelasCapitalGiro) {
  entries.push({
    id: BASE_PARCELA_ID + p.parcela,
    description: `Capital de giro — Sicoob (Parcela ${p.parcela}/12)`,
    amount: -1877.45,
    dueDate: p.dueDate,
    settlementDate: '',
    type: 'Despesa',
    status: 'pendente',
    recurrence: 'Parcelamento',
    accountId: 'sicoob-lenon',
    categoryId: 'emprestimo-bancario',
  })
}

async function run() {
  console.log('── Lançamentos Extrato Sicoob Lenon — Itens #1 a #13 ──\n')

  for (const entry of entries) {
    await setDoc(doc(db, 'entries', String(entry.id)), entry)
    const tipo = entry.amount > 0 ? '↑' : '↓'
    const valor = Math.abs(entry.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    console.log(`  ✓ id ${entry.id} — ${entry.description} — ${tipo} R$ ${valor}`)
  }

  console.log(`\n✅ ${entries.length} lançamentos criados!`)
  console.log(`   → 14 lançamentos do extrato (itens #1 a #13)`)
  console.log(`   → 12 parcelas do Capital de Giro Sicoob`)
  process.exit(0)
}

run().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
