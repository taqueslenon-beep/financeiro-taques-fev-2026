import { useState, useMemo } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import DataTable from './components/DataTable'
import SelectionModal from './components/SelectionModal'
import Modal from './components/Modal'
import InvoiceModal from './components/InvoiceModal'
import RateioModal from './components/RateioModal'
import AccountsPage from './components/AccountsPage'
import DashboardPage from './components/DashboardPage'
import CreditCardsPage from './components/CreditCardsPage'
import { initialEntries } from './data/entries'
import { accounts } from './data/accounts'

/**
 * Controle de acesso simulado.
 * Altere para 'berna' para testar a visão restrita no modal.
 */
const currentUser = 'lenon'

const creditCardAccounts = accounts.filter((a) => a.type === 'cartao')

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
  const [activePage, setActivePage] = useState('contas-pagar-receber')
  const [entries, setEntries] = useState(initialEntries)
  const [editingEntry, setEditingEntry] = useState(null)

  // Estado das faturas de cartão: { [invoiceId]: { items: [], total: 0 } }
  const [invoiceData, setInvoiceData] = useState({})

  // Modais
  const [isSelectionOpen, setIsSelectionOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalEntryType, setModalEntryType] = useState('despesa')
  const [invoiceModalEntry, setInvoiceModalEntry] = useState(null)
  const [isInvoiceStandalone, setIsInvoiceStandalone] = useState(false)
  const [isRateioOpen, setIsRateioOpen] = useState(false)

  /**
   * Gera as entradas de fatura de cartão para cada mês que tenha visibilidade.
   */
  const invoiceEntries = useMemo(() => {
    const result = []
    for (const card of creditCardAccounts) {
      for (let y = 2025; y <= 2027; y++) {
        for (let m = 0; m < 12; m++) {
          const invoiceId = getInvoiceId(card.id, y, m)
          const data = invoiceData[invoiceId]
          const items = data?.items || []
          const total = data?.total ?? 0

          result.push({
            id: invoiceId,
            description: getCardLabel(card),
            amount: total === 0 ? 0 : -Math.abs(total),
            dueDate: getInvoiceDueDate(y, m),
            settlementDate: '',
            type: 'Despesa',
            status: total === 0 ? 'pendente' : 'pendente',
            recurrence: 'Fatura',
            accountId: card.id,
            isInvoice: true,
            invoiceItems: items,
          })
        }
      }
    }
    return result
  }, [invoiceData])

  // Combina entries normais com faturas de cartão
  const allEntries = useMemo(() => {
    return [...entries, ...invoiceEntries]
  }, [entries, invoiceEntries])

  const handleSaveEntry = (newEntryOrEntries) => {
    setEntries((prev) =>
      Array.isArray(newEntryOrEntries)
        ? [...newEntryOrEntries, ...prev]
        : [newEntryOrEntries, ...prev]
    )
  }

  const handleUpdateEntry = (updatedEntry) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry))
    )
  }

  const handleDeleteEntry = (entryId) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== entryId))
  }

  const handleSettleEntry = (entryId, settlementDate) => {
    if (typeof entryId === 'string' && entryId.startsWith('invoice-')) {
      setInvoiceData((prev) => ({
        ...prev,
        [entryId]: {
          ...prev[entryId],
          status: 'pago',
          settlementDate,
        },
      }))
      return
    }
    setEntries((prev) => {
      const settled = prev.find((e) => e.id === entryId)
      return prev.map((entry) => {
        if (entry.id === entryId) {
          return { ...entry, status: 'pago', settlementDate }
        }
        if (
          settled?.rateioLevel === 1 &&
          settled?.rateioId &&
          entry.rateioLevel === 2 &&
          entry.rateioId === settled.rateioId &&
          entry.rateioMasterId === entryId &&
          entry.status === 'aguardando'
        ) {
          return { ...entry, status: 'pendente' }
        }
        return entry
      })
    })
  }

  const handleReverseSettle = (entryId) => {
    if (typeof entryId === 'string' && entryId.startsWith('invoice-')) {
      setInvoiceData((prev) => ({
        ...prev,
        [entryId]: {
          ...prev[entryId],
          status: 'pendente',
          settlementDate: '',
        },
      }))
      return
    }
    setEntries((prev) => {
      const reversed = prev.find((e) => e.id === entryId)
      return prev.map((entry) => {
        if (entry.id === entryId) {
          return { ...entry, status: 'pendente', settlementDate: '' }
        }
        if (
          reversed?.rateioLevel === 1 &&
          reversed?.rateioId &&
          entry.rateioLevel === 2 &&
          entry.rateioId === reversed.rateioId &&
          entry.rateioMasterId === entryId &&
          entry.status === 'pendente'
        ) {
          return { ...entry, status: 'aguardando' }
        }
        return entry
      })
    })
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
      // Abre InvoiceModal em modo standalone
      setInvoiceModalEntry(null)
      setIsInvoiceStandalone(true)
    } else if (type === 'rateio') {
      // Abre RateioModal
      setIsRateioOpen(true)
    } else {
      // Abre Modal de Receita ou Despesa
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

  const handleSaveInvoice = (invoiceId, items, total) => {
    // Separate current-month items from future-month installments
    const currentItems = items.filter((i) => (i.monthOffset || 0) === 0)
    const futureItems = items.filter((i) => (i.monthOffset || 0) > 0)

    // Parse the invoice ID to extract card, year, and month
    const parts = invoiceId.match(/^(invoice-.+)-(\d{4})-(\d{2})$/)
    if (!parts) return

    const cardPrefix = parts[1]
    const baseYear = parseInt(parts[2], 10)
    const baseMonth = parseInt(parts[3], 10) - 1

    setInvoiceData((prev) => {
      const next = { ...prev }

      // Save current month items
      next[invoiceId] = {
        ...next[invoiceId],
        items: currentItems,
        total,
      }

      // Clean up old installments from those groups in future months
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

      // Propagate future items to their corresponding month invoices
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

      return next
    })
  }

  // Estado do InvoiceModal: aberto se invoiceModalEntry !== null OU se isInvoiceStandalone
  const isInvoiceModalOpen = invoiceModalEntry !== null || isInvoiceStandalone

  return (
    <div className="flex min-h-screen">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      <main className="flex-1 p-10">
        {activePage === 'contas-pagar-receber' && (
          <>
            <Header onNewEntry={handleNewEntry} />
            <DataTable
              entries={allEntries}
              onEdit={handleEditEntry}
              onDelete={handleDeleteEntry}
              onSettle={handleSettleEntry}
              onReverseSettle={handleReverseSettle}
            />
          </>
        )}

        {activePage === 'lancamentos-por-conta' && <AccountsPage />}

        {activePage === 'painel' && (
          <DashboardPage entries={entries} />
        )}

        {activePage === 'cartoes' && <CreditCardsPage />}
      </main>

      {/* Modal de Seleção (Gatilho) */}
      <SelectionModal
        isOpen={isSelectionOpen}
        onClose={() => setIsSelectionOpen(false)}
        onSelect={handleSelection}
      />

      {/* Modal de Receita / Despesa */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={editingEntry ? handleUpdateEntry : handleSaveEntry}
        currentUser={currentUser}
        editingEntry={editingEntry}
        entryType={modalEntryType}
      />

      {/* Modal de Fatura (Cartão de Crédito) */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={handleCloseInvoiceModal}
        invoiceEntry={invoiceModalEntry}
        onSave={handleSaveInvoice}
        standalone={isInvoiceStandalone}
        onSaveStandalone={handleSaveInvoice}
      />

      {/* Modal de Rateio */}
      <RateioModal
        isOpen={isRateioOpen}
        onClose={() => setIsRateioOpen(false)}
        onSave={handleSaveEntry}
        currentUser={currentUser}
      />
    </div>
  )
}
