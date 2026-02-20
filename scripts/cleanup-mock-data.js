/**
 * Remove TODOS os dados mock/aleatórios do Firestore.
 * Mantém apenas os lançamentos reais (IDs 100+).
 *
 * Rodar com: node scripts/cleanup-mock-data.js
 */

import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore'

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

const REAL_IDS = new Set([
  // Fevereiro real
  '100','101','102','103','104','105','106','107',
  // Parcelamento Simples Nacional
  '200','201','202','203','204','205','206','207','208','209','210','211',
  // Assessoria de marketing
  '300','301','302','303','304','305','306','307','308','309','310',
  // Salário Berna
  '400','401','402','403','404','405','406','407','408','409',
  // Limpeza
  '500','501','502','503','504','505','506','507','508','509',
])

async function cleanup() {
  console.log('Limpando dados fictícios do Firestore...\n')

  // Limpar entries mock (manter apenas IDs reais)
  console.log('→ Limpando coleção "entries"...')
  const entriesSnap = await getDocs(collection(db, 'entries'))
  let deletedEntries = 0
  let keptEntries = 0
  for (const d of entriesSnap.docs) {
    if (!REAL_IDS.has(d.id)) {
      await deleteDoc(doc(db, 'entries', d.id))
      deletedEntries++
    } else {
      keptEntries++
    }
  }
  console.log(`  ✓ ${deletedEntries} fictícios removidos, ${keptEntries} reais mantidos`)

  // Limpar TODOS os creditCardEntries (são todos mock)
  console.log('→ Limpando coleção "creditCardEntries"...')
  const ccSnap = await getDocs(collection(db, 'creditCardEntries'))
  let deletedCC = 0
  for (const d of ccSnap.docs) {
    await deleteDoc(doc(db, 'creditCardEntries', d.id))
    deletedCC++
  }
  console.log(`  ✓ ${deletedCC} lançamentos de cartão removidos`)

  console.log('\n✅ Limpeza concluída! Apenas dados reais no Firestore.')
  process.exit(0)
}

cleanup().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
