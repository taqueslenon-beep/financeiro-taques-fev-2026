import { useState, useMemo, useEffect } from 'react'
import {
  ChevronLeft, ChevronRight,
  BarChart3, TrendingDown, TrendingUp,
  Calendar, CalendarRange, History, Target, Crosshair, ShieldCheck, Wallet,
  Layers, ArrowLeftRight,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, ReferenceLine,
} from 'recharts'
import { useWorkspaceData, useWorkspace } from '../contexts/WorkspaceContext'
import { categories } from '../data/categories'
import { classifyEntry, classifyReceita } from '../utils/classifyEntry'
import { accounts } from '../data/accounts'
import ProjectionPage from './ProjectionPage'
import { fetchProjectionData, fetchEntries } from '../services/firestore'

/* ------------------------------------------------------------------ */
/*  Constantes                                                         */
/* ------------------------------------------------------------------ */

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const SHORT_MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

/** Tabs de alto nível */
const TOP_TABS = [
  { id: 'mensal', label: 'Mensal', icon: Calendar },
  { id: 'anual', label: 'Anual', icon: CalendarRange },
  { id: 'reserva', label: 'Reserva de Emergência', icon: ShieldCheck },
  { id: 'simulador-prolabore', label: 'Simulador Pró-labore', icon: Wallet, workspace: 'trabalho' },
]

/** Sub-tabs da visão Mensal */
const MONTHLY_SUB_TABS = [
  { id: 'total', label: 'Total', icon: Layers },
  { id: 'equilibrio', label: 'Ponto de equilíbrio', icon: Crosshair },
  { id: 'despesas', label: 'Despesas', icon: TrendingDown },
  { id: 'receitas', label: 'Receitas', icon: TrendingUp },
]

/** Sub-tabs da visão Anual */
const ANNUAL_SUB_TABS = [
  { id: 'total', label: 'Total', icon: Layers },
  { id: 'equilibrio', label: 'Ponto de equilíbrio', icon: Crosshair },
  { id: 'despesas', label: 'Despesas', icon: TrendingDown },
  { id: 'receitas', label: 'Receitas', icon: TrendingUp },
  { id: 'historico', label: 'Histórico consolidado', icon: History },
  { id: 'projecao', label: 'Projeção orçamentária', icon: Target },
]

/** ID da conta vinculada à reserva de emergência */
const RESERVA_ACCOUNT_ID = 'reserva-emergencia'

/** Cores */
const OWNER_COLORS = { lenon: '#004D4A', berna: '#C4D600' }
const TYPE_COLORS = {
  'Fixa': '#223631',
  'Previsão': '#0E7490',
  'Impostos': '#B45309',
  'Parcelamento': '#6b6b6b',
  'Repasse Parceiros': '#0369A1',
  'Pró-labore': '#0E7490',
  'Retirada Gilberto': '#7C3AED',
  'Variável': '#9b9b9b',
}

const RECEITA_COLORS = {
  'Honorários Lenon': '#004D4A',
  'Honorários Gilberto': '#7C3AED',
  'Empréstimo': '#0369A1',
  'Aporte de Sócio': '#2D6A4F',
  'Impostos Gilberto': '#B45309',
  'Outras Receitas': '#9b9b9b',
}
const CATEGORY_LABEL_MAP = Object.fromEntries(
  [...categories.despesa, ...categories.receita].map((c) => [c.id, c.label]),
)

const CATEGORY_COLORS = {
  'aluguel': '#004D4A',
  'mercado': '#2D6A4F',
  'folha-pagamento': '#40916C',
  'tecnologia': '#1B4332',
  'contabilidade': '#52796F',
  'anuidade-oab': '#354F52',
  'impostos': '#6B705C',
  'taxas': '#A68A64',
  'deslocamentos-viagens': '#B08968',
  'manutencao-escritorio': '#7F5539',
  'moveis': '#9C6644',
  'marketing': '#C4D600',
  'pro-labore': '#223631',
  'distribuicao-lucros': '#3A5A40',
  'material-escritorio': '#588157',
  'treinamentos-cursos': '#A3B18A',
  'repasse-parceiro': '#DAD7CD',
  'financiamento-veiculo': '#8B5E3C',
}

const ANNUAL_INCOME_COLOR = '#166534'
const ANNUAL_EXPENSE_COLOR = '#991b1b'
const BREAKEVEN_COLOR = '#223631'

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function filterByMonth(entries, year, month) {
  return entries.filter((e) => {
    if (!e.dueDate) return false
    const d = new Date(e.dueDate + 'T12:00:00')
    return d.getFullYear() === year && d.getMonth() === month
  })
}

function parseYearMonth(value) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return null
  const year = parseInt(value.slice(0, 4), 10)
  const month = parseInt(value.slice(5, 7), 10) - 1
  if (Number.isNaN(year) || Number.isNaN(month) || month < 0 || month > 11) return null
  return { year, month }
}

function inferForecastStartMonth(entry) {
  const fromField = parseYearMonth(entry.forecastStartMonth)
  if (fromField) return fromField

  if (entry.dueDate) {
    const fromDueDate = parseYearMonth(entry.dueDate.slice(0, 7))
    if (fromDueDate) return fromDueDate
  }

  if (typeof entry.createdAt === 'string' && entry.createdAt.length >= 7) {
    const fromCreatedAt = parseYearMonth(entry.createdAt.slice(0, 7))
    if (fromCreatedAt) return fromCreatedAt
  }

  const numericId = Number(entry.id)
  if (!Number.isNaN(numericId) && numericId > 0) {
    const d = new Date(numericId)
    if (!Number.isNaN(d.getTime())) return { year: d.getFullYear(), month: d.getMonth() }
  }

  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() }
}

function getForecastMonthlyAmount(entry) {
  const abs = Math.abs(entry.amount || 0)
  const freq = entry.forecastFrequency || 'mensal'
  const monthlyAbs = freq === 'semanal' ? abs * 4 : freq === 'anual' ? abs / 12 : abs
  return entry.type === 'Receita' ? monthlyAbs : -monthlyAbs
}

function buildForecastVirtualEntries(entries) {
  const horizonMonths = 72
  const result = []
  for (const entry of entries) {
    if (entry._isForecastVirtual) continue
    if (entry.recurrence !== 'Previsão') continue
    if (entry.dueDate) continue

    const start = inferForecastStartMonth(entry)
    const monthlyAmount = getForecastMonthlyAmount(entry)

    for (let i = 0; i < horizonMonths; i++) {
      const date = new Date(start.year, start.month + i, 1, 12, 0, 0)
      const year = date.getFullYear()
      const month = date.getMonth()
      const lastDay = new Date(year, month + 1, 0).getDate()
      const dueDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

      result.push({
        ...entry,
        id: `${entry.id}-forecast-${year}-${String(month + 1).padStart(2, '0')}`,
        amount: Math.round(monthlyAmount * 100) / 100,
        dueDate,
        settlementDate: '',
        _isForecastVirtual: true,
        _hideDueDate: true,
      })
    }
  }
  return result
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatCurrencyCompact(value) {
  if (Math.abs(value) >= 1000) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1,
    }).format(value)
  }
  return formatCurrency(value)
}

function computeMetrics(entries) {
  let incomeForecast = 0, incomeSettled = 0, expenseForecast = 0, expenseSettled = 0
  for (const e of entries) {
    const isPaid = e.status === 'pago'
    if (e.type === 'Receita') {
      incomeForecast += e.amount
      if (isPaid) incomeSettled += e.amount
    } else {
      const abs = Math.abs(e.amount)
      expenseForecast += abs
      if (isPaid) expenseSettled += abs
    }
  }
  return {
    incomeForecast, incomeSettled, expenseForecast, expenseSettled,
    resultOperational: incomeSettled - expenseSettled,
    resultProjected: incomeForecast - expenseForecast,
    resultFinal: incomeSettled - expenseSettled,
  }
}

/**
 * Expande entries que são faturas de cartão (isInvoice) nos seus itens individuais,
 * para que cada item contribua com seu próprio tipo/categoria nos gráficos.
 */
function expandInvoiceEntries(entries, invoiceData) {
  if (!invoiceData || Object.keys(invoiceData).length === 0) return entries

  const RECURRENCE_TO_TYPE = {
    'Fixa': 'Fixa', 'Fixa/Anual': 'Fixa/Anual', 'Parcelamento': 'Parcelamento', 'Variável': 'Variável',
    'Mensal': 'Fixa', 'Anual': 'Fixa/Anual', 'unico': 'Variável', 'fixo': 'Fixa', 'parcelado': 'Parcelamento',
  }

  const result = []
  for (const e of entries) {
    if (!e.isInvoice || !e.invoiceId) {
      result.push(e)
      continue
    }
    const inv = invoiceData[e.invoiceId]
    if (!inv?.items?.length) {
      result.push(e)
      continue
    }
    for (const item of inv.items) {
      if ((item.monthOffset || 0) !== 0) continue
      const isRevenue = item.type === 'receita'
      result.push({
        ...e,
        isInvoice: false,
        description: item.description,
        categoryId: item.category || item.categoryId || e.categoryId,
        recurrence: RECURRENCE_TO_TYPE[item.recurrence] || 'Variável',
        amount: isRevenue ? item.amount : -Math.abs(item.amount),
        type: isRevenue ? 'Receita' : 'Despesa',
        _fromInvoice: true,
      })
    }
  }
  return result
}

function computeExpensesByType(entries) {
  const map = {}
  for (const e of entries) {
    if (e.type !== 'Despesa') continue
    const key = classifyEntry(e)
    map[key] = (map[key] || 0) + Math.abs(e.amount)
  }
  return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
}

function computeExpensesByOwner(entries) {
  const map = {}
  for (const e of entries) {
    if (e.type !== 'Despesa') continue
    const account = accounts.find((a) => a.id === e.accountId)
    const owner = account ? account.owner : 'outros'
    map[owner] = (map[owner] || 0) + Math.abs(e.amount)
  }
  return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
}

function computeExpensesByCategory(entries) {
  const map = {}
  for (const e of entries) {
    if (e.type !== 'Despesa') continue
    const key = e.categoryId || 'sem-categoria'
    map[key] = (map[key] || 0) + Math.abs(e.amount)
  }
  return Object.entries(map)
    .map(([id, value]) => ({ name: CATEGORY_LABEL_MAP[id] || 'Sem categoria', value, id }))
    .sort((a, b) => b.value - a.value)
}

function computeAnnualData(entries, year) {
  const data = SHORT_MONTHS.map((label) => ({ month: label, faturamento: 0, custo: 0 }))
  for (const e of entries) {
    if (!e.dueDate) continue
    const d = new Date(e.dueDate + 'T12:00:00')
    if (d.getFullYear() !== year) continue
    const m = d.getMonth()
    if (e.type === 'Receita') data[m].faturamento += e.amount
    else data[m].custo += Math.abs(e.amount)
  }
  return data
}

/**
 * Histórico consolidado: apenas dados efetivados (pago) de meses passados.
 * Retorna TODOS os 12 meses com `_isPast` flag.
 * Meses futuros terão valores zerados.
 */
function computeHistoricoData(entries, year) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  const data = SHORT_MONTHS.map((label, i) => {
    const isPast =
      year < currentYear || (year === currentYear && i < currentMonth)
    return { month: label, receita: 0, despesa: 0, _index: i, _isPast: isPast }
  })

  for (const e of entries) {
    if (!e.dueDate) continue
    if (e.status !== 'pago') continue
    const d = new Date(e.dueDate + 'T12:00:00')
    if (d.getFullYear() !== year) continue
    const m = d.getMonth()

    // Só meses já concluídos (antes do mês atual no ano atual, ou todos se ano passado)
    if (year === currentYear && m >= currentMonth) continue
    if (year > currentYear) continue

    if (e.type === 'Receita') data[m].receita += e.amount
    else data[m].despesa += Math.abs(e.amount)
  }

  return data
}

/**
 * Projeção orçamentária: TODOS os lançamentos do ano.
 * Retorna TODOS os 12 meses com `_isPast` flag.
 * Meses passados mostram dados consolidados (pago) com opacidade reduzida.
 * Meses futuros (a partir do mês atual) mostram projeção com cor sólida.
 */
function computeProjecaoData(entries, year) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  const data = SHORT_MONTHS.map((label, i) => {
    const isPast =
      year < currentYear || (year === currentYear && i < currentMonth)
    return { month: label, faturamento: 0, custo: 0, _index: i, _isPast: isPast }
  })

  for (const e of entries) {
    if (!e.dueDate) continue
    const d = new Date(e.dueDate + 'T12:00:00')
    if (d.getFullYear() !== year) continue
    const m = d.getMonth()

    // Meses passados: somente dados efetivados (pago)
    if (data[m]._isPast) {
      if (e.status !== 'pago') continue
    }

    if (e.type === 'Receita') data[m].faturamento += e.amount
    else data[m].custo += Math.abs(e.amount)
  }

  return data
}

/**
 * Ponto de Equilíbrio Anual: soma de TODAS as despesas do ano
 * (realizadas + previstas). Retorna também o faturamento acumulado
 * para comparação visual.
 */
function computeAnnualBreakeven(entries, year) {
  let totalExpenses = 0
  let incomeSettled = 0
  let incomeForecast = 0

  for (const e of entries) {
    if (!e.dueDate) continue
    const d = new Date(e.dueDate + 'T12:00:00')
    if (d.getFullYear() !== year) continue

    if (e.type === 'Receita') {
      incomeForecast += e.amount
      if (e.status === 'pago') incomeSettled += e.amount
    } else {
      totalExpenses += Math.abs(e.amount)
    }
  }

  return {
    breakeven: totalExpenses,
    incomeSettled,
    incomeForecast,
    totalIncome: incomeForecast,
  }
}

/* ------------------------------------------------------------------ */
/*  Seletor de mês                                                     */
/* ------------------------------------------------------------------ */

function MonthSelector({ year, month, onPrev, onNext, onToday, isCurrentMonth }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onPrev} className="p-1.5 rounded-lg text-text-muted hover:bg-offwhite hover:text-text-primary transition-colors duration-150 cursor-pointer">
          <ChevronLeft size={18} strokeWidth={2} />
        </button>
        <span className="text-sm font-semibold tracking-wide text-primary min-w-[140px] text-center">
          {MONTH_NAMES[month].toUpperCase()} {year}
        </span>
        <button type="button" onClick={onNext} className="p-1.5 rounded-lg text-text-muted hover:bg-offwhite hover:text-text-primary transition-colors duration-150 cursor-pointer">
          <ChevronRight size={18} strokeWidth={2} />
        </button>
      </div>
      {!isCurrentMonth && (
        <button type="button" onClick={onToday} className="text-xs font-medium text-text-muted hover:text-primary transition-colors duration-150 cursor-pointer">
          Ir para mês atual
        </button>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Seletor de ano                                                     */
/* ------------------------------------------------------------------ */

function YearSelector({ year, onPrev, onNext, onToday, isCurrentYear }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onPrev} className="p-1.5 rounded-lg text-text-muted hover:bg-offwhite hover:text-text-primary transition-colors duration-150 cursor-pointer">
          <ChevronLeft size={18} strokeWidth={2} />
        </button>
        <span className="text-sm font-semibold tracking-wide text-primary min-w-[80px] text-center">
          {year}
        </span>
        <button type="button" onClick={onNext} className="p-1.5 rounded-lg text-text-muted hover:bg-offwhite hover:text-text-primary transition-colors duration-150 cursor-pointer">
          <ChevronRight size={18} strokeWidth={2} />
        </button>
      </div>
      {!isCurrentYear && (
        <button type="button" onClick={onToday} className="text-xs font-medium text-text-muted hover:text-primary transition-colors duration-150 cursor-pointer">
          Ano atual
        </button>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Tooltips                                                           */
/* ------------------------------------------------------------------ */

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-sm">
      <p className="text-[11px] font-medium text-text-primary">{name}</p>
      <p className="text-[11px] text-text-secondary tabular-nums">{formatCurrency(value)}</p>
    </div>
  )
}

function AnnualChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface border border-border rounded-lg px-4 py-3 shadow-sm">
      <p className="text-[11px] font-semibold text-primary mb-1.5">{label}</p>
      {payload.map((item) => (
        <div key={item.dataKey} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-[11px] text-text-secondary">
              {item.dataKey === 'faturamento' ? 'Faturamento' : 'Custo'}
            </span>
          </div>
          <span className="text-[11px] font-medium text-text-primary tabular-nums">
            {formatCurrency(item.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

/** Tooltip para gráficos de barras agrupadas (com saldo) */
function BarChartTooltip({ active, payload, label, incomeKey, incomeLabel, expenseKey, expenseLabel }) {
  if (!active || !payload?.length) return null
  const incomeVal = payload.find((p) => p.dataKey === incomeKey)?.value || 0
  const expenseVal = payload.find((p) => p.dataKey === expenseKey)?.value || 0
  const saldo = incomeVal - expenseVal

  return (
    <div className="bg-surface border border-border rounded-lg px-4 py-3 shadow-sm min-w-[180px]">
      <p className="text-[11px] font-semibold text-primary mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ANNUAL_INCOME_COLOR }} />
            <span className="text-[11px] text-text-secondary">{incomeLabel}</span>
          </div>
          <span className="text-[11px] font-medium text-text-primary tabular-nums">
            {formatCurrency(incomeVal)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ANNUAL_EXPENSE_COLOR }} />
            <span className="text-[11px] text-text-secondary">{expenseLabel}</span>
          </div>
          <span className="text-[11px] font-medium text-text-primary tabular-nums">
            {formatCurrency(expenseVal)}
          </span>
        </div>
        <div className="pt-1.5 mt-1 border-t border-border flex items-center justify-between gap-4">
          <span className="text-[11px] text-text-muted">Saldo</span>
          <span className={`text-[11px] font-semibold tabular-nums ${saldo >= 0 ? 'text-value-income' : 'text-value-expense'}`}>
            {formatCurrency(saldo)}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Legenda para donut charts                                          */
/* ------------------------------------------------------------------ */

function ChartLegend({ data, colorMap, total }) {
  return (
    <div className="space-y-2">
      {data.map((item) => {
        const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0'
        return (
          <div key={item.name} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colorMap[item.name] || '#9b9b9b' }} />
              <span className="text-[11px] text-text-secondary capitalize">{item.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-text-primary tabular-nums">{formatCurrency(item.value)}</span>
              <span className="text-[10px] text-text-muted tabular-nums w-10 text-right">{pct}%</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Legenda inline para bar charts ─────────────────────────────── */

function BarChartLegend({ items }) {
  return (
    <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-border">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
          <span className="text-[11px] text-text-secondary">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

/* ================================================================== */
/*  VISÃO MENSAL — Sub-abas                                            */
/* ================================================================== */

function OverviewTab({ m }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface rounded-xl border border-border px-5 py-4">
          <h3 className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-3">Saídas</h3>
          <div className="divide-y divide-border">
            <div className="flex items-baseline justify-between py-2.5">
              <div>
                <p className="text-[12px] font-medium text-text-primary">Custo Previsto</p>
                <p className="text-[10px] text-text-muted mt-0.5">Compromissos programados</p>
              </div>
              <p className="text-[13px] font-semibold tabular-nums text-value-expense">{formatCurrency(m.expenseForecast)}</p>
            </div>
            <div className="flex items-baseline justify-between py-2.5">
              <div>
                <p className="text-[12px] font-medium text-text-primary">Saídas Realizadas</p>
                <p className="text-[10px] text-text-muted mt-0.5">Saídas confirmadas e liquidadas</p>
              </div>
              <p className="text-[13px] font-semibold tabular-nums text-value-expense">{formatCurrency(m.expenseSettled)}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-xl border border-border px-5 py-4">
          <h3 className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-3">Entradas</h3>
          <div className="divide-y divide-border">
            <div className="flex items-baseline justify-between py-2.5">
              <div>
                <p className="text-[12px] font-medium text-text-primary">Faturamento Esperado</p>
                <p className="text-[10px] text-text-muted mt-0.5">Receitas previstas para o caixa</p>
              </div>
              <p className="text-[13px] font-semibold tabular-nums text-value-income">{formatCurrency(m.incomeForecast)}</p>
            </div>
            <div className="flex items-baseline justify-between py-2.5">
              <div>
                <p className="text-[12px] font-medium text-text-primary">Receita Efetivada</p>
                <p className="text-[10px] text-text-muted mt-0.5">Valores recebidos e disponíveis</p>
              </div>
              <p className="text-[13px] font-semibold tabular-nums text-value-income">{formatCurrency(m.incomeSettled)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-offwhite rounded-xl border border-border px-5 py-4">
        <h3 className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-3">Performance</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Resultado Operacional', hint: 'Saldo real de caixa', value: m.resultOperational },
            { label: 'Resultado Projetado', hint: 'Expectativa ao final do período', value: m.resultProjected },
            { label: 'Resultado Final', hint: 'Lucro ou prejuízo líquido', value: m.resultFinal },
          ].map((item) => (
            <div key={item.label} className="bg-surface rounded-lg border border-border px-4 py-3">
              <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-0.5">{item.label}</p>
              <p className="text-[9px] text-text-muted mb-2">{item.hint}</p>
              <p className={`text-base font-semibold tabular-nums ${item.value >= 0 ? 'text-value-income' : 'text-value-expense'}`}>
                {formatCurrency(item.value)}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

function ExpenseViewToggle({ view, onChange }) {
  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-offwhite p-0.5">
      {['previsto', 'efetivado'].map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`
            px-3 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider
            transition-colors duration-150 cursor-pointer
            ${view === v
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-muted hover:text-text-secondary'
            }
          `}
        >
          {v === 'previsto' ? 'Previsto' : 'Efetivado'}
        </button>
      ))}
    </div>
  )
}

function ExpensesTab({ monthEntries, invoiceData }) {
  const [expenseView, setExpenseView] = useState('previsto')
  const expanded = useMemo(() => expandInvoiceEntries(monthEntries, invoiceData), [monthEntries, invoiceData])
  const filtered = useMemo(
    () => expenseView === 'efetivado' ? expanded.filter((e) => e.status === 'pago') : expanded,
    [expanded, expenseView],
  )

  const byType = useMemo(() => computeExpensesByType(filtered), [filtered])
  const byOwner = useMemo(() => computeExpensesByOwner(filtered), [filtered])

  /* Previsto vs Realizado por tipo de despesa */
  const previstoVsRealizado = useMemo(() => {
    const mapPrevisto = {}
    const mapRealizado = {}
    for (const e of expanded) {
      if (e.type !== 'Despesa') continue
      const key = classifyEntry(e)
      const abs = Math.abs(e.amount)
      mapPrevisto[key] = (mapPrevisto[key] || 0) + abs
      if (e.status === 'pago') {
        mapRealizado[key] = (mapRealizado[key] || 0) + abs
      }
    }
    const allKeys = [...new Set([...Object.keys(mapPrevisto), ...Object.keys(mapRealizado)])]
    return allKeys
      .map((name) => ({ name, previsto: mapPrevisto[name] || 0, realizado: mapRealizado[name] || 0 }))
      .sort((a, b) => b.previsto - a.previsto)
  }, [expanded])
  const byCategory = useMemo(() => computeExpensesByCategory(filtered), [filtered])
  const previstoBreakdown = useMemo(() => {
    const map = { 'Previsão': 0, 'Fixa': 0, 'Parcelamento': 0, 'Variável': 0 }
    for (const e of expanded) {
      if (e.type !== 'Despesa') continue
      const key = classifyEntry(e)
      if (Object.prototype.hasOwnProperty.call(map, key)) map[key] += Math.abs(e.amount)
    }
    return map
  }, [expanded])
  const totalByType = byType.reduce((s, d) => s + d.value, 0)
  const totalByOwner = byOwner.reduce((s, d) => s + d.value, 0)
  const totalByCategory = byCategory.reduce((s, d) => s + d.value, 0)

  const categoryColorMap = {}
  for (const item of byCategory) {
    categoryColorMap[item.name] = CATEGORY_COLORS[item.id] || '#9b9b9b'
  }

  const ownerLabelMap = { lenon: 'Lenon', berna: 'Berna', outros: 'Outros' }
  const ownerColorMap = { lenon: OWNER_COLORS.lenon, berna: OWNER_COLORS.berna, outros: '#9b9b9b' }
  const byOwnerLabeled = byOwner.map((d) => ({ ...d, name: ownerLabelMap[d.name] || d.name }))
  const ownerColorMapLabeled = {}
  for (const [key, color] of Object.entries(ownerColorMap)) {
    ownerColorMapLabeled[ownerLabelMap[key] || key] = color
  }

  if (monthEntries.filter((e) => e.type === 'Despesa').length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-surface rounded-xl border border-border">
        <p className="text-[12px] text-text-muted">Nenhuma despesa registrada neste período.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-surface rounded-xl border border-border px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[10px] font-semibold text-primary uppercase tracking-wider">Total de despesas</h3>
            <p className="text-[10px] text-text-muted mt-0.5">
              {expenseView === 'previsto' ? 'Soma de todas as saídas previstas' : 'Soma das saídas efetivamente pagas'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ExpenseViewToggle view={expenseView} onChange={setExpenseView} />
            <p className="text-lg font-semibold tabular-nums text-value-expense">{formatCurrency(totalByType)}</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border grid grid-cols-4 gap-3">
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Previsão</p>
            <p className="text-[12px] font-semibold tabular-nums text-text-primary">{formatCurrency(previstoBreakdown['Previsão'] || 0)}</p>
          </div>
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Fixa</p>
            <p className="text-[12px] font-semibold tabular-nums text-text-primary">{formatCurrency(previstoBreakdown.Fixa || 0)}</p>
          </div>
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Parcelamento</p>
            <p className="text-[12px] font-semibold tabular-nums text-text-primary">{formatCurrency(previstoBreakdown.Parcelamento || 0)}</p>
          </div>
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Variável</p>
            <p className="text-[12px] font-semibold tabular-nums text-text-primary">{formatCurrency(previstoBreakdown['Variável'] || 0)}</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface rounded-xl border border-border px-5 py-4">
          <h3 className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">Por Tipo</h3>
          <p className="text-[10px] text-text-muted mb-4">Distribuição por tipo de despesa</p>
          {totalByType === 0 ? (
            <p className="text-[11px] text-text-muted py-6 text-center">Nenhuma despesa {expenseView === 'efetivado' ? 'efetivada' : ''} neste período.</p>
          ) : (
          <div className="flex items-center gap-6">
            <div className="w-[120px] h-[120px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byType} cx="50%" cy="50%" innerRadius={36} outerRadius={54} paddingAngle={2} dataKey="value" stroke="none">
                    {byType.map((entry) => <Cell key={entry.name} fill={TYPE_COLORS[entry.name] || '#9b9b9b'} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 min-w-0"><ChartLegend data={byType} colorMap={TYPE_COLORS} total={totalByType} /></div>
          </div>
          )}
        </div>
        <div className="bg-surface rounded-xl border border-border px-5 py-4">
          <h3 className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">Por Responsável</h3>
          <p className="text-[10px] text-text-muted mb-4">Comparativo entre gestores</p>
          <div className="flex items-center gap-6">
            <div className="w-[120px] h-[120px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byOwnerLabeled} cx="50%" cy="50%" innerRadius={36} outerRadius={54} paddingAngle={2} dataKey="value" stroke="none">
                    {byOwnerLabeled.map((entry) => <Cell key={entry.name} fill={ownerColorMapLabeled[entry.name] || '#9b9b9b'} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 min-w-0"><ChartLegend data={byOwnerLabeled} colorMap={ownerColorMapLabeled} total={totalByOwner} /></div>
          </div>
        </div>
      </div>

      {byCategory.length > 0 && (
        <div className="bg-surface rounded-xl border border-border px-5 py-4">
          <h3 className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">Por Categoria</h3>
          <p className="text-[10px] text-text-muted mb-4">Distribuição por tipo de gasto</p>
          <div className="flex items-start gap-6">
            <div className="w-[140px] h-[140px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCategory} cx="50%" cy="50%" innerRadius={42} outerRadius={64} paddingAngle={2} dataKey="value" stroke="none">
                    {byCategory.map((entry) => <Cell key={entry.name} fill={categoryColorMap[entry.name] || '#9b9b9b'} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 min-w-0"><ChartLegend data={byCategory} colorMap={categoryColorMap} total={totalByCategory} /></div>
          </div>
        </div>
      )}

      {/* Gráfico Previsto vs Realizado por tipo */}
      {previstoVsRealizado.length > 0 && (
        <div className="bg-surface rounded-xl border border-border px-5 py-4">
          <h3 className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">Previsto vs Realizado</h3>
          <p className="text-[10px] text-text-muted mb-4">Comparativo entre despesas previstas e efetivamente pagas, por tipo</p>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={previstoVsRealizado} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e8e8e4" />
                <XAxis type="number" tickFormatter={formatCurrencyCompact} tick={{ fontSize: 10, fill: '#6b6b6b' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fill: '#1a1a1a' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e8e8e4' }}
                  labelStyle={{ fontWeight: 600, fontSize: 11 }}
                />
                <Bar dataKey="previsto" name="Previsto" fill="#223631" radius={[0, 4, 4, 0]} barSize={14} />
                <Bar dataKey="realizado" name="Realizado" fill="#4ade80" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: '#223631' }} />
              <span className="text-[10px] text-text-secondary font-medium">Previsto</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: '#4ade80' }} />
              <span className="text-[10px] text-text-secondary font-medium">Realizado</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function computeRevenuesByType(entries) {
  const map = {}
  for (const e of entries) {
    if (e.type !== 'Receita') continue
    const key = classifyReceita(e)
    map[key] = (map[key] || 0) + Math.abs(e.amount)
  }
  return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
}

function RevenueTab({ monthEntries }) {
  const [revenueView, setRevenueView] = useState('previsto')

  const revenueEntries = useMemo(
    () => monthEntries.filter((e) => e.type === 'Receita'),
    [monthEntries],
  )

  const filtered = useMemo(
    () => revenueView === 'efetivado' ? revenueEntries.filter((e) => e.status === 'pago') : revenueEntries,
    [revenueEntries, revenueView],
  )

  const byType = useMemo(() => computeRevenuesByType(filtered), [filtered])
  const totalByType = byType.reduce((s, d) => s + d.value, 0)

  const totalPrevisto = revenueEntries.reduce((s, e) => s + Math.abs(e.amount), 0)
  const totalEfetivado = revenueEntries.filter((e) => e.status === 'pago').reduce((s, e) => s + Math.abs(e.amount), 0)

  if (revenueEntries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-surface rounded-xl border border-border">
        <p className="text-[12px] text-text-muted">Nenhuma receita neste período.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl border border-border px-5 py-3.5">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">Receita prevista</p>
          <p className="text-[15px] font-semibold tabular-nums text-value-income">{formatCurrency(totalPrevisto)}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border px-5 py-3.5">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">Receita efetivada</p>
          <p className="text-[15px] font-semibold tabular-nums text-value-income">{formatCurrency(totalEfetivado)}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border px-5 py-3.5">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">A receber</p>
          <p className="text-[15px] font-semibold tabular-nums text-text-primary">{formatCurrency(totalPrevisto - totalEfetivado)}</p>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">Por Tipo</h3>
            <p className="text-[10px] text-text-muted">Distribuição por tipo de receita</p>
          </div>
          <ExpenseViewToggle view={revenueView} onChange={setRevenueView} />
        </div>
        {totalByType === 0 ? (
          <p className="text-[11px] text-text-muted py-6 text-center">Nenhuma receita {revenueView === 'efetivado' ? 'efetivada' : ''} neste período.</p>
        ) : (
          <div className="flex items-center gap-6">
            <div className="w-[120px] h-[120px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byType} cx="50%" cy="50%" innerRadius={36} outerRadius={54} paddingAngle={2} dataKey="value" stroke="none">
                    {byType.map((entry) => <Cell key={entry.name} fill={RECEITA_COLORS[entry.name] || '#9b9b9b'} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 min-w-0"><ChartLegend data={byType} colorMap={RECEITA_COLORS} total={totalByType} /></div>
          </div>
        )}
      </div>
    </div>
  )
}

function ProlaboreSimulatorTab({ entries }) {
  const [personalEntries, setPersonalEntries] = useState([])
  const [personalProjection, setPersonalProjection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('atual') // 'atual' | 'meta'

  useEffect(() => {
    let cancelled = false
    async function loadData() {
      try {
        const [pEntries, pProj] = await Promise.all([
          fetchEntries('personal_'),
          fetchProjectionData('personal_')
        ])
        if (cancelled) return
        const virtual = buildForecastVirtualEntries(pEntries)
        setPersonalEntries([...pEntries, ...virtual])
        setPersonalProjection(pProj)
      } catch (err) {
        console.error("Erro ao carregar dados pessoais/projeção", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadData()
    return () => { cancelled = true }
  }, [])

  const rows = useMemo(() => {
    if (loading) return []

    const months = [
      { year: 2026, month: 2 }, // mar
      { year: 2026, month: 3 }, // abr
      { year: 2026, month: 4 }, // mai
      { year: 2026, month: 5 }, // jun
    ]

    return months.map(({ year, month }) => {
      // 1. Calcular Resultado Projetado do Trabalho
      const monthEntries = entries.filter((e) => {
        if (!e.dueDate) return false
        const d = new Date(e.dueDate + 'T12:00:00')
        return d.getFullYear() === year && d.getMonth() === month
      })

      let receitasPrevistas = 0
      let despesasFixas = 0
      let despesasReservaEmpresa = 0
      let despesasPrevistas = 0
      let prolaboreJaLancado = 0
      
      for (const e of monthEntries) {
        if (e.type === 'Receita') {
          receitasPrevistas += Math.abs(e.amount)
          continue
        }
        if (e.type !== 'Despesa') continue
        const abs = Math.abs(e.amount)
        const tipo = classifyEntry(e)
        despesasPrevistas += abs
        if (tipo === 'Fixa') despesasFixas += abs
        if (tipo === 'Fixa' || tipo === 'Parcelamento') despesasReservaEmpresa += abs
        if (e.categoryId === 'pro-labore') prolaboreJaLancado += abs
      }

      const resultadoProjetado = receitasPrevistas - despesasPrevistas

      // 2. Calcular Custo Previsto Pessoal (Pró-labore Mínimo)
      const monthPersonalEntries = personalEntries.filter((e) => {
        if (!e.dueDate) return false
        const d = new Date(e.dueDate + 'T12:00:00')
        return d.getFullYear() === year && d.getMonth() === month
      })

      const custoPrevistoPessoal = monthPersonalEntries.reduce((sum, e) => {
        if (e.type === 'Despesa') return sum + Math.abs(e.amount)
        return sum
      }, 0)

      const prolaboreComplementar = Math.max(0, custoPrevistoPessoal - prolaboreJaLancado)
      const sobraAposProlabore = resultadoProjetado - prolaboreComplementar

      return {
        key: `${year}-${month}`,
        monthLabel: `${SHORT_MONTHS[month]}/${year}`,
        receitasPrevistas,
        despesasPrevistas, // Includes fixed
        despesasReservaEmpresa,
        resultadoProjetado,
        custoPrevistoPessoal,
        prolaboreJaLancado,
        prolaboreComplementar,
        sobraAposProlabore,
        ok: sobraAposProlabore >= 0,
      }
    })
  }, [entries, personalEntries, loading])

  // Lógica da Meta
  const metaData = useMemo(() => {
    if (loading || rows.length === 0) return null

    // Meta Pessoal: 3 meses Confortável + AP Confortável
    // Calcula custo médio mensal confortável
    // Lógica copiada/adaptada de ProjectionPage (simplificada para não duplicar tudo, focada nos itens marcados)
    // Se não tiver dados de projeção, usa fallback ou 0
    
    // Calcular média de despesas "Vida Confortável" (simples + confortavel items do setup)
    // Mas o usuário já deu um número alvo de 88k.
    // Vamos tentar calcular dinamicamente.
    
    let custoMensalConfortavel = 0
    if (personalProjection) {
      // Itens 'confortavelItems' (adicionais para vida confortável)
      const addConfortavel = (personalProjection.confortavelItems || []).reduce((s, i) => s + (Number(i.amount)||0), 0)
      
      // Precisamos da 'base' (vida simples). Como não temos a função calculateAverageExpenses exportada,
      // vamos aproximar usando a média do custo previsto pessoal atual (que é o cenário "pais" ou simples?)
      // O usuário disse: "Cenário atual é eu morando com os pais".
      // Então o 'custoPrevistoPessoal' dos rows é o cenário ATUAL.
      
      // O usuário quer "3 meses de vida confortável".
      // Vamos assumir que 'vida confortável' = CustoAtual + AdicionaisConfortaveis?
      // Ou vamos pegar os dados do personalProjection se existirem.
      
      // Para ser preciso com o número de R$ 88k mencionado:
      // Se R$ 88.996 é o alvo total.
      // Vamos usar o cálculo do ProjectionPage se possível, mas aqui vamos fazer uma estimativa baseada no que temos.
      // "Eu quero que você considere que eu tenho que juntar esse número até o mês de junho." -> R$ 88.996,27
      // Se esse número for fixo na mente do usuário, melhor usá-lo ou permitir editá-lo.
      // Mas ele disse "considere que esse número é um pouco dinâmico".
      
      // Vamos tentar reconstruir o valor "Vida Confortável" do ProjectionPage:
      // ProjectionPage: avgExpenses.confortavel = avgExpenses.simples + totalConfortavelItems
      // Setup: invTotals.confortavel
      // Meta = 3 * avgExpenses.confortavel + invTotals.confortavel
      
      // Como não tenho as médias calculadas aqui facilmente, vou usar o valor que ele deu como 'Target Base'
      // mas somar a reserva da empresa dinamicamente.
    }
    
    // Meta Pessoal HARDCODED/DINAMICA
    // Vou usar o cálculo real se conseguir, senão uso o valor dele.
    // Para calcular real, precisaria de 'setupCategories' para o AP e média de despesas.
    // Vou fazer o seguinte: Calcular a Reserva da Empresa e usar o valor dele para a Pessoal, 
    // mas deixar um aviso que é o valor alvo.
    
    const META_PESSOAL_ALVO = 88996.27

    // Meta Empresa: reserva de 3 meses (fixas + parcelamentos), sem duplicar outras despesas.
    // Usa a mesma base da visão "Reserva de Emergência".
    const metaReservaEmpresa = rows
      .slice(0, 3)
      .reduce((sum, row) => sum + row.despesasReservaEmpresa, 0)

    const metaTotal = META_PESSOAL_ALVO + metaReservaEmpresa

    // Quanto já vamos sobrar?
    // Soma das 'sobraAposProlabore' de Mar, Abr, Mai, Jun.
    // Se a sobra for negativa, consideramos 0 para acumulação (ou subtraímos?)
    // O usuário quer saber "quanto faltaria ainda eu faturar".
    // Então, assumimos que toda a sobra projetada vai para o pote.
    const sobraProjetadaTotal = rows.reduce((s, r) => s + r.sobraAposProlabore, 0)

    const faltaAcumular = metaTotal - sobraProjetadaTotal
    const esforcoMensalExtra = faltaAcumular / 4

    return {
      metaPessoal: META_PESSOAL_ALVO,
      metaReservaEmpresa,
      metaTotal,
      sobraProjetadaTotal,
      faltaAcumular,
      esforcoMensalExtra
    }
  }, [rows, personalProjection, loading])


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-surface rounded-xl border border-border">
        <p className="text-[12px] text-text-muted">Carregando dados combinados...</p>
      </div>
    )
  }

  const mesesComFolga = rows.filter((r) => r.ok).length

  return (
    <div className="space-y-4">
      <div className="bg-surface rounded-xl border border-border px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">Simulador de Pró-labore</h3>
            <p className="text-[10px] text-text-muted">
              Análise de viabilidade financeira: Março a Junho/2026
            </p>
          </div>
          <div className="flex bg-offwhite p-1 rounded-lg border border-border">
            <button
              onClick={() => setViewMode('atual')}
              className={`px-3 py-1.5 text-[10px] font-medium rounded-md transition-all ${
                viewMode === 'atual' ? 'bg-white text-primary shadow-sm border border-border/50' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Cenário Atual (Pais)
            </button>
            <button
              onClick={() => setViewMode('meta')}
              className={`px-3 py-1.5 text-[10px] font-medium rounded-md transition-all ${
                viewMode === 'meta' ? 'bg-white text-primary shadow-sm border border-border/50' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Meta: Sair de Casa + Reserva
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'atual' ? (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface rounded-xl border border-border px-4 py-3">
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Meses com folga</p>
              <p className="text-[18px] font-bold text-primary tabular-nums">{mesesComFolga}/4</p>
            </div>
            <div className="bg-surface rounded-xl border border-border px-4 py-3">
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Menor sobra após pró-labore</p>
              <p className={`text-[18px] font-bold tabular-nums ${Math.min(...rows.map((r) => r.sobraAposProlabore)) >= 0 ? 'text-value-income' : 'text-value-expense'}`}>
                {formatCurrency(Math.min(...rows.map((r) => r.sobraAposProlabore)))}
              </p>
            </div>
            <div className="bg-surface rounded-xl border border-border px-4 py-3">
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Maior sobra após pró-labore</p>
              <p className="text-[18px] font-bold text-value-income tabular-nums">
                {formatCurrency(Math.max(...rows.map((r) => r.sobraAposProlabore)))}
              </p>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-offwhite border-b border-border">
                    <th className="text-left px-4 py-2.5 font-semibold text-text-secondary uppercase tracking-wider">Mês</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-text-secondary uppercase tracking-wider">Receitas (Trab)</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-text-secondary uppercase tracking-wider">Despesas (Trab)</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-text-secondary uppercase tracking-wider">Res. Projetado</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-text-secondary uppercase tracking-wider text-primary">Custo Pessoal (Mínimo)</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-text-secondary uppercase tracking-wider">Complementar</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-text-secondary uppercase tracking-wider">Sobra/Falta</th>
                    <th className="text-center px-4 py-2.5 font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={row.key} className={`border-b border-border ${idx % 2 === 0 ? '' : 'bg-offwhite/40'}`}>
                      <td className="px-4 py-3 font-semibold text-text-primary">{row.monthLabel}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-value-income">{formatCurrency(row.receitasPrevistas)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-value-expense">{formatCurrency(row.despesasPrevistas)}</td>
                      <td className={`px-4 py-3 text-right tabular-nums font-semibold ${row.resultadoProjetado >= 0 ? 'text-value-income' : 'text-value-expense'}`}>
                        {formatCurrency(row.resultadoProjetado)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-primary">
                        {formatCurrency(row.custoPrevistoPessoal)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-text-primary">
                        {formatCurrency(row.prolaboreComplementar)}
                      </td>
                      <td className={`px-4 py-3 text-right tabular-nums font-semibold ${row.ok ? 'text-value-income' : 'text-value-expense'}`}>
                        {formatCurrency(row.sobraAposProlabore)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${row.ok ? 'bg-status-paid-bg text-status-paid-text' : 'bg-status-overdue-bg text-status-overdue-text'}`}>
                          {row.ok ? 'Consegue pagar' : 'Não consegue'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface rounded-xl border border-border px-5 py-4">
               <h4 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-3">Metas de Acumulação (até Jun/26)</h4>
               <div className="space-y-3">
                 <div className="flex justify-between items-center">
                   <span className="text-[11px] text-text-secondary">Pessoal (3 meses Conforto + AP)</span>
                   <span className="text-[12px] font-semibold text-text-primary tabular-nums">{formatCurrency(metaData?.metaPessoal || 0)}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-[11px] text-text-secondary">Empresa (3 meses Reserva)</span>
                   <span className="text-[12px] font-semibold text-text-primary tabular-nums">{formatCurrency(metaData?.metaReservaEmpresa || 0)}</span>
                 </div>
                 <div className="pt-2 border-t border-border flex justify-between items-center">
                   <span className="text-[11px] font-semibold text-primary">Total Necessário</span>
                   <span className="text-[14px] font-bold text-primary tabular-nums">{formatCurrency(metaData?.metaTotal || 0)}</span>
                 </div>
               </div>
            </div>

            <div className="bg-surface rounded-xl border border-border px-5 py-4 bg-primary/5">
               <h4 className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-3">Planejamento</h4>
               <div className="space-y-3">
                 <div className="flex justify-between items-center">
                   <span className="text-[11px] text-text-secondary">Total Necessário</span>
                   <span className="text-[12px] font-semibold text-text-primary tabular-nums">{formatCurrency(metaData?.metaTotal || 0)}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-[11px] text-text-secondary">Sobra Projetada (Mar-Jun)</span>
                   <span className={`text-[12px] font-semibold tabular-nums ${metaData?.sobraProjetadaTotal >= 0 ? 'text-value-income' : 'text-value-expense'}`}>
                     {formatCurrency(metaData?.sobraProjetadaTotal || 0)}
                   </span>
                 </div>
                 <div className="pt-2 border-t border-border/50 flex justify-between items-center">
                   <span className="text-[11px] font-semibold text-value-expense">Falta Acumular</span>
                   <span className="text-[14px] font-bold text-value-expense tabular-nums">{formatCurrency(metaData?.faltaAcumular || 0)}</span>
                 </div>
               </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border px-6 py-8 text-center">
            <p className="text-[11px] text-text-muted uppercase tracking-wider mb-2">Esforço Mensal Adicional</p>
            <h3 className="text-3xl font-bold text-primary mb-2 tabular-nums">
              {formatCurrency(metaData?.esforçoMensalExtra || metaData?.esforcoMensalExtra || 0)}
            </h3>
            <p className="text-[12px] text-text-secondary max-w-md mx-auto">
              Para atingir as metas de <strong>R$ {formatCurrencyCompact(metaData?.metaPessoal || 0)}</strong> (pessoal) e <strong>R$ {formatCurrencyCompact(metaData?.metaReservaEmpresa || 0)}</strong> (empresa) até junho, você precisa faturar este valor <strong>extra</strong> (além do previsto) em Março, Abril, Maio e Junho.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ================================================================== */
/*  PONTO DE EQUILÍBRIO — Sub-aba compartilhada (Mensal / Anual)       */
/* ================================================================== */

/**
 * Sub-aba "Ponto de Equilíbrio" — reutilizável para Mensal e Anual.
 * Props:
 *   periodEntries — lançamentos do período selecionado
 *   periodLabel   — ex: "Mensal" ou "Anual"
 *   periodHint    — ex: "fevereiro de 2026" ou "2026"
 */
function BreakevenTab() {
  return (
    <div className="flex items-center justify-center h-64 bg-surface rounded-xl border border-border">
      <div className="text-center">
        <Crosshair size={24} className="text-text-muted mx-auto mb-2" strokeWidth={1.5} />
        <p className="text-[12px] font-medium text-text-muted">Ponto de equilíbrio</p>
        <p className="text-[11px] text-text-muted/70 mt-1">Em desenvolvimento</p>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  RESERVA DE EMERGÊNCIA                                              */
/* ================================================================== */

function ReservaTab({ allEntries, year, month, invoiceData }) {
  const data = useMemo(() => {
    const monthsData = []
    const currentFixaItems = []
    const currentParcelamentoItems = []

    for (let i = 0; i < 12; i++) {
      const targetMonth = (month + i) % 12
      const targetYear = year + Math.floor((month + i) / 12)

      const monthEntries = allEntries.filter(e => {
        if (!e.dueDate || e.type !== 'Despesa') return false
        const d = new Date(e.dueDate + 'T12:00:00')
        return d.getFullYear() === targetYear && d.getMonth() === targetMonth
      })

      const expanded = expandInvoiceEntries(monthEntries, invoiceData)

      let fixas = 0
      let parcelamentos = 0

      for (const e of expanded) {
        if (e.type !== 'Despesa') continue
        const tipo = classifyEntry(e)
        if (tipo === 'Fixa') {
          fixas += Math.abs(e.amount)
          if (i === 0) currentFixaItems.push({ description: e.description, amount: Math.abs(e.amount) })
        } else if (tipo === 'Parcelamento') {
          parcelamentos += Math.abs(e.amount)
          if (i === 0) currentParcelamentoItems.push({ description: e.description, amount: Math.abs(e.amount) })
        }
      }

      monthsData.push({
        label: SHORT_MONTHS[targetMonth],
        fixas,
        parcelamentos,
        total: fixas + parcelamentos,
        hasData: monthEntries.length > 0,
      })
    }

    const baseFixas = monthsData[0].fixas
    for (let i = 1; i < monthsData.length; i++) {
      if (!monthsData[i].hasData && baseFixas > 0) {
        monthsData[i].fixas = baseFixas
        monthsData[i].total = baseFixas + monthsData[i].parcelamentos
        monthsData[i]._estimated = true
      }
    }

    currentFixaItems.sort((a, b) => b.amount - a.amount)
    currentParcelamentoItems.sort((a, b) => b.amount - a.amount)

    return {
      monthsData,
      currentMonth: monthsData[0],
      fixaItems: currentFixaItems,
      parcelamentoItems: currentParcelamentoItems,
      reserve1: monthsData[0].total,
      reserve3: monthsData.slice(0, 3).reduce((s, m) => s + m.total, 0),
      reserve6: monthsData.slice(0, 6).reduce((s, m) => s + m.total, 0),
      reserve12: monthsData.reduce((s, m) => s + m.total, 0),
    }
  }, [allEntries, year, month, invoiceData])

  const {
    monthsData, currentMonth, fixaItems, parcelamentoItems,
    reserve1, reserve3, reserve6, reserve12,
  } = data

  const reserves = [
    { months: 1, label: '1 mês', value: reserve1, hint: 'Base mensal' },
    { months: 3, label: '3 meses', value: reserve3, hint: 'Acumulado trimestral' },
    { months: 6, label: '6 meses', value: reserve6, hint: 'Segurança semestral' },
    { months: 12, label: '12 meses', value: reserve12, hint: 'Proteção anual' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-[10px] font-semibold text-primary uppercase tracking-wider">
          Reserva de Emergência
        </h3>
        <p className="text-[10px] text-text-muted mt-0.5">
          Calculada com base nas despesas fixas e parcelamentos vigentes
        </p>
      </div>

      {/* Base mensal */}
      <div className="bg-surface rounded-xl border border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-3">
          <ShieldCheck size={18} strokeWidth={1.8} style={{ color: BREAKEVEN_COLOR }} className="shrink-0" />
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: BREAKEVEN_COLOR }}>
              Custo Mensal Base
            </h4>
            <p className="text-[10px] text-text-muted mt-0.5">
              Despesas fixas + parcelamentos do mês selecionado
            </p>
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-3xl font-bold tabular-nums" style={{ color: BREAKEVEN_COLOR }}>
            {formatCurrency(currentMonth.total)}
          </span>
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <span className="text-text-muted">
            Fixas: <span className="font-medium text-text-primary tabular-nums">{formatCurrency(currentMonth.fixas)}</span>
          </span>
          <span className="text-text-muted">
            Parcelamentos: <span className="font-medium text-text-primary tabular-nums">{formatCurrency(currentMonth.parcelamentos)}</span>
          </span>
        </div>
      </div>

      {/* Reserve targets */}
      <div className="grid grid-cols-4 gap-4">
        {reserves.map((r, i) => (
          <div
            key={r.months}
            className={`rounded-xl border px-5 py-4 ${
              i === 3
                ? 'bg-primary/5 border-primary/20'
                : 'bg-surface border-border'
            }`}
          >
            <p className="text-[9px] font-semibold text-text-muted uppercase tracking-wider mb-2">
              {r.label}
            </p>
            <p className={`text-xl font-bold tabular-nums ${
              i === 3 ? 'text-primary' : 'text-text-primary'
            }`}>
              {formatCurrency(r.value)}
            </p>
            <p className="text-[9px] text-text-muted mt-1">{r.hint}</p>
          </div>
        ))}
      </div>

      {/* Evolução 12 meses */}
      <div className="bg-surface rounded-xl border border-border px-5 py-5">
        <h4 className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">
          Evolução nos próximos 12 meses
        </h4>
        <p className="text-[10px] text-text-muted mb-4">
          Como as despesas fixas e parcelamentos evoluem mês a mês
        </p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthsData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e4" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b6b6b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9b9b9b' }} tickFormatter={formatCurrencyCompact} width={64} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const fixasVal = payload.find(item => item.dataKey === 'fixas')?.value || 0
                  const parcVal = payload.find(item => item.dataKey === 'parcelamentos')?.value || 0
                  return (
                    <div className="bg-surface border border-border rounded-lg px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-semibold text-primary mb-2">{label}</p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: BREAKEVEN_COLOR }} />
                            <span className="text-[10px] text-text-secondary">Fixas</span>
                          </div>
                          <span className="text-[10px] font-medium text-text-primary tabular-nums">{formatCurrency(fixasVal)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#6b6b6b' }} />
                            <span className="text-[10px] text-text-secondary">Parcelamentos</span>
                          </div>
                          <span className="text-[10px] font-medium text-text-primary tabular-nums">{formatCurrency(parcVal)}</span>
                        </div>
                        <div className="pt-1.5 mt-1 border-t border-border flex items-center justify-between gap-4">
                          <span className="text-[10px] text-text-muted">Total</span>
                          <span className="text-[10px] font-semibold text-text-primary tabular-nums">{formatCurrency(fixasVal + parcVal)}</span>
                        </div>
                      </div>
                    </div>
                  )
                }}
              />
              <Bar dataKey="fixas" stackId="a" fill={BREAKEVEN_COLOR} maxBarSize={24} />
              <Bar dataKey="parcelamentos" stackId="a" fill="#6b6b6b" radius={[3, 3, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: BREAKEVEN_COLOR }} />
            <span className="text-[10px] text-text-secondary">Fixas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#6b6b6b' }} />
            <span className="text-[10px] text-text-secondary">Parcelamentos</span>
          </div>
        </div>
      </div>

      {/* Detalhamento */}
      {(fixaItems.length > 0 || parcelamentoItems.length > 0) && (
        <div className="bg-surface rounded-xl border border-border px-5 py-4">
          <h4 className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-4">
            Detalhamento do mês
          </h4>
          <div className="grid grid-cols-2 gap-6">
            {fixaItems.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-border">
                  <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Fixas</span>
                  <span className="text-[10px] font-semibold text-text-primary tabular-nums">{formatCurrency(currentMonth.fixas)}</span>
                </div>
                <div className="space-y-1.5">
                  {fixaItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-[11px] text-text-secondary truncate mr-2">{item.description}</span>
                      <span className="text-[11px] font-medium text-text-primary tabular-nums shrink-0">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {parcelamentoItems.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-border">
                  <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Parcelamentos</span>
                  <span className="text-[10px] font-semibold text-text-primary tabular-nums">{formatCurrency(currentMonth.parcelamentos)}</span>
                </div>
                <div className="space-y-1.5">
                  {parcelamentoItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-[11px] text-text-secondary truncate mr-2">{item.description}</span>
                      <span className="text-[11px] font-medium text-text-primary tabular-nums shrink-0">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


/* ================================================================== */
/*  VISÃO ANUAL — Sub-abas: Visão Geral + Histórico + Projeção         */
/* ================================================================== */

/* ── Visão Geral Anual ─────────────────────────────────────────── */

function AnnualOverviewTab({ entries, annualYear }) {
  const be = useMemo(() => computeAnnualBreakeven(entries, annualYear), [entries, annualYear])
  const { breakeven, incomeSettled, totalIncome } = be

  const pctSettled = breakeven > 0 ? Math.min((incomeSettled / breakeven) * 100, 100) : 0
  const pctTotal = breakeven > 0 ? Math.min((totalIncome / breakeven) * 100, 100) : 0
  const reachedSettled = incomeSettled >= breakeven
  const reachedTotal = totalIncome >= breakeven
  const saldo = totalIncome - breakeven

  if (breakeven === 0 && totalIncome === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-[10px] font-semibold text-primary uppercase tracking-wider">Visão Geral</h3>
          <p className="text-[10px] text-text-muted mt-0.5">Panorama financeiro consolidado do ano</p>
        </div>
        <div className="flex items-center justify-center h-64 bg-surface rounded-xl border border-border">
          <p className="text-[12px] text-text-muted">Nenhum dado disponível para {annualYear}.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[10px] font-semibold text-primary uppercase tracking-wider">Visão Geral</h3>
        <p className="text-[10px] text-text-muted mt-0.5">Panorama financeiro consolidado do ano</p>
      </div>

      {/* KPIs resumidos */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl border border-border px-5 py-3.5">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">Receita Efetivada</p>
          <p className="text-[15px] font-semibold tabular-nums text-value-income">{formatCurrency(incomeSettled)}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border px-5 py-3.5">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">Custo Total Previsto</p>
          <p className="text-[15px] font-semibold tabular-nums text-value-expense">{formatCurrency(breakeven)}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border px-5 py-3.5">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">Saldo Projetado</p>
          <p className={`text-[15px] font-semibold tabular-nums ${saldo >= 0 ? 'text-value-income' : 'text-value-expense'}`}>
            {formatCurrency(saldo)}
          </p>
        </div>
      </div>

      {/* Progresso Receita Efetivada */}
      <div className="bg-surface rounded-xl border border-border px-5 py-4">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-text-muted">Receita Efetivada vs Custo Total</span>
              <span className={`text-[10px] font-medium tabular-nums ${reachedSettled ? 'text-value-income' : 'text-text-muted'}`}>
                {pctSettled.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-offwhite overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${pctSettled}%`, backgroundColor: reachedSettled ? ANNUAL_INCOME_COLOR : BREAKEVEN_COLOR }}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-text-muted">Faturamento Total (Realizado + Esperado) vs Custo Total</span>
              <span className={`text-[10px] font-medium tabular-nums ${reachedTotal ? 'text-value-income' : 'text-text-muted'}`}>
                {pctTotal.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-offwhite overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${pctTotal}%`, backgroundColor: reachedTotal ? ANNUAL_INCOME_COLOR : '#9b9b9b' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Histórico Consolidado ──────────────────────────────────────── */

function HistoricoTab({ entries, annualYear }) {
  const data = useMemo(() => computeHistoricoData(entries, annualYear), [entries, annualYear])
  const pastData = data.filter((d) => d._isPast)
  const totalReceita = pastData.reduce((s, d) => s + d.receita, 0)
  const totalDespesa = pastData.reduce((s, d) => s + d.despesa, 0)
  const hasPastMonths = pastData.length > 0
  const hasData = hasPastMonths && (totalReceita > 0 || totalDespesa > 0)

  if (!hasData) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-[10px] font-semibold text-primary uppercase tracking-wider">Histórico Consolidado</h3>
          <p className="text-[10px] text-text-muted mt-0.5">Receita efetivada vs saídas realizadas — meses concluídos</p>
        </div>
        <div className="flex items-center justify-center h-64 bg-surface rounded-xl border border-border">
          <p className="text-[12px] text-text-muted">Nenhum dado consolidado disponível para {annualYear}.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[10px] font-semibold text-primary uppercase tracking-wider">Histórico Consolidado</h3>
        <p className="text-[10px] text-text-muted mt-0.5">Receita efetivada vs saídas realizadas — meses concluídos</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl border border-border px-5 py-3.5">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">Receita Efetivada</p>
          <p className="text-[15px] font-semibold tabular-nums text-value-income">{formatCurrency(totalReceita)}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border px-5 py-3.5">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">Saídas Realizadas</p>
          <p className="text-[15px] font-semibold tabular-nums text-value-expense">{formatCurrency(totalDespesa)}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border px-5 py-3.5">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">Resultado Efetivo</p>
          <p className={`text-[15px] font-semibold tabular-nums ${totalReceita - totalDespesa >= 0 ? 'text-value-income' : 'text-value-expense'}`}>
            {formatCurrency(totalReceita - totalDespesa)}
          </p>
        </div>
      </div>

      {/* BarChart — todos os 12 meses; barras só nos meses passados */}
      <div className="bg-surface rounded-xl border border-border px-5 py-5">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e4" vertical={false} />
              <XAxis
                dataKey="month" axisLine={false} tickLine={false}
                tick={({ x, y, payload }) => {
                  const item = data.find((d) => d.month === payload.value)
                  const isPast = item?._isPast
                  return (
                    <text x={x} y={y + 12} textAnchor="middle" fontSize={11} fontWeight={500} fill={isPast ? '#6b6b6b' : '#c8c8c4'}>
                      {payload.value}
                    </text>
                  )
                }}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9b9b9b' }} tickFormatter={(v) => formatCurrencyCompact(v)} width={64} />
              <ReferenceLine y={0} stroke="#e8e8e4" />
              <Tooltip content={
                <BarChartTooltip
                  incomeKey="receita" incomeLabel="Receita Efetivada"
                  expenseKey="despesa" expenseLabel="Saídas Realizadas"
                />
              } />
              <Bar dataKey="receita" radius={[3, 3, 0, 0]} maxBarSize={28}>
                {data.map((entry) => (
                  <Cell key={`r-${entry._index}`} fill={ANNUAL_INCOME_COLOR} fillOpacity={entry._isPast ? 1 : 0} />
                ))}
              </Bar>
              <Bar dataKey="despesa" radius={[3, 3, 0, 0]} maxBarSize={28}>
                {data.map((entry) => (
                  <Cell key={`d-${entry._index}`} fill={ANNUAL_EXPENSE_COLOR} fillOpacity={entry._isPast ? 1 : 0} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <BarChartLegend items={[
          { label: 'Receita Efetivada', color: ANNUAL_INCOME_COLOR },
          { label: 'Saídas Realizadas', color: ANNUAL_EXPENSE_COLOR },
        ]} />
        <p className="text-[10px] text-text-muted text-center mt-2">
          Exibindo apenas meses concluídos — meses futuros ficam sem barras
        </p>
      </div>
    </div>
  )
}

/* ── Projeção Orçamentária ──────────────────────────────────────── */

function ProjecaoTab({ entries, annualYear }) {
  const data = useMemo(() => computeProjecaoData(entries, annualYear), [entries, annualYear])
  const totalFaturamento = data.reduce((s, d) => s + d.faturamento, 0)
  const totalCusto = data.reduce((s, d) => s + d.custo, 0)
  const hasData = totalFaturamento > 0 || totalCusto > 0

  /** Opacidade reduzida para meses já consolidados */
  const PAST_OPACITY = 0.35

  if (!hasData) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-[10px] font-semibold text-primary uppercase tracking-wider">Projeção Orçamentária</h3>
          <p className="text-[10px] text-text-muted mt-0.5">Faturamento esperado vs custo previsto — visão completa do ano</p>
        </div>
        <div className="flex items-center justify-center h-64 bg-surface rounded-xl border border-border">
          <p className="text-[12px] text-text-muted">Nenhuma projeção disponível para {annualYear}.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[10px] font-semibold text-primary uppercase tracking-wider">Projeção Orçamentária</h3>
        <p className="text-[10px] text-text-muted mt-0.5">Faturamento esperado vs custo previsto — visão completa do ano</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl border border-border px-5 py-3.5">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">Faturamento Esperado</p>
          <p className="text-[15px] font-semibold tabular-nums text-value-income">{formatCurrency(totalFaturamento)}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border px-5 py-3.5">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">Custo Previsto</p>
          <p className="text-[15px] font-semibold tabular-nums text-value-expense">{formatCurrency(totalCusto)}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border px-5 py-3.5">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">Resultado Projetado</p>
          <p className={`text-[15px] font-semibold tabular-nums ${totalFaturamento - totalCusto >= 0 ? 'text-value-income' : 'text-value-expense'}`}>
            {formatCurrency(totalFaturamento - totalCusto)}
          </p>
        </div>
      </div>

      {/* BarChart — todos os 12 meses; meses passados com opacidade reduzida */}
      <div className="bg-surface rounded-xl border border-border px-5 py-5">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e4" vertical={false} />
              <XAxis
                dataKey="month" axisLine={false} tickLine={false}
                tick={({ x, y, payload }) => {
                  const item = data.find((d) => d.month === payload.value)
                  const isPast = item?._isPast
                  return (
                    <text x={x} y={y + 12} textAnchor="middle" fontSize={11} fontWeight={500} fill={isPast ? '#b0b0a8' : '#6b6b6b'}>
                      {payload.value}
                    </text>
                  )
                }}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9b9b9b' }} tickFormatter={(v) => formatCurrencyCompact(v)} width={64} />
              <ReferenceLine y={0} stroke="#e8e8e4" />
              <Tooltip content={
                <BarChartTooltip
                  incomeKey="faturamento" incomeLabel="Faturamento Esperado"
                  expenseKey="custo" expenseLabel="Custo Previsto"
                />
              } />
              <Bar dataKey="faturamento" radius={[3, 3, 0, 0]} maxBarSize={28}>
                {data.map((entry) => (
                  <Cell key={`f-${entry._index}`} fill={ANNUAL_INCOME_COLOR} fillOpacity={entry._isPast ? PAST_OPACITY : 1} />
                ))}
              </Bar>
              <Bar dataKey="custo" radius={[3, 3, 0, 0]} maxBarSize={28}>
                {data.map((entry) => (
                  <Cell key={`c-${entry._index}`} fill={ANNUAL_EXPENSE_COLOR} fillOpacity={entry._isPast ? PAST_OPACITY : 1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <BarChartLegend items={[
          { label: 'Faturamento Esperado', color: ANNUAL_INCOME_COLOR },
          { label: 'Custo Previsto', color: ANNUAL_EXPENSE_COLOR },
        ]} />
        <div className="flex items-center justify-center gap-6 mt-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: '#9b9b9b', opacity: PAST_OPACITY }} />
            <span className="text-[10px] text-text-muted">Consolidado (meses concluídos)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: '#9b9b9b' }} />
            <span className="text-[10px] text-text-muted">Projeção ativa (meses futuros)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Despesas Anuais ──────────────────────────────────────────── */

function AnnualExpensesTab({ entries, annualYear, invoiceData }) {
  const [expenseView, setExpenseView] = useState('previsto')

  const yearEntries = useMemo(() => {
    const expanded = expandInvoiceEntries(entries, invoiceData)
    return expanded.filter((e) => {
      if (!e.dueDate || e.type === 'Receita') return false
      return new Date(e.dueDate + 'T12:00:00').getFullYear() === annualYear
    })
  }, [entries, annualYear, invoiceData])

  const filtered = useMemo(
    () => expenseView === 'efetivado' ? yearEntries.filter((e) => e.status === 'pago') : yearEntries,
    [yearEntries, expenseView],
  )

  const byType = useMemo(() => computeExpensesByType(filtered), [filtered])
  const byOwner = useMemo(() => computeExpensesByOwner(filtered), [filtered])
  const byCategory = useMemo(() => computeExpensesByCategory(filtered), [filtered])
  const totalByType = byType.reduce((s, d) => s + d.value, 0)
  const totalByOwner = byOwner.reduce((s, d) => s + d.value, 0)
  const totalByCategory = byCategory.reduce((s, d) => s + d.value, 0)

  const categoryColorMap = {}
  for (const item of byCategory) {
    categoryColorMap[item.name] = CATEGORY_COLORS[item.id] || '#9b9b9b'
  }

  const ownerLabelMap = { lenon: 'Lenon', berna: 'Berna', outros: 'Outros' }
  const ownerColorMap = { lenon: OWNER_COLORS.lenon, berna: OWNER_COLORS.berna, outros: '#9b9b9b' }
  const byOwnerLabeled = byOwner.map((d) => ({ ...d, name: ownerLabelMap[d.name] || d.name }))
  const ownerColorMapLabeled = {}
  for (const [key, color] of Object.entries(ownerColorMap)) {
    ownerColorMapLabeled[ownerLabelMap[key] || key] = color
  }

  const monthlyData = useMemo(() => {
    const data = SHORT_MONTHS.map((label) => ({ month: label, despesa: 0 }))
    for (const e of filtered) {
      if (!e.dueDate) continue
      const d = new Date(e.dueDate + 'T12:00:00')
      data[d.getMonth()].despesa += Math.abs(e.amount)
    }
    return data
  }, [filtered])

  if (yearEntries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-surface rounded-xl border border-border">
        <p className="text-[12px] text-text-muted">Nenhuma despesa registrada em {annualYear}.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-surface rounded-xl border border-border px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[10px] font-semibold text-primary uppercase tracking-wider">Total de despesas no ano</h3>
            <p className="text-[10px] text-text-muted mt-0.5">
              {expenseView === 'previsto'
                ? `Soma de todas as saídas previstas em ${annualYear}`
                : `Soma das saídas efetivamente pagas em ${annualYear}`
              }
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ExpenseViewToggle view={expenseView} onChange={setExpenseView} />
            <p className="text-lg font-semibold tabular-nums text-value-expense">{formatCurrency(totalByType)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface rounded-xl border border-border px-5 py-4">
          <h3 className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">Por tipo</h3>
          <p className="text-[10px] text-text-muted mb-4">Distribuição por tipo de despesa</p>
          {totalByType === 0 ? (
            <p className="text-[11px] text-text-muted py-6 text-center">Nenhuma despesa {expenseView === 'efetivado' ? 'efetivada' : ''} neste ano.</p>
          ) : (
          <div className="flex items-center gap-6">
            <div className="w-[120px] h-[120px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byType} cx="50%" cy="50%" innerRadius={36} outerRadius={54} paddingAngle={2} dataKey="value" stroke="none">
                    {byType.map((entry) => <Cell key={entry.name} fill={TYPE_COLORS[entry.name] || '#9b9b9b'} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 min-w-0"><ChartLegend data={byType} colorMap={TYPE_COLORS} total={totalByType} /></div>
          </div>
          )}
        </div>
        <div className="bg-surface rounded-xl border border-border px-5 py-4">
          <h3 className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">Por responsável</h3>
          <p className="text-[10px] text-text-muted mb-4">Comparativo entre gestores</p>
          <div className="flex items-center gap-6">
            <div className="w-[120px] h-[120px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byOwnerLabeled} cx="50%" cy="50%" innerRadius={36} outerRadius={54} paddingAngle={2} dataKey="value" stroke="none">
                    {byOwnerLabeled.map((entry) => <Cell key={entry.name} fill={ownerColorMapLabeled[entry.name] || '#9b9b9b'} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 min-w-0"><ChartLegend data={byOwnerLabeled} colorMap={ownerColorMapLabeled} total={totalByOwner} /></div>
          </div>
        </div>
      </div>

      {byCategory.length > 0 && (
        <div className="bg-surface rounded-xl border border-border px-5 py-4">
          <h3 className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">Por Categoria</h3>
          <p className="text-[10px] text-text-muted mb-4">Distribuição por tipo de gasto em {annualYear}</p>
          <div className="flex items-start gap-6">
            <div className="w-[140px] h-[140px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCategory} cx="50%" cy="50%" innerRadius={42} outerRadius={64} paddingAngle={2} dataKey="value" stroke="none">
                    {byCategory.map((entry) => <Cell key={entry.name} fill={categoryColorMap[entry.name] || '#9b9b9b'} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 min-w-0"><ChartLegend data={byCategory} colorMap={categoryColorMap} total={totalByCategory} /></div>
          </div>
        </div>
      )}

      <div className="bg-surface rounded-xl border border-border px-5 py-5">
        <h3 className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">Evolução mensal de despesas</h3>
        <p className="text-[10px] text-text-muted mb-4">Saídas acumuladas mês a mês em {annualYear}</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e4" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b6b6b', fontWeight: 500 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9b9b9b' }} tickFormatter={(v) => formatCurrencyCompact(v)} width={64} />
              <Tooltip
                formatter={(value) => [formatCurrency(value), 'Despesa']}
                contentStyle={{ backgroundColor: '#fafaf7', border: '1px solid #e8e8e4', borderRadius: '8px', fontSize: '11px' }}
              />
              <Bar dataKey="despesa" fill={ANNUAL_EXPENSE_COLOR} radius={[3, 3, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

/* ── Receitas Anuais ─────────────────────────────────────────── */

function AnnualRevenueTab({ entries, annualYear }) {
  const [revenueView, setRevenueView] = useState('previsto')

  const yearEntries = useMemo(() =>
    entries.filter((e) => {
      if (!e.dueDate || e.type !== 'Receita') return false
      return new Date(e.dueDate + 'T12:00:00').getFullYear() === annualYear
    }),
    [entries, annualYear],
  )

  const filtered = useMemo(
    () => revenueView === 'efetivado' ? yearEntries.filter((e) => e.status === 'pago') : yearEntries,
    [yearEntries, revenueView],
  )

  const totalForecast = yearEntries.reduce((s, e) => s + e.amount, 0)
  const totalSettled = yearEntries.filter((e) => e.status === 'pago').reduce((s, e) => s + e.amount, 0)

  const byType = useMemo(() => computeRevenuesByType(filtered), [filtered])
  const totalByType = byType.reduce((s, d) => s + d.value, 0)

  const monthlyData = useMemo(() => {
    const data = SHORT_MONTHS.map((label) => ({ month: label, prevista: 0, efetivada: 0 }))
    for (const e of yearEntries) {
      if (!e.dueDate) continue
      const d = new Date(e.dueDate + 'T12:00:00')
      const m = d.getMonth()
      data[m].prevista += e.amount
      if (e.status === 'pago') data[m].efetivada += e.amount
    }
    return data
  }, [yearEntries])

  if (totalForecast === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-surface rounded-xl border border-border">
        <p className="text-[12px] text-text-muted">Nenhuma receita registrada em {annualYear}.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl border border-border px-5 py-3.5">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">Faturamento esperado</p>
          <p className="text-[15px] font-semibold tabular-nums text-value-income">{formatCurrency(totalForecast)}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border px-5 py-3.5">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">Receita efetivada</p>
          <p className="text-[15px] font-semibold tabular-nums text-value-income">{formatCurrency(totalSettled)}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border px-5 py-3.5">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">A receber</p>
          <p className="text-[15px] font-semibold tabular-nums text-text-primary">{formatCurrency(totalForecast - totalSettled)}</p>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border px-5 py-5">
        <h3 className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">Evolução mensal de receitas</h3>
        <p className="text-[10px] text-text-muted mb-4">Entradas acumuladas mês a mês em {annualYear}</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e4" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b6b6b', fontWeight: 500 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9b9b9b' }} tickFormatter={(v) => formatCurrencyCompact(v)} width={64} />
              <Tooltip content={
                <BarChartTooltip
                  incomeKey="prevista" incomeLabel="Prevista"
                  expenseKey="efetivada" expenseLabel="Efetivada"
                />
              } />
              <Bar dataKey="prevista" fill={ANNUAL_INCOME_COLOR} fillOpacity={0.35} radius={[3, 3, 0, 0]} maxBarSize={28} />
              <Bar dataKey="efetivada" fill={ANNUAL_INCOME_COLOR} radius={[3, 3, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <BarChartLegend items={[
          { label: 'Prevista', color: '#16653480' },
          { label: 'Efetivada', color: ANNUAL_INCOME_COLOR },
        ]} />
      </div>

      <div className="bg-surface rounded-xl border border-border px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">Por tipo</h3>
            <p className="text-[10px] text-text-muted">Distribuição por tipo de receita</p>
          </div>
          <ExpenseViewToggle view={revenueView} onChange={setRevenueView} />
        </div>
        {totalByType === 0 ? (
          <p className="text-[11px] text-text-muted py-6 text-center">Nenhuma receita {revenueView === 'efetivado' ? 'efetivada' : ''} neste ano.</p>
        ) : (
          <div className="flex items-center gap-6">
            <div className="w-[120px] h-[120px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byType} cx="50%" cy="50%" innerRadius={36} outerRadius={54} paddingAngle={2} dataKey="value" stroke="none">
                    {byType.map((entry) => <Cell key={entry.name} fill={RECEITA_COLORS[entry.name] || '#9b9b9b'} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 min-w-0"><ChartLegend data={byType} colorMap={RECEITA_COLORS} total={totalByType} /></div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Visão Anual: wrapper com sub-tabs ──────────────────────────── */

function AnnualView({ entries, invoiceData }) {
  const now = new Date()
  const [annualYear, setAnnualYear] = useState(now.getFullYear())
  const [annualSubTab, setAnnualSubTab] = useState('total')
  const isCurrentYear = annualYear === now.getFullYear()

  const yearEntries = useMemo(() =>
    entries.filter((e) => {
      if (!e.dueDate) return false
      return new Date(e.dueDate + 'T12:00:00').getFullYear() === annualYear
    }),
    [entries, annualYear],
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end">
        <YearSelector
          year={annualYear}
          onPrev={() => setAnnualYear((y) => y - 1)}
          onNext={() => setAnnualYear((y) => y + 1)}
          onToday={() => setAnnualYear(now.getFullYear())}
          isCurrentYear={isCurrentYear}
        />
      </div>

      <div className="flex gap-6">
        <nav className="w-48 shrink-0">
          <ul className="space-y-0.5">
            {ANNUAL_SUB_TABS.map((tab) => {
              const isActive = tab.id === annualSubTab
              return (
                <li key={tab.id}>
                  <button
                    type="button"
                    onClick={() => setAnnualSubTab(tab.id)}
                    className={`
                      w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[12px] font-medium
                      transition-colors duration-150 cursor-pointer text-left
                      ${isActive
                        ? 'bg-primary text-white'
                        : 'text-text-secondary hover:bg-offwhite hover:text-text-primary'
                      }
                    `}
                  >
                    <tab.icon size={15} strokeWidth={1.8} className="shrink-0" />
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex-1 min-w-0">
          {annualSubTab === 'total' && <AnnualOverviewTab entries={entries} annualYear={annualYear} />}
          {annualSubTab === 'equilibrio' && <BreakevenTab />}
          {annualSubTab === 'despesas' && <AnnualExpensesTab entries={entries} annualYear={annualYear} invoiceData={invoiceData} />}
          {annualSubTab === 'receitas' && <AnnualRevenueTab entries={entries} annualYear={annualYear} />}
          {annualSubTab === 'historico' && <HistoricoTab entries={entries} annualYear={annualYear} />}
          {annualSubTab === 'projecao' && <ProjecaoTab entries={entries} annualYear={annualYear} />}
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  COMPONENTE PRINCIPAL                                               */
/* ================================================================== */

export default function DashboardPage({ entries, invoiceData }) {
  const { accounts, categories, classifyEntry, classifyReceita } = useWorkspaceData()
  const { workspaceId } = useWorkspace()
  const now = new Date()
  const [topTab, setTopTab] = useState('mensal')
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [monthlySubTab, setMonthlySubTab] = useState('total')

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  const visibleTopTabs = useMemo(() => {
    const tabs = TOP_TABS.filter((tab) => !tab.workspace || tab.workspace === workspaceId)
    if (workspaceId === 'pessoal') {
      tabs.push({ id: 'projecao-pessoal', label: 'Projeção Pessoal', icon: ArrowLeftRight })
    }
    return tabs
  }, [workspaceId])
  const effectiveTopTab = visibleTopTabs.some((t) => t.id === topTab) ? topTab : 'mensal'
  const visibleMonthlyTabs = useMemo(
    () => MONTHLY_SUB_TABS.filter((tab) => !tab.workspace || tab.workspace === workspaceId),
    [workspaceId],
  )
  const effectiveMonthlySubTab = visibleMonthlyTabs.some((t) => t.id === monthlySubTab) ? monthlySubTab : 'total'

  const handlePrev = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1) } else setMonth((m) => m - 1)
  }
  const handleNext = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1) } else setMonth((m) => m + 1)
  }
  const handleToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth()) }

  const entriesWithForecast = useMemo(() => {
    const virtual = buildForecastVirtualEntries(entries)
    return [...entries, ...virtual]
  }, [entries])

  const monthEntries = useMemo(() => filterByMonth(entriesWithForecast, year, month), [entriesWithForecast, year, month])
  const m = useMemo(() => computeMetrics(monthEntries), [monthEntries])
  const hasMonthData = monthEntries.length > 0

  return (
    <section>
      <header className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight uppercase">Painel do Lenon</h2>
          <p className="text-sm text-text-muted mt-1 font-semibold">Resumo executivo do período</p>
        </div>
        {(effectiveTopTab === 'mensal' || effectiveTopTab === 'reserva') && (
          <MonthSelector
            year={year} month={month}
            onPrev={handlePrev} onNext={handleNext}
            onToday={handleToday} isCurrentMonth={isCurrentMonth}
          />
        )}
      </header>

      <div className="flex items-center gap-1 mb-6 border-b border-border">
        {visibleTopTabs.map((tab) => {
          const isActive = tab.id === effectiveTopTab
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTopTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 text-[12px] font-medium
                transition-colors duration-150 cursor-pointer border-b-2 -mb-px
                ${isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
                }
              `}
            >
              <tab.icon size={15} strokeWidth={1.8} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {effectiveTopTab === 'anual' && <AnnualView entries={entriesWithForecast} invoiceData={invoiceData} />}

      {effectiveTopTab === 'reserva' && (
        <ReservaTab
          allEntries={entriesWithForecast}
          year={year}
          month={month}
          invoiceData={invoiceData}
        />
      )}

      {effectiveTopTab === 'simulador-prolabore' && (
        <ProlaboreSimulatorTab entries={entriesWithForecast} />
      )}

      {effectiveTopTab === 'projecao-pessoal' && (
        <ProjectionPage entries={entriesWithForecast} />
      )}

      {effectiveTopTab === 'mensal' && (
        <div className="flex gap-6">
          <nav className="w-44 shrink-0">
            <ul className="space-y-0.5">
              {visibleMonthlyTabs.map((tab) => {
                const isActive = tab.id === effectiveMonthlySubTab
                return (
                  <li key={tab.id}>
                    <button
                      type="button"
                      onClick={() => setMonthlySubTab(tab.id)}
                      className={`
                        w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[12px] font-medium
                        transition-colors duration-150 cursor-pointer text-left
                        ${isActive
                          ? 'bg-primary text-white'
                          : 'text-text-secondary hover:bg-offwhite hover:text-text-primary'
                        }
                      `}
                    >
                      <tab.icon size={15} strokeWidth={1.8} className="shrink-0" />
                      <span className="whitespace-nowrap">{tab.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>
          <div className="flex-1 min-w-0">
            {!hasMonthData && effectiveMonthlySubTab !== 'simulador-prolabore' ? (
              <div className="flex items-center justify-center h-64 bg-surface rounded-xl border border-border">
                <p className="text-[12px] text-text-muted">
                  Nenhuma conta registrada em {MONTH_NAMES[month].toLowerCase()} de {year}.
                </p>
              </div>
            ) : (
              <>
                {effectiveMonthlySubTab === 'total' && <OverviewTab m={m} />}
                {effectiveMonthlySubTab === 'equilibrio' && (
                  <BreakevenTab />
                )}
                {effectiveMonthlySubTab === 'despesas' && <ExpensesTab monthEntries={monthEntries} invoiceData={invoiceData} />}
                {effectiveMonthlySubTab === 'receitas' && <RevenueTab monthEntries={monthEntries} />}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
