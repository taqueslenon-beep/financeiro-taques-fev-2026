import { Check } from 'lucide-react'
import { useWorkspaceData } from '../contexts/WorkspaceContext'

/* ------------------------------------------------------------------ */
/*  Formatação                                                         */
/* ------------------------------------------------------------------ */

const SHORT_MONTHS = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
]

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T12:00:00')
  return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]}`
}

/* ------------------------------------------------------------------ */
/*  Ordenação                                                          */
/* ------------------------------------------------------------------ */

function sortBlock(entries) {
  return [...entries].sort((a, b) => {
    const aIsPaid = a.status === 'pago'
    const bIsPaid = b.status === 'pago'
    if (aIsPaid !== bIsPaid) return aIsPaid ? 1 : -1
    return (a.dueDate || '').localeCompare(b.dueDate || '')
  })
}

/* ------------------------------------------------------------------ */
/*  Checkbox circular                                                  */
/* ------------------------------------------------------------------ */

function SettlementCheckbox({ isPaid, onSettle, onReverse }) {
  return (
    <button
      type="button"
      onClick={isPaid ? onReverse : onSettle}
      title={isPaid ? 'Estornar efetivação' : 'Dar baixa'}
      className={`
        flex items-center justify-center
        w-4 h-4 rounded-full border-[1.5px]
        shrink-0 transition-all duration-200 cursor-pointer
        ${
          isPaid
            ? 'border-primary bg-primary hover:bg-primary-light hover:border-primary-light'
            : 'border-text-muted/40 bg-transparent hover:border-primary/60'
        }
      `}
    >
      {isPaid && <Check size={9} strokeWidth={3} className="text-white" />}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Linha compacta                                                     */
/* ------------------------------------------------------------------ */

function MonitorItem({ row, isLast, onSettle, onReverse }) {
  const isPaid = row.status === 'pago'

  return (
    <div
      className={`
        flex items-center gap-2.5 px-3 py-2
        transition-all duration-300 ease-in-out
        hover:bg-offwhite/60
        ${!isLast ? 'border-b border-border/60' : ''}
      `}
    >
      <SettlementCheckbox
        isPaid={isPaid}
        onSettle={onSettle}
        onReverse={onReverse}
      />

      <span
        className={`flex-1 text-[13px] font-medium truncate transition-all duration-300 ${
          isPaid
            ? 'text-text-muted line-through decoration-text-muted/40'
            : 'text-text-primary'
        }`}
        title={row.description}
      >
        {row.description}
      </span>

      <div className="flex items-center gap-3 shrink-0">
        <span
          className={`text-[13px] font-semibold tabular-nums transition-all duration-300 ${
            isPaid
              ? 'text-text-muted line-through decoration-text-muted/40'
              : 'text-value-income'
          }`}
        >
          {formatCurrency(row.amount)}
        </span>
        <span
          className={`text-[11px] tabular-nums w-[42px] text-right transition-colors duration-300 ${
            isPaid ? 'text-text-muted' : 'text-text-secondary'
          }`}
        >
          {formatDate(row.dueDate)}
        </span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Coluna individual (um tipo)                                        */
/* ------------------------------------------------------------------ */

function RevenueColumn({ title, entries, onSettle, onReverse }) {
  const sorted = sortBlock(entries)
  const previsto = entries.reduce((sum, e) => sum + Math.abs(e.amount), 0)
  const efetivado = entries
    .filter((e) => e.status === 'pago')
    .reduce((sum, e) => sum + Math.abs(e.amount), 0)

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden flex flex-col">
      <div className="px-3.5 pt-3 pb-2.5 border-b border-border">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold text-primary uppercase tracking-wider">
            {title}
          </h4>
          <span className="text-[10px] text-text-muted tabular-nums">
            {sorted.length} {sorted.length === 1 ? 'item' : 'itens'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="px-3.5 py-6 text-center">
            <p className="text-xs text-text-muted">Nenhuma receita.</p>
          </div>
        ) : (
          sorted.map((row, idx) => (
            <MonitorItem
              key={row.id}
              row={row}
              isLast={idx === sorted.length - 1}
              onSettle={() => onSettle(row)}
              onReverse={() => onReverse(row.id)}
            />
          ))
        )}
      </div>

      <div className="px-3.5 py-3 border-t border-border/60">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wide mb-0.5">Previsto</p>
            <p className="text-[13px] font-semibold text-text-primary tabular-nums">
              {formatCurrency(previsto)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-text-muted uppercase tracking-wide mb-0.5">Efetivado</p>
            <p className="text-[13px] font-semibold text-value-income tabular-nums">
              {formatCurrency(efetivado)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Chaves internas para agrupamento                                   */
/* ------------------------------------------------------------------ */

const CLASSIFY_KEY_MAP = {
  'Honorários Lenon': 'honLenon',
  'Honorários Gilberto': 'honGilberto',
  'Empréstimo': 'emprestimo',
  'Aporte de Sócio': 'aporte',
  'Impostos Gilberto': 'impostosGilberto',
  'Outras Receitas': 'outras',
}

/* ------------------------------------------------------------------ */
/*  Componente principal: RevenueMonitor (layout 3×2)                  */
/* ------------------------------------------------------------------ */

export default function RevenueMonitor({ revenues, onSettle, onReverse }) {
  const { classifyReceita } = useWorkspaceData()
  const groups = {
    honLenon: [], honGilberto: [], emprestimo: [],
    aporte: [], impostosGilberto: [], outras: [],
  }
  for (const e of revenues) {
    const key = CLASSIFY_KEY_MAP[classifyReceita(e)] || 'outras'
    groups[key].push(e)
  }

  const totalPrevisto = revenues.reduce((sum, e) => sum + Math.abs(e.amount), 0)
  const totalEfetivado = revenues
    .filter((e) => e.status === 'pago')
    .reduce((sum, e) => sum + Math.abs(e.amount), 0)

  if (revenues.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-border px-4 py-10 text-center">
        <p className="text-sm text-text-muted">Nenhuma receita neste período.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4 items-start">
        <RevenueColumn
          title="Honorários Lenon"
          entries={groups.honLenon}
          onSettle={onSettle}
          onReverse={onReverse}
        />
        <RevenueColumn
          title="Honorários Gilberto"
          entries={groups.honGilberto}
          onSettle={onSettle}
          onReverse={onReverse}
        />
        <RevenueColumn
          title="Empréstimo"
          entries={groups.emprestimo}
          onSettle={onSettle}
          onReverse={onReverse}
        />
        <RevenueColumn
          title="Aporte de Sócio"
          entries={groups.aporte}
          onSettle={onSettle}
          onReverse={onReverse}
        />
        <RevenueColumn
          title="Impostos Gilberto"
          entries={groups.impostosGilberto}
          onSettle={onSettle}
          onReverse={onReverse}
        />
        <RevenueColumn
          title="Outras Receitas"
          entries={groups.outras}
          onSettle={onSettle}
          onReverse={onReverse}
        />
      </div>

      <div className="flex items-center justify-end gap-6 px-1">
        <span className="text-[11px] text-text-muted">
          Total previsto{' '}
          <span className="font-semibold text-text-primary tabular-nums">
            {formatCurrency(totalPrevisto)}
          </span>
        </span>
        <span className="text-[11px] text-text-muted">
          Total efetivado{' '}
          <span className="font-semibold text-value-income tabular-nums">
            {formatCurrency(totalEfetivado)}
          </span>
        </span>
      </div>
    </div>
  )
}
