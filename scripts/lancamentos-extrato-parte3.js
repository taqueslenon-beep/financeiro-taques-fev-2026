/**
 * Lançamentos do extrato Sicoob Lenon — Itens #28 a #40
 *
 * Rodar com: node scripts/lancamentos-extrato-parte3.js
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
  // #28 — Fatura Mastercard — 11/02
  {
    id: 931,
    description: 'Fatura cartão de crédito — Mastercard',
    amount: -4667.42,
    dueDate: '2026-02-11',
    settlementDate: '2026-02-11',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'fatura-cartao',
    isInvoice: true,
  },

  // #29 — Contribuição Gilberto (depósito dinheiro DOC 40) — 11/02
  {
    id: 932,
    description: 'Contribuição Gilberto — Despesas escritório',
    amount: 370.0,
    dueDate: '2026-02-11',
    settlementDate: '2026-02-11',
    type: 'Receita',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'contribuicao-socio',
  },

  // #30 — Contribuição Gilberto (depósito dinheiro DOC 41) — 11/02
  {
    id: 933,
    description: 'Contribuição Gilberto — Despesas escritório',
    amount: 325.0,
    dueDate: '2026-02-11',
    settlementDate: '2026-02-11',
    type: 'Receita',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'contribuicao-socio',
  },

  // #31 — Mercado / Alimentação — Churrascaria Saretto — 11/02
  {
    id: 934,
    description: 'Mercado / Alimentação — Churrascaria Saretto',
    amount: -4.0,
    dueDate: '2026-02-11',
    settlementDate: '2026-02-11',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'mercado-alimentacao',
  },

  // #32 — Mercado / Alimentação — Comercial Mallon — 11/02
  {
    id: 935,
    description: 'Mercado / Alimentação — Comercial Mallon',
    amount: -108.3,
    dueDate: '2026-02-11',
    settlementDate: '2026-02-11',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'mercado-alimentacao',
  },

  // #33 — Honorários Danielly — Carlos Marcos Torquato (receita) — 12/02
  {
    id: 936,
    description: 'Honorários advocacia — Danielly (Carlos Marcos Torquato)',
    amount: 2000.0,
    dueDate: '2026-02-12',
    settlementDate: '2026-02-12',
    type: 'Receita',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'honorarios',
    captador: 'lenon',
  },

  // #34 — Mercado / Alimentação — Do Pedro Bistro — 13/02
  {
    id: 937,
    description: 'Mercado / Alimentação — Do Pedro Bistro',
    amount: -64.0,
    dueDate: '2026-02-13',
    settlementDate: '2026-02-13',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'mercado-alimentacao',
  },

  // #35 — Retirada sócio Lenon — 18/02
  {
    id: 938,
    description: 'Retirada sócio — Lenon',
    amount: -2000.0,
    dueDate: '2026-02-18',
    settlementDate: '2026-02-18',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'retirada-socio',
  },

  // #36 — Mercado / Alimentação — Delivery Much — 18/02
  {
    id: 939,
    description: 'Mercado / Alimentação — Delivery Much',
    amount: -39.89,
    dueDate: '2026-02-18',
    settlementDate: '2026-02-18',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'mercado-alimentacao',
  },

  // #37 — Aporte de sócio — Lenon PF → PJ — 18/02
  {
    id: 940,
    description: 'Aporte de sócio — Lenon',
    amount: 1300.0,
    dueDate: '2026-02-18',
    settlementDate: '2026-02-18',
    type: 'Receita',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'aporte-socio',
  },

  // #38 — Retirada sócio Lenon — 18/02
  {
    id: 941,
    description: 'Retirada sócio — Lenon',
    amount: -100.0,
    dueDate: '2026-02-18',
    settlementDate: '2026-02-18',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'retirada-socio',
  },

  // #39 — Retirada sócio Lenon — 18/02
  {
    id: 942,
    description: 'Retirada sócio — Lenon',
    amount: -50.0,
    dueDate: '2026-02-18',
    settlementDate: '2026-02-18',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'retirada-socio',
  },

  // #40 — Retirada sócio Lenon — 19/02
  {
    id: 943,
    description: 'Retirada sócio — Lenon',
    amount: -90.0,
    dueDate: '2026-02-19',
    settlementDate: '2026-02-19',
    type: 'Despesa',
    status: 'pago',
    recurrence: '—',
    accountId: 'sicoob-lenon',
    categoryId: 'retirada-socio',
  },
]

async function run() {
  console.log('── Lançamentos Extrato Sicoob Lenon — Itens #28 a #40 ──\n')

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
