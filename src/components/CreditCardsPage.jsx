import { useState, useMemo } from 'react'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useWorkspaceData } from '../contexts/WorkspaceContext'
import { creditCardEntries } from '../data/creditCardEntries'
import StatusBadge from './StatusBadge'

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const SHORT_MONTHS = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T12:00:00')
  return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

function filterByMonth(entries, year, month) {
  return entries.filter((e) => {
    if (!e.date) return false
    const d = new Date(e.date + 'T12:00:00')
    return d.getFullYear() === year && d.getMonth() === month
  })
}

function getCardShortName(card) {
  if (card.owner === 'lenon') return 'Cartão Lenon'
  if (card.owner === 'berna') return 'Cartão Berna'
  return card.label
}

/* ------------------------------------------------------------------ */
/*  Seletor de mês                                                     */
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
/*  Componente principal                                               */
/* ------------------------------------------------------------------ */

export default function CreditCardsPage() {
  const { accounts } = useWorkspaceData()
  const creditCards = useMemo(() => accounts.filter((a) => a.type === 'cartao'), [accounts])
  const now = new Date()
  const [activeCardId, setActiveCardId] = useState(creditCards[0]?.id || '')
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  const handlePrev = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }
  const handleNext = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }
  const handleToday = () => {
    setYear(now.getFullYear())
    setMonth(now.getMonth())
  }

  const activeCard = creditCards.find((c) => c.id === activeCardId)

  const cardEntries = useMemo(() => {
    const byCard = creditCardEntries.filter((e) => e.cardId === activeCardId)
    const byMonth = filterByMonth(byCard, year, month)
    return byMonth.sort((a, b) => a.date.localeCompare(b.date))
  }, [activeCardId, year, month])

  const totalMonth = useMemo(
    () => cardEntries.reduce((sum, e) => sum + e.amount, 0),
    [cardEntries],
  )

  return (
    <section>
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight uppercase">Cartões de Crédito</h2>
          <p className="text-sm text-text-muted mt-1 font-semibold">
            Acompanhe os gastos por cartão
          </p>
        </div>

        <button
          type="button"
          className="
            flex items-center gap-2 bg-primary text-white
            px-5 py-2.5 rounded-lg text-sm font-medium
            hover:bg-primary-light transition-colors duration-150
            cursor-pointer
          "
        >
          <Plus size={18} strokeWidth={2} />
          Nova despesa
        </button>
      </header>

      {/* Tabs de cartões */}
      <div className="flex items-center gap-1 mb-4">
        {creditCards.map((card) => {
          const isActive = card.id === activeCardId
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setActiveCardId(card.id)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium
                transition-colors duration-150 cursor-pointer
                ${isActive
                  ? 'bg-primary text-white'
                  : 'text-text-muted hover:bg-offwhite hover:text-text-primary'
                }
              `}
            >
              {getCardShortName(card)}
            </button>
          )
        })}
      </div>

      {/* Card da tabela */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {/* Navegador de mês */}
        <MonthNavigator
          year={year}
          month={month}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          isCurrentMonth={isCurrentMonth}
        />

        {/* Tabela */}
        <table className="w-full">
          <thead>
            <tr className="border-t border-b border-border">
              <th className="text-left text-[11px] font-medium text-text-muted uppercase tracking-wider px-4 py-2.5">
                Data
              </th>
              <th className="text-left text-[11px] font-medium text-text-muted uppercase tracking-wider px-4 py-2.5">
                Descrição
              </th>
              <th className="text-left text-[11px] font-medium text-text-muted uppercase tracking-wider px-4 py-2.5">
                Categoria
              </th>
              <th className="text-left text-[11px] font-medium text-text-muted uppercase tracking-wider px-4 py-2.5">
                Valor
              </th>
              <th className="text-left text-[11px] font-medium text-text-muted uppercase tracking-wider px-4 py-2.5">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {cardEntries.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm text-text-muted"
                >
                  Nenhuma despesa neste cartão para o período.
                </td>
              </tr>
            ) : (
              <>
                {cardEntries.map((row, index) => (
                  <tr
                    key={row.id}
                    className={`
                      transition-colors duration-100 hover:bg-offwhite
                      ${index < cardEntries.length - 1 ? 'border-b border-border' : ''}
                    `}
                  >
                    <td className="px-4 py-2.5 text-sm text-text-secondary tabular-nums">
                      {formatDate(row.date)}
                    </td>
                    <td className="px-4 py-2.5 text-sm font-medium text-text-primary">
                      {row.description}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-text-secondary">
                      {row.category}
                    </td>
                    <td className="px-4 py-2.5 text-sm font-semibold tabular-nums text-value-expense">
                      {formatCurrency(row.amount)}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}

                {/* Rodapé com total */}
                <tr className="border-t border-border bg-offwhite">
                  <td colSpan={3} className="px-4 py-2.5 text-sm font-semibold text-text-primary">
                    Total da fatura
                  </td>
                  <td className="px-4 py-2.5 text-sm font-bold tabular-nums text-value-expense">
                    {formatCurrency(totalMonth)}
                  </td>
                  <td />
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Info do cartão */}
      {activeCard && (
        <div className="flex items-center gap-2.5 mt-3 px-1">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: activeCard.color }}
          />
          <span className="text-[11px] text-text-muted">
            {activeCard.label}
          </span>
        </div>
      )}
    </section>
  )
}
