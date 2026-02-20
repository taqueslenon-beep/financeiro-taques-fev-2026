/**
 * Migração: Detalhamento da fatura do cartão Sicoob Lenon — Fev/2026
 * Fonte: Extrato de cartão de crédito 19/02/2026
 * Total da fatura: R$ 4.667,42 — Vencimento: 11/02/2026 — PAGO
 *
 * Rodar com: node scripts/migrar-fatura-fev2026.js
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

const items = [
  // ── Anuidade (se anulam) ──
  { date: '2025-12-05', description: 'Anuidade Mastercard (9253) 11/12', amount: 9.90, type: 'despesa', category: 'tarifas-bancarias' },
  { date: '2025-12-05', description: 'Desconto anuidade por uso Mastercard', amount: 9.90, type: 'receita', category: 'tarifas-bancarias' },

  // ── IOF Operações Exterior ──
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

  // ── Compras ──
  { date: '2025-10-03', description: 'HTM *asimovacadem — Barueri (parcela 4/6)', amount: 329.88, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-01', description: 'Google Workspace (taquesadvogados)', amount: 98.00, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-01', description: 'Google Workspace (advgilberto)', amount: 39.20, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-03', description: 'HTM*Nctar - Assistente IA — Pomerode', amount: 29.90, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-03', description: 'Infinity Innovations — US$ 36,00', amount: 195.74, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-04', description: 'Cursor Usage — US$ 60,15', amount: 327.05, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-04', description: 'Amazon Digital BR', amount: 33.16, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-05', description: 'Apple.com/bill — iCloud/Apps', amount: 53.90, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-06', description: 'Cursor Usage — US$ 80,03', amount: 430.54, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-07', description: 'Amazon Digital BR', amount: 182.00, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-07', description: 'MercadoLivre — Produto', amount: 473.47, type: 'despesa', category: 'custos-estrutura' },
  { date: '2026-01-08', description: 'Amazon Digital BR', amount: 42.99, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-08', description: 'Registro.BR — Domínio', amount: 40.00, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-09', description: 'Claude AI — Anthropic — US$ 20,42', amount: 110.00, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-09', description: 'Google One', amount: 96.99, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-12', description: 'JusBrasil — Salvador', amount: 138.90, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-12', description: 'Amazon Digital BR', amount: 31.41, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-13', description: 'Cursor AI — US$ 60,00', amount: 322.58, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-15', description: 'Monday.com — US$ 36,73', amount: 198.00, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-15', description: 'Cursor Usage Dec — US$ 69,10', amount: 371.72, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-16', description: 'Amazon Digital BR', amount: 19.90, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-17', description: 'Amazon Digital BR', amount: 19.94, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-18', description: 'Hostinger — Hospedagem', amount: 443.88, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-18', description: 'Amazon Digital BR', amount: 53.83, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-18', description: 'Amazon Digital BR', amount: 45.16, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-19', description: 'Amazon Digital BR', amount: 99.00, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-20', description: 'Lucid Software — US$ 15,00', amount: 80.48, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-21', description: 'Amazon Digital BR', amount: 39.90, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-22', description: 'Amazon Digital BR', amount: 11.96, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-23', description: 'OpenAI — US$ 5,00', amount: 26.44, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-23', description: 'OpenAI — US$ 10,00', amount: 52.88, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-24', description: 'Amazon Digital BR', amount: 31.86, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-26', description: 'Amazon Digital BR', amount: 42.75, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-26', description: 'Franz / MeetFranz — US$ 7,99', amount: 42.25, type: 'despesa', category: 'tecnologia' },
  { date: '2026-01-27', description: 'iLovePDF — R$ 35,00', amount: 35.00, type: 'despesa', category: 'tecnologia' },
]

async function run() {
  console.log('Migrando detalhamento da fatura Fev/2026...\n')

  const settingsRef = doc(db, 'settings', 'invoiceData')
  const snap = await getDoc(settingsRef)
  const data = snap.exists() ? snap.data() : {}

  const totalDespesas = items
    .filter(i => i.type === 'despesa')
    .reduce((sum, i) => sum + i.amount, 0)
  const totalReceitas = items
    .filter(i => i.type === 'receita')
    .reduce((sum, i) => sum + i.amount, 0)
  const total = +(totalDespesas - totalReceitas).toFixed(2)

  data[invoiceId] = {
    ...data[invoiceId],
    items,
    total: 4667.42,
    status: 'pago',
    settlementDate: '2026-02-11',
  }

  await setDoc(settingsRef, data)

  console.log(`  Itens: ${items.length}`)
  console.log(`  Despesas: R$ ${totalDespesas.toFixed(2)}`)
  console.log(`  Estornos: R$ ${totalReceitas.toFixed(2)}`)
  console.log(`  Total fatura: R$ 4.667,42`)
  console.log(`  Status: pago (11/02/2026)`)
  console.log('\nPronto! Fatura detalhada migrada.')
  process.exit(0)
}

run().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
