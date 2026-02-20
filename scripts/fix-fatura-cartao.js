/**
 * Move fatura Mastercard para o sistema de faturas existente.
 * - Deleta entry 931 (fatura duplicada no entries)
 * - Atualiza invoiceData para Fev/2026 do cartão Lenon com total R$ 4.667,42
 *
 * Rodar com: node scripts/fix-fatura-cartao.js
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, doc, deleteDoc, getDoc, setDoc } from 'firebase/firestore'

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
  console.log('── Corrigindo fatura do cartão ──\n')

  // 1. Deletar entry 931 (fatura avulsa)
  await deleteDoc(doc(db, 'entries', '931'))
  console.log('  ✓ Entry 931 (Fatura Mastercard avulsa) deletada')

  // 2. Atualizar invoiceData com o total da fatura Fev/2026 do Lenon
  const invoiceRef = doc(db, 'settings', 'invoiceData')
  const snap = await getDoc(invoiceRef)
  const current = snap.exists() ? snap.data() : {}

  const invoiceId = 'invoice-cartao-sicoob-lenon-2026-02'

  current[invoiceId] = {
    ...current[invoiceId],
    items: current[invoiceId]?.items || [],
    total: 4667.42,
    status: 'pago',
    settlementDate: '2026-02-11',
  }

  await setDoc(invoiceRef, current)
  console.log(`  ✓ invoiceData[${invoiceId}] atualizado:`)
  console.log(`    → total: R$ 4.667,42 | status: pago | efetivação: 11/02/2026`)

  console.log('\n✅ Fatura do cartão do Lenon corrigida!')
  process.exit(0)
}

run().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
