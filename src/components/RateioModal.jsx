import { useState, useMemo } from 'react'
import { X, ChevronDown, Plus, Trash2, CalendarDays, Clock, ChevronRight } from 'lucide-react'
import { useWorkspaceData } from '../contexts/WorkspaceContext'

/* ------------------------------------------------------------------ */
/*  Constantes                                                         */
/* ------------------------------------------------------------------ */

const ownerOptions = [
  { id: 'lenon', label: 'Lenon' },
  { id: 'berna', label: 'Berna' },
]

const statusOptions = [
  { id: 'pago', label: 'Pago' },
  { id: 'pendente', label: 'Pendente' },
  { id: 'atrasado', label: 'Atrasado' },
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmt(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function parse(formatted) {
  if (!formatted) return 0
  return parseFloat(formatted.replace(/[R$\s.]/g, '').replace(',', '.')) || 0
}

function addMonths(dateStr, months) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setMonth(d.getMonth() + months)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function dateBR(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function handleCurrencyInput(setter, fieldOrId, e, updateFn) {
  const raw = e.target.value.replace(/\D/g, '')
  const val = raw === '' ? '' : fmt((parseInt(raw, 10) / 100).toFixed(2))
  if (updateFn) updateFn(fieldOrId, 'amount', val)
  else setter(fieldOrId, val)
}

/* ------------------------------------------------------------------ */
/*  Micro-componentes                                                  */
/* ------------------------------------------------------------------ */

const sCls =
  'w-full appearance-none bg-white border border-border rounded-md px-2.5 py-[7px] pr-8 text-[13px] text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-150 cursor-pointer'

const iCls =
  'w-full bg-white border border-border rounded-md px-2.5 py-[7px] text-[13px] text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-150'

const lCls = 'block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1'

function Sel({ label, value, onChange, placeholder, children, className = '' }) {
  return (
    <div className={className}>
      {label && <label className={lCls}>{label}</label>}
      <div className="relative">
        <select value={value} onChange={onChange} className={sCls}>
          <option value="" disabled>{placeholder}</option>
          {children}
        </select>
        <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted/60 pointer-events-none" />
      </div>
    </div>
  )
}

function Inp({ label, className = '', ...rest }) {
  return (
    <div className={className}>
      {label && <label className={lCls}>{label}</label>}
      <input className={iCls} {...rest} />
    </div>
  )
}

function Toggle({ label, checked, onChange, description }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <div className="pt-0.5">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={`
            relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent
            transition-colors duration-200 ease-in-out cursor-pointer
            ${checked ? 'bg-[#223631]' : 'bg-border'}
          `}
        >
          <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
        </button>
      </div>
      <div>
        <span className="text-[13px] font-semibold text-text-primary leading-tight">{label}</span>
        {description && <p className="text-[11px] text-text-muted mt-0.5 leading-snug">{description}</p>}
      </div>
    </label>
  )
}

function SideTab({ label, active, onClick, indent = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full text-left px-3.5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider
        transition-all duration-150 whitespace-nowrap
        ${indent ? 'pl-6' : ''}
        ${active
          ? 'bg-[#223631] text-white cursor-pointer'
          : 'text-text-muted hover:bg-offwhite hover:text-text-primary cursor-pointer'
        }
      `}
    >
      {label}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  NÍVEL 3 — Sub-aba CLASSIFICAÇÃO                                    */
/* ------------------------------------------------------------------ */

function PartnerClassification({ partner, onUpdate, currentUser }) {
  const grouped = getGroupedAccountsForUser(currentUser)
  return (
    <div className="grid grid-cols-2 gap-3">
      <Sel
        label="CONTA DE MOVIMENTAÇÃO"
        value={partner.accountId}
        onChange={(e) => onUpdate(partner.id, 'accountId', e.target.value)}
        placeholder="Selecione"
      >
        {grouped.map((g) => (
          <optgroup key={g.groupLabel} label={g.groupLabel}>
            {g.accounts.filter((a) => a.type !== 'cartao').map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </optgroup>
        ))}
      </Sel>
      <Sel
        label="CATEGORIA"
        value={partner.categoryId}
        onChange={(e) => onUpdate(partner.id, 'categoryId', e.target.value)}
        placeholder="Selecione"
      >
        {despesaCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
      </Sel>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  NÍVEL 3 — Sub-aba PARCELAMENTO                                     */
/* ------------------------------------------------------------------ */

function IndependentFields({ partner, onUpdate }) {
  const total = parse(partner.amount)
  const numP = partner.numParcelas || 2
  const pVal = numP > 0 ? total / numP : 0

  return (
    <div className="space-y-3 mt-3">
      <div className="flex items-end gap-3">
        <div className="w-32">
          <label className={lCls}>Nº DE PARCELAS</label>
          <input
            type="number"
            min={2}
            max={60}
            value={numP}
            onChange={(e) => onUpdate(partner.id, 'numParcelas', Math.max(2, Math.min(60, parseInt(e.target.value, 10) || 2)))}
            className={`${iCls} text-center font-semibold`}
          />
        </div>
        <Inp
          label="1º VENCIMENTO"
          type="date"
          value={partner.firstDueDate || ''}
          onChange={(e) => onUpdate(partner.id, 'firstDueDate', e.target.value)}
          className="w-40"
        />
      </div>
      {total > 0 && (
        <p className="text-[12px] text-text-muted">
          {numP}x de <span className="font-bold text-[#223631]">{fmt(pVal)}</span>
        </p>
      )}
    </div>
  )
}

function PartnerInstallment({ partner, onUpdate, isReceitaParcelada, receitaNumParcelas }) {
  const total = parse(partner.amount)

  if (isReceitaParcelada) {
    const isMirrored = partner.installmentMode !== 'independent'
    return (
      <div className="space-y-3">
        <Toggle
          label="Espelhar Parcelamento da Receita"
          description={`Divide em ${receitaNumParcelas} parcelas, espelhando os vencimentos da receita.`}
          checked={isMirrored}
          onChange={(v) => onUpdate(partner.id, 'installmentMode', v ? 'mirror' : 'independent')}
        />
        {isMirrored && total > 0 && (
          <p className="text-[12px] text-text-muted bg-offwhite px-3 py-2 rounded-md">
            {receitaNumParcelas}x de <span className="font-bold text-[#223631]">{fmt(total / receitaNumParcelas)}</span>
          </p>
        )}
        {!isMirrored && <IndependentFields partner={partner} onUpdate={onUpdate} />}
      </div>
    )
  }

  const isParcelado = partner.installmentMode === 'independent'
  return (
    <div className="space-y-3">
      <Toggle
        label="Parcelar este Repasse"
        description="Define um parcelamento independente para o repasse deste parceiro."
        checked={isParcelado}
        onChange={(v) => onUpdate(partner.id, 'installmentMode', v ? 'independent' : 'none')}
      />
      {isParcelado && <IndependentFields partner={partner} onUpdate={onUpdate} />}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  NÍVEL 2 — Card de Parceiro (com sub-abas Nível 3)                  */
/* ------------------------------------------------------------------ */

function PartnerCard({ partner, onUpdate, onRemove, isReceitaParcelada, receitaNumParcelas, currentUser }) {
  const [subTab, setSubTab] = useState('classificacao')

  return (
    <div className="border border-amber-200/80 rounded-lg overflow-hidden bg-white">
      {/* Header do parceiro */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50/60 border-b border-amber-200/60">
        <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wider bg-amber-200/50 px-1.5 py-0.5 rounded shrink-0">
          N2
        </span>
        <input
          placeholder="Nome do parceiro"
          value={partner.name}
          onChange={(e) => onUpdate(partner.id, 'name', e.target.value)}
          className={`${iCls} flex-1 !border-amber-200/60 !bg-white`}
        />
        <input
          type="text"
          inputMode="numeric"
          placeholder="R$ 0,00"
          value={partner.amount}
          onChange={(e) => handleCurrencyInput(null, partner.id, e, onUpdate)}
          className={`${iCls} w-36 tabular-nums font-semibold !border-amber-200/60 !bg-white`}
        />
        <button
          type="button"
          onClick={() => onRemove(partner.id)}
          className="p-1.5 rounded-md text-status-overdue-text/40 hover:text-status-overdue-text hover:bg-status-overdue-bg transition-colors cursor-pointer shrink-0"
        >
          <Trash2 size={14} strokeWidth={2} />
        </button>
      </div>

      {/* Sub-abas Nível 3 */}
      <div className="flex border-b border-border bg-offwhite/40">
        {[
          { id: 'classificacao', label: 'CLASSIFICAÇÃO' },
          { id: 'parcelamento', label: 'PARCELAMENTO' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id)}
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              subTab === t.id
                ? 'text-[#223631] border-b-2 border-[#223631] bg-white'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Conteúdo da sub-aba */}
      <div className="px-3 py-3">
        <div className={subTab === 'classificacao' ? '' : 'hidden'}>
          <PartnerClassification partner={partner} onUpdate={onUpdate} currentUser={currentUser} />
        </div>
        <div className={subTab === 'parcelamento' ? '' : 'hidden'}>
          <PartnerInstallment
            partner={partner}
            onUpdate={onUpdate}
            isReceitaParcelada={isReceitaParcelada}
            receitaNumParcelas={receitaNumParcelas}
          />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  NÍVEL 1 — RECEITA BRUTA                                            */
/* ------------------------------------------------------------------ */

function TabReceitaBruta({ form, setField, currentUser }) {
  const grouped = getGroupedAccountsForUser(currentUser)

  const grossNum = parse(form.grossAmount)
  const numP = form.numParcelas || 1
  const pVal = numP > 0 ? grossNum / numP : 0

  const previewDates = useMemo(() => {
    if (!form.isInstallment || !form.dueDate || numP <= 1) return []
    return Array.from({ length: numP }, (_, i) => ({
      n: i + 1,
      date: addMonths(form.dueDate, i),
      value: pVal,
    }))
  }, [form.isInstallment, form.dueDate, numP, pVal])

  return (
    <div className="space-y-4">
      {/* Badge Nível 1 */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[9px] font-bold text-[#223631] uppercase tracking-wider bg-[#223631]/10 px-2 py-0.5 rounded">
          NÍVEL 1 — MESTRE
        </span>
      </div>

      <Inp
        label="DESCRIÇÃO"
        placeholder="Ex.: Honorários - Processo #1042"
        value={form.description}
        onChange={(e) => setField('description', e.target.value)}
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lCls}>VALOR BRUTO</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="R$ 0,00"
            value={form.grossAmount}
            onChange={(e) => handleCurrencyInput(setField, 'grossAmount', e)}
            className={`${iCls} !bg-offwhite font-semibold tabular-nums`}
          />
        </div>
        <Sel label="RESPONSÁVEL" value={form.owner} onChange={(e) => setField('owner', e.target.value)} placeholder="Selecione">
          {ownerOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </Sel>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Sel label="CONTA — SICOOB" value={form.accountId} onChange={(e) => setField('accountId', e.target.value)} placeholder="Selecione">
          {grouped.map((g) => (
            <optgroup key={g.groupLabel} label={g.groupLabel}>
              {g.accounts.filter((a) => a.type !== 'cartao').map((a) => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </optgroup>
          ))}
        </Sel>
        <Sel label="CATEGORIA" value={form.categoryId} onChange={(e) => setField('categoryId', e.target.value)} placeholder="Selecione">
          {receitaCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </Sel>
        <Inp
          label="VENCIMENTO (1ª PARCELA)"
          type="date"
          value={form.dueDate}
          onChange={(e) => setField('dueDate', e.target.value)}
        />
      </div>

      <Sel label="STATUS" value={form.status} onChange={(e) => setField('status', e.target.value)} placeholder="Selecione" className="w-1/3">
        {statusOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </Sel>

      {/* Parcelamento */}
      <div className="border-t border-border pt-4 mt-2">
        <Toggle
          label="Parcelado"
          description="Divide a receita bruta em parcelas mensais com vencimentos projetados."
          checked={!!form.isInstallment}
          onChange={(v) => {
            setField('isInstallment', v)
            if (!v) setField('numParcelas', 1)
            else if (!form.numParcelas || form.numParcelas <= 1) setField('numParcelas', 2)
          }}
        />

        {form.isInstallment && (
          <div className="mt-3 space-y-3">
            <div className="flex items-end gap-3">
              <div className="w-32">
                <label className={lCls}>Nº DE PARCELAS</label>
                <input
                  type="number"
                  min={2}
                  max={60}
                  value={form.numParcelas || 2}
                  onChange={(e) => setField('numParcelas', Math.max(2, Math.min(60, parseInt(e.target.value, 10) || 2)))}
                  className={`${iCls} text-center font-semibold`}
                />
              </div>
              {grossNum > 0 && numP > 1 && (
                <p className="text-[12px] text-text-muted pb-2">
                  {numP}x de <span className="font-bold text-[#223631]">{fmt(pVal)}</span>
                </p>
              )}
            </div>

            {previewDates.length > 0 && (
              <div className="bg-white border border-border rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-offwhite border-b border-border">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarDays size={12} />
                    PROJEÇÃO DE VENCIMENTOS — RECEITA
                  </p>
                </div>
                <div className="max-h-[160px] overflow-y-auto">
                  {previewDates.map((item) => (
                    <div key={item.n} className="flex items-center justify-between px-3 py-1.5 text-[12px] border-b border-border last:border-b-0">
                      <span className="text-text-secondary font-medium">Parcela {item.n}/{numP}</span>
                      <span className="text-text-muted">{dateBR(item.date)}</span>
                      <span className="font-semibold text-value-income tabular-nums">{fmt(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  NÍVEL 2 — PARCEIROS E REPASSES                                     */
/* ------------------------------------------------------------------ */

function TabParceiros({ partners, setPartners, form, currentUser }) {
  const grossNum = parse(form.grossAmount)
  const isParcelado = form.isInstallment && form.numParcelas > 1
  const numP = isParcelado ? form.numParcelas : 1

  const handleAdd = () => {
    setPartners((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: '',
        amount: '',
        accountId: form.accountId,
        categoryId: 'repasse-parceiro',
        installmentMode: isParcelado ? 'mirror' : 'none',
        numParcelas: 2,
        firstDueDate: '',
      },
    ])
  }

  const handleRemove = (id) => setPartners((prev) => prev.filter((p) => p.id !== id))

  const updatePartner = (id, key, value) => {
    setPartners((prev) => prev.map((p) => (p.id === id ? { ...p, [key]: value } : p)))
  }

  const totalRepasses = partners.reduce((s, p) => s + parse(p.amount), 0)
  const saldoEscritorio = grossNum - totalRepasses
  const saldoParcela = numP > 1 ? saldoEscritorio / numP : saldoEscritorio

  const parcelaPreview = useMemo(() => {
    if (!isParcelado || !form.dueDate || partners.length === 0) return []
    return Array.from({ length: numP }, (_, i) => {
      const date = addMonths(form.dueDate, i)
      const breakdown = partners.map((p) => {
        const pTotal = parse(p.amount)
        const mode = p.installmentMode
        if (mode === 'mirror' || mode === 'none') {
          return { name: p.name || 'Parceiro', value: pTotal / numP }
        }
        if (mode === 'independent' && p.numParcelas > 1) {
          return { name: p.name || 'Parceiro', value: pTotal / p.numParcelas, independent: true }
        }
        return { name: p.name || 'Parceiro', value: pTotal }
      })
      const totalRep = breakdown.reduce((s, b) => s + b.value, 0)
      return { n: i + 1, date, breakdown, saldo: (grossNum / numP) - totalRep }
    })
  }, [isParcelado, form.dueDate, numP, partners, grossNum])

  return (
    <div className="space-y-4">
      {/* Resumo da receita */}
      <div className="bg-white rounded-md px-3 py-2 border border-border">
        <p className="text-xs text-text-muted">
          <span className="font-bold">RECEITA BRUTA:</span>{' '}
          <span className="font-semibold text-text-secondary">{form.grossAmount || 'R$ 0,00'}</span>
          {isParcelado && (
            <span className="ml-2 text-[#223631] font-semibold">
              ({numP}x de {fmt(grossNum / numP)})
            </span>
          )}
        </p>
      </div>

      {/* Cards de parceiros */}
      {partners.map((partner) => (
        <PartnerCard
          key={partner.id}
          partner={partner}
          onUpdate={updatePartner}
          onRemove={handleRemove}
          isReceitaParcelada={isParcelado}
          receitaNumParcelas={numP}
          currentUser={currentUser}
        />
      ))}

      {/* Adicionar */}
      <button
        type="button"
        onClick={handleAdd}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md border border-dashed border-border text-[13px] font-medium text-text-muted hover:border-[#223631]/40 hover:text-[#223631] transition-all cursor-pointer"
      >
        <Plus size={15} strokeWidth={2} />
        ADICIONAR PARCEIRO
      </button>

      {/* Rodapé com totais */}
      {partners.length > 0 && (
        <div className="bg-offwhite border border-border rounded-lg px-4 py-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">TOTAL REPASSES</span>
            <span className="text-sm font-semibold tabular-nums text-value-expense">{fmt(totalRepasses)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-1.5">
            <span className="text-xs font-bold text-[#223631] uppercase tracking-wider">SALDO ESCRITÓRIO</span>
            <span className={`text-sm font-bold tabular-nums ${saldoEscritorio >= 0 ? 'text-[#223631]' : 'text-status-overdue-text'}`}>
              {fmt(saldoEscritorio)}
            </span>
          </div>
          {numP > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-1.5">
              <span className="text-[10px] font-bold text-[#223631]/70 uppercase tracking-wider">SALDO ESCRITÓRIO / PARCELA</span>
              <span className="text-sm font-bold tabular-nums text-[#223631]/80">{fmt(saldoParcela)}</span>
            </div>
          )}
        </div>
      )}

      {/* Preview de espelhamento por parcela */}
      {parcelaPreview.length > 0 && (
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-amber-50 border-b border-amber-200">
            <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarDays size={12} />
              SALDO ESCRITÓRIO POR PARCELA
            </p>
          </div>
          <div className="max-h-[220px] overflow-y-auto">
            {parcelaPreview.map((item) => (
              <div key={item.n} className="px-3 py-2.5 border-b border-border last:border-b-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-text-primary uppercase">PARCELA {item.n}/{numP}</span>
                  <span className="text-[11px] text-text-muted">{dateBR(item.date)}</span>
                </div>
                {item.breakdown.map((b, bi) => (
                  <div key={bi} className="flex items-center justify-between pl-3 py-0.5">
                    <span className="text-[11px] text-text-secondary">
                      Repasse — {b.name}
                      {b.independent && <span className="text-[9px] text-amber-600 ml-1">(indep.)</span>}
                    </span>
                    <span className="text-[11px] font-semibold text-value-expense tabular-nums">{fmt(b.value)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pl-3 pt-1 mt-1 border-t border-dashed border-border">
                  <span className="text-[10px] font-bold text-[#223631] uppercase tracking-wider">SALDO ESCRITÓRIO</span>
                  <span className="text-[12px] font-bold text-[#223631] tabular-nums">{fmt(item.saldo)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  MODAL PRINCIPAL — RATEIO                                           */
/* ------------------------------------------------------------------ */

export default function RateioModal({ isOpen, onClose, onSave, currentUser }) {
  const { getGroupedAccountsForUser, getCategoriesByType } = useWorkspaceData()
  const receitaCategories = getCategoriesByType('receita')
  const despesaCategories = getCategoriesByType('despesa')
  const [activeTab, setActiveTab] = useState('receita')
  const [form, setForm] = useState({
    description: '',
    grossAmount: '',
    owner: '',
    accountId: '',
    categoryId: '',
    dueDate: '',
    status: 'pendente',
    isInstallment: false,
    numParcelas: 2,
  })
  const [partners, setPartners] = useState([])

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const resetAll = () => {
    setActiveTab('receita')
    setForm({
      description: '',
      grossAmount: '',
      owner: '',
      accountId: '',
      categoryId: '',
      dueDate: '',
      status: 'pendente',
      isInstallment: false,
      numParcelas: 2,
    })
    setPartners([])
  }

  if (!isOpen) return null

  const grossNum = parse(form.grossAmount)
  const totalRepasses = partners.reduce((s, p) => s + parse(p.amount), 0)
  const saldoEscritorio = grossNum - totalRepasses

  const canSave =
    form.description.trim() !== '' &&
    form.grossAmount !== '' &&
    form.owner !== '' &&
    form.accountId !== '' &&
    form.categoryId !== '' &&
    form.dueDate !== '' &&
    form.status !== '' &&
    partners.length > 0 &&
    partners.every((p) => p.name.trim() !== '' && p.amount !== '') &&
    saldoEscritorio >= 0

  const handleSave = () => {
    if (!canSave) return

    const rateioId = `rateio-${Date.now()}`
    const entries = []
    const baseDesc = form.description.trim()
    const isParcelado = form.isInstallment && form.numParcelas > 1
    const numP = isParcelado ? form.numParcelas : 1
    let idC = Date.now()
    const nid = () => ++idC

    const receitaEntries = []

    if (isParcelado) {
      const pVal = grossNum / numP
      for (let i = 0; i < numP; i++) {
        const entry = {
          id: nid(),
          description: `${baseDesc} (Parcela ${i + 1}/${numP})`,
          amount: Math.abs(pVal),
          dueDate: addMonths(form.dueDate, i),
          settlementDate: '',
          type: 'Receita',
          status: i === 0 ? form.status : 'pendente',
          recurrence: 'Parcelamento',
          accountId: form.accountId,
          categoryId: form.categoryId,
          captador: '',
          owner: form.owner,
          rateioId,
          rateioLevel: 1,
          isInstallment: true,
        }
        receitaEntries.push(entry)
        entries.push(entry)
      }
    } else {
      const entry = {
        id: nid(),
        description: baseDesc,
        amount: Math.abs(grossNum),
        dueDate: form.dueDate,
        settlementDate: '',
        type: 'Receita',
        status: form.status,
        recurrence: 'Variável',
        accountId: form.accountId,
        categoryId: form.categoryId,
        captador: '',
        owner: form.owner,
        rateioId,
        rateioLevel: 1,
      }
      receitaEntries.push(entry)
      entries.push(entry)
    }

    const descontoLabel = grossNum > 0
      ? ` (descontado ${Math.round(((grossNum - partners.reduce((s, p) => s + parse(p.amount), 0)) / grossNum) * 100)}% imposto)`
      : ''

    partners.forEach((partner) => {
      const pTotal = parse(partner.amount)
      const pName = partner.name.trim()
      const pAccount = partner.accountId || form.accountId
      const pCategory = partner.categoryId || 'repasse-parceiro'
      const mode = partner.installmentMode
      const suffix = pTotal < grossNum ? descontoLabel : ''

      if (mode === 'mirror' && isParcelado) {
        for (let i = 0; i < numP; i++) {
          entries.push({
            id: nid(),
            description: `Repasse — ${pName} (Parcela ${i + 1}/${numP})${suffix}`,
            amount: -Math.abs(pTotal / numP),
            dueDate: addMonths(form.dueDate, i),
            settlementDate: '',
            type: 'Despesa',
            status: 'pendente',
            recurrence: 'Parcelamento',
            accountId: pAccount,
            categoryId: pCategory,
            captador: '',
            owner: form.owner,
            rateioId,
            rateioLevel: 2,
            rateioMasterId: receitaEntries[i].id,
            isInstallment: true,
          })
        }
      } else if (mode === 'independent' && partner.numParcelas > 1) {
        const pNumP = partner.numParcelas
        const pStart = partner.firstDueDate || form.dueDate
        for (let i = 0; i < pNumP; i++) {
          entries.push({
            id: nid(),
            description: `Repasse — ${pName} (Parcela ${i + 1}/${pNumP})${suffix}`,
            amount: -Math.abs(pTotal / pNumP),
            dueDate: addMonths(pStart, i),
            settlementDate: '',
            type: 'Despesa',
            status: 'pendente',
            recurrence: 'Parcelamento',
            accountId: pAccount,
            categoryId: pCategory,
            captador: '',
            owner: form.owner,
            rateioId,
            rateioLevel: 2,
            rateioMasterId: receitaEntries[0].id,
            isInstallment: true,
          })
        }
      } else {
        entries.push({
          id: nid(),
          description: `Repasse — ${pName}${suffix}`,
          amount: -Math.abs(pTotal),
          dueDate: form.dueDate,
          settlementDate: '',
          type: 'Despesa',
          status: 'pendente',
          recurrence: 'Variável',
          accountId: pAccount,
          categoryId: pCategory,
          captador: '',
          owner: form.owner,
          rateioId,
          rateioLevel: 2,
          rateioMasterId: receitaEntries[0].id,
        })
      }
    })

    onSave(entries)
    resetAll()
    onClose()
  }

  const handleClose = () => {
    resetAll()
    onClose()
  }

  const tabs = [
    { id: 'receita', label: 'Receita Bruta' },
    { id: 'parceiros', label: 'Parceiros' },
  ]

  const numP = form.isInstallment && form.numParcelas > 1 ? form.numParcelas : 1
  const saldoParcela = numP > 1 ? saldoEscritorio / numP : saldoEscritorio

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={handleClose} />

      <div className="relative bg-offwhite rounded-2xl shadow-xl w-full max-w-4xl mx-4 max-h-[85vh] flex flex-col transition-all duration-300">
        {/* Header */}
        <div className="px-7 pt-7 pb-4 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-[#223631] uppercase tracking-wide">
                NOVO RATEIO
              </h3>
              <p className="text-xs text-text-muted mt-0.5 font-semibold">
                Receita com repasses a parceiros
                {form.isInstallment && form.numParcelas > 1 && (
                  <span className="ml-1 text-[#223631]">• Parcelado em {form.numParcelas}x</span>
                )}
              </p>
            </div>
            <button onClick={handleClose} className="p-1.5 -mr-1.5 -mt-1 rounded-lg text-text-muted hover:bg-white hover:text-text-primary transition-colors cursor-pointer">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Corpo: sidebar + conteúdo */}
        <div className="flex flex-1 min-h-0 px-7 pb-0">
          <nav className="flex flex-col gap-1 w-[150px] shrink-0 pr-5 border-r border-border pt-1">
            {tabs.map((tab) => (
              <SideTab key={tab.id} label={tab.label} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
            ))}
            {/* Indicador de parceiros */}
            {partners.length > 0 && activeTab === 'parceiros' && (
              <div className="mt-1 pl-2 space-y-0.5">
                {partners.map((p) => (
                  <div key={p.id} className="flex items-center gap-1.5 text-[10px] text-text-muted truncate">
                    <ChevronRight size={10} className="text-amber-400 shrink-0" />
                    <span className="truncate">{p.name || 'Sem nome'}</span>
                  </div>
                ))}
              </div>
            )}
          </nav>

          <div className="flex-1 min-w-0 pl-6 overflow-y-auto pb-4 pt-1">
            <div className={activeTab === 'receita' ? '' : 'hidden'}>
              <TabReceitaBruta form={form} setField={setField} currentUser={currentUser} />
            </div>
            <div className={activeTab === 'parceiros' ? '' : 'hidden'}>
              <TabParceiros partners={partners} setPartners={setPartners} form={form} currentUser={currentUser} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-5 shrink-0">
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="text-xs text-text-muted space-y-0.5">
              {partners.length > 0 && grossNum > 0 && (
                <>
                  <div>
                    Saldo escritório:{' '}
                    <span className={`font-bold ${saldoEscritorio >= 0 ? 'text-[#223631]' : 'text-status-overdue-text'}`}>
                      {fmt(saldoEscritorio)}
                    </span>
                  </div>
                  {numP > 1 && (
                    <div>
                      Saldo / parcela:{' '}
                      <span className="font-bold text-[#223631]/80">{fmt(saldoParcela)}</span>
                      <span className="text-text-muted/60 ml-1">({numP} parcelas)</span>
                    </div>
                  )}
                </>
              )}
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className={`px-7 py-2.5 rounded-lg text-[13px] font-bold uppercase tracking-wide transition-all duration-150 ${
                canSave
                  ? 'bg-[#223631] text-white hover:bg-[#223631]/90 cursor-pointer'
                  : 'bg-border text-text-muted cursor-not-allowed'
              }`}
            >
              SALVAR RATEIO
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
