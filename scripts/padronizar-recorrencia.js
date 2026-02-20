/**
 * Padroniza o campo `recurrence` de todas as entries no Firestore.
 *
 * Mapeamento:
 *   'Mensal'    → 'Fixa'
 *   'Anual'     → 'Fixa/Anual'
 *   'parcelada' → 'Parcelamento'
 *   '—'         → 'Variável'
 *
 * Rodar com: node scripts/padronizar-recorrencia.js
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore'

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

const MAPPING = {
  'Mensal': 'Fixa',
  'Anual': 'Fixa/Anual',
  'parcelada': 'Parcelamento',
  '—': 'Variável',
}

async function run() {
  const snap = await getDocs(collection(db, 'entries'))
  let updated = 0
  let skipped = 0

  const counts = {}

  for (const d of snap.docs) {
    const data = d.data()
    const current = data.recurrence || ''
    counts[current] = (counts[current] || 0) + 1

    if (MAPPING[current]) {
      const newVal = MAPPING[current]
      await updateDoc(doc(db, 'entries', d.id), { recurrence: newVal })
      console.log(`  ✓ ${d.id} — "${current}" → "${newVal}" (${data.description})`)
      updated++
    } else {
      skipped++
    }
  }

  console.log('\n--- Resumo antes da migração ---')
  for (const [k, v] of Object.entries(counts).sort()) {
    const arrow = MAPPING[k] ? ` → ${MAPPING[k]}` : ' (ok)'
    console.log(`  "${k}": ${v} entries${arrow}`)
  }

  console.log(`\nTotal: ${snap.size} | Atualizados: ${updated} | Já corretos: ${skipped}`)
  process.exit(0)
}

run().catch(e => { console.error(e); process.exit(1) })
