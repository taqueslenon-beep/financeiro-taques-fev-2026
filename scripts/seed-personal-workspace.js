/**
 * Script para popular as coleções do workspace "Pessoal" no Firestore.
 *
 * Cria:
 *   - personal_accounts (contas pessoais)
 *   - personal_settings/categories (categorias pessoais)
 *   - personal_settings/invoiceData (vazio, pronto para uso)
 *
 * Uso: node scripts/seed-personal-workspace.js
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, collection } from 'firebase/firestore'

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

const personalAccounts = [
  { id: 'banco-pessoal-lenon', label: 'Conta Pessoal — Sicoob (Lenon)', owner: 'lenon', color: '#1e3a5f', type: 'banco' },
  { id: 'cartao-pessoal-lenon', label: 'Cartão de Crédito Pessoal (Lenon)', owner: 'lenon', color: '#2563eb', type: 'cartao' },
  { id: 'poupanca-lenon', label: 'Poupança (Lenon)', owner: 'lenon', color: '#3b82f6', type: 'banco' },
  { id: 'investimentos-lenon', label: 'Investimentos (Lenon)', owner: 'lenon', color: '#1d4ed8', type: 'reserva' },
  { id: 'banco-pessoal-berna', label: 'Conta Pessoal — Sicoob (Berna)', owner: 'berna', color: '#7c3aed', type: 'banco' },
  { id: 'cartao-pessoal-berna', label: 'Cartão de Crédito Pessoal (Berna)', owner: 'berna', color: '#8b5cf6', type: 'cartao' },
]

const personalCategories = {
  receita: [
    { id: 'salario', label: 'Salário' },
    { id: 'freelance', label: 'Freelance' },
    { id: 'rendimentos', label: 'Rendimento de investimentos' },
    { id: 'aluguel-recebido', label: 'Aluguel recebido' },
    { id: 'bonus', label: 'Bônus / 13o' },
    { id: 'outras-receitas-pessoal', label: 'Outras receitas' },
  ],
  despesa: [
    { id: 'moradia', label: 'Moradia' },
    { id: 'alimentacao', label: 'Alimentação' },
    { id: 'transporte', label: 'Transporte' },
    { id: 'saude', label: 'Saúde' },
    { id: 'educacao', label: 'Educação' },
    { id: 'lazer', label: 'Lazer e entretenimento' },
    { id: 'vestuario', label: 'Vestuário' },
    { id: 'assinaturas', label: 'Assinaturas e serviços' },
    { id: 'seguros', label: 'Seguros' },
    { id: 'impostos-pessoais', label: 'Impostos pessoais' },
    { id: 'pets', label: 'Pets' },
    { id: 'presentes', label: 'Presentes e doações' },
    { id: 'cuidados-pessoais', label: 'Cuidados pessoais' },
    { id: 'financiamento', label: 'Financiamento' },
    { id: 'condominio', label: 'Condomínio' },
    { id: 'energia-agua-gas', label: 'Energia / Água / Gás' },
    { id: 'internet-telefone', label: 'Internet / Telefone' },
    { id: 'outros-pessoal', label: 'Outros' },
  ],
}

async function seed() {
  console.log('Populando coleções do workspace Pessoal...\n')

  for (const account of personalAccounts) {
    await setDoc(doc(db, 'personal_accounts', account.id), account)
    console.log(`  ✓ Conta: ${account.label}`)
  }

  await setDoc(doc(db, 'personal_settings', 'categories'), personalCategories)
  console.log('  ✓ Categorias pessoais')

  await setDoc(doc(db, 'personal_settings', 'invoiceData'), {})
  console.log('  ✓ Invoice data (vazio)')

  console.log('\nPronto! Workspace Pessoal configurado no Firestore.')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
