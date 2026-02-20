/**
 * Script para popular o Firestore com os dados iniciais do sistema.
 *
 * Rodar com: node scripts/seed-firestore.js
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore'

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

// ── Contas ────────────────────────────────────────────────────────
const accounts = [
  { id: 'sicoob-lenon', label: 'Sicoob — Conta principal (Lenon)', owner: 'lenon', color: '#004D4A', type: 'banco' },
  { id: 'cartao-sicoob-lenon', label: 'Cartão de crédito Sicoob — Conta principal (Lenon)', owner: 'lenon', color: '#004D4A', type: 'cartao' },
  { id: 'dinheiro-lenon', label: 'Dinheiro físico recebido por Lenon', owner: 'lenon', color: '#D97706', type: 'dinheiro' },
  { id: 'sicoob-berna', label: 'Sicoob — Subconta (Berna)', owner: 'berna', color: '#C4D600', type: 'banco' },
  { id: 'cartao-sicoob-berna', label: 'Cartão de crédito Sicoob — Subconta (Berna)', owner: 'berna', color: '#C4D600', type: 'cartao' },
  { id: 'dinheiro-berna', label: 'Dinheiro físico recebido por Berna', owner: 'berna', color: '#FDBA74', type: 'dinheiro' },
  { id: 'reserva-emergencia', label: 'Reserva de Emergência — Sicoob Invest', owner: 'lenon', color: '#223631', type: 'reserva' },
]

// ── Categorias ────────────────────────────────────────────────────
const categories = {
  receita: [
    { id: 'honorarios-iniciais', label: 'Honorários iniciais' },
    { id: 'honorarios-exito', label: 'Honorários de êxito' },
    { id: 'honorarios-sucumbencia', label: 'Honorários de sucumbência' },
    { id: 'estornos', label: 'Estornos' },
  ],
  despesa: [
    { id: 'aluguel', label: 'Aluguel' },
    { id: 'mercado', label: 'Mercado' },
    { id: 'folha-pagamento', label: 'Folha de pagamento' },
    { id: 'tecnologia', label: 'Tecnologia' },
    { id: 'contabilidade', label: 'Contabilidade' },
    { id: 'anuidade-oab', label: 'Anuidade OAB' },
    { id: 'impostos', label: 'Impostos' },
    { id: 'taxas', label: 'Taxas' },
    { id: 'deslocamentos-viagens', label: 'Deslocamentos e viagens' },
    { id: 'manutencao-escritorio', label: 'Manutenção do escritório' },
    { id: 'moveis', label: 'Móveis' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'pro-labore', label: 'Pró-labore' },
    { id: 'distribuicao-lucros', label: 'Distribuição de lucros' },
    { id: 'material-escritorio', label: 'Material de escritório' },
    { id: 'treinamentos-cursos', label: 'Treinamentos e cursos' },
    { id: 'repasse-parceiro', label: 'Repasse a parceiro' },
  ],
}

// ── Lançamentos ───────────────────────────────────────────────────
const entries = [
  { id: 1, description: 'Plano de internet', amount: -289.9, dueDate: '2026-01-28', settlementDate: '2026-01-28', type: 'Despesa', status: 'pago', recurrence: 'Fixa', accountId: 'sicoob-lenon' },
  { id: 2, description: 'Conta de energia', amount: -420.0, dueDate: '2026-01-30', settlementDate: '', type: 'Despesa', status: 'atrasado', recurrence: 'Variável', accountId: 'sicoob-lenon' },
  { id: 3, description: 'Honorários — Processo #871', amount: 9200.0, dueDate: '2026-01-15', settlementDate: '2026-01-16', type: 'Receita', status: 'pago', recurrence: '—', accountId: 'sicoob-lenon', captador: 'lenon' },
  { id: 4, description: 'Aluguel do escritório', amount: -4500.0, dueDate: '2026-01-05', settlementDate: '2026-01-05', type: 'Despesa', status: 'pago', recurrence: 'Fixa', accountId: 'sicoob-lenon' },
  { id: 5, description: 'Licença software jurídico', amount: -1200.0, dueDate: '2026-01-02', settlementDate: '2026-01-02', type: 'Despesa', status: 'pago', recurrence: 'Fixa', accountId: 'sicoob-lenon' },
  { id: 6, description: 'Aluguel do escritório', amount: -4500.0, dueDate: '2026-02-05', settlementDate: '2026-02-04', type: 'Despesa', status: 'pago', recurrence: 'Fixa', accountId: 'sicoob-lenon' },
  { id: 7, description: 'Honorários — Processo #1042', amount: 12000.0, dueDate: '2026-02-10', settlementDate: '', type: 'Receita', status: 'pendente', recurrence: '—', accountId: 'sicoob-lenon', captador: 'lenon' },
  { id: 8, description: 'Consultoria tributária', amount: 8500.0, dueDate: '2026-02-15', settlementDate: '', type: 'Receita', status: 'pendente', recurrence: '—', accountId: 'sicoob-berna', captador: 'berna' },
  { id: 9, description: 'Licença software jurídico', amount: -1200.0, dueDate: '2026-02-01', settlementDate: '2026-02-01', type: 'Despesa', status: 'pago', recurrence: 'Fixa', accountId: 'sicoob-lenon' },
  { id: 10, description: 'Honorários — Processo #983', amount: 6750.0, dueDate: '2026-02-20', settlementDate: '', type: 'Receita', status: 'pendente', recurrence: '—', accountId: 'sicoob-berna', captador: 'gilberto' },
  { id: 11, description: 'Sofá — Sala do Lenon (Parcela 1/10)', amount: -890.0, dueDate: '2026-02-10', settlementDate: '2026-02-10', type: 'Despesa', status: 'pago', recurrence: 'Parcelamento', accountId: 'cartao-sicoob-lenon' },
  { id: 12, description: 'Material de escritório', amount: -347.5, dueDate: '2026-02-18', settlementDate: '', type: 'Despesa', status: 'pendente', recurrence: 'Variável', accountId: 'sicoob-berna' },
  { id: 13, description: 'Plano de internet', amount: -289.9, dueDate: '2026-02-28', settlementDate: '', type: 'Despesa', status: 'pendente', recurrence: 'Fixa', accountId: 'sicoob-lenon' },
  { id: 14, description: 'Conta de energia', amount: -398.0, dueDate: '2026-02-27', settlementDate: '', type: 'Despesa', status: 'pendente', recurrence: 'Variável', accountId: 'sicoob-lenon' },
  { id: 15, description: 'Aluguel do escritório', amount: -4500.0, dueDate: '2026-03-05', settlementDate: '', type: 'Despesa', status: 'pendente', recurrence: 'Fixa', accountId: 'sicoob-lenon' },
  { id: 16, description: 'Sofá — Sala do Lenon (Parcela 2/10)', amount: -890.0, dueDate: '2026-03-10', settlementDate: '', type: 'Despesa', status: 'pendente', recurrence: 'Parcelamento', accountId: 'cartao-sicoob-lenon' },
  { id: 17, description: 'Honorários — Processo #1105', amount: 15300.0, dueDate: '2026-03-12', settlementDate: '', type: 'Receita', status: 'pendente', recurrence: '—', accountId: 'sicoob-lenon', captador: 'lenon' },
  { id: 18, description: 'Conta de energia', amount: -385.0, dueDate: '2026-03-28', settlementDate: '', type: 'Despesa', status: 'pendente', recurrence: 'Variável', accountId: 'sicoob-lenon' },
  { id: 19, description: 'Plano de internet', amount: -289.9, dueDate: '2026-03-28', settlementDate: '', type: 'Despesa', status: 'pendente', recurrence: 'Fixa', accountId: 'sicoob-lenon' },
  { id: 20, description: 'Acordo judicial — Processo #790 (Parcela 1/5)', amount: 4600.0, dueDate: '2026-03-20', settlementDate: '', type: 'Receita', status: 'pendente', recurrence: 'Parcelamento', accountId: 'sicoob-berna', captador: 'berna' },
  { id: 21, description: 'Licença software jurídico', amount: -1200.0, dueDate: '2026-03-01', settlementDate: '', type: 'Despesa', status: 'pendente', recurrence: 'Fixa', accountId: 'sicoob-lenon' },
  { id: 22, description: 'Aluguel do escritório', amount: -4500.0, dueDate: '2026-04-05', settlementDate: '', type: 'Despesa', status: 'pendente', recurrence: 'Fixa', accountId: 'sicoob-lenon' },
  { id: 23, description: 'Sofá — Sala do Lenon (Parcela 3/10)', amount: -890.0, dueDate: '2026-04-10', settlementDate: '', type: 'Despesa', status: 'pendente', recurrence: 'Parcelamento', accountId: 'cartao-sicoob-lenon' },
  { id: 24, description: 'Acordo judicial — Processo #790 (Parcela 2/5)', amount: 4600.0, dueDate: '2026-04-20', settlementDate: '', type: 'Receita', status: 'pendente', recurrence: 'Parcelamento', accountId: 'sicoob-berna', captador: 'berna' },
  { id: 25, description: 'Honorários — Processo #1120', amount: 7800.0, dueDate: '2026-04-14', settlementDate: '', type: 'Receita', status: 'pendente', recurrence: '—', accountId: 'sicoob-lenon', captador: 'gilberto' },
  { id: 26, description: 'Reforma da recepção (Parcela 1/4)', amount: -3200.0, dueDate: '2026-04-25', settlementDate: '', type: 'Despesa', status: 'pendente', recurrence: 'Parcelamento', accountId: 'sicoob-berna' },
  { id: 27, description: 'Aluguel do escritório', amount: -4500.0, dueDate: '2026-05-05', settlementDate: '', type: 'Despesa', status: 'pendente', recurrence: 'Fixa', accountId: 'sicoob-lenon' },
  { id: 28, description: 'Sofá — Sala do Lenon (Parcela 4/10)', amount: -890.0, dueDate: '2026-05-10', settlementDate: '', type: 'Despesa', status: 'pendente', recurrence: 'Parcelamento', accountId: 'cartao-sicoob-lenon' },
  { id: 29, description: 'Acordo judicial — Processo #790 (Parcela 3/5)', amount: 4600.0, dueDate: '2026-05-20', settlementDate: '', type: 'Receita', status: 'pendente', recurrence: 'Parcelamento', accountId: 'sicoob-berna', captador: 'berna' },
  { id: 30, description: 'Reforma da recepção (Parcela 2/4)', amount: -3200.0, dueDate: '2026-05-25', settlementDate: '', type: 'Despesa', status: 'pendente', recurrence: 'Parcelamento', accountId: 'sicoob-berna' },
  { id: 31, description: 'Consultoria trabalhista — Cliente Rocha & Filhos', amount: 11500.0, dueDate: '2026-05-08', settlementDate: '', type: 'Receita', status: 'pendente', recurrence: '—', accountId: 'sicoob-lenon', captador: 'lenon' },
  { id: 32, description: 'Aporte — Reserva de Emergência', amount: 5000.0, dueDate: '2026-01-10', settlementDate: '2026-01-10', type: 'Reserva', status: 'pago', recurrence: '—', accountId: 'reserva-emergencia' },
  { id: 33, description: 'Aporte — Reserva de Emergência', amount: 5000.0, dueDate: '2026-02-10', settlementDate: '2026-02-10', type: 'Reserva', status: 'pago', recurrence: '—', accountId: 'reserva-emergencia' },
  { id: 34, description: 'Aporte — Reserva de Emergência', amount: 3000.0, dueDate: '2026-03-10', settlementDate: '', type: 'Reserva', status: 'pendente', recurrence: '—', accountId: 'reserva-emergencia' },
  { id: 35, description: 'Aporte — Reserva de Emergência', amount: 3000.0, dueDate: '2026-04-10', settlementDate: '', type: 'Reserva', status: 'pendente', recurrence: '—', accountId: 'reserva-emergencia' },
  { id: 36, description: 'Aporte — Reserva de Emergência', amount: 3000.0, dueDate: '2026-05-10', settlementDate: '', type: 'Reserva', status: 'pendente', recurrence: '—', accountId: 'reserva-emergencia' },
]

// ── Lançamentos de Cartão de Crédito ──────────────────────────────
const creditCardEntries = [
  { id: 'cc-1', cardId: 'cartao-sicoob-lenon', date: '2026-02-03', description: 'Uber — Deslocamento ao fórum', category: 'Transporte', amount: -47.9, status: 'pendente' },
  { id: 'cc-2', cardId: 'cartao-sicoob-lenon', date: '2026-02-05', description: 'Almoço de trabalho — Restaurante Oliva', category: 'Alimentação', amount: -128.0, status: 'pendente' },
  { id: 'cc-3', cardId: 'cartao-sicoob-lenon', date: '2026-02-07', description: 'Adobe Creative Cloud — Assinatura mensal', category: 'Software', amount: -290.0, status: 'pendente' },
  { id: 'cc-4', cardId: 'cartao-sicoob-lenon', date: '2026-02-10', description: 'Sofá — Sala do Lenon (Parcela 1/10)', category: 'Mobiliário', amount: -890.0, status: 'pago' },
  { id: 'cc-5', cardId: 'cartao-sicoob-lenon', date: '2026-02-12', description: 'Papelaria e suprimentos — Kalunga', category: 'Material', amount: -215.4, status: 'pendente' },
  { id: 'cc-6', cardId: 'cartao-sicoob-lenon', date: '2026-02-15', description: 'Google Workspace — Assinatura anual', category: 'Software', amount: -1140.0, status: 'pago' },
  { id: 'cc-7', cardId: 'cartao-sicoob-lenon', date: '2026-01-08', description: 'Combustível — Posto Shell', category: 'Transporte', amount: -320.0, status: 'pago' },
  { id: 'cc-8', cardId: 'cartao-sicoob-lenon', date: '2026-01-20', description: 'Jantar com cliente — Processo #1042', category: 'Alimentação', amount: -274.5, status: 'pago' },
  { id: 'cc-9', cardId: 'cartao-sicoob-berna', date: '2026-02-02', description: 'Uber — Visita ao cliente', category: 'Transporte', amount: -35.7, status: 'pendente' },
  { id: 'cc-10', cardId: 'cartao-sicoob-berna', date: '2026-02-06', description: 'Almoço de trabalho — Bistrot Central', category: 'Alimentação', amount: -96.0, status: 'pendente' },
  { id: 'cc-11', cardId: 'cartao-sicoob-berna', date: '2026-02-09', description: 'Canva Pro — Assinatura mensal', category: 'Software', amount: -55.0, status: 'pendente' },
  { id: 'cc-12', cardId: 'cartao-sicoob-berna', date: '2026-02-14', description: 'Material de limpeza — Escritório', category: 'Material', amount: -189.9, status: 'pago' },
  { id: 'cc-13', cardId: 'cartao-sicoob-berna', date: '2026-01-10', description: 'Combustível — Posto Ipiranga', category: 'Transporte', amount: -250.0, status: 'pago' },
  { id: 'cc-14', cardId: 'cartao-sicoob-berna', date: '2026-01-25', description: 'Papelaria — Toner para impressora', category: 'Material', amount: -380.0, status: 'pago' },
]

// ── Seed ──────────────────────────────────────────────────────────
async function seed() {
  console.log('Populando Firestore...\n')

  console.log('→ Contas...')
  for (const acc of accounts) {
    await setDoc(doc(db, 'accounts', acc.id), acc)
  }
  console.log(`  ✓ ${accounts.length} contas criadas`)

  console.log('→ Categorias...')
  await setDoc(doc(db, 'settings', 'categories'), categories)
  console.log('  ✓ Categorias salvas')

  console.log('→ Lançamentos...')
  for (const entry of entries) {
    await setDoc(doc(db, 'entries', String(entry.id)), entry)
  }
  console.log(`  ✓ ${entries.length} lançamentos criados`)

  console.log('→ Lançamentos de cartão...')
  for (const cc of creditCardEntries) {
    await setDoc(doc(db, 'creditCardEntries', cc.id), cc)
  }
  console.log(`  ✓ ${creditCardEntries.length} lançamentos de cartão criados`)

  console.log('\n✅ Firestore populado com sucesso!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Erro ao popular Firestore:', err)
  process.exit(1)
})
