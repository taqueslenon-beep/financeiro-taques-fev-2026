import { useState, useEffect, useMemo } from 'react'
import { X, Plus, Trash2, ChevronDown, Repeat } from 'lucide-react'
import { useWorkspaceData } from '../contexts/WorkspaceContext'

const tipoInvoiceOptions = [
  { id: 'Variável', label: 'Variável' },
  { id: 'Fixa', label: 'Fixa' },
  { id: 'Fixa/Anual', label: 'Fixa/Anual' },
  { id: 'Parcelamento', label: 'Parcelamento' },
]

function formatCurrencyBRL(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function parseCurrencyToNumber(formatted) {
  if (!formatted) return 0
  const cleaned = formatted
    .replace(/[R$\s.]/g, '')
    .replace(',', '.')
  return parseFloat(cleaned) || 0
}

function formatDateBR(dateStr) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

/* ------------------------------------------------------------------ */
/*  Modo standalone: aberto via SelectionModal (sem invoiceEntry)      */
/*  Modo edição: aberto via DataTable (com invoiceEntry)               */
/* ------------------------------------------------------------------ */

export default function InvoiceModal({ isOpen, onClose, invoiceEntry, onSave, standalone = false, onSaveStandalone }) {
  const { accounts, categories } = useWorkspaceData()
  const allCategories = useMemo(() => [
    ...categories.despesa.map((c) => ({ ...c, group: 'Despesa' })),
    ...categories.receita.map((c) => ({ ...c, group: 'Receita' })),
  ], [categories])
  const creditCardAccounts = useMemo(() => accounts.filter((a) => a.type === 'cartao'), [accounts])

  const [items, setItems] = useState([])
  const [selectedCard, setSelectedCard] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')

  // Form fields
  const [newDate, setNewDate] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newCat, setNewCat] = useState('')
  const [newRecurrence, setNewRecurrence] = useState('Variável')
  const [newAmount, setNewAmount] = useState('')
  const [newInstallments, setNewInstallments] = useState('')
  const [newType, setNewType] = useState('despesa')

  // Gera opções de mês para o modo standalone
  const monthOptions = useMemo(() => {
    const result = []
    const now = new Date()
    for (let i = -2; i <= 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const y = d.getFullYear()
      const m = d.getMonth()
      const mm = String(m + 1).padStart(2, '0')
      const names = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
      result.push({
        value: `${y}-${mm}`,
        label: `${names[m]} ${y}`,
        year: y,
        month: m,
      })
    }
    return result
  }, [])

  useEffect(() => {
    if (isOpen) {
      resetForm()
      if (invoiceEntry && !standalone) {
        setItems(invoiceEntry.invoiceItems || [])
        setSelectedCard(invoiceEntry.accountId || '')
      } else {
        setItems([])
        setSelectedCard('')
        setSelectedMonth('')
      }
    }
  }, [isOpen, invoiceEntry, standalone])

  if (!isOpen) return null

  function resetForm() {
    setNewDate('')
    setNewDesc('')
    setNewCat('')
    setNewRecurrence('Variável')
    setNewAmount('')
    setNewInstallments('')
    setNewType('despesa')
  }

  // Derived: modo standalone precisa de card + mês selecionados
  const isStandaloneReady = !standalone || (selectedCard !== '' && selectedMonth !== '')

  // Título e subtítulo dinâmicos
  const getTitle = () => {
    if (standalone) return 'Lançamento no Cartão de Crédito'
    return 'Detalhes da Fatura'
  }

  const getSubtitle = () => {
    if (standalone && selectedCard) {
      const card = creditCardAccounts.find((c) => c.id === selectedCard)
      const ownerLabel = card?.owner === 'lenon' ? 'Lenon' : 'Berna'
      const monthOpt = monthOptions.find((m) => m.value === selectedMonth)
      return `Sicoob — ${ownerLabel}${monthOpt ? ` — ${monthOpt.label}` : ''}`
    }
    if (invoiceEntry) {
      return `${invoiceEntry.description} — Venc. ${formatDateBR(invoiceEntry.dueDate)}`
    }
    return 'Selecione o cartão e o mês da fatura'
  }

  // Gerar invoiceId para modo standalone
  const getStandaloneInvoiceId = () => {
    if (!selectedCard || !selectedMonth) return null
    const [y, mm] = selectedMonth.split('-')
    return `invoice-${selectedCard}-${y}-${mm}`
  }

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '')
    if (raw === '') { setNewAmount(''); return }
    const numericValue = (parseInt(raw, 10) / 100).toFixed(2)
    setNewAmount(formatCurrencyBRL(numericValue))
  }

  const isParcelado = newRecurrence === 'Parcelamento'
  const parsedInstallments = parseInt(newInstallments, 10) || 0

  const canAdd =
    isStandaloneReady &&
    newDate !== '' &&
    newDesc.trim() !== '' &&
    newCat !== '' &&
    newAmount !== '' &&
    (!isParcelado || parsedInstallments >= 2)

  const handleAdd = () => {
    if (!canAdd) return
    const amount = parseCurrencyToNumber(newAmount)
    const isRevenue = newType === 'receita'
    const finalAmount = isRevenue ? Math.abs(amount) : amount

    if (isParcelado && parsedInstallments >= 2) {
      const perInstallment = +(finalAmount / parsedInstallments).toFixed(2)
      const groupId = `grp-${Date.now()}`

      const newItems = []
      for (let i = 0; i < parsedInstallments; i++) {
        newItems.push({
          id: Date.now() + i,
          purchaseDate: newDate,
          description: `${newDesc.trim()} (${i + 1}/${parsedInstallments})`,
          categoryId: newCat,
          recurrence: 'Parcelamento',
          amount: perInstallment,
          type: newType,
          installmentIndex: i,
          installmentTotal: parsedInstallments,
          installmentGroupId: groupId,
          monthOffset: i,
        })
      }
      setItems((prev) => [...prev, ...newItems])
    } else {
      const item = {
        id: Date.now(),
        purchaseDate: newDate,
        description: newDesc.trim(),
        categoryId: newCat,
        recurrence: newRecurrence,
        amount: finalAmount,
        type: newType,
        monthOffset: 0,
      }
      setItems((prev) => [...prev, item])
    }
    resetForm()
  }

  const handleRemove = (id) => {
    const target = items.find((i) => i.id === id)
    if (target?.installmentGroupId) {
      setItems((prev) => prev.filter((i) => i.installmentGroupId !== target.installmentGroupId))
    } else {
      setItems((prev) => prev.filter((i) => i.id !== id))
    }
  }

  const currentMonthItems = items.filter((i) => (i.monthOffset || 0) === 0)
  const futureItems = items.filter((i) => (i.monthOffset || 0) > 0)

  const total = currentMonthItems.reduce((sum, i) => {
    return i.type === 'receita' ? sum - i.amount : sum + i.amount
  }, 0)

  const handleSave = () => {
    if (standalone) {
      const invoiceId = getStandaloneInvoiceId()
      if (!invoiceId) return
      if (onSaveStandalone) {
        onSaveStandalone(invoiceId, items, total)
      } else if (onSave) {
        onSave(invoiceId, items, total)
      }
    } else {
      onSave(invoiceEntry.id, items, total)
    }
    onClose()
  }

  const getCategoryLabel = (catId) => {
    const cat = allCategories.find((c) => c.id === catId)
    return cat ? cat.label : catId
  }

  const getTipoLabel = (rec) => {
    if (!rec) return 'Variável'
    const opt = tipoInvoiceOptions.find((o) => o.id === rec)
    if (opt) return opt.label
    const legacy = { 'unico': 'Variável', 'fixo': 'Fixa', 'parcelado': 'Parcelamento', 'Mensal': 'Fixa', 'Anual': 'Fixa/Anual' }
    return legacy[rec] || rec
  }

  const filteredCategories = newType === 'receita'
    ? categories.receita
    : categories.despesa

  const inputClass =
    'w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-150'
  const labelClass =
    'block text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative bg-surface rounded-2xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-8 pt-8 pb-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-text-primary uppercase tracking-wide">
                {getTitle()}
              </h3>
              <p className="text-sm text-text-muted mt-0.5 font-semibold">
                {getSubtitle()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 -mt-1 rounded-lg text-text-muted hover:bg-offwhite hover:text-text-primary transition-colors duration-150 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Seleção de Cartão + Mês (modo standalone) */}
        {standalone && (
          <div className="px-8 pb-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className={labelClass}>RESPONSÁVEL / CARTÃO</label>
                <div className="relative">
                  <select
                    value={selectedCard}
                    onChange={(e) => setSelectedCard(e.target.value)}
                    className={`${inputClass} appearance-none pr-8 cursor-pointer`}
                  >
                    <option value="" disabled>Selecione o cartão</option>
                    {creditCardAccounts.map((card) => {
                      const ownerLabel = card.owner === 'lenon' ? 'Lenon' : 'Berna'
                      return (
                        <option key={card.id} value={card.id}>
                          Sicoob — {ownerLabel}
                        </option>
                      )
                    })}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
              </div>
              <div className="w-52">
                <label className={labelClass}>MÊS DA FATURA</label>
                <div className="relative">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className={`${inputClass} appearance-none pr-8 cursor-pointer`}
                  >
                    <option value="" disabled>Selecione o mês</option>
                    {monthOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
              </div>
            </div>
            {selectedCard && selectedMonth && (
              <p className="text-xs text-text-muted mt-2">
                Vencimento automático: dia 10 do mês selecionado
              </p>
            )}
          </div>
        )}

        {/* Tipo toggle */}
        {isStandaloneReady && (
          <div className="px-8 pb-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setNewType('despesa'); setNewCat('') }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition-colors duration-150 cursor-pointer ${
                  newType === 'despesa'
                    ? 'bg-primary text-white'
                    : 'bg-offwhite text-text-muted hover:text-text-primary'
                }`}
              >
                Despesa
              </button>
              <button
                type="button"
                onClick={() => { setNewType('receita'); setNewCat('') }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition-colors duration-150 cursor-pointer ${
                  newType === 'receita'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-offwhite text-text-muted hover:text-text-primary'
                }`}
              >
                Receita / Estorno
              </button>
            </div>
          </div>
        )}

        {/* Formulário de adição */}
        {isStandaloneReady && (
          <div className="px-8 pb-4">
            <div className="flex items-end gap-3 mb-3">
              <div className="w-36">
                <label className={labelClass}>DATA DA COMPRA</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex-1">
                <label className={labelClass}>DESCRIÇÃO</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Ex.: Restaurante"
                  className={inputClass}
                />
              </div>
              <div className="w-44">
                <label className={labelClass}>CATEGORIA</label>
                <div className="relative">
                  <select
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    className={`${inputClass} appearance-none pr-8 cursor-pointer`}
                  >
                    <option value="" disabled>Selecione</option>
                    {filteredCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex items-end gap-3">
              <div className="w-36">
                <label className={labelClass}>TIPO</label>
                <div className="relative">
                  <select
                    value={newRecurrence}
                    onChange={(e) => setNewRecurrence(e.target.value)}
                    className={`${inputClass} appearance-none pr-8 cursor-pointer`}
                  >
                    {tipoInvoiceOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
              </div>

              {isParcelado && (
                <div className="w-28">
                  <label className={labelClass}>PARCELAS</label>
                  <input
                    type="number"
                    min="2"
                    max="48"
                    value={newInstallments}
                    onChange={(e) => setNewInstallments(e.target.value)}
                    placeholder="Nº"
                    className={inputClass}
                  />
                </div>
              )}

              <div className={isParcelado ? 'w-36' : 'w-40'}>
                <label className={labelClass}>
                  {isParcelado ? 'VALOR TOTAL' : 'VALOR'}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={newAmount}
                  onChange={handleAmountChange}
                  placeholder="R$ 0,00"
                  className={`${inputClass} tabular-nums`}
                />
              </div>

              {isParcelado && parsedInstallments >= 2 && newAmount && (
                <div className="pb-2 text-xs text-text-muted whitespace-nowrap">
                  {parsedInstallments}x de{' '}
                  <span className="font-semibold text-text-primary">
                    {formatCurrencyBRL(parseCurrencyToNumber(newAmount) / parsedInstallments)}
                  </span>
                </div>
              )}

              <div className="flex-1" />

              <button
                type="button"
                onClick={handleAdd}
                disabled={!canAdd}
                className={`p-2.5 rounded-lg transition-colors duration-150 ${
                  canAdd
                    ? 'bg-primary text-white hover:bg-primary-light cursor-pointer'
                    : 'bg-border text-text-muted cursor-not-allowed'
                }`}
              >
                <Plus size={18} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}

        {/* Tabela de itens (mês atual) */}
        {isStandaloneReady && (
          <div className="px-8 pb-4">
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-offwhite">
                    <th className="text-left text-[11px] font-medium text-text-muted uppercase tracking-wider px-4 py-2.5">
                      DATA
                    </th>
                    <th className="text-left text-[11px] font-medium text-text-muted uppercase tracking-wider px-4 py-2.5">
                      DESCRIÇÃO
                    </th>
                    <th className="text-left text-[11px] font-medium text-text-muted uppercase tracking-wider px-4 py-2.5">
                      CATEGORIA
                    </th>
                    <th className="text-left text-[11px] font-medium text-text-muted uppercase tracking-wider px-4 py-2.5">
                      TIPO
                    </th>
                    <th className="text-right text-[11px] font-medium text-text-muted uppercase tracking-wider px-4 py-2.5">
                      VALOR
                    </th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {currentMonthItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-text-muted">
                        Nenhum item na fatura. Adicione lançamentos acima.
                      </td>
                    </tr>
                  ) : (
                    currentMonthItems.map((item, idx) => {
                      const isRevenue = item.type === 'receita'
                      const isFixed = item.recurrence === 'Fixa' || item.recurrence === 'Fixa/Anual'
                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-offwhite/60 transition-colors duration-100 group ${
                            idx < currentMonthItems.length - 1 ? 'border-b border-border' : ''
                          }`}
                        >
                          <td className="px-4 py-2 text-sm text-text-secondary tabular-nums whitespace-nowrap">
                            {formatDateBR(item.purchaseDate)}
                          </td>
                          <td className="px-4 py-2 text-sm font-medium text-text-primary">
                            <div className="flex items-center gap-1.5">
                              {isFixed && (
                                <Repeat size={12} className="text-primary/50 shrink-0" />
                              )}
                              {item.description}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm text-text-secondary">
                            {getCategoryLabel(item.categoryId)}
                          </td>
                          <td className="px-4 py-2 text-sm text-text-secondary">
                            {getTipoLabel(item.recurrence)}
                          </td>
                          <td className={`px-4 py-2 text-sm font-semibold tabular-nums text-right ${
                            isRevenue ? 'text-value-income' : 'text-value-expense'
                          }`}>
                            {isRevenue ? '+' : ''}{formatCurrencyBRL(item.amount)}
                          </td>
                          <td className="px-2 py-2">
                            <button
                              type="button"
                              onClick={() => handleRemove(item.id)}
                              className="p-1 rounded-lg text-status-overdue-text/40 hover:text-status-overdue-text hover:bg-status-overdue-bg transition-colors duration-150 cursor-pointer opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={14} strokeWidth={2} />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}

                  {/* Total da fatura */}
                  {currentMonthItems.length > 0 && (
                    <tr className="border-t border-border bg-offwhite">
                      <td colSpan={4} className="px-4 py-2.5 text-sm font-semibold text-text-primary">
                        Total da Fatura
                      </td>
                      <td className="px-4 py-2.5 text-sm font-bold tabular-nums text-right text-value-expense">
                        {formatCurrencyBRL(total)}
                      </td>
                      <td />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Parcelas futuras info */}
        {futureItems.length > 0 && (
          <div className="px-8 pb-4">
            <div className="bg-offwhite border border-border rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Parcelas em meses futuros ({futureItems.length})
              </p>
              <div className="space-y-1">
                {futureItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">{item.description}</span>
                    <span className="font-semibold tabular-nums text-text-primary">
                      +{item.monthOffset} {item.monthOffset === 1 ? 'mês' : 'meses'} — {formatCurrencyBRL(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer fixo com SALVAR */}
        <div className="px-8 pb-8 pt-2">
          <div className="flex items-center justify-end pt-5 border-t border-border">
            <button
              type="button"
              onClick={handleSave}
              disabled={!isStandaloneReady}
              className={`
                flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide
                transition-all duration-150
                ${isStandaloneReady
                  ? 'bg-primary text-white hover:bg-primary-light cursor-pointer'
                  : 'bg-border text-text-muted cursor-not-allowed'
                }
              `}
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
