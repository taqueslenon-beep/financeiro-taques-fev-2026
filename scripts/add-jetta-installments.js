/**
 * Adiciona as 60 parcelas do financiamento Carro — Jetta ao Firestore.
 * Também atualiza as categorias para incluir "Financiamento de veículo".
 *
 * Rodar com: node scripts/add-jetta-installments.js
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore'

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

async function run() {
  console.log('── Atualizando categorias ──────────────────────────')
  const catRef = doc(db, 'settings', 'categories')
  const catSnap = await getDoc(catRef)
  const categories = catSnap.exists() ? catSnap.data() : { receita: [], despesa: [] }

  const alreadyHas = categories.despesa.some((c) => c.id === 'financiamento-veiculo')
  if (!alreadyHas) {
    categories.despesa.push({ id: 'financiamento-veiculo', label: 'Financiamento de veículo' })
    await setDoc(catRef, categories)
    console.log('  ✓ Categoria "Financiamento de veículo" adicionada')
  } else {
    console.log('  ℹ Categoria já existe, pulando')
  }

  console.log('\n── Adicionando parcelas Carro — Jetta (60x) ────────')
  const BASE_ID = 700
  const COUNT = 60
  const AMOUNT = -3186.85
  let added = 0

  for (let i = 0; i < COUNT; i++) {
    const d = new Date(2026, 1, 10) // Feb 10, 2026
    d.setMonth(d.getMonth() + i)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = '10'

    const entry = {
      id: BASE_ID + i,
      description: `Carro — Jetta (Parcela ${i + 1}/${COUNT})`,
      amount: AMOUNT,
      dueDate: `${yyyy}-${mm}-${dd}`,
      settlementDate: '',
      type: 'Despesa',
      status: 'pendente',
      recurrence: 'Parcelamento',
      accountId: 'sicoob-lenon',
      categoryId: 'financiamento-veiculo',
    }

    await setDoc(doc(db, 'entries', String(entry.id)), entry)
    added++
    if (added % 10 === 0) console.log(`  ... ${added}/${COUNT} parcelas`)
  }

  console.log(`  ✓ ${added} parcelas do Jetta adicionadas ao Firestore`)
  console.log('\n✅ Concluído!')
  process.exit(0)
}

run().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
