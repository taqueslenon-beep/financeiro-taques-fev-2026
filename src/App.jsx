import { useState, useEffect, useMemo } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import DataTable from './components/DataTable'
import SelectionModal from './components/SelectionModal'
import Modal from './components/Modal'
import InvoiceModal from './components/InvoiceModal'
import RateioModal from './components/RateioModal'
import AccountsPage from './components/AccountsPage'
import AccountStatement from './components/AccountStatement'
import DashboardPage from './components/DashboardPage'
import CreditCardsPage from './components/CreditCardsPage'
import WorkspaceSwitcher from './components/WorkspaceSwitcher'
import { useWorkspace } from './contexts/WorkspaceContext'
import {
  subscribeEntries,
  saveEntry,
  updateEntry as updateEntryFS,
  deleteEntry as deleteEntryFS,
  fetchAccounts,
  saveInvoiceData,
  fetchInvoiceData,
  generateEntryId,
} from './services/firestore'

/**
 * Controle de acesso simulado.
 * Altere para 'berna' para testar a visão restrita no modal.
 */
const currentUser = 'lenon'

function getCardLabel(account) {
  const ownerLabel = account.owner === 'lenon' ? 'Lenon' : 'Berna'
  return `Fatura do cartão de crédito - Sicoob - ${ownerLabel}`
}

/**
 * Gera IDs estáveis para faturas: "invoice-{cardId}-{YYYY}-{MM}"
 */
function getInvoiceId(cardId, year, month) {
  const mm = String(month + 1).padStart(2, '0')
  return `invoice-${cardId}-${year}-${mm}`
}

/**
 * Gera a data de vencimento (dia 10) para um mês/ano.
 */
function getInvoiceDueDate(year, month) {
  const mm = String(month + 1).padStart(2, '0')
  return `${year}-${mm}-10`
}

export default function App() {
  const { workspaceId, config } = useWorkspace()
  const prefix = config.collectionsPrefix

  const [activePage, setActivePage] = useState('contas-pagar-receber')
  const [entries, setEntries] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingEntry, setEditingEntry] = useState(null)
  const [selectedAccount, setSelectedAccount] = useState(null)

  const [invoiceData, setInvoiceData] = useState({})

  const creditCardAccounts = useMemo(
    () => accounts.filter((a) => a.type === 'cartao'),
    [accounts],
  )

  useEffect(() => {
    setLoading(true)
    setEntries([])
    setAccounts([])
    setInvoiceData({})
    setSelectedAccount(null)

    fetchAccounts(prefix).then(setAccounts)
    fetchInvoiceData(prefix).then(setInvoiceData)

    const unsubscribe = subscribeEntries((firestoreEntries) => {
      setEntries(firestoreEntries)
      setLoading(false)
    }, prefix)

    return () => unsubscribe()
  }, [prefix])

  useEffect(() => {
    document.documentElement.setAttribute('data-workspace', workspaceId)
  }, [workspaceId])

  // Modais
  const [isSelectionOpen, setIsSelectionOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalEntryType, setModalEntryType] = useState('despesa')
  const [invoiceModalEntry, setInvoiceModalEntry] = useState(null)
  const [isInvoiceStandalone, setIsInvoiceStandalone] = useState(false)
  const [isRateioOpen, setIsRateioOpen] = useState(false)

  /**
   * Mês de início das faturas por cartão (year * 12 + month).
   * Lenon: fevereiro/2026 | Berna: março/2026
   */
  const INVOICE_START = {
    'cartao-sicoob-lenon': 2026 * 12 + 1,
    'cartao-sicoob-berna': 2026 * 12 + 2,
    'cartao-pessoal-lenon': 2026 * 12 + 1,
    'cartao-pessoal-berna': 2026 * 12 + 2,
  }
  const INVOICE_END_YEAR = 2027

  const invoiceEntries = useMemo(() => {
    const result = []
    for (const card of creditCardAccounts) {
      const startKey = INVOICE_START[card.id] ?? 2026 * 12
      for (let y = 2026; y <= INVOICE_END_YEAR; y++) {
        for (let m = 0; m < 12; m++) {
          if (y * 12 + m < startKey) continue
          const invoiceId = getInvoiceId(card.id, y, m)
          const data = invoiceData[invoiceId]
          const items = data?.items || []
          const total = data?.total ?? 0

          result.push({
            id: invoiceId,
            description: getCardLabel(card),
            amount: total === 0 ? 0 : -Math.abs(total),
            dueDate: getInvoiceDueDate(y, m),
            settlementDate: data?.settlementDate || '',
            type: 'Despesa',
            status: data?.status || 'pendente',
            recurrence: 'Fatura',
            accountId: card.id,
            isInvoice: true,
            invoiceItems: items,
          })
        }
      }
    }
    return result
  }, [invoiceData, creditCardAccounts])

  const SIMPLES_ALIQUOTA = 0.05

  const allEntries = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const base = [...entries, ...invoiceEntries]

    const faturamentoByMonth = {}
    for (const e of base) {
      if (e.type !== 'Receita' || !e.dueDate) continue
      const d = new Date(e.dueDate + 'T12:00:00')
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      faturamentoByMonth[key] = (faturamentoByMonth[key] || 0) + Math.abs(e.amount)
    }

    return base.map((e) => {
      let entry = e

      if (workspaceId === 'trabalho' && e.categoryId === 'simples-nacional' && e.type === 'Despesa' && e.dueDate && e.status !== 'pago') {
        const dueD = new Date(e.dueDate + 'T12:00:00')
        let prevMonth = dueD.getMonth() - 1
        let prevYear = dueD.getFullYear()
        if (prevMonth < 0) { prevMonth = 11; prevYear -= 1 }
        const prevKey = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`
        const faturamento = faturamentoByMonth[prevKey] || 0
        const estimativa = +(faturamento * SIMPLES_ALIQUOTA).toFixed(2)
        entry = { ...e, amount: estimativa === 0 ? 0 : -estimativa, _faturamentoBase: faturamento, _isEstimativa: true }
      }

      if (entry.status === 'pago' || entry.status === 'aguardando') return entry
      if (!entry.dueDate) return entry
      const due = new Date(entry.dueDate + 'T12:00:00')
      if (due < today && (entry.status === 'pendente' || !entry.status)) {
        return { ...entry, status: 'atrasado' }
      }
      return entry
    })
  }, [entries, invoiceEntries, workspaceId])

  const handleSaveEntry = async (newEntryOrEntries) => {
    const items = Array.isArray(newEntryOrEntries)
      ? newEntryOrEntries
      : [newEntryOrEntries]
    for (const entry of items) {
      if (!entry.id) entry.id = generateEntryId()
      await saveEntry(entry, prefix)
    }
  }

  const handleUpdateEntry = async (updatedEntry) => {
    const { _docId, ...data } = updatedEntry
    await updateEntryFS(data, prefix)
  }

  const handleDeleteEntry = async (entryId) => {
    await deleteEntryFS(entryId, prefix)
  }

  const handleSettleEntry = async (entryId, settlementDate) => {
    if (typeof entryId === 'string' && entryId.startsWith('invoice-')) {
      const next = {
        ...invoiceData,
        [entryId]: {
          ...invoiceData[entryId],
          status: 'pago',
          settlementDate,
        },
      }
      setInvoiceData(next)
      await saveInvoiceData(next, prefix)
      return
    }
    const settled = entries.find((e) => e.id === entryId)
    if (settled) {
      await updateEntryFS({ ...settled, status: 'pago', settlementDate }, prefix)
    }
    if (settled?.rateioLevel === 1 && settled?.rateioId) {
      for (const entry of entries) {
        if (
          entry.rateioLevel === 2 &&
          entry.rateioId === settled.rateioId &&
          entry.rateioMasterId === entryId &&
          entry.status === 'aguardando'
        ) {
          await updateEntryFS({ ...entry, status: 'pendente' }, prefix)
        }
      }
    }
  }

  const handleReverseSettle = async (entryId) => {
    if (typeof entryId === 'string' && entryId.startsWith('invoice-')) {
      const next = {
        ...invoiceData,
        [entryId]: {
          ...invoiceData[entryId],
          status: 'pendente',
          settlementDate: '',
        },
      }
      setInvoiceData(next)
      await saveInvoiceData(next, prefix)
      return
    }
    const reversed = entries.find((e) => e.id === entryId)
    if (reversed) {
      await updateEntryFS({ ...reversed, status: 'pendente', settlementDate: '' }, prefix)
    }
    if (reversed?.rateioLevel === 1 && reversed?.rateioId) {
      for (const entry of entries) {
        if (
          entry.rateioLevel === 2 &&
          entry.rateioId === reversed.rateioId &&
          entry.rateioMasterId === entryId &&
          entry.status === 'pendente'
        ) {
          await updateEntryFS({ ...entry, status: 'aguardando' }, prefix)
        }
      }
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Fluxo de criação: SelectionModal → Modal ou InvoiceModal         */
  /* ---------------------------------------------------------------- */

  const handleNewEntry = () => {
    setEditingEntry(null)
    setIsSelectionOpen(true)
  }

  const handleSelection = (type) => {
    setIsSelectionOpen(false)

    if (type === 'cartao') {
      setInvoiceModalEntry(null)
      setIsInvoiceStandalone(true)
    } else if (type === 'rateio') {
      setIsRateioOpen(true)
    } else {
      setModalEntryType(type)
      setEditingEntry(null)
      setIsModalOpen(true)
    }
  }

  const handleEditEntry = (entry) => {
    if (entry.isInvoice) {
      setInvoiceModalEntry(entry)
      setIsInvoiceStandalone(false)
      return
    }
    setEditingEntry(entry)
    setModalEntryType(entry.type?.toLowerCase() || 'despesa')
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingEntry(null)
  }

  const handleCloseInvoiceModal = () => {
    setInvoiceModalEntry(null)
    setIsInvoiceStandalone(false)
  }

  const handleSaveInvoice = async (invoiceId, items, total) => {
    const currentItems = items.filter((i) => (i.monthOffset || 0) === 0)
    const futureItems = items.filter((i) => (i.monthOffset || 0) > 0)

    const parts = invoiceId.match(/^(invoice-.+)-(\d{4})-(\d{2})$/)
    if (!parts) return

    const cardPrefix = parts[1]
    const baseYear = parseInt(parts[2], 10)
    const baseMonth = parseInt(parts[3], 10) - 1

    const next = { ...invoiceData }

    next[invoiceId] = {
      ...next[invoiceId],
      items: currentItems,
      total,
    }

    const groupIds = new Set(
      futureItems.map((i) => i.installmentGroupId).filter(Boolean)
    )

    if (groupIds.size > 0) {
      for (const key of Object.keys(next)) {
        if (key === invoiceId) continue
        if (!key.startsWith(cardPrefix.replace('invoice-', 'invoice-'))) continue
        const existing = next[key]
        if (!existing?.items) continue
        const cleaned = existing.items.filter(
          (i) => !i.installmentGroupId || !groupIds.has(i.installmentGroupId)
        )
        if (cleaned.length !== existing.items.length) {
          const cleanedTotal = cleaned.reduce((sum, i) => {
            return i.type === 'receita' ? sum - i.amount : sum + i.amount
          }, 0)
          next[key] = { ...existing, items: cleaned, total: cleanedTotal }
        }
      }
    }

    for (const item of futureItems) {
      const offset = item.monthOffset || 0
      let targetMonth = baseMonth + offset
      let targetYear = baseYear
      while (targetMonth >= 12) {
        targetMonth -= 12
        targetYear += 1
      }
      const mm = String(targetMonth + 1).padStart(2, '0')
      const cardId = cardPrefix.replace('invoice-', '')
      const targetInvoiceId = `invoice-${cardId}-${targetYear}-${mm}`

      const targetData = next[targetInvoiceId] || { items: [], total: 0 }
      const targetItems = [...(targetData.items || [])]
      targetItems.push({ ...item, monthOffset: 0 })

      const targetTotal = targetItems.reduce((sum, i) => {
        return i.type === 'receita' ? sum - i.amount : sum + i.amount
      }, 0)

      next[targetInvoiceId] = { ...targetData, items: targetItems, total: targetTotal }
    }

    setInvoiceData(next)
    await saveInvoiceData(next, prefix)
  }

  const isInvoiceModalOpen = invoiceModalEntry !== null || isInvoiceStandalone

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500 text-lg">Carregando dados...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar activePage={activePage} onNavigate={(page) => { setActivePage(page); setSelectedAccount(null) }} />

      <main className="flex-1 p-10">
        <div className="flex justify-end mb-4">
          <WorkspaceSwitcher />
        </div>

        {activePage === 'contas-pagar-receber' && (
          <>
            <Header onNewEntry={handleNewEntry} />
            <DataTable
              entries={allEntries}
              onEdit={handleEditEntry}
              onDelete={handleDeleteEntry}
              onSettle={handleSettleEntry}
              onReverseSettle={handleReverseSettle}
              onInlineUpdate={handleUpdateEntry}
            />
          </>
        )}

        {activePage === 'lancamentos-por-conta' && !selectedAccount && (
          <AccountsPage onSelectAccount={(account) => setSelectedAccount(account)} />
        )}

        {activePage === 'lancamentos-por-conta' && selectedAccount && (
          <AccountStatement
            account={selectedAccount}
            entries={allEntries}
            onBack={() => setSelectedAccount(null)}
          />
        )}

        {activePage === 'painel' && (
          <DashboardPage entries={entries} invoiceData={invoiceData} />
        )}

        {activePage === 'cartoes' && <CreditCardsPage />}
      </main>

      <SelectionModal
        isOpen={isSelectionOpen}
        onClose={() => setIsSelectionOpen(false)}
        onSelect={handleSelection}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={editingEntry ? handleUpdateEntry : handleSaveEntry}
        currentUser={currentUser}
        editingEntry={editingEntry}
        entryType={modalEntryType}
      />

      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={handleCloseInvoiceModal}
        invoiceEntry={invoiceModalEntry}
        onSave={handleSaveInvoice}
        standalone={isInvoiceStandalone}
        onSaveStandalone={handleSaveInvoice}
      />

      <RateioModal
        isOpen={isRateioOpen}
        onClose={() => setIsRateioOpen(false)}
        onSave={handleSaveEntry}
        currentUser={currentUser}
      />
    </div>
  )
}
