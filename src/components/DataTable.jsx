import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Pencil, Trash2, ListFilter, X, Check, LayoutList, Gauge, TrendingUp, FileText, Link2, AlertTriangle, CornerDownRight, Clock } from 'lucide-react'
import { useWorkspaceData } from '../contexts/WorkspaceContext'
import StatusBadge from './StatusBadge'
import ConfirmDialog from './ConfirmDialog'
import SettlementDialog from './SettlementDialog'
import ExpenseMonitor from './ExpenseMonitor'
import RevenueMonitor from './RevenueMonitor'

const columns = [
  { key: 'description', label: 'Descrição' },
  { key: 'amount', label: 'Valor' },
  { key: 'dueDate', label: 'Vencimento' },
  { key: 'settlementDate', label: 'Efetivação' },
  { key: 'type', label: 'Categoria' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'owner', label: 'Responsável' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Ações' },
]

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const OWNER_ACCOUNTS = {
  lenon: accounts.filter((a) => a.owner === 'lenon').map((a) => a.id),
  berna: accounts.filter((a) => a.owner === 'berna').map((a) => a.id),
}

/* ------------------------------------------------------------------ */
/*  Formatação                                                         */
/* ------------------------------------------------------------------ */

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const SHORT_MONTHS = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
]

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T12:00:00')
  return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

function formatDescription(row) {
  if (row.recurrence !== 'Parcelamento') return row.description
  if (/\(Parcela \d+\/\d+\)/.test(row.description)) return row.description
  const oldFormat = row.description.match(/^(.+?)\s*\((\d+\/\d+)\)$/)
  if (oldFormat) return `${oldFormat[1]} (Parcela ${oldFormat[2]})`
  return row.description
}

/* ------------------------------------------------------------------ */
/*  Filtragem e ordenação                                              */
/* ------------------------------------------------------------------ */

function applyFilters(entries, { year, month, categoryFilter, statusFilter, ownerFilter, tipoFilter }) {
  return entries.filter((entry) => {
    if (!entry.dueDate) return false
    const date = new Date(entry.dueDate + 'T12:00:00')
    if (date.getFullYear() !== year || date.getMonth() !== month) return false

    if (categoryFilter && entry.type !== categoryFilter) return false
    if (statusFilter && entry.status !== statusFilter) return false
    if (tipoFilter && classifyAny(entry) !== tipoFilter) return false

    if (ownerFilter) {
      const ownerAccountIds = OWNER_ACCOUNTS[ownerFilter]
      if (!ownerAccountIds || !ownerAccountIds.includes(entry.accountId)) return false
    }

    return true
  })
}

function getEntryLevel(e) {
  if (!e.rateioId) return 0
  return e.rateioLevel || (e.type === 'Receita' ? 1 : 2)
}

function sortEntries(entries) {
  const rateioMap = new Map()
  const standalone = []

  for (const entry of entries) {
    if (entry.rateioId) {
      if (!rateioMap.has(entry.rateioId)) rateioMap.set(entry.rateioId, [])
      rateioMap.get(entry.rateioId).push(entry)
    } else {
      standalone.push(entry)
    }
  }

  for (const [, group] of rateioMap) {
    group.sort((a, b) => {
      const la = getEntryLevel(a), lb = getEntryLevel(b)
      if (la !== lb) return la - lb
      return (a.description || '').localeCompare(b.description || '')
    })
  }

  const items = []
  for (const e of standalone) {
    items.push({ date: e.dueDate || '', paid: e.status === 'pago', inv: !!e.isInvoice, entries: [e] })
  }
  for (const [, group] of rateioMap) {
    const master = group.find((e) => getEntryLevel(e) === 1) || group[0]
    items.push({ date: master.dueDate || '', paid: master.status === 'pago', inv: false, entries: group })
  }

  items.sort((a, b) => {
    if (a.paid !== b.paid) return a.paid ? 1 : -1
    return a.date.localeCompare(b.date)
  })

  return items.flatMap((i) => i.entries)
}

function getDaysOverdue(dueDateStr) {
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const dueDate = new Date(dueDateStr + 'T12:00:00')
  return Math.floor((today - dueDate) / (1000 * 60 * 60 * 24))
}

/* ------------------------------------------------------------------ */
/*  Checkbox circular de efetivação                                    */
/* ------------------------------------------------------------------ */

function SettlementCheckbox({ isPaid, onSettle, onReverse }) {
  return (
    <button
      type="button"
      onClick={isPaid ? onReverse : onSettle}
      title={isPaid ? 'Estornar efetivação' : 'Dar baixa'}
      className={`
        flex items-center justify-center
        w-[18px] h-[18px] rounded-full border-[1.5px]
        shrink-0 transition-all duration-200 cursor-pointer
        ${
          isPaid
            ? 'border-primary bg-primary hover:bg-primary-light hover:border-primary-light'
            : 'border-text-muted/40 bg-transparent hover:border-primary/60'
        }
      `}
    >
      {isPaid && <Check size={11} strokeWidth={3} className="text-white" />}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Dropdown genérico para filtros de coluna                           */
/* ------------------------------------------------------------------ */

function ColumnFilterDropdown({ label, value, options, onChange, colKey }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const isActive = value !== ''

  return (
    <th
      ref={ref}
      className={`text-left text-[11px] font-medium uppercase tracking-wider px-4 py-2.5 relative ${
        colKey === 'actions' ? 'w-[90px] text-center' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`
          flex items-center gap-1 cursor-pointer transition-colors duration-150
          ${isActive ? 'text-primary' : 'text-text-muted hover:text-text-secondary'}
        `}
      >
        {label}
        <ChevronDown size={12} strokeWidth={2} className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-2 mt-1 z-20 bg-surface border border-border rounded-lg shadow-sm py-1 min-w-[130px]">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`
                w-full text-left px-3 py-2 text-xs transition-colors duration-100 cursor-pointer
                ${value === opt.value
                  ? 'text-primary font-semibold bg-primary/5'
                  : 'text-text-secondary hover:bg-offwhite'
                }
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </th>
  )
}

/* ------------------------------------------------------------------ */
/*  Cabeçalho de coluna ordenável                                      */
/* ------------------------------------------------------------------ */

function SortableColumnHeader({ label, sortKey, activeColumn, direction, onSort }) {
  const isActive = activeColumn === sortKey

  return (
    <th className="text-left text-[11px] font-medium uppercase tracking-wider px-4 py-2.5">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        title={
          isActive
            ? direction === 'asc'
              ? 'Ordenado do mais antigo para o mais recente'
              : 'Ordenado do mais recente para o mais antigo'
            : `Ordenar por ${label.toLowerCase()}`
        }
        className={`
          flex items-center gap-1 cursor-pointer transition-colors duration-150
          ${isActive ? 'text-primary' : 'text-text-muted hover:text-text-secondary'}
        `}
      >
        {label}
        {isActive && (
          direction === 'asc'
            ? <ChevronUp size={12} strokeWidth={2} />
            : <ChevronDown size={12} strokeWidth={2} />
        )}
      </button>
    </th>
  )
}

/* ------------------------------------------------------------------ */
/*  Navegação de mês                                                   */
/* ------------------------------------------------------------------ */

function MonthNavigator({ year, month, onPrev, onNext, onToday, isCurrentMonth }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onPrev}
          className="p-1.5 rounded-lg text-text-muted hover:bg-offwhite hover:text-text-primary transition-colors duration-150 cursor-pointer"
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </button>

        <span className="text-sm font-semibold tracking-wide text-primary min-w-[140px] text-center">
          {MONTH_NAMES[month].toUpperCase()} {year}
        </span>

        <button
          type="button"
          onClick={onNext}
          className="p-1.5 rounded-lg text-text-muted hover:bg-offwhite hover:text-text-primary transition-colors duration-150 cursor-pointer"
        >
          <ChevronRight size={18} strokeWidth={2} />
        </button>
      </div>

      {!isCurrentMonth && (
        <button
          type="button"
          onClick={onToday}
          className="text-xs font-medium text-text-muted hover:text-primary transition-colors duration-150 cursor-pointer"
        >
          Ir para mês atual
        </button>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Abas de responsável (owner tabs)                                   */
/* ------------------------------------------------------------------ */

const ownerTabs = [
  { value: '', label: 'Todos' },
  { value: 'lenon', label: 'Lenon' },
  { value: 'berna', label: 'Berna' },
]

function OwnerTabs({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {ownerTabs.map((tab) => {
        const isActive = value === tab.value
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-medium
              transition-colors duration-150 cursor-pointer
              ${isActive
                ? 'bg-primary text-white'
                : 'text-text-muted hover:bg-offwhite hover:text-text-primary'
              }
            `}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Toggle de visualização                                             */
/* ------------------------------------------------------------------ */

const viewModes = [
  { value: 'geral', label: 'Visão Geral', Icon: LayoutList },
  { value: 'monitor', label: 'Monitor de Despesas', Icon: Gauge },
  { value: 'receitas', label: 'Monitor de Receitas', Icon: TrendingUp },
  { value: 'atrasados', label: 'Atrasados', Icon: AlertTriangle },
]

function ViewToggle({ value, onChange }) {
  return (
    <div className="flex items-center gap-0.5 bg-offwhite rounded-lg p-0.5">
      {viewModes.map(({ value: v, label, Icon }) => {
        const isActive = value === v
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
              transition-all duration-150 cursor-pointer
              ${isActive
                ? 'bg-surface text-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
              }
            `}
          >
            <Icon size={13} strokeWidth={2} />
            {label}
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Barra de filtros ativos                                            */
/* ------------------------------------------------------------------ */

function ActiveFilters({ categoryFilter, statusFilter, ownerFilter, tipoFilter, onClearCategory, onClearStatus, onClearOwner, onClearTipo, onClearAll }) {
  const chips = []

  if (categoryFilter) {
    chips.push({ label: categoryFilter === 'Receita' ? 'Receitas' : 'Despesas', onClear: onClearCategory })
  }
  if (statusFilter) {
    const statusLabels = { pago: 'Pago', pendente: 'Pendente', atrasado: 'Atrasado', aguardando: 'Aguardando' }
    chips.push({ label: statusLabels[statusFilter], onClear: onClearStatus })
  }
  if (tipoFilter) {
    chips.push({ label: tipoFilter, onClear: onClearTipo })
  }
  if (ownerFilter) {
    const ownerLabels = { lenon: 'Lenon', berna: 'Berna' }
    chips.push({ label: ownerLabels[ownerFilter], onClear: onClearOwner })
  }

  if (chips.length === 0) return null

  return (
    <div className="flex items-center gap-2 px-4 pb-3">
      <ListFilter size={13} className="text-text-muted shrink-0" />
      {chips.map((chip) => (
        <span
          key={chip.label}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-offwhite rounded-md text-[11px] font-medium text-text-secondary"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onClear}
            className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <X size={11} strokeWidth={2.5} />
          </button>
        </span>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-[11px] text-text-muted hover:text-primary font-medium transition-colors cursor-pointer ml-1"
        >
          Limpar tudo
        </button>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Células editáveis inline                                           */
/* ------------------------------------------------------------------ */

function parseCurrencyInput(str) {
  return parseFloat(str.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0
}

function InlineEditAmount({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const ref = useRef(null)

  const start = () => {
    setDraft(Math.abs(value).toFixed(2).replace('.', ','))
    setEditing(true)
  }

  useEffect(() => {
    if (editing && ref.current) ref.current.select()
  }, [editing])

  const commit = () => {
    const num = parseCurrencyInput(draft)
    if (num > 0) onSave(num)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={ref}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        className="w-[100px] text-sm tabular-nums bg-offwhite border border-border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary/40"
      />
    )
  }

  return (
    <span
      onDoubleClick={start}
      className="cursor-pointer hover:bg-offwhite rounded px-1 -mx-1 transition-colors"
      title="Clique duas vezes para editar"
    >
      {formatCurrency(value)}
    </span>
  )
}

function InlineEditDate({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const ref = useRef(null)

  const start = () => {
    setDraft(value || '')
    setEditing(true)
  }

  useEffect(() => {
    if (editing && ref.current) ref.current.focus()
  }, [editing])

  const commit = () => {
    onSave(draft)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={ref}
        type="date"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        className="text-sm bg-offwhite border border-border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary/40"
      />
    )
  }

  return (
    <span
      onDoubleClick={start}
      className="cursor-pointer hover:bg-offwhite rounded px-1 -mx-1 transition-colors"
      title="Clique duas vezes para editar"
    >
      {value ? formatDate(value) : '—'}
    </span>
  )
}

function InlineEditSelect({ value, options, onSave }) {
  const [editing, setEditing] = useState(false)
  const ref = useRef(null)
  const committedRef = useRef(false)

  useEffect(() => {
    if (editing && ref.current) {
      committedRef.current = false
      ref.current.focus()
    }
  }, [editing])

  const commit = (val) => {
    committedRef.current = true
    setEditing(false)
    if (val !== value) onSave(val)
  }

  const handleBlur = () => {
    setTimeout(() => {
      if (!committedRef.current) setEditing(false)
    }, 120)
  }

  if (editing) {
    return (
      <select
        ref={ref}
        value={value}
        onChange={(e) => commit(e.target.value)}
        onBlur={handleBlur}
        className="text-sm bg-offwhite border border-primary/30 rounded px-2 py-1 outline-none ring-1 ring-primary/40 cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    )
  }

  const display = options.find((o) => o.value === value)?.label || value || '—'
  return (
    <span
      onClick={() => setEditing(true)}
      className="cursor-pointer hover:bg-primary/5 rounded px-1.5 py-0.5 -mx-1 transition-colors border border-transparent hover:border-border"
      title="Clique para editar"
    >
      {display}
    </span>
  )
}

const ownerInlineOptions = [
  { value: 'lenon', label: 'Lenon' },
  { value: 'berna', label: 'Berna' },
]

const OWNER_ACCOUNT_MAP = {
  lenon: accounts.find((a) => a.owner === 'lenon' && a.type === 'banco')?.id || 'sicoob-lenon',
  berna: accounts.find((a) => a.owner === 'berna' && a.type === 'banco')?.id || 'sicoob-berna',
}

/* ------------------------------------------------------------------ */
/*  Componente principal                                               */
/* ------------------------------------------------------------------ */

const categoryOptions = [
  { value: '', label: 'Ver tudo' },
  { value: 'Receita', label: 'Receitas' },
  { value: 'Despesa', label: 'Despesas' },
]

const statusOptions = [
  { value: '', label: 'Ver tudo' },
  { value: 'pago', label: 'Pago' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'atrasado', label: 'Atrasado' },
  { value: 'aguardando', label: 'Aguardando' },
]

const ownerOptions = [
  { value: '', label: 'Ver tudo' },
  { value: 'lenon', label: 'Lenon' },
  { value: 'berna', label: 'Berna' },
]

function getOwnerLabel(accountId) {
  const account = accounts.find((a) => a.id === accountId)
  if (!account) return '—'
  return account.owner === 'lenon' ? 'Lenon' : 'Berna'
}

const ACCOUNT_SHORT_LABELS = {
  'sicoob-lenon': 'Sicoob — Lenon',
  'cartao-sicoob-lenon': 'Sicoob — Lenon',
  'dinheiro-lenon': 'Dinheiro — Lenon',
  'sicoob-berna': 'Sicoob — Berna',
  'cartao-sicoob-berna': 'Sicoob — Berna',
  'dinheiro-berna': 'Dinheiro — Berna',
  'reserva-emergencia': 'Reserva — Sicoob',
}

function getAccountShortLabel(accountId) {
  return ACCOUNT_SHORT_LABELS[accountId] || '—'
}

function getBaseDescription(desc) {
  if (!desc) return ''
  return desc
    .replace(/\s*—?\s*Parcela\s+\d+\/\d+/gi, '')
    .replace(/\s*\(\s*Parcela\s+\d+\/\d+\s*\)/gi, '')
    .replace(/\s*\(\s*\d+\/\d+\s*\)/gi, '')
    .replace(/\s*—?\s*ref\.\s*\d{2}\/\d{4}/gi, '')
    .replace(/\s*—?\s*(Jan|Fev|Mar|Abr|Mai|Jun|Jul|Ago|Set|Out|Nov|Dez)\/\d{4}/gi, '')
    .replace(/\s*—?\s*\d{4}\s*$/gi, '')
    .replace(/\s*—\s*$/, '')
    .trim()
}

function findRelatedEntries(entry, allEntries) {
  if (entry.recurrence === 'Variável' || !entry.recurrence) return []
  const baseDesc = getBaseDescription(entry.description)
  return allEntries.filter(e =>
    String(e.id) !== String(entry.id) &&
    e.accountId === entry.accountId &&
    e.recurrence === entry.recurrence &&
    getBaseDescription(e.description) === baseDesc
  )
}

function OwnerChangeDialog({ entry, newOwnerKey, relatedEntries, onConfirmSingle, onConfirmAll, onCancel }) {
  const ownerLabel = newOwnerKey === 'lenon' ? 'Lenon' : 'Berna'
  const isRecurring = entry.recurrence === 'Fixa' || entry.recurrence === 'Fixa/Anual' || entry.recurrence === 'Parcelamento'
  const hasRelated = isRecurring && relatedEntries.length > 0
  const totalCount = relatedEntries.length + 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-text-primary mb-2">Trocar responsável</h3>
        <p className="text-sm text-text-secondary mb-5">
          Deseja trocar o responsável deste lançamento para <strong>{ownerLabel}</strong>?
        </p>

        {hasRelated ? (
          <div className="space-y-2">
            <button
              onClick={onConfirmSingle}
              className="w-full text-left px-4 py-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors"
            >
              <span className="text-sm font-medium text-text-primary">Apenas este lançamento</span>
            </button>
            <button
              onClick={onConfirmAll}
              className="w-full text-left px-4 py-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors"
            >
              <span className="text-sm font-medium text-text-primary">Todos os {totalCount} lançamentos desta série</span>
              <span className="block text-xs text-text-muted mt-0.5">{getBaseDescription(entry.description)}</span>
            </button>
            <button
              onClick={onCancel}
              className="w-full text-center px-4 py-2 text-sm text-text-muted hover:text-text-secondary transition-colors mt-1"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-text-muted hover:text-text-secondary rounded-lg border border-border hover:border-border transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirmSingle}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
            >
              Confirmar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DataTable({ entries, onEdit, onDelete, onSettle, onReverseSettle, onInlineUpdate }) {
  const { accounts, classifyEntry, classifyReceita, TIPO_OPTIONS } = useWorkspaceData()
  const CARD_ACCOUNT_IDS = useMemo(() => new Set(accounts.filter((a) => a.type === 'cartao').map((a) => a.id)), [accounts])
  const classifyAny = (entry) => entry.type === 'Receita' ? classifyReceita(entry) : classifyEntry(entry)
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [settleTarget, setSettleTarget] = useState(null)
  const [ownerChangeDialog, setOwnerChangeDialog] = useState(null)

  // Visualização
  const [viewMode, setViewMode] = useState('geral')
  const isMonitor = viewMode === 'monitor'
  const isReceitas = viewMode === 'receitas'
  const isAtrasados = viewMode === 'atrasados'
  const isSpecialView = isMonitor || isReceitas || isAtrasados

  // Filtros
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [ownerFilter, setOwnerFilter] = useState('')
  const [tipoFilter, setTipoFilter] = useState('')

  // Ordenação por coluna de data
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')

  const handleSort = (column) => {
    if (sortColumn !== column) {
      setSortColumn(column)
      setSortDirection('asc')
    } else if (sortDirection === 'asc') {
      setSortDirection('desc')
    } else {
      setSortColumn(null)
      setSortDirection('asc')
    }
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  const handlePrev = () => {
    if (month === 0) {
      setMonth(11)
      setYear((y) => y - 1)
    } else {
      setMonth((m) => m - 1)
    }
  }

  const handleNext = () => {
    if (month === 11) {
      setMonth(0)
      setYear((y) => y + 1)
    } else {
      setMonth((m) => m + 1)
    }
  }

  const handleToday = () => {
    setYear(now.getFullYear())
    setMonth(now.getMonth())
  }

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  const handleConfirmSettle = (entryId, settlementDate) => {
    onSettle(entryId, settlementDate)
    setSettleTarget(null)
  }

  const handleOwnerChangeRequest = (row, newOwnerKey) => {
    const currentOwner = accounts.find((a) => a.id === row.accountId)?.owner
    if (newOwnerKey === currentOwner) return
    const related = findRelatedEntries(row, entries)
    setOwnerChangeDialog({ entry: row, newOwnerKey, relatedEntries: related })
  }

  const applyOwnerChange = (entriesToUpdate, newOwnerKey) => {
    for (const e of entriesToUpdate) {
      const isCard = CARD_ACCOUNT_IDS.has(e.accountId)
      const newAccount = accounts.find((a) => a.owner === newOwnerKey && (isCard ? a.type === 'cartao' : a.type === 'banco'))
      if (newAccount) onInlineUpdate({ ...e, accountId: newAccount.id })
    }
    setOwnerChangeDialog(null)
  }

  const clearAllFilters = () => {
    setCategoryFilter('')
    setStatusFilter('')
    setOwnerFilter('')
    setTipoFilter('')
  }

  // Nos modos monitor, ignora filtros de tipo/status (forçado por tipo)
  const effectiveCategoryFilter = isMonitor ? 'Despesa' : isReceitas ? 'Receita' : categoryFilter
  const effectiveStatusFilter = isSpecialView ? '' : statusFilter

  const filtered = applyFilters(entries, {
    year,
    month,
    categoryFilter: effectiveCategoryFilter,
    statusFilter: effectiveStatusFilter,
    ownerFilter,
    tipoFilter,
  })
  const sorted = sortColumn
    ? [...filtered].sort((a, b) => {
        const dateA = a[sortColumn] || ''
        const dateB = b[sortColumn] || ''
        const cmp = dateA.localeCompare(dateB)
        return sortDirection === 'asc' ? cmp : -cmp
      })
    : sortEntries(filtered)
  const hasActiveFilters = categoryFilter || statusFilter || ownerFilter || tipoFilter

  const overdueEntries = isAtrasados
    ? entries
        .filter((entry) => {
          if (!entry.dueDate) return false
          if (entry.status === 'pago') return false
          if (entry.isInvoice) return false
          const todayStr = new Date().toISOString().slice(0, 10)
          if (entry.dueDate >= todayStr) return false
          if (categoryFilter && entry.type !== categoryFilter) return false
          if (statusFilter && entry.status !== statusFilter) return false
          if (tipoFilter && classifyAny(entry) !== tipoFilter) return false
          if (ownerFilter) {
            const ownerAccountIds = OWNER_ACCOUNTS[ownerFilter]
            if (!ownerAccountIds || !ownerAccountIds.includes(entry.accountId)) return false
          }
          return true
        })
        .sort((a, b) => {
          if (sortColumn) {
            const dateA = a[sortColumn] || ''
            const dateB = b[sortColumn] || ''
            const cmp = dateA.localeCompare(dateB)
            return sortDirection === 'asc' ? cmp : -cmp
          }
          return a.dueDate.localeCompare(b.dueDate)
        })
    : []

  return (
    <>
      {/* Barra de visualização */}
      <div className="flex items-center justify-end mb-3">
        <ViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      {/* Navegador de mês (compartilhado entre visões baseadas em mês) */}
      {!isAtrasados && (
      <div className="bg-surface rounded-xl border border-border overflow-x-auto mb-0">
        <MonthNavigator
          year={year}
          month={month}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          isCurrentMonth={isCurrentMonth}
        />

        {/* Chips de filtros ativos — apenas na visão geral */}
        {!isSpecialView && (
          <ActiveFilters
            categoryFilter={categoryFilter}
            statusFilter={statusFilter}
            ownerFilter={ownerFilter}
            tipoFilter={tipoFilter}
            onClearCategory={() => setCategoryFilter('')}
            onClearStatus={() => setStatusFilter('')}
            onClearOwner={() => setOwnerFilter('')}
            onClearTipo={() => setTipoFilter('')}
            onClearAll={clearAllFilters}
          />
        )}

        {/* ── Visão Geral (tabela normal dentro do card) ── */}
        {!isSpecialView && (
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-t border-b border-border">
                <th className="text-left text-[11px] font-medium text-text-muted uppercase tracking-wider px-4 py-2.5">
                  DESCRIÇÃO
                </th>
                <th className="text-left text-[11px] font-medium text-text-muted uppercase tracking-wider px-4 py-2.5">
                  VALOR
                </th>
                <SortableColumnHeader
                  label="VENCIMENTO"
                  sortKey="dueDate"
                  activeColumn={sortColumn}
                  direction={sortDirection}
                  onSort={handleSort}
                />
                <SortableColumnHeader
                  label="EFETIVAÇÃO"
                  sortKey="settlementDate"
                  activeColumn={sortColumn}
                  direction={sortDirection}
                  onSort={handleSort}
                />
                <ColumnFilterDropdown
                  label="CATEGORIA"
                  value={categoryFilter}
                  options={categoryOptions}
                  onChange={setCategoryFilter}
                  colKey="category"
                />
                <ColumnFilterDropdown
                  label="TIPO"
                  value={tipoFilter}
                  options={TIPO_OPTIONS}
                  onChange={setTipoFilter}
                  colKey="tipo"
                />
                <ColumnFilterDropdown
                  label="RESPONSÁVEL"
                  value={ownerFilter}
                  options={ownerOptions}
                  onChange={setOwnerFilter}
                  colKey="owner"
                />
                <ColumnFilterDropdown
                  label="STATUS"
                  value={statusFilter}
                  options={statusOptions}
                  onChange={setStatusFilter}
                  colKey="status"
                />
                <th className="text-left text-[11px] font-medium text-text-muted uppercase tracking-wider px-4 py-2.5 w-[90px] text-center">
                  AÇÕES
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-10 text-center text-sm text-text-muted"
                  >
                    {hasActiveFilters
                      ? 'Nenhuma conta encontrada com os filtros aplicados.'
                      : 'Nenhuma conta neste período.'}
                  </td>
                </tr>
              ) : (
                sorted.map((row, index) => {
                  const isPaid = row.status === 'pago'
                  const isCardRow = row.isInvoice || CARD_ACCOUNT_IDS.has(row.accountId)
                  const isInvoice = !!row.isInvoice
                  const isRateio = !!row.rateioId
                  const rLevel = getEntryLevel(row)
                  const isN2 = isRateio && rLevel === 2
                  const isN1 = isRateio && rLevel === 1
                  const isAguardando = row.status === 'aguardando'

                  return (
                    <tr
                      key={row.id}
                      className={`
                        transition-all duration-300 ease-in-out
                        group
                        ${isCardRow
                          ? 'bg-[#D6EDE6] hover:bg-[#C2E4DA]'
                          : isN1
                            ? 'bg-amber-50/40 hover:bg-amber-50/70'
                            : isN2
                              ? 'bg-amber-50/15 hover:bg-amber-50/35'
                              : 'hover:bg-offwhite'
                        }
                        ${index < sorted.length - 1 ? 'border-b border-border' : ''}
                      `}
                    >
                      <td className={`px-4 ${isN2 ? 'py-2' : 'py-2.5'}`}>
                        <div className={`flex items-center gap-2.5 ${isN2 ? 'pl-7' : ''}`}>
                          {isN2 && (
                            <CornerDownRight size={12} strokeWidth={1.8} className="text-amber-400/50 shrink-0 -ml-1" />
                          )}
                          {isAguardando ? (
                            <Clock size={isN2 ? 13 : 14} strokeWidth={1.8} className="text-amber-500/50 shrink-0" title="Aguardando efetivação da receita" />
                          ) : !isInvoice ? (
                            <SettlementCheckbox
                              isPaid={isPaid}
                              onSettle={() => setSettleTarget(row)}
                              onReverse={() => onReverseSettle(row.id)}
                            />
                          ) : (
                            <FileText size={16} strokeWidth={2} className="text-[#00695C] shrink-0" />
                          )}
                          {isN1 && (
                            <Link2 size={14} strokeWidth={2} className="text-amber-500/60 shrink-0" />
                          )}
                          <span
                            className={`transition-all duration-300 ${
                              isN2
                                ? 'text-[13px] text-text-secondary/75 font-normal'
                                : isPaid
                                  ? 'text-sm font-medium text-text-muted line-through decoration-text-muted/40'
                                  : isAguardando
                                    ? 'text-sm font-medium text-text-muted/80'
                                    : isInvoice
                                      ? 'text-sm font-semibold text-[#00574B]'
                                      : 'text-sm font-medium text-text-primary'
                            }`}
                          >
                            {formatDescription(row)}
                          </span>
                          {row._isEstimativa && (
                            <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                              Estimativa
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        className={`px-4 ${isN2 ? 'py-2' : 'py-2.5'} tabular-nums whitespace-nowrap transition-all duration-300 ${
                          isPaid
                            ? 'text-sm font-semibold text-text-muted line-through decoration-text-muted/40'
                            : row.amount === 0
                              ? 'text-sm font-semibold text-text-muted'
                              : row.type === 'Receita'
                                ? 'text-sm font-semibold text-value-income'
                                : 'text-sm font-semibold text-value-expense'
                        }`}
                      >
                        {isInvoice ? formatCurrency(row.amount) : (
                          <InlineEditAmount
                            value={row.amount}
                            onSave={(abs) => {
                              const newAmount = row.type === 'Despesa' ? -abs : abs
                              onInlineUpdate({ ...row, amount: newAmount })
                            }}
                          />
                        )}
                      </td>
                      <td className={`px-4 ${isN2 ? 'py-2 text-[13px] text-text-muted/70' : 'py-2.5 text-sm'} whitespace-nowrap transition-colors duration-300 ${
                        !isN2 && (isPaid ? 'text-text-muted' : 'text-text-secondary')
                      }`}>
                        {isInvoice ? formatDate(row.dueDate) : (
                          <InlineEditDate
                            value={row.dueDate}
                            onSave={(d) => onInlineUpdate({ ...row, dueDate: d })}
                          />
                        )}
                      </td>
                      <td className={`px-4 ${isN2 ? 'py-2 text-[13px] text-text-muted/70' : 'py-2.5 text-sm'} whitespace-nowrap transition-colors duration-300 ${
                        !isN2 && (isPaid ? 'text-text-secondary' : 'text-text-muted')
                      }`}>
                        {isInvoice ? (row.settlementDate ? formatDate(row.settlementDate) : '—') : (
                          <InlineEditDate
                            value={row.settlementDate}
                            onSave={(d) => {
                              const updates = { ...row, settlementDate: d }
                              if (d && row.status !== 'pago') updates.status = 'pago'
                              if (!d && row.status === 'pago') updates.status = 'pendente'
                              onInlineUpdate(updates)
                            }}
                          />
                        )}
                      </td>
                      <td className={`px-4 ${isN2 ? 'py-2 text-[13px] text-text-muted/70' : 'py-2.5 text-sm'} transition-colors duration-300 ${
                        !isN2 && (isPaid ? 'text-text-muted' : 'text-text-secondary')
                      }`}>
                        {row.type}
                      </td>
                      <td className={`px-4 ${isN2 ? 'py-2 text-[13px] text-text-muted/70' : 'py-2.5 text-sm'} transition-colors duration-300 ${
                        !isN2 && (isPaid ? 'text-text-muted' : 'text-text-secondary')
                      }`}>
                        {classifyAny(row)}
                      </td>
                      <td className={`px-4 ${isN2 ? 'py-2 text-[13px] text-text-muted/70' : 'py-2.5 text-sm'} transition-colors duration-300 ${
                        !isN2 && (isPaid ? 'text-text-muted' : 'text-text-secondary')
                      }`}>
                        {isInvoice ? getOwnerLabel(row.accountId) : (
                          <InlineEditSelect
                            value={accounts.find((a) => a.id === row.accountId)?.owner || 'lenon'}
                            options={ownerInlineOptions}
                            onSave={(ownerKey) => handleOwnerChangeRequest(row, ownerKey)}
                          />
                        )}
                      </td>
                      <td className={`px-4 ${isN2 ? 'py-2' : 'py-2.5'}`}>
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          {isInvoice ? (
                            <button
                              type="button"
                              onClick={() => onEdit(row)}
                              title="Ver fatura"
                              className="
                                p-1.5 rounded-lg
                                text-[#00695C] hover:text-[#004D40] hover:bg-[#C2E4DA]
                                transition-colors duration-150 cursor-pointer
                              "
                            >
                              <FileText size={15} strokeWidth={2} />
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => onEdit(row)}
                                title="Editar"
                                className="
                                  p-1.5 rounded-lg
                                  text-primary/70 hover:text-primary hover:bg-primary/5
                                  transition-colors duration-150 cursor-pointer
                                "
                              >
                                <Pencil size={15} strokeWidth={2} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(row)}
                                title="Excluir"
                                className="
                                  p-1.5 rounded-lg
                                  text-status-overdue-text/60 hover:text-status-overdue-text hover:bg-status-overdue-bg
                                  transition-colors duration-150 cursor-pointer
                                "
                              >
                                <Trash2 size={15} strokeWidth={2} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </div>
      )}

      {/* ── Atrasados (todos os vencidos não pagos, layout idêntico à Visão Geral + dias em atraso) ── */}
      {isAtrasados && (
        <div className="bg-surface rounded-xl border border-border overflow-x-auto">
          <ActiveFilters
            categoryFilter={categoryFilter}
            statusFilter={statusFilter}
            ownerFilter={ownerFilter}
            tipoFilter={tipoFilter}
            onClearCategory={() => setCategoryFilter('')}
            onClearStatus={() => setStatusFilter('')}
            onClearOwner={() => setOwnerFilter('')}
            onClearTipo={() => setTipoFilter('')}
            onClearAll={clearAllFilters}
          />

          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-t border-b border-border">
                <th className="text-left text-[11px] font-medium text-text-muted uppercase tracking-wider px-4 py-2.5">
                  DESCRIÇÃO
                </th>
                <th className="text-left text-[11px] font-medium text-text-muted uppercase tracking-wider px-4 py-2.5 whitespace-nowrap">
                  VALOR
                </th>
                <SortableColumnHeader
                  label="VENCIMENTO"
                  sortKey="dueDate"
                  activeColumn={sortColumn}
                  direction={sortDirection}
                  onSort={handleSort}
                />
                <th className="text-left text-[11px] font-medium text-text-muted uppercase tracking-wider px-4 py-2.5 whitespace-nowrap">
                  DIAS EM ATRASO
                </th>
                <ColumnFilterDropdown
                  label="CATEGORIA"
                  value={categoryFilter}
                  options={categoryOptions}
                  onChange={setCategoryFilter}
                  colKey="category"
                />
                <ColumnFilterDropdown
                  label="TIPO"
                  value={tipoFilter}
                  options={TIPO_OPTIONS}
                  onChange={setTipoFilter}
                  colKey="tipo"
                />
                <ColumnFilterDropdown
                  label="RESPONSÁVEL"
                  value={ownerFilter}
                  options={ownerOptions}
                  onChange={setOwnerFilter}
                  colKey="owner"
                />
                <ColumnFilterDropdown
                  label="STATUS"
                  value={statusFilter}
                  options={statusOptions}
                  onChange={setStatusFilter}
                  colKey="status"
                />
                <th className="text-left text-[11px] font-medium text-text-muted uppercase tracking-wider px-4 py-2.5 w-[90px] text-center">
                  AÇÕES
                </th>
              </tr>
            </thead>
            <tbody>
              {overdueEntries.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-sm text-text-muted"
                  >
                    {hasActiveFilters
                      ? 'Nenhuma conta encontrada com os filtros aplicados.'
                      : 'Nenhuma conta vencida encontrada.'}
                  </td>
                </tr>
              ) : (
                overdueEntries.map((row, index) => {
                  const isCardRow = row.isInvoice || CARD_ACCOUNT_IDS.has(row.accountId)
                  const isInvoice = !!row.isInvoice
                  const isRateio = !!row.rateioId
                  const daysOverdue = getDaysOverdue(row.dueDate)

                  return (
                    <tr
                      key={row.id}
                      className={`
                        transition-all duration-300 ease-in-out
                        group
                        ${isCardRow
                          ? 'bg-[#D6EDE6] hover:bg-[#C2E4DA]'
                          : 'hover:bg-offwhite'
                        }
                        ${index < overdueEntries.length - 1 ? 'border-b border-border' : ''}
                      `}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <SettlementCheckbox
                            isPaid={false}
                            onSettle={() => setSettleTarget(row)}
                            onReverse={() => {}}
                          />
                          {isRateio && !isInvoice && (
                            <Link2 size={14} strokeWidth={2} className="text-amber-500/60 shrink-0" />
                          )}
                          <span className={`text-sm font-medium ${isInvoice ? 'text-[#00574B] font-semibold' : 'text-text-primary'}`}>
                            {formatDescription(row)}
                          </span>
                        </div>
                      </td>
                      <td className={`px-4 py-2.5 text-sm font-semibold tabular-nums whitespace-nowrap ${
                        row.amount === 0
                          ? 'text-text-muted'
                          : row.type === 'Receita'
                            ? 'text-value-income'
                            : 'text-value-expense'
                      }`}>
                        <InlineEditAmount
                          value={row.amount}
                          onSave={(abs) => {
                            const newAmount = row.type === 'Despesa' ? -abs : abs
                            onInlineUpdate({ ...row, amount: newAmount })
                          }}
                        />
                      </td>
                      <td className="px-4 py-2.5 text-sm text-text-secondary whitespace-nowrap">
                        <InlineEditDate
                          value={row.dueDate}
                          onSave={(d) => onInlineUpdate({ ...row, dueDate: d })}
                        />
                      </td>
                      <td className="px-4 py-2.5 text-sm font-semibold text-status-overdue-text tabular-nums whitespace-nowrap">
                        {daysOverdue} {daysOverdue === 1 ? 'dia' : 'dias'}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-text-secondary">
                        {row.type}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-text-secondary">
                        {classifyAny(row)}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-text-secondary">
                        <InlineEditSelect
                          value={accounts.find((a) => a.id === row.accountId)?.owner || 'lenon'}
                          options={ownerInlineOptions}
                          onSave={(ownerKey) => handleOwnerChangeRequest(row, ownerKey)}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          {isInvoice ? (
                            <button
                              type="button"
                              onClick={() => onEdit(row)}
                              title="Ver fatura"
                              className="
                                p-1.5 rounded-lg
                                text-[#00695C] hover:text-[#004D40] hover:bg-[#C2E4DA]
                                transition-colors duration-150 cursor-pointer
                              "
                            >
                              <FileText size={15} strokeWidth={2} />
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => onEdit(row)}
                                title="Editar"
                                className="
                                  p-1.5 rounded-lg
                                  text-primary/70 hover:text-primary hover:bg-primary/5
                                  transition-colors duration-150 cursor-pointer
                                "
                              >
                                <Pencil size={15} strokeWidth={2} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(row)}
                                title="Excluir"
                                className="
                                  p-1.5 rounded-lg
                                  text-status-overdue-text/60 hover:text-status-overdue-text hover:bg-status-overdue-bg
                                  transition-colors duration-150 cursor-pointer
                                "
                              >
                                <Trash2 size={15} strokeWidth={2} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Monitor de Despesas (3 colunas, fora do card) ── */}
      {isMonitor && (
        <div className="mt-4">
          <ExpenseMonitor
            expenses={filtered}
            onSettle={(row) => setSettleTarget(row)}
            onReverse={(id) => onReverseSettle(id)}
          />
        </div>
      )}

      {/* ── Monitor de Receitas (3 colunas por captador, fora do card) ── */}
      {isReceitas && (
        <div className="mt-4">
          <RevenueMonitor
            revenues={filtered}
            onSettle={(row) => setSettleTarget(row)}
            onReverse={(id) => onReverseSettle(id)}
          />
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Deseja excluir esta conta?"
        message={
          deleteTarget
            ? `"${formatDescription(deleteTarget)}" será removido permanentemente.`
            : ''
        }
      />

      {/* Modal de efetivação (baixa) */}
      <SettlementDialog
        isOpen={settleTarget !== null}
        onClose={() => setSettleTarget(null)}
        onConfirm={handleConfirmSettle}
        entry={settleTarget}
      />

      {ownerChangeDialog && (
        <OwnerChangeDialog
          entry={ownerChangeDialog.entry}
          newOwnerKey={ownerChangeDialog.newOwnerKey}
          relatedEntries={ownerChangeDialog.relatedEntries}
          onConfirmSingle={() => applyOwnerChange([ownerChangeDialog.entry], ownerChangeDialog.newOwnerKey)}
          onConfirmAll={() => applyOwnerChange([ownerChangeDialog.entry, ...ownerChangeDialog.relatedEntries], ownerChangeDialog.newOwnerKey)}
          onCancel={() => setOwnerChangeDialog(null)}
        />
      )}
    </>
  )
}
