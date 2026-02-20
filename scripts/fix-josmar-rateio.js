/**
 * Ajusta lançamentos Josmar Milcheski para formato rateio:
 *   - Nível 1 (Receita): honorários mantidos como estão (990, 991)
 *   - Nível 2 (Despesa): retirada Gilberto a 95% (992, 993)
 *   - 5% retido para Simples Nacional
 *
 * Rodar com: node scripts/fix-josmar-rateio.js
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

const RATEIO_ID = 'rateio-josmar-milcheski'
const ALIQUOTA = 0.05
const VALOR_PARCELA = 5798.50
const REPASSE_GILBERTO = +(VALOR_PARCELA * (1 - ALIQUOTA)).toFixed(2) // R$ 5.508,58

async function run() {
  console.log('Ajustando Josmar Milcheski para rateio...\n')
  console.log(`  Valor parcela:    R$ ${VALOR_PARCELA.toFixed(2)}`)
  console.log(`  Alíquota retida:  ${(ALIQUOTA * 100).toFixed(0)}%`)
  console.log(`  Repasse Gilberto: R$ ${REPASSE_GILBERTO.toFixed(2)}`)
  console.log(`  Retido (imposto): R$ ${(VALOR_PARCELA - REPASSE_GILBERTO).toFixed(2)}\n`)

  // Atualizar receitas (990, 991) com campos de rateio
  const receitas = [
    { id: 990, dueDate: '2026-03-09', parcela: '1/2' },
    { id: 991, dueDate: '2026-04-09', parcela: '2/2' },
  ]

  for (const r of receitas) {
    await setDoc(doc(db, 'entries', String(r.id)), {
      id: r.id,
      description: `Honorários Josmar Milcheski — Parcela ${r.parcela}`,
      amount: VALOR_PARCELA,
      dueDate: r.dueDate,
      settlementDate: null,
      type: 'Receita',
      status: 'pendente',
      recurrence: 'parcelada',
      accountId: 'sicoob-lenon',
      categoryId: 'honorarios',
      owner: 'gilberto',
      captador: 'gilberto',
      rateioId: RATEIO_ID,
      rateioLevel: 1,
    })
    console.log(`  ✓ Receita ${r.id} — Parcela ${r.parcela} — R$ ${VALOR_PARCELA.toFixed(2)} (nível 1)`)
  }

  // Criar retiradas do Gilberto (992, 993)
  const retiradas = [
    { id: 992, dueDate: '2026-03-09', parcela: '1/2', masterId: 990 },
    { id: 993, dueDate: '2026-04-09', parcela: '2/2', masterId: 991 },
  ]

  for (const d of retiradas) {
    await setDoc(doc(db, 'entries', String(d.id)), {
      id: d.id,
      description: `Retirada Gilberto — Josmar Milcheski ${d.parcela}`,
      amount: -REPASSE_GILBERTO,
      dueDate: d.dueDate,
      settlementDate: null,
      type: 'Despesa',
      status: 'aguardando',
      recurrence: 'parcelada',
      accountId: 'sicoob-lenon',
      categoryId: 'retirada-socio',
      owner: 'gilberto',
      rateioId: RATEIO_ID,
      rateioLevel: 2,
      rateioMasterId: d.masterId,
    })
    console.log(`  ✓ Retirada ${d.id} — Gilberto ${d.parcela} — R$ ${REPASSE_GILBERTO.toFixed(2)} (nível 2, aguardando)`)
  }

  console.log('\nPronto! Rateio Josmar configurado.')
  console.log('Quando a receita for paga, a retirada do Gilberto muda automaticamente para "pendente".')
  process.exit(0)
}

run().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
