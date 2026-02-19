import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, ArrowLeft, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import StatusBadge from './StatusBadge'
import { useWorkspaceData } from '../contexts/WorkspaceContext'

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

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
  return `${String(date.getDate()).padStart(2, '0')} ${SHORT_MONTHS[date.getMonth()]}`
}

function formatFullDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T12:00:00')
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

export default function AccountStatement({ account, entries, onBack }) {
  const { classifyEntry, classifyReceita } = useWorkspaceData()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear] = useState(now.getFullYear())

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1) }
    else setMonth(month - 1)
  }

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1) }
    else setMonth(month + 1)
  }

  const accountEntries = useMemo(() => {
    return entries
      .filter((e) => {
        if (e.accountId !== account.id) return false
        const dateStr = e.settlementDate || e.dueDate
        if (!dateStr) return false
        const d = new Date(dateStr + 'T12:00:00')
        return d.getFullYear() === year && d.getMonth() === month
      })
      .sort((a, b) => {
        const dA = a.settlementDate || a.dueDate
        const dB = b.settlementDate || b.dueDate
        if (dA < dB) return -1
        if (dA > dB) return 1
        return (a.id || 0) - (b.id || 0)
      })
  }, [entries, account.id, year, month])

  const { totalReceitas, totalDespesas, saldo } = useMemo(() => {
    let receitas = 0
    let despesas = 0
    for (const e of accountEntries) {
      if (e.amount > 0) receitas += e.amount
      else despesas += Math.abs(e.amount)
    }
    return {
      totalReceitas: receitas,
      totalDespesas: despesas,
      saldo: receitas - despesas,
    }
  }, [accountEntries])

  const rows = useMemo(() => {
    let running = 0
    return accountEntries.map((e) => {
      running += e.amount
      return { ...e, runningBalance: running }
    })
  }, [accountEntries])

  return (
    <section>
      {/* Header com voltar */}
      <header className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft size={16} strokeWidth={1.8} />
          Voltar para Contas
        </button>

        <div className="flex items-center gap-3 mb-1">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: account.color }}
          />
          <h2 className="text-2xl font-bold tracking-tight uppercase">
            {account.label}
          </h2>
        </div>
        <p className="text-sm text-text-muted font-semibold">
          Extrato mensal da conta
        </p>
      </header>

      {/* Navegação de mês */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-offwhite transition-colors cursor-pointer"
        >
          <ChevronLeft size={20} strokeWidth={1.8} />
        </button>
        <h3 className="text-lg font-bold tracking-tight">
          {MONTH_NAMES[month]} {year}
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-offwhite transition-colors cursor-pointer"
        >
          <ChevronRight size={20} strokeWidth={1.8} />
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-value-income" />
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Entradas
            </span>
          </div>
          <p className="text-xl font-bold text-value-income">
            {formatCurrency(totalReceitas)}
          </p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={16} className="text-value-expense" />
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Saídas
            </span>
          </div>
          <p className="text-xl font-bold text-value-expense">
            {formatCurrency(-totalDespesas)}
          </p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={16} className="text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Resultado do mês
            </span>
          </div>
          <p className={`text-xl font-bold ${saldo >= 0 ? 'text-value-income' : 'text-value-expense'}`}>
            {formatCurrency(saldo)}
          </p>
        </div>
      </div>

      {/* Tabela de extrato */}
      {rows.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <p className="text-sm font-medium">Nenhum lançamento neste mês.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-primary text-white">
                <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">
                  Data
                </th>
                <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wider">
                  Descrição
                </th>
                <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">
                  Categoria
                </th>
                <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">
                  Status
                </th>
                <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">
                  Valor
                </th>
                <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">
                  Saldo
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const dateStr = row.settlementDate || row.dueDate
                const isCredit = row.amount > 0
                const isN2 = row.rateioLevel === 2
                const prevDate = idx > 0 ? (rows[idx - 1].settlementDate || rows[idx - 1].dueDate) : null
                const showDateSep = idx === 0 || dateStr !== prevDate

                return (
                  <tr
                    key={row.id || idx}
                    className={`
                      border-b border-border/50 transition-colors
                      ${isN2 ? 'bg-amber-50/20 hover:bg-amber-50/40' : 'hover:bg-offwhite/60'}
                      ${showDateSep && idx > 0 ? 'border-t border-border' : ''}
                    `}
                  >
                    <td className={`${isN2 ? 'py-2 text-[13px] text-text-muted/70' : 'py-3 text-text-secondary'} px-4 font-medium tabular-nums whitespace-nowrap`}>
                      {formatDate(dateStr)}
                    </td>
                    <td className={`px-4 ${isN2 ? 'py-2' : 'py-3'}`}>
                      <span className={isN2 ? 'text-[13px] text-text-secondary/75 font-normal pl-4' : 'text-text-primary font-medium'}>{row.description}</span>
                      {!isN2 && (
                        <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted bg-offwhite px-1.5 py-0.5 rounded-full whitespace-nowrap">
                          {row.type === 'Receita' ? classifyReceita(row) : classifyEntry(row)}
                        </span>
                      )}
                      {row._isEstimativa && (
                        <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                          Estimativa
                        </span>
                      )}
                    </td>
                    <td className={`px-4 whitespace-nowrap ${isN2 ? 'py-2' : 'py-3'}`}>
                      <span className={isN2 ? 'text-xs text-text-muted/60 capitalize' : 'text-xs text-text-muted capitalize'}>
                        {(row.categoryId || '').replace(/-/g, ' ')}
                      </span>
                    </td>
                    <td className={`px-4 whitespace-nowrap ${isN2 ? 'py-2' : 'py-3'}`}>
                      <StatusBadge status={row.status} />
                    </td>
                    <td className={`px-4 text-right tabular-nums whitespace-nowrap ${
                      isN2
                        ? `py-2 text-sm font-semibold ${isCredit ? 'text-value-income' : 'text-value-expense'}`
                        : `py-3 font-semibold ${isCredit ? 'text-value-income' : 'text-value-expense'}`
                    }`}>
                      {isCredit ? '+' : ''}{formatCurrency(row.amount)}
                    </td>
                    <td className={`px-4 text-right tabular-nums whitespace-nowrap ${
                      isN2
                        ? 'py-2 text-[13px] font-medium text-text-muted/70'
                        : `py-3 font-bold ${row.runningBalance >= 0 ? 'text-text-primary' : 'text-value-expense'}`
                    }`}>
                      {formatCurrency(row.runningBalance)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-offwhite border-t border-border">
                <td colSpan={4} className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-text-muted">
                  Total do mês ({accountEntries.length} lançamentos)
                </td>
                <td className={`py-3 px-4 text-right font-bold tabular-nums ${saldo >= 0 ? 'text-value-income' : 'text-value-expense'}`}>
                  {formatCurrency(saldo)}
                </td>
                <td className={`py-3 px-4 text-right font-bold tabular-nums ${rows.length > 0 && rows[rows.length - 1].runningBalance >= 0 ? 'text-text-primary' : 'text-value-expense'}`}>
                  {rows.length > 0 ? formatCurrency(rows[rows.length - 1].runningBalance) : '—'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  )
}
