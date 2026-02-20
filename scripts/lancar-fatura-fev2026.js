/**
 * Lança itens classificados na fatura do cartão Sicoob Lenon — Fev/2026
 *
 * Classificados:
 * - #1-2: Anuidade (despesa fixa + estorno)
 * - #3-14: IOF (impostos)
 * - #15: Curso de Python (asimovacademy)
 * - #16-20, 22-23, 28-30, 32-34, 41, 44-45, 48-49: Tecnologia
 *
 * Rodar com: node scripts/lancar-fatura-fev2026.js
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

const invoiceId = 'invoice-cartao-sicoob-lenon-2026-02'

const classifiedItems = [
  // #1-2: Anuidade
  { date: '2025-12-05', description: 'Anuidade Mastercard (9253) 11/12', amount: 9.90, type: 'despesa', category: 'tarifas-bancarias', recurrence: 'Mensal' },
  { date: '2025-12-05', description: 'Desconto anuidade por uso Mastercard', amount: 9.90, type: 'receita', category: 'tarifas-bancarias' },

  // #3-14: IOF
  { date: '2026-01-03', description: 'IOF Operação Exterior', amount: 6.85, type: 'despesa', category: 'impostos' },
  { date: '2026-01-04', description: 'IOF Operação Exterior', amount: 11.45, type: 'despesa', category: 'impostos' },
  { date: '2026-01-06', description: 'IOF Operação Exterior', amount: 15.07, type: 'despesa', category: 'impostos' },
  { date: '2026-01-09', description: 'IOF Operação Exterior', amount: 3.85, type: 'despesa', category: 'impostos' },
  { date: '2026-01-13', description: 'IOF Operação Exterior', amount: 11.29, type: 'despesa', category: 'impostos' },
  { date: '2026-01-15', description: 'IOF Operação Exterior', amount: 6.93, type: 'despesa', category: 'impostos' },
  { date: '2026-01-15', description: 'IOF Operação Exterior', amount: 13.01, type: 'despesa', category: 'impostos' },
  { date: '2026-01-20', description: 'IOF Operação Exterior', amount: 2.82, type: 'despesa', category: 'impostos' },
  { date: '2026-01-23', description: 'IOF Operação Exterior', amount: 0.93, type: 'despesa', category: 'impostos' },
  { date: '2026-01-23', description: 'IOF Operação Exterior', amount: 1.85, type: 'despesa', category: 'impostos' },
  { date: '2026-01-26', description: 'IOF Operação Exterior', amount: 1.48, type: 'despesa', category: 'impostos' },
  { date: '2026-01-27', description: 'IOF Operação Exterior', amount: 1.23, type: 'despesa', category: 'impostos' },

  // #15: Curso Python
  { date: '2025-10-03', description: 'Curso de Python — Asimov Academy (parcela 4/6)', amount: 329.88, type: 'despesa', category: 'tecnologia', recurrence: 'Parcelamento' },

  // #16-20: Tecnologia
  { date: '2026-01-01', description: 'Google Workspace (taquesadvogados)', amount: 98.00, type: 'despesa', category: 'tecnologia', recurrence: 'Mensal' },
  { date: '2026-01-01', description: 'Google Workspace (advgilberto)', amount: 39.20, type: 'despesa', category: 'tecnologia', recurrence: 'Mensal' },
  { date: '2026-01-03', description: 'HTM*Nctar - Assistente IA — Pomerode', amount: 29.90, type: 'despesa', category: 'tecnologia', recurrence: 'Mensal' },
  { date: '2026-01-03', description: 'Infinity Innovations — US$ 36,00', amount: 195.74, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-04', description: 'Cursor Usage — US$ 60,15', amount: 327.05, type: 'despesa', category: 'tecnologia' },

  // #22-23
  { date: '2026-01-05', description: 'Apple.com/bill — iCloud/Apps', amount: 53.90, type: 'despesa', category: 'tecnologia', recurrence: 'Mensal' },
  { date: '2026-01-06', description: 'Cursor Usage — US$ 80,03', amount: 430.54, type: 'despesa', category: 'tecnologia' },

  // #28-30
  { date: '2026-01-09', description: 'Claude AI — Anthropic — US$ 20,42', amount: 110.00, type: 'despesa', category: 'tecnologia', recurrence: 'Mensal' },
  { date: '2026-01-09', description: 'Google One', amount: 96.99, type: 'despesa', category: 'tecnologia', recurrence: 'Mensal' },
  { date: '2026-01-12', description: 'JusBrasil — Salvador', amount: 138.90, type: 'despesa', category: 'tecnologia', recurrence: 'Mensal' },

  // #32-34
  { date: '2026-01-13', description: 'Cursor AI — US$ 60,00', amount: 322.58, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-15', description: 'Monday.com — US$ 36,73', amount: 198.00, type: 'despesa', category: 'tecnologia', recurrence: 'Mensal' },
  { date: '2026-01-15', description: 'Cursor Usage Dec — US$ 69,10', amount: 371.72, type: 'despesa', category: 'tecnologia' },

  // #41
  { date: '2026-01-20', description: 'Lucid Software Inc. — US$ 15,00', amount: 80.48, type: 'despesa', category: 'tecnologia', recurrence: 'Mensal' },

  // #44-45
  { date: '2026-01-23', description: 'OpenAI — US$ 5,00', amount: 26.44, type: 'despesa', category: 'tecnologia', recurrence: 'Mensal' },
  { date: '2026-01-23', description: 'OpenAI — US$ 10,00', amount: 52.88, type: 'despesa', category: 'tecnologia', recurrence: 'Mensal' },

  // #48-49
  { date: '2026-01-26', description: 'Franz / MeetFranz — US$ 7,99', amount: 42.25, type: 'despesa', category: 'tecnologia', recurrence: 'Mensal' },
  { date: '2026-01-27', description: 'iLovePDF.com — Barcelona', amount: 35.00, type: 'despesa', category: 'tecnologia', recurrence: 'Mensal' },
]

// Itens pendentes de classificação
const pendingItems = [
  { num: 21, date: '2026-01-04', description: 'Amazon Digital BR', amount: 33.16 },
  { num: 24, date: '2026-01-07', description: 'Amazon Digital BR', amount: 182.00 },
  { num: 25, date: '2026-01-07', description: 'MercadoLivre — Produto (Osasco)', amount: 473.47 },
  { num: 26, date: '2026-01-08', description: 'Amazon Digital BR', amount: 42.99 },
  { num: 27, date: '2026-01-08', description: 'Registro.BR — Domínio', amount: 40.00 },
  { num: 31, date: '2026-01-12', description: 'Amazon Digital BR', amount: 31.41 },
  { num: 35, date: '2026-01-16', description: 'Amazon Digital BR', amount: 19.90 },
  { num: 36, date: '2026-01-17', description: 'Amazon Digital BR', amount: 19.94 },
  { num: 37, date: '2026-01-18', description: 'Hostinger — Hospedagem', amount: 443.88 },
  { num: 38, date: '2026-01-18', description: 'Amazon Digital BR', amount: 53.83 },
  { num: 39, date: '2026-01-18', description: 'Amazon Digital BR', amount: 45.16 },
  { num: 40, date: '2026-01-19', description: 'Amazon Digital BR', amount: 99.00 },
  { num: 42, date: '2026-01-21', description: 'Amazon Digital BR', amount: 39.90 },
  { num: 43, date: '2026-01-22', description: 'Amazon Digital BR', amount: 11.96 },
  { num: 46, date: '2026-01-24', description: 'Amazon Digital BR', amount: 31.86 },
  { num: 47, date: '2026-01-26', description: 'Amazon Digital BR', amount: 42.75 },
]

async function run() {
  console.log('Lançando itens classificados na fatura Fev/2026...\n')

  const settingsRef = doc(db, 'settings', 'invoiceData')
  const snap = await getDoc(settingsRef)
  const data = snap.exists() ? snap.data() : {}

  data[invoiceId] = {
    ...data[invoiceId],
    items: classifiedItems,
    total: 4667.42,
    status: 'pago',
    settlementDate: '2026-02-11',
  }

  await setDoc(settingsRef, data)

  console.log(`  ✓ ${classifiedItems.length} itens classificados lançados`)
  console.log(`  ⏳ ${pendingItems.length} itens pendentes de classificação`)
  console.log('\nItens pendentes:')
  for (const p of pendingItems) {
    console.log(`  #${p.num} — ${p.date} — ${p.description} — R$ ${p.amount.toFixed(2)}`)
  }

  console.log('\nPronto!')
  process.exit(0)
}

run().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
