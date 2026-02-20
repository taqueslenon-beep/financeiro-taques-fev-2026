import { useState, useEffect } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { useWorkspaceData, useWorkspace } from '../contexts/WorkspaceContext'
import { tipoOptions as defaultTipoOptions } from '../data/categories'

/* ------------------------------------------------------------------ */
/*  Constantes                                                         */
/* ------------------------------------------------------------------ */

const INITIAL_STATE = {
  accountId: '',
  recurrence: '',
  forecastFrequency: '',
  forecastStartMonth: '',
  categoryId: '',
  captador: '',
  description: '',
  amount: '',
  status: '',
  dueDate: '',
  settlementDate: '',
  isInstallment: false,
  owner: '',
}

const INITIAL_INSTALLMENT = {
  installmentAmount: '',
  totalInstallments: '',
  firstDueDate: '',
}

const captadorOptions = [
  { id: 'lenon', label: 'Lenon' },
  { id: 'gilberto', label: 'Gilberto' },
  { id: 'berna', label: 'Berna' },
]

const statusOptions = [
  { id: 'pago', label: 'Pago' },
  { id: 'pendente', label: 'Pendente' },
  { id: 'atrasado', label: 'Atrasado' },
]

const ownerOptions = [
  { id: 'lenon', label: 'Lenon' },
  { id: 'berna', label: 'Berna' },
]

const forecastFrequencyOptions = [
  { id: 'semanal', label: 'Semanal' },
  { id: 'mensal', label: 'Mensal' },
  { id: 'anual', label: 'Anual' },
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrencyBRL(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDateBR(dateStr) {
  if (!dateStr) return ''
  return new Intl.DateTimeFormat('pt-BR').format(new Date(dateStr + 'T12:00:00'))
}

function parseCurrencyToNumber(formatted) {
  if (!formatted) return 0
  return parseFloat(formatted.replace(/[R$\s.]/g, '').replace(',', '.')) || 0
}

function capitalizeFirst(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''
}

function formatRecurrenceLabel(recurrenceId) {
  const map = {
    fixa: 'Fixa',
    previsao: 'Previsão',
    variavel: 'Variável',
    parcelamento: 'Parcelamento',
  }
  return map[recurrenceId] || capitalizeFirst(recurrenceId)
}

/* ------------------------------------------------------------------ */
/*  Micro-componentes de campo (compactos)                             */
/* ------------------------------------------------------------------ */

const selectCls =
  'w-full appearance-none bg-white border border-border rounded-md px-2.5 py-[7px] pr-8 text-[13px] text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-150 cursor-pointer'

const inputCls =
  'w-full bg-white border border-border rounded-md px-2.5 py-[7px] text-[13px] text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-150'

const labelCls = 'block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1'

function Select({ label, value, onChange, placeholder, children, className = '' }) {
  return (
    <div className={className}>
      {label && <label className={labelCls}>{label}</label>}
      <div className="relative">
        <select value={value} onChange={onChange} className={selectCls}>
          <option value="" disabled>{placeholder}</option>
          {children}
        </select>
        <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted/60 pointer-events-none" />
      </div>
    </div>
  )
}

function Input({ label, hint, className = '', ...rest }) {
  return (
    <div className={className}>
      {label && <label className={labelCls}>{label}</label>}
      <input className={inputCls} {...rest} />
      {hint && <p className="text-[10px] text-text-muted mt-0.5">{hint}</p>}
    </div>
  )
}

function MiniSelect({ value, onChange, children }) {
  return (
    <div className="relative">
      <select value={value} onChange={onChange}
        className="w-full appearance-none bg-white border border-border rounded-md px-2 py-1 pr-6 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-150 cursor-pointer"
      >
        {children}
      </select>
      <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-text-muted/60 pointer-events-none" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Sub-aba lateral                                                    */
/* ------------------------------------------------------------------ */

function SideTab({ label, active, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full text-left px-3.5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider
        transition-all duration-150 whitespace-nowrap
        ${disabled
          ? 'text-text-muted/30 cursor-not-allowed'
          : active
            ? 'bg-primary text-white cursor-pointer'
            : 'text-text-muted hover:bg-offwhite hover:text-text-primary cursor-pointer'
        }
      `}
    >
      {label}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  ABA: GERAL                                                         */
/* ------------------------------------------------------------------ */

function TabGeral({ form, setField, entryType }) {
  const isDespesa = entryType === 'despesa'
  const isReceita = entryType === 'receita'
  const dueDateHint = isDespesa && form.recurrence === 'previsao'
    ? 'Opcional para lançamentos de previsão.'
    : ''

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '')
    if (raw === '') { setField('amount', ''); return }
    setField('amount', formatCurrencyBRL((parseInt(raw, 10) / 100).toFixed(2)))
  }

  const settlementLabel = isReceita ? 'Data do recebimento' : 'Data do pagamento'

  return (
    <div className="space-y-4">
      {/* DESCRIÇÃO — campo principal no topo */}
      <Input
        label="Descrição"
        placeholder="Ex.: Honorários do processo #1042"
        value={form.description}
        onChange={(e) => setField('description', e.target.value)}
      />

      {/* Linha: Valor + Responsável */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Valor</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="R$ 0,00"
            value={form.amount}
            onChange={handleAmountChange}
            className={`${inputCls} !bg-offwhite font-semibold tabular-nums`}
          />
        </div>
        <Select
          label="Responsável"
          value={form.owner}
          onChange={(e) => setField('owner', e.target.value)}
          placeholder="Selecione"
        >
          {ownerOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </Select>
      </div>

      {/* Linha: Vencimento + Efetivação + Status */}
      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Data de vencimento"
          type="date"
          value={form.dueDate}
          onChange={(e) => setField('dueDate', e.target.value)}
          hint={dueDateHint}
        />
        <Input
          label={settlementLabel}
          type="date"
          value={form.settlementDate}
          onChange={(e) => setField('settlementDate', e.target.value)}
        />
        <Select
          label="Status"
          value={form.status}
          onChange={(e) => setField('status', e.target.value)}
          placeholder="Selecione"
        >
          {statusOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </Select>
      </div>

      {/* Dica da efetivação */}
      <p className="text-[10px] text-text-muted -mt-2">
        Efetivação é opcional — preencha apenas quando a conta for efetivada.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  ABA: CLASSIFICAÇÃO                                                 */
/* ------------------------------------------------------------------ */

function TabClassificacao({ form, setField, currentUser, entryType, isEditing }) {
  const { getCategoriesByType, getGroupedAccountsForUser, tipoOptions: workspaceTipoOptions } = useWorkspaceData()
  const recurrenceOptions = Array.isArray(workspaceTipoOptions) && workspaceTipoOptions.length > 0
    ? workspaceTipoOptions
    : defaultTipoOptions
  const isDespesa = entryType === 'despesa'
  const isReceita = entryType === 'receita'
  const availableCategories = getCategoriesByType(entryType)
  const groupedAccounts = getGroupedAccountsForUser(currentUser)

  return (
    <div className="space-y-4">
      {/* Conta de movimentação */}
      <Select
        label="Conta de movimentação"
        value={form.accountId}
        onChange={(e) => setField('accountId', e.target.value)}
        placeholder="Selecione uma conta"
      >
        {groupedAccounts.map((group) => (
          <optgroup key={group.groupLabel} label={group.groupLabel}>
            {group.accounts
              .filter((acc) => acc.type !== 'cartao')
              .map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.label}</option>
              ))}
          </optgroup>
        ))}
      </Select>

      {/* Linha: Categoria + Tipo (despesa) OU Categoria + Captador (receita) */}
      {isDespesa && (
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Categoria"
            value={form.categoryId}
            onChange={(e) => setField('categoryId', e.target.value)}
            placeholder="Selecione"
          >
            {availableCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </Select>
          <div>
            <label className={labelCls}>Tipo</label>
            <div className="flex gap-1.5">
              {recurrenceOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setField('recurrence', opt.id)
                    if (opt.id === 'previsao' && !form.forecastFrequency) setField('forecastFrequency', 'mensal')
                    if (opt.id !== 'previsao' && form.forecastFrequency) setField('forecastFrequency', '')
                  }}
                  className={`
                    flex-1 py-[7px] rounded-md text-[13px] font-medium border
                    transition-all duration-150 cursor-pointer
                    ${form.recurrence === opt.id
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-white text-text-muted hover:border-text-muted/40'
                    }
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {isDespesa && form.recurrence === 'previsao' && (
        <Select
          label="Frequência da previsão"
          value={form.forecastFrequency}
          onChange={(e) => setField('forecastFrequency', e.target.value)}
          placeholder="Selecione a frequência"
        >
          {forecastFrequencyOptions.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
        </Select>
      )}

      {isReceita && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Categoria"
              value={form.categoryId}
              onChange={(e) => setField('categoryId', e.target.value)}
              placeholder="Selecione"
            >
              {availableCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </Select>
            <Select
              label="Captador"
              value={form.captador}
              onChange={(e) => setField('captador', e.target.value)}
              placeholder="Selecione o captador"
            >
              {captadorOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </Select>
          </div>
        </>
      )}

      {/* Checkbox parcelamento — oculto em edição */}
      {!isEditing && (
        <label className="flex items-center gap-2.5 cursor-pointer group mt-2">
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              checked={form.isInstallment}
              onChange={(e) => setField('isInstallment', e.target.checked)}
              className="peer sr-only"
            />
            <div className="
              w-[18px] h-[18px] rounded border-[1.5px] border-border
              peer-checked:border-primary peer-checked:bg-primary
              transition-all duration-150 flex items-center justify-center
            ">
              {form.isInstallment && (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-[13px] text-text-secondary group-hover:text-text-primary transition-colors">
            Esta conta é parcelada?
          </span>
        </label>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  ABA: PARCELAMENTO                                                  */
/* ------------------------------------------------------------------ */

function TabParcelamento({ form, installmentForm, setInstallmentField, installments, setInstallments, entryType }) {
  const isReceita = entryType === 'receita'

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '')
    if (raw === '') { setInstallmentField('installmentAmount', ''); return }
    setInstallmentField('installmentAmount', formatCurrencyBRL((parseInt(raw, 10) / 100).toFixed(2)))
  }

  const canGenerate =
    installmentForm.installmentAmount !== '' &&
    installmentForm.totalInstallments !== '' &&
    parseInt(installmentForm.totalInstallments, 10) > 0 &&
    installmentForm.firstDueDate !== ''

  const handleGenerate = () => {
    if (!canGenerate) return
    const total = parseInt(installmentForm.totalInstallments, 10)
    const baseDate = new Date(installmentForm.firstDueDate + 'T12:00:00')

    const generated = Array.from({ length: total }, (_, i) => {
      const date = new Date(baseDate)
      date.setMonth(date.getMonth() + i)
      return {
        index: i,
        label: `${i + 1}/${total}`,
        dueDate: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        amount: installmentForm.installmentAmount,
        status: 'pendente',
      }
    })
    setInstallments(generated)
  }

  const updateInstallment = (index, key, value) => {
    setInstallments((prev) => prev.map((r) => (r.index === index ? { ...r, [key]: value } : r)))
  }

  const handleRowAmountChange = (index, rawValue) => {
    const raw = rawValue.replace(/\D/g, '')
    if (raw === '') { updateInstallment(index, 'amount', ''); return }
    updateInstallment(index, 'amount', formatCurrencyBRL((parseInt(raw, 10) / 100).toFixed(2)))
  }

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="bg-white rounded-md px-3 py-2 border border-border">
        <p className="text-xs text-text-muted">
          <span className="font-medium text-text-secondary">{form.description || 'Sem descrição'}</span>
          {' — '}Parcelamento de {isReceita ? 'receita' : 'despesa'}
        </p>
      </div>

      {/* Campos de configuração */}
      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Valor da parcela"
          placeholder="R$ 0,00"
          value={installmentForm.installmentAmount}
          onChange={handleAmountChange}
          inputMode="numeric"
        />
        <Input
          label="Nº de parcelas"
          type="number"
          placeholder="12"
          value={installmentForm.totalInstallments}
          onChange={(e) => setInstallmentField('totalInstallments', e.target.value)}
          min="1"
          max="120"
        />
        <Input
          label={isReceita ? 'Receb. da 1ª parcela' : 'Venc. da 1ª parcela'}
          type="date"
          value={installmentForm.firstDueDate}
          onChange={(e) => setInstallmentField('firstDueDate', e.target.value)}
        />
      </div>

      {/* Botão gerar */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={!canGenerate}
        className={`
          w-full py-2 rounded-md text-[13px] font-bold uppercase tracking-wide border
          transition-all duration-150
          ${canGenerate
            ? 'border-primary text-primary hover:bg-primary/5 cursor-pointer'
            : 'border-border text-text-muted cursor-not-allowed'
          }
        `}
      >
        Gerar Parcelas
      </button>

      {/* Tabela de parcelas */}
      {installments.length > 0 && (
        <div className="border border-border rounded-md overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-offwhite">
                <th className="text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider px-2.5 py-1.5">PARCELA</th>
                <th className="text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider px-2.5 py-1.5">{isReceita ? 'RECEBIMENTO' : 'VENCIMENTO'}</th>
                <th className="text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider px-2.5 py-1.5">VALOR</th>
                <th className="text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider px-2.5 py-1.5">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {installments.map((row, idx) => (
                <tr key={row.index} className={idx < installments.length - 1 ? 'border-b border-border' : ''}>
                  <td className="px-2.5 py-1.5 text-xs font-medium text-text-secondary tabular-nums">{row.label}</td>
                  <td className="px-2.5 py-1.5 text-xs text-text-secondary tabular-nums">{formatDateBR(row.dueDate)}</td>
                  <td className="px-2.5 py-1.5">
                    <input
                      type="text" inputMode="numeric" value={row.amount}
                      onChange={(e) => handleRowAmountChange(row.index, e.target.value)}
                      className="w-full bg-white border border-border rounded-md px-2 py-1 text-xs text-text-primary tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-150"
                    />
                  </td>
                  <td className="px-2.5 py-1.5">
                    <MiniSelect value={row.status} onChange={(e) => updateInstallment(row.index, 'status', e.target.value)}>
                      {statusOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </MiniSelect>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  MODAL PRINCIPAL — Widescreen horizontal                            */
/* ------------------------------------------------------------------ */

export default function Modal({ isOpen, onClose, onSave, currentUser, editingEntry = null, entryType = 'despesa' }) {
  const { workspaceId } = useWorkspace()
  const isPersonalWorkspace = workspaceId === 'pessoal'
  const [form, setForm] = useState(INITIAL_STATE)
  const [installmentForm, setInstallmentForm] = useState(INITIAL_INSTALLMENT)
  const [installments, setInstallments] = useState([])
  const [activeTab, setActiveTab] = useState('geral')

  const isEditing = editingEntry !== null
  const type = isEditing ? (editingEntry.type?.toLowerCase() || entryType) : entryType
  const isDespesa = type === 'despesa'
  const isReceita = type === 'receita'

  useEffect(() => {
    if (isOpen) {
      setInstallmentForm(INITIAL_INSTALLMENT)
      setInstallments([])
      setActiveTab('geral')

      if (editingEntry) {
        const absAmount = Math.abs(editingEntry.amount)
        setForm({
          accountId: editingEntry.accountId || '',
          recurrence: editingEntry.recurrence === 'Fixa' || editingEntry.recurrence === 'Fixa/Anual' ? 'fixa' : editingEntry.recurrence === 'Variável' ? 'variavel' : editingEntry.recurrence === 'Parcelamento' ? 'parcelamento' : editingEntry.recurrence === 'Previsao' || editingEntry.recurrence === 'Previsão' ? 'previsao' : '',
          forecastFrequency: editingEntry.forecastFrequency || '',
          forecastStartMonth: editingEntry.forecastStartMonth || '',
          categoryId: editingEntry.categoryId || '',
          captador: editingEntry.captador || '',
          description: editingEntry.description || '',
          amount: absAmount ? formatCurrencyBRL(absAmount.toFixed(2)) : '',
          status: editingEntry.status || '',
          dueDate: editingEntry.dueDate || '',
          settlementDate: editingEntry.settlementDate || '',
          isInstallment: false,
          owner: editingEntry.owner || '',
        })
      } else {
        setForm(INITIAL_STATE)
      }
    }
  }, [isOpen, editingEntry])

  if (!isOpen) return null

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))
  const setInstallmentField = (key, value) => setInstallmentForm((prev) => ({ ...prev, [key]: value }))

  const typeLabel = isReceita ? 'Receita' : 'Despesa'
  const title = isEditing ? `Editar ${typeLabel}` : `Nova ${typeLabel}`
  const isForecastWithoutDueDate = isDespesa && form.recurrence === 'previsao'
  const isForecastWithoutStatus = isDespesa && form.recurrence === 'previsao'
  const isForecastFrequencyRequired = isDespesa && form.recurrence === 'previsao'

  // Validação
  const canSaveSingle =
    !form.isInstallment &&
    form.owner !== '' &&
    form.accountId !== '' &&
    form.categoryId !== '' &&
    form.description.trim() !== '' &&
    form.amount !== '' &&
    (isForecastWithoutDueDate || form.dueDate !== '') &&
    (isForecastWithoutStatus || form.status !== '') &&
    (!isDespesa || form.recurrence !== '') &&
    (!isForecastFrequencyRequired || form.forecastFrequency !== '') &&
    (!isReceita || form.captador !== '')

  const canSaveInstallments = installments.length > 0 && form.owner !== ''
  const showParcelamento = form.isInstallment && !isEditing
  const isInstallmentFlow = showParcelamento && (isPersonalWorkspace || activeTab === 'parcelamento')
  const canSave = isInstallmentFlow ? canSaveInstallments : canSaveSingle

  const handleSave = () => {
    if (isInstallmentFlow) {
      if (!canSaveInstallments) return
      const baseDescription = form.description.trim()
      const entries = installments.map((row) => {
        const absAmount = Math.abs(parseCurrencyToNumber(row.amount))
        return {
          id: Date.now() + row.index,
          description: `${baseDescription} (Parcela ${row.label})`,
          amount: isReceita ? absAmount : -absAmount,
          dueDate: row.dueDate,
          settlementDate: '',
          type: capitalizeFirst(type),
          status: row.status,
          recurrence: 'Parcelamento',
          accountId: form.accountId,
          categoryId: form.categoryId,
          captador: isReceita ? form.captador : '',
          owner: form.owner,
        }
      })
      onSave(entries)
      onClose()
    } else {
      if (!canSaveSingle) return
      const numericAmount = parseCurrencyToNumber(form.amount)
      const now = new Date()
      const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const forecastStartMonth = isForecastFrequencyRequired
        ? (form.forecastStartMonth || (form.dueDate ? form.dueDate.slice(0, 7) : currentYearMonth))
        : ''
      const entry = {
        id: isEditing ? editingEntry.id : Date.now(),
        description: form.description.trim(),
        amount: isDespesa ? -Math.abs(numericAmount) : Math.abs(numericAmount),
        dueDate: form.dueDate,
        settlementDate: form.settlementDate || '',
        type: capitalizeFirst(type),
        status: form.status || 'pendente',
        recurrence: isDespesa ? formatRecurrenceLabel(form.recurrence) : 'Variável',
        forecastFrequency: isForecastFrequencyRequired ? form.forecastFrequency : '',
        forecastStartMonth,
        accountId: form.accountId,
        categoryId: form.categoryId,
        captador: isReceita ? form.captador : '',
        owner: form.owner,
      }
      onSave(entry)
      onClose()
    }
  }

  // Tabs disponíveis
  const tabs = isPersonalWorkspace
    ? []
    : [
        { id: 'geral', label: 'Geral' },
        { id: 'classificacao', label: 'Classificação' },
        ...(showParcelamento ? [{ id: 'parcelamento', label: 'Parcelamento' }] : []),
      ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      {/* Modal widescreen */}
      <div className="relative bg-offwhite rounded-2xl shadow-xl w-full max-w-4xl mx-4 max-h-[85vh] flex flex-col transition-all duration-300">
        {/* Header */}
        <div className="px-7 pt-7 pb-4 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-text-primary uppercase tracking-wide">
                {title}
              </h3>
              <p className="text-xs text-text-muted mt-0.5 font-semibold">
                {isEditing ? 'Atualize os dados do lançamento' : 'Preencha os dados do lançamento'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 -mr-1.5 -mt-1 rounded-lg text-text-muted hover:bg-white hover:text-text-primary transition-colors duration-150 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Corpo */}
        {isPersonalWorkspace ? (
          <div className="flex flex-1 min-h-0 px-7 pb-0">
            <div className="flex-1 min-w-0 overflow-y-auto pb-4 pt-1 space-y-5">
              <div>
                <h4 className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-2">Geral</h4>
                <TabGeral form={form} setField={setField} entryType={type} />
              </div>

              <div className="pt-1 border-t border-border">
                <h4 className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-2">Classificação</h4>
                <TabClassificacao
                  form={form}
                  setField={setField}
                  currentUser={currentUser}
                  entryType={type}
                  isEditing={isEditing}
                />
              </div>

              {showParcelamento && (
                <div className="pt-1 border-t border-border">
                  <h4 className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-2">Parcelamento</h4>
                  <TabParcelamento
                    form={form}
                    installmentForm={installmentForm}
                    setInstallmentField={setInstallmentField}
                    installments={installments}
                    setInstallments={setInstallments}
                    entryType={type}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 min-h-0 px-7 pb-0">
            {/* Sub-abas fixas à esquerda */}
            <nav className="flex flex-col gap-1 w-[140px] shrink-0 pr-5 border-r border-border pt-1">
              {tabs.map((tab) => (
                <SideTab
                  key={tab.id}
                  label={tab.label}
                  active={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                />
              ))}
            </nav>

            {/* Área de conteúdo da aba (com scroll independente) */}
            <div className="flex-1 min-w-0 pl-6 overflow-y-auto pb-4 pt-1">
              {activeTab === 'geral' && (
                <TabGeral form={form} setField={setField} entryType={type} />
              )}
              {activeTab === 'classificacao' && (
                <TabClassificacao
                  form={form}
                  setField={setField}
                  currentUser={currentUser}
                  entryType={type}
                  isEditing={isEditing}
                />
              )}
              {activeTab === 'parcelamento' && (
                <TabParcelamento
                  form={form}
                  installmentForm={installmentForm}
                  setInstallmentField={setInstallmentField}
                  installments={installments}
                  setInstallments={setInstallments}
                  entryType={type}
                />
              )}
            </div>
          </div>
        )}

        {/* Footer fixo com SALVAR */}
        <div className="px-7 py-5 shrink-0">
          <div className="flex items-center justify-end pt-4 border-t border-border">
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className={`
                px-7 py-2.5 rounded-lg text-[13px] font-bold uppercase tracking-wide
                transition-all duration-150
                ${canSave
                  ? 'bg-primary text-white hover:bg-primary-light cursor-pointer'
                  : 'bg-border text-text-muted cursor-not-allowed'
                }
              `}
            >
              {isEditing ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
