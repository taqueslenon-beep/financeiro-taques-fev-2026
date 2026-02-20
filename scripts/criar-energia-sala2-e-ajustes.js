/**
 * 1. Cria entries Energia Elétrica — Sala 2 (Jan-Dez/2026) — R$ 50/mês estimativa
 * 2. Atualiza descrições da Sala 1 (1200-1208) para incluir mês de referência
 * 3. Cria entry Sala 1 — Jan/2026 (valor real R$ 200,81) e Fev-Mar/2026 (estimativa)
 *
 * Rodar com: node scripts/criar-energia-sala2-e-ajustes.js
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

const MEDIA_SALA1 = 184.53
const VALOR_SALA2 = 50.00

const MESES = [
  { num: 1,  label: 'Jan/2026', ref: '01/2026' },
  { num: 2,  label: 'Fev/2026', ref: '02/2026' },
  { num: 3,  label: 'Mar/2026', ref: '03/2026' },
  { num: 4,  label: 'Abr/2026', ref: '04/2026' },
  { num: 5,  label: 'Mai/2026', ref: '05/2026' },
  { num: 6,  label: 'Jun/2026', ref: '06/2026' },
  { num: 7,  label: 'Jul/2026', ref: '07/2026' },
  { num: 8,  label: 'Ago/2026', ref: '08/2026' },
  { num: 9,  label: 'Set/2026', ref: '09/2026' },
  { num: 10, label: 'Out/2026', ref: '10/2026' },
  { num: 11, label: 'Nov/2026', ref: '11/2026' },
  { num: 12, label: 'Dez/2026', ref: '12/2026' },
]

async function run() {
  // ── 1. Atualizar descrições da Sala 1 (ids 1200-1208, Abr-Dez/2026) ──
  console.log('1. Atualizando descrições Sala 1 com mês de referência...\n')
  const sala1Meses = MESES.filter(m => m.num >= 4) // Abr-Dez
  for (let i = 0; i < sala1Meses.length; i++) {
    const m = sala1Meses[i]
    const id = 1200 + i
    await setDoc(doc(db, 'entries', String(id)), {
      description: `Energia Elétrica — Sala 1 (Celesc) — ref. ${m.ref}`,
    }, { merge: true })
    console.log(`  ✓ id ${id} → ref. ${m.ref}`)
  }

  // ── 2. Criar Sala 1 — Jan/2026 (valor real) + Fev e Mar/2026 (estimativa) ──
  console.log('\n2. Criando Sala 1 — Jan, Fev, Mar/2026...\n')

  // Jan/2026 — valor real da fatura
  await setDoc(doc(db, 'entries', '1210'), {
    id: 1210,
    description: 'Energia Elétrica — Sala 1 (Celesc) — ref. 01/2026',
    amount: -200.81,
    dueDate: '2026-02-18',
    settlementDate: null,
    type: 'Despesa',
    status: 'pendente',
    recurrence: 'Mensal',
    accountId: 'sicoob-lenon',
    categoryId: 'energia-eletrica',
    owner: 'lenon',
  })
  console.log('  ✓ Sala 1 — ref. 01/2026 — R$ 200,81 (valor real)')

  // Fev/2026 — estimativa
  await setDoc(doc(db, 'entries', '1211'), {
    id: 1211,
    description: 'Energia Elétrica — Sala 1 (Celesc) — ref. 02/2026',
    amount: -MEDIA_SALA1,
    dueDate: '2026-03-15',
    settlementDate: null,
    type: 'Despesa',
    status: 'pendente',
    recurrence: 'Mensal',
    accountId: 'sicoob-lenon',
    categoryId: 'energia-eletrica',
    owner: 'lenon',
    _isEstimativa: true,
  })
  console.log('  ✓ Sala 1 — ref. 02/2026 — R$ 184,53 (estimativa)')

  // Mar/2026 — estimativa
  await setDoc(doc(db, 'entries', '1212'), {
    id: 1212,
    description: 'Energia Elétrica — Sala 1 (Celesc) — ref. 03/2026',
    amount: -MEDIA_SALA1,
    dueDate: '2026-04-15',
    settlementDate: null,
    type: 'Despesa',
    status: 'pendente',
    recurrence: 'Mensal',
    accountId: 'sicoob-lenon',
    categoryId: 'energia-eletrica',
    owner: 'lenon',
    _isEstimativa: true,
  })
  console.log('  ✓ Sala 1 — ref. 03/2026 — R$ 184,53 (estimativa)')

  // ── 3. Criar Sala 2 — Jan a Dez/2026 (R$ 50 estimativa) ──
  console.log('\n3. Criando Energia Elétrica — Sala 2 (Jan-Dez/2026)...\n')

  const BASE_SALA2 = 1220
  for (let i = 0; i < MESES.length; i++) {
    const m = MESES[i]
    const mm = String(m.num).padStart(2, '0')
    const id = BASE_SALA2 + i
    const vencMes = m.num + 1 > 12 ? 1 : m.num + 1
    const vencAno = m.num + 1 > 12 ? 2027 : 2026
    const vencMM = String(vencMes).padStart(2, '0')

    const entry = {
      id,
      description: `Energia Elétrica — Sala 2 (Celesc) — ref. ${m.ref}`,
      amount: -VALOR_SALA2,
      dueDate: `${vencAno}-${vencMM}-15`,
      settlementDate: null,
      type: 'Despesa',
      status: 'pendente',
      recurrence: 'Mensal',
      accountId: 'sicoob-lenon',
      categoryId: 'energia-eletrica',
      owner: 'lenon',
      _isEstimativa: true,
    }

    await setDoc(doc(db, 'entries', String(id)), entry)
    console.log(`  ✓ ${entry.description} — R$ ${VALOR_SALA2.toFixed(2)} — venc. ${entry.dueDate}`)
  }

  console.log('\nPronto! Tudo lançado.')
  process.exit(0)
}

run().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
