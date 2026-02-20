import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  ArrowLeftRight, Home, Building2, Plus, Trash2, Edit3, Check, X,
  TrendingUp, TrendingDown, DollarSign, AlertTriangle,
  BarChart3, Target, Layers, Leaf, Gem,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { fetchProjectionData, saveProjectionData } from '../services/firestore'
import { personalCategories } from '../data/categories'

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

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

function generateId() {
  return `proj-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

const CATEGORY_LABEL_MAP = Object.fromEntries(
  [...personalCategories.despesa, ...personalCategories.receita].map((c) => [c.id, c.label]),
)

const SHORT_MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const DEFAULT_NEW_ITEMS = [
  { id: 'aluguel-proj', category: 'moradia', label: 'Aluguel', amount: 0 },
  { id: 'condominio-proj', category: 'condominio', label: 'Condominio', amount: 0 },
  { id: 'energia-proj', category: 'energia-agua-gas', label: 'Energia', amount: 0 },
  { id: 'agua-proj', category: 'energia-agua-gas', label: 'Agua', amount: 0 },
  { id: 'gas-proj', category: 'energia-agua-gas', label: 'Gas', amount: 0 },
  { id: 'internet-proj', category: 'internet-telefone', label: 'Internet', amount: 0 },
]

const DEFAULT_TANGO_ITEMS = []
const DEFAULT_CONFORTAVEL_ITEMS = []

// Categorias excluídas dos cenários pessoais (gastos da casa dos pais que não teremos)
const EXCLUDED_CATEGORIES = ['moradia', 'internet-telefone']

const DEFAULT_SCENARIO_ESSENCIAL = [
  { id: 'ess-aluguel', label: 'Aluguel (kitnet/studio)', amount: 0 },
  { id: 'ess-condominio', label: 'Condomínio', amount: 0 },
  { id: 'ess-energia', label: 'Energia', amount: 0 },
  { id: 'ess-agua', label: 'Água', amount: 0 },
  { id: 'ess-gas', label: 'Gás', amount: 0 },
  { id: 'ess-internet', label: 'Internet', amount: 0 },
  { id: 'ess-mercado', label: 'Mercado', amount: 0 },
  { id: 'ess-limpeza', label: 'Produtos de limpeza', amount: 0 },
]

const DEFAULT_SCENARIO_CONFORTAVEL = [
  { id: 'conf-aluguel', label: 'Aluguel (1 quarto)', amount: 0 },
  { id: 'conf-condominio', label: 'Condomínio', amount: 0 },
  { id: 'conf-energia', label: 'Energia', amount: 0 },
  { id: 'conf-agua', label: 'Água', amount: 0 },
  { id: 'conf-gas', label: 'Gás', amount: 0 },
  { id: 'conf-internet', label: 'Internet', amount: 0 },
  { id: 'conf-mercado', label: 'Mercado', amount: 0 },
  { id: 'conf-limpeza', label: 'Produtos de limpeza', amount: 0 },
  { id: 'conf-lazer', label: 'Lazer / Entretenimento', amount: 0 },
  { id: 'conf-delivery', label: 'Delivery / Restaurantes', amount: 0 },
]

const DEFAULT_SCENARIOS = {
  essencial: { name: 'Essencial', items: DEFAULT_SCENARIO_ESSENCIAL },
  confortavel: { name: 'Confortável', items: DEFAULT_SCENARIO_CONFORTAVEL },
}

const SUB_TABS = [
  { id: 'projecao', label: 'Projeção 12 Meses', icon: BarChart3 },
  { id: 'cenarios', label: 'Cenários', icon: Layers },
  { id: 'comparativo', label: 'Comparativo Mensal', icon: ArrowLeftRight },
]

const COLOR_EM_CASA = '#EA580C'       // laranja — ficando na casa dos pais
const COLOR_SIMPLES = '#3B82F6'       // azul claro — vida mais simples
const COLOR_CONFORTAVEL = '#16A34A'   // verde — vida mais confortável
const COLOR_INCOME = '#7C3AED'        // roxo — linha de renda

/* ------------------------------------------------------------------ */
/*  Tooltip do gráfico de projeção                                      */
/* ------------------------------------------------------------------ */

function ProjectionTooltip({ active, payload, label, monthlyIncome }) {
  if (!active || !payload?.length) return null
  const emCasa = payload.find((p) => p.dataKey === 'emCasa')?.value || 0
  const simples = payload.find((p) => p.dataKey === 'simples')?.value || 0
  const confortavel = payload.find((p) => p.dataKey === 'confortavel')?.value || 0

  return (
    <div className="bg-surface border border-border rounded-lg px-4 py-3 shadow-sm min-w-[240px]">
      <p className="text-[11px] font-semibold text-primary mb-2.5">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: COLOR_EM_CASA }} />
            <span className="text-[10px] text-text-secondary">Em Casa</span>
          </div>
          <span className="text-[11px] font-semibold tabular-nums text-text-primary">{formatCurrency(emCasa)}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: COLOR_SIMPLES }} />
            <span className="text-[10px] text-text-secondary">Vida mais simples</span>
          </div>
          <span className="text-[11px] font-semibold tabular-nums text-text-primary">{formatCurrency(simples)}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: COLOR_CONFORTAVEL }} />
            <span className="text-[10px] text-text-secondary">Vida mais confortável</span>
          </div>
          <span className="text-[11px] font-semibold tabular-nums text-text-primary">{formatCurrency(confortavel)}</span>
        </div>
        {monthlyIncome > 0 && (
          <>
            <div className="border-t border-dashed border-border my-1.5" />
            <div className="flex items-center justify-between gap-6">
              <span className="text-[10px] text-text-muted">Sobra (em casa)</span>
              <span className={`text-[11px] font-semibold tabular-nums ${monthlyIncome - emCasa >= 0 ? 'text-value-income' : 'text-value-expense'}`}>
                {formatCurrency(monthlyIncome - emCasa)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-[10px] text-text-muted">Sobra (simples)</span>
              <span className={`text-[11px] font-semibold tabular-nums ${monthlyIncome - simples >= 0 ? 'text-value-income' : 'text-value-expense'}`}>
                {formatCurrency(monthlyIncome - simples)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-[10px] text-text-muted">Sobra (confortável)</span>
              <span className={`text-[11px] font-semibold tabular-nums ${monthlyIncome - confortavel >= 0 ? 'text-value-income' : 'text-value-expense'}`}>
                {formatCurrency(monthlyIncome - confortavel)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Componente de item editavel                                         */
/* ------------------------------------------------------------------ */

function ProjectionItem({ item, onUpdate, onDelete, editable }) {
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(item.label)
  const [amount, setAmount] = useState(String(item.amount || ''))

  const handleSave = () => {
    onUpdate({ ...item, label, amount: parseFloat(amount) || 0 })
    setEditing(false)
  }

  const handleCancel = () => {
    setLabel(item.label)
    setAmount(String(item.amount || ''))
    setEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') handleCancel()
  }

  if (editing && editable) {
    return (
      <div className="flex items-center gap-2 py-2 px-3 bg-offwhite rounded-lg">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 text-[12px] bg-white border border-border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Descricao"
          autoFocus
        />
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-text-muted">R$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-28 text-[12px] bg-white border border-border rounded pl-8 pr-2 py-1.5 text-right focus:outline-none focus:ring-1 focus:ring-primary tabular-nums"
            placeholder="0,00"
            step="0.01"
            min="0"
          />
        </div>
        <button onClick={handleSave} className="p-1 text-value-income hover:bg-white rounded cursor-pointer">
          <Check size={14} strokeWidth={2} />
        </button>
        <button onClick={handleCancel} className="p-1 text-text-muted hover:bg-white rounded cursor-pointer">
          <X size={14} strokeWidth={2} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 py-2 px-3 group hover:bg-offwhite rounded-lg transition-colors">
      <span className="flex-1 min-w-0 text-[12px] text-text-primary truncate">
        {item.label}
      </span>
      <span className={`text-[12px] font-medium tabular-nums shrink-0 ${item.amount > 0 ? 'text-value-expense' : 'text-text-muted'}`}>
        {formatCurrency(item.amount || 0)}
      </span>
      {editable && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)} className="p-1 text-text-muted hover:text-primary rounded cursor-pointer">
            <Edit3 size={12} strokeWidth={2} />
          </button>
          <button onClick={() => onDelete(item.id)} className="p-1 text-text-muted hover:text-red-600 rounded cursor-pointer">
            <Trash2 size={12} strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Sub-aba: Projeção 12 Meses                                          */
/* ------------------------------------------------------------------ */

function ProjecaoTab({ entries, monthlyIncome, totalSimplesExtra, totalConfortavelExtra }) {
  const chartData = useMemo(() => {
    const now = new Date()
    const startYear = now.getFullYear()
    const startMonth = now.getMonth()

    // Gastos totais por mês (em casa = tudo)
    const allByMonth = {}
    // Gastos filtrados por mês (excluindo moradia e internet)
    const filteredByMonth = {}
    for (const e of entries) {
      if (!e.dueDate || e.type !== 'Despesa') continue
      const d = new Date(e.dueDate + 'T12:00:00')
      const key = `${d.getFullYear()}-${d.getMonth()}`
      allByMonth[key] = (allByMonth[key] || 0) + Math.abs(e.amount)
      const cat = e.categoryId || 'outros-pessoal'
      if (!EXCLUDED_CATEGORIES.includes(cat)) {
        filteredByMonth[key] = (filteredByMonth[key] || 0) + Math.abs(e.amount)
      }
    }

    const currentKey = `${startYear}-${startMonth}`
    const fallbackAll = allByMonth[currentKey] || 0
    const fallbackFiltered = filteredByMonth[currentKey] || 0

    const data = []
    for (let i = 0; i < 12; i++) {
      let m = startMonth + i
      let y = startYear
      while (m >= 12) { m -= 12; y++ }

      const key = `${y}-${m}`
      const allExpense = allByMonth[key] || fallbackAll
      const filteredExpense = filteredByMonth[key] || fallbackFiltered

      data.push({
        month: `${SHORT_MONTHS[m]}/${String(y).slice(2)}`,
        emCasa: Math.round(allExpense),
        simples: Math.round(filteredExpense + totalSimplesExtra),
        confortavel: Math.round(filteredExpense + totalConfortavelExtra),
      })
    }

    return data
  }, [entries, totalSimplesExtra, totalConfortavelExtra])

  const avgEmCasa = useMemo(
    () => chartData.reduce((s, d) => s + d.emCasa, 0) / chartData.length,
    [chartData],
  )
  const avgSimples = useMemo(
    () => chartData.reduce((s, d) => s + d.simples, 0) / chartData.length,
    [chartData],
  )
  const avgConfortavel = useMemo(
    () => chartData.reduce((s, d) => s + d.confortavel, 0) / chartData.length,
    [chartData],
  )
  const sobraMediaEmCasa = monthlyIncome - avgEmCasa
  const sobraMediaSimples = monthlyIncome - avgSimples
  const sobraMediaConfortavel = monthlyIncome - avgConfortavel

  return (
    <div className="space-y-6">
      {/* Métricas resumo */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl border border-border px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <Home size={13} strokeWidth={2} style={{ color: COLOR_EM_CASA }} />
            <p className="text-[9px] font-semibold text-text-muted uppercase tracking-wider">Média Em Casa</p>
          </div>
          <p className="text-lg font-bold tabular-nums" style={{ color: COLOR_EM_CASA }}>{formatCurrency(avgEmCasa)}</p>
          <p className={`text-[10px] mt-1 font-medium ${sobraMediaEmCasa >= 0 ? 'text-value-income' : 'text-value-expense'}`}>
            Sobra: {formatCurrency(sobraMediaEmCasa)}
          </p>
        </div>

        <div className="bg-surface rounded-xl border border-border px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <Leaf size={13} strokeWidth={2} style={{ color: COLOR_SIMPLES }} />
            <p className="text-[9px] font-semibold text-text-muted uppercase tracking-wider">Média Vida Simples</p>
          </div>
          <p className="text-lg font-bold tabular-nums" style={{ color: COLOR_SIMPLES }}>{formatCurrency(avgSimples)}</p>
          <p className={`text-[10px] mt-1 font-medium ${sobraMediaSimples >= 0 ? 'text-value-income' : 'text-value-expense'}`}>
            Sobra: {formatCurrency(sobraMediaSimples)}
          </p>
        </div>

        <div className="bg-surface rounded-xl border border-border px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <Gem size={13} strokeWidth={2} style={{ color: COLOR_CONFORTAVEL }} />
            <p className="text-[9px] font-semibold text-text-muted uppercase tracking-wider">Média Vida Confortável</p>
          </div>
          <p className="text-lg font-bold tabular-nums" style={{ color: COLOR_CONFORTAVEL }}>{formatCurrency(avgConfortavel)}</p>
          <p className={`text-[10px] mt-1 font-medium ${sobraMediaConfortavel >= 0 ? 'text-value-income' : 'text-value-expense'}`}>
            Sobra: {formatCurrency(sobraMediaConfortavel)}
          </p>
        </div>
      </div>

      {/* Gráfico de barras comparativo */}
      <div className="bg-surface rounded-xl border border-border px-5 py-5">
        <h3 className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">
          Despesas Mensais — Próximos 12 Meses
        </h3>
        <p className="text-[10px] text-text-muted mb-5">
          Comparativo entre os 3 cenários, com a renda atual como referência
        </p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={1} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e4" vertical={false} />
              <XAxis
                dataKey="month" axisLine={false} tickLine={false}
                tick={{ fontSize: 10, fill: '#6b6b6b', fontWeight: 500 }}
              />
              <YAxis
                axisLine={false} tickLine={false}
                tick={{ fontSize: 10, fill: '#9b9b9b' }}
                tickFormatter={(v) => formatCurrencyCompact(v)}
                width={64}
              />
              {monthlyIncome > 0 && (
                <ReferenceLine
                  y={monthlyIncome}
                  stroke={COLOR_INCOME}
                  strokeDasharray="6 4"
                  strokeWidth={2}
                  label={{
                    value: `Renda: ${formatCurrencyCompact(monthlyIncome)}`,
                    position: 'right',
                    fill: COLOR_INCOME,
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />
              )}
              <Tooltip content={<ProjectionTooltip monthlyIncome={monthlyIncome} />} />
              <Bar dataKey="emCasa" name="Em Casa" fill={COLOR_EM_CASA} radius={[3, 3, 0, 0]} maxBarSize={24} />
              <Bar dataKey="simples" name="Vida mais simples" fill={COLOR_SIMPLES} radius={[3, 3, 0, 0]} maxBarSize={24} />
              <Bar dataKey="confortavel" name="Vida mais confortável" fill={COLOR_CONFORTAVEL} radius={[3, 3, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: COLOR_EM_CASA }} />
            <span className="text-[11px] text-text-secondary">Em Casa</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: COLOR_SIMPLES }} />
            <span className="text-[11px] text-text-secondary">Vida mais simples</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: COLOR_CONFORTAVEL }} />
            <span className="text-[11px] text-text-secondary">Vida mais confortável</span>
          </div>
          {monthlyIncome > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-4 h-0 border-t-2 border-dashed shrink-0" style={{ borderColor: COLOR_INCOME }} />
              <span className="text-[11px] text-text-secondary">Renda</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabela mensal detalhada */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-[10px] font-semibold text-primary uppercase tracking-wider">
            Detalhamento Mensal
          </h3>
          <p className="text-[10px] text-text-muted mt-0.5">Projeção mês a mês dos 3 cenários</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-offwhite border-b border-border">
                <th className="text-left px-3 py-2.5 font-semibold text-text-secondary uppercase tracking-wider">Mês</th>
                <th className="text-right px-3 py-2.5 font-semibold uppercase tracking-wider" style={{ color: COLOR_EM_CASA }}>Em Casa</th>
                <th className="text-right px-3 py-2.5 font-semibold uppercase tracking-wider" style={{ color: COLOR_SIMPLES }}>Simples</th>
                <th className="text-right px-3 py-2.5 font-semibold uppercase tracking-wider" style={{ color: COLOR_CONFORTAVEL }}>Confortável</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((row, idx) => (
                <tr key={row.month} className={`border-b border-border ${idx % 2 === 0 ? '' : 'bg-offwhite/50'}`}>
                  <td className="px-3 py-2.5 font-semibold text-text-primary">{row.month}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-medium" style={{ color: COLOR_EM_CASA }}>{formatCurrency(row.emCasa)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-medium" style={{ color: COLOR_SIMPLES }}>{formatCurrency(row.simples)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-medium" style={{ color: COLOR_CONFORTAVEL }}>{formatCurrency(row.confortavel)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-offwhite font-semibold border-t-2 border-border">
                <td className="px-3 py-3 text-text-primary uppercase tracking-wider text-[10px]">Média</td>
                <td className="px-3 py-3 text-right tabular-nums" style={{ color: COLOR_EM_CASA }}>{formatCurrency(avgEmCasa)}</td>
                <td className="px-3 py-3 text-right tabular-nums" style={{ color: COLOR_SIMPLES }}>{formatCurrency(avgSimples)}</td>
                <td className="px-3 py-3 text-right tabular-nums" style={{ color: COLOR_CONFORTAVEL }}>{formatCurrency(avgConfortavel)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Sub-aba: Cenários                                                    */
/* ------------------------------------------------------------------ */

function ScenarioColumn({ scenario, scenarioKey, icon: Icon, color, monthlyIncome, avgMonthlyExpenses, onUpdate, onDelete, onAdd }) {
  const total = scenario.items.reduce((s, i) => s + (i.amount || 0), 0)
  const totalComAtual = avgMonthlyExpenses + total
  const sobra = monthlyIncome - totalComAtual
  const pct = monthlyIncome > 0 ? (totalComAtual / monthlyIncome) * 100 : 0

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-border bg-offwhite">
        <div className="flex items-center gap-2.5">
          <Icon size={16} strokeWidth={1.8} className="shrink-0" style={{ color }} />
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color }}>
              {scenario.name}
            </h3>
            <p className="text-[10px] text-text-muted">
              {scenarioKey === 'essencial' ? 'Vida simples e econômica' : 'Vida mais confortável'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-3 py-3 flex-1 max-h-[480px] overflow-y-auto">
        {/* Gastos base — média dinâmica 12 meses */}
        <div className="mb-3">
          <p className="text-[9px] font-semibold text-text-muted uppercase tracking-wider px-3 mb-1.5">
            Gastos mensais projetados
          </p>
          <div className="flex items-center gap-2 py-2 px-3 bg-offwhite/60 rounded-lg">
            <span className="flex-1 min-w-0 text-[12px] text-text-primary">Média mensal (próx. 12 meses)</span>
            <span className="text-[12px] font-semibold tabular-nums text-text-primary shrink-0">
              {formatCurrency(avgMonthlyExpenses)}
            </span>
          </div>
          <div className="mx-3 my-2 border-t border-dashed border-border" />
        </div>

        {/* Itens do cenario (editaveis) */}
        <div>
          <p className="text-[9px] font-semibold text-text-muted uppercase tracking-wider px-3 mb-1.5">
            Custos de moradia
          </p>
          <div className="space-y-0.5">
            {scenario.items.map((item) => (
              <ProjectionItem
                key={item.id}
                item={item}
                onUpdate={(updated) => onUpdate(scenarioKey, updated)}
                onDelete={(id) => onDelete(scenarioKey, id)}
                editable
              />
            ))}
          </div>
          <button
            onClick={() => onAdd(scenarioKey)}
            className="flex items-center gap-2 w-full px-3 py-2 mt-2 text-[11px] font-medium text-primary hover:bg-offwhite rounded-lg transition-colors cursor-pointer"
          >
            <Plus size={14} strokeWidth={2} />
            <span>Adicionar item</span>
          </button>
        </div>
      </div>

      {/* Rodapé com totais */}
      <div className="border-t border-border bg-offwhite px-5 py-3.5 space-y-2.5 mt-auto">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Novos custos</span>
          <span className="text-[13px] font-bold tabular-nums" style={{ color }}>
            {formatCurrency(total)}
          </span>
        </div>
        <div className="border-t border-dashed border-border pt-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Total mensal</span>
            <span className="text-base font-bold tabular-nums text-value-expense">
              {formatCurrency(totalComAtual)}
            </span>
          </div>
        </div>
        {monthlyIncome > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-muted">Sobra do pró-labore</span>
            <span className={`text-[13px] font-bold tabular-nums ${sobra >= 0 ? 'text-value-income' : 'text-value-expense'}`}>
              {formatCurrency(sobra)}
            </span>
          </div>
        )}
        {monthlyIncome > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-text-muted">Comprometimento</span>
              <span className="text-[10px] font-bold tabular-nums text-text-primary">{pct.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-white rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(pct, 100)}%`,
                  backgroundColor: pct > 80 ? '#DC2626' : pct > 60 ? '#D97706' : color,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CenariosTab({ scenarios, avgMonthlyExpenses, monthlyIncome, onUpdateItem, onDeleteItem, onAddItem }) {
  const essencial = scenarios.essencial
  const confortavel = scenarios.confortavel

  const totalEssencial = avgMonthlyExpenses + essencial.items.reduce((s, i) => s + (i.amount || 0), 0)
  const totalConfortavel = avgMonthlyExpenses + confortavel.items.reduce((s, i) => s + (i.amount || 0), 0)
  const diff = totalConfortavel - totalEssencial

  return (
    <div className="space-y-6">
      {/* Duas colunas lado a lado */}
      <div className="grid grid-cols-2 gap-5">
        <ScenarioColumn
          scenario={essencial}
          scenarioKey="essencial"
          icon={Leaf}
          color="#16A34A"
          monthlyIncome={monthlyIncome}
          avgMonthlyExpenses={avgMonthlyExpenses}
          onUpdate={onUpdateItem}
          onDelete={onDeleteItem}
          onAdd={onAddItem}
        />
        <ScenarioColumn
          scenario={confortavel}
          scenarioKey="confortavel"
          icon={Gem}
          color="#7C3AED"
          monthlyIncome={monthlyIncome}
          avgMonthlyExpenses={avgMonthlyExpenses}
          onUpdate={onUpdateItem}
          onDelete={onDeleteItem}
          onAdd={onAddItem}
        />
      </div>

      {/* Resumo comparativo dos cenários */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-[10px] font-semibold text-primary uppercase tracking-wider">
            Comparativo dos Cenários
          </h3>
          <p className="text-[10px] text-text-muted mt-0.5">
            Diferença entre vida essencial e confortável
          </p>
        </div>

        <div className="grid grid-cols-4 gap-px bg-border">
          <div className="bg-surface px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={13} strokeWidth={2} className="text-primary" />
              <p className="text-[9px] font-semibold text-text-muted uppercase tracking-wider">Pró-labore</p>
            </div>
            <p className="text-lg font-bold tabular-nums text-primary">{formatCurrency(monthlyIncome)}</p>
          </div>

          <div className="bg-surface px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <Leaf size={13} strokeWidth={2} className="text-green-600" />
              <p className="text-[9px] font-semibold text-text-muted uppercase tracking-wider">Total Essencial</p>
            </div>
            <p className="text-lg font-bold tabular-nums text-green-600">{formatCurrency(totalEssencial)}</p>
            {monthlyIncome > 0 && (
              <p className={`text-[10px] mt-1 font-medium ${monthlyIncome - totalEssencial >= 0 ? 'text-value-income' : 'text-value-expense'}`}>
                Sobra: {formatCurrency(monthlyIncome - totalEssencial)}
              </p>
            )}
          </div>

          <div className="bg-surface px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <Gem size={13} strokeWidth={2} className="text-purple-600" />
              <p className="text-[9px] font-semibold text-text-muted uppercase tracking-wider">Total Confortável</p>
            </div>
            <p className="text-lg font-bold tabular-nums text-purple-600">{formatCurrency(totalConfortavel)}</p>
            {monthlyIncome > 0 && (
              <p className={`text-[10px] mt-1 font-medium ${monthlyIncome - totalConfortavel >= 0 ? 'text-value-income' : 'text-value-expense'}`}>
                Sobra: {formatCurrency(monthlyIncome - totalConfortavel)}
              </p>
            )}
          </div>

          <div className="bg-surface px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={13} strokeWidth={2} className="text-amber-500" />
              <p className="text-[9px] font-semibold text-text-muted uppercase tracking-wider">Diferença</p>
            </div>
            <p className="text-lg font-bold tabular-nums text-amber-600">+{formatCurrency(diff)}</p>
            <p className="text-[10px] text-text-muted mt-1">
              conforto custa a mais/mês
            </p>
          </div>
        </div>

        {/* Barras comparativas */}
        {monthlyIncome > 0 && (
          <div className="px-6 py-5 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Leaf size={12} strokeWidth={2} className="text-green-600" />
                  <span className="text-[10px] font-semibold text-text-secondary">Essencial</span>
                </div>
                <span className="text-[10px] font-bold tabular-nums text-text-primary">
                  {(monthlyIncome > 0 ? (totalEssencial / monthlyIncome) * 100 : 0).toFixed(1)}%
                </span>
              </div>
              <div className="h-2.5 bg-offwhite rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((totalEssencial / monthlyIncome) * 100, 100)}%`,
                    backgroundColor: '#16A34A',
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Gem size={12} strokeWidth={2} className="text-purple-600" />
                  <span className="text-[10px] font-semibold text-text-secondary">Confortável</span>
                </div>
                <span className="text-[10px] font-bold tabular-nums text-text-primary">
                  {(monthlyIncome > 0 ? (totalConfortavel / monthlyIncome) * 100 : 0).toFixed(1)}%
                </span>
              </div>
              <div className="h-2.5 bg-offwhite rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((totalConfortavel / monthlyIncome) * 100, 100)}%`,
                    backgroundColor: '#7C3AED',
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Sub-aba: Comparativo Mensal (conteúdo original)                     */
/* ------------------------------------------------------------------ */

function ComparativoTab({
  entries, monthlyIncome,
  tangoItems, onUpdateTangoItem, onDeleteTangoItem, onAddTangoItem,
  confortavelItems, onUpdateConfortavelItem, onDeleteConfortavelItem, onAddConfortavelItem,
}) {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth()) // 0-11
  const [accordionOpen, setAccordionOpen] = useState(false)
  const [accordionOpenConf, setAccordionOpenConf] = useState(false)

  // Despesas filtradas do mês selecionado (excluindo moradia e internet dos pais)
  const filteredExpenses = useMemo(() => {
    const y = 2026
    const m = selectedMonth

    const monthEntries = entries.filter((e) => {
      if (!e.dueDate || e.type !== 'Despesa') return false
      const d = new Date(e.dueDate + 'T12:00:00')
      return d.getFullYear() === y && d.getMonth() === m
    })

    const byCategory = {}
    for (const e of monthEntries) {
      const cat = e.categoryId || 'outros-pessoal'
      if (EXCLUDED_CATEGORIES.includes(cat)) continue
      if (!byCategory[cat]) {
        byCategory[cat] = { category: cat, label: CATEGORY_LABEL_MAP[cat] || cat, amount: 0, items: [] }
      }
      byCategory[cat].amount += Math.abs(e.amount)
      byCategory[cat].items.push(e)
    }

    return Object.values(byCategory).sort((a, b) => b.amount - a.amount)
  }, [entries, selectedMonth])

  const totalFiltered = filteredExpenses.reduce((s, g) => s + g.amount, 0)
  const totalSimplesCustom = tangoItems.reduce((s, i) => s + (i.amount || 0), 0)
  const totalConfortavelCustom = confortavelItems.reduce((s, i) => s + (i.amount || 0), 0)
  const totalVidaSimples = totalFiltered + totalSimplesCustom
  const totalVidaConfortavel = totalFiltered + totalConfortavelCustom

  const handlePrevMonth = () => setSelectedMonth((m) => Math.max(0, m - 1))
  const handleNextMonth = () => setSelectedMonth((m) => Math.min(11, m + 1))

  const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

  return (
    <div className="space-y-6">
      {/* Comparativo lado a lado */}
      <div className="grid grid-cols-2 gap-5">
        {/* Coluna: Vida mais simples */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-offwhite">
            <div className="flex items-center gap-2.5">
              <Leaf size={16} strokeWidth={1.8} className="text-green-600 shrink-0" />
              <div>
                <h3 className="text-[11px] font-semibold text-green-700 uppercase tracking-wider">
                  Vida mais simples
                </h3>
                <p className="text-[10px] text-text-muted">Projeção essencial, sem gastos da casa</p>
              </div>
            </div>
          </div>

          {/* Navegação de mês */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-offwhite/50">
            <button
              onClick={handlePrevMonth}
              disabled={selectedMonth === 0}
              className="p-1 rounded hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft size={14} strokeWidth={2} className="text-text-secondary" />
            </button>
            <span className="text-[11px] font-semibold text-text-primary">
              {MONTH_NAMES[selectedMonth]} 2026
            </span>
            <button
              onClick={handleNextMonth}
              disabled={selectedMonth === 11}
              className="p-1 rounded hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronRight size={14} strokeWidth={2} className="text-text-secondary" />
            </button>
          </div>

          <div className="px-3 py-3 max-h-[420px] overflow-y-auto">
            {/* Accordion: Gastos que já tenho */}
            <div className="mb-3">
              <button
                onClick={() => setAccordionOpen(!accordionOpen)}
                className="flex items-center justify-between w-full px-3 py-2.5 bg-offwhite/60 rounded-lg hover:bg-offwhite transition-colors cursor-pointer"
              >
                <span className="text-[11px] font-semibold text-text-secondary">
                  Gastos que já tenho
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold tabular-nums text-text-primary">
                    {formatCurrency(totalFiltered)}
                  </span>
                  {accordionOpen
                    ? <ChevronUp size={14} strokeWidth={2} className="text-text-muted" />
                    : <ChevronDown size={14} strokeWidth={2} className="text-text-muted" />
                  }
                </div>
              </button>

              {accordionOpen && (
                <div className="mt-1.5 space-y-0.5">
                  {filteredExpenses.length === 0 ? (
                    <p className="text-[11px] text-text-muted text-center py-3">
                      Nenhuma despesa neste mês
                    </p>
                  ) : (
                    filteredExpenses.map((group) => (
                      <div key={group.category} className="flex items-center gap-2 py-1.5 px-3">
                        <span className="flex-1 min-w-0 text-[11px] text-text-muted truncate">
                          {group.label}
                        </span>
                        <span className="text-[11px] font-medium tabular-nums text-text-muted shrink-0">
                          {formatCurrency(group.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
              <div className="mx-3 my-2 border-t border-dashed border-border" />
            </div>

            {/* Itens adicionais editáveis */}
            <div>
              <div className="space-y-0.5">
                {tangoItems.map((item) => (
                  <ProjectionItem
                    key={item.id}
                    item={item}
                    onUpdate={onUpdateTangoItem}
                    onDelete={onDeleteTangoItem}
                    editable
                  />
                ))}
              </div>
              <button
                onClick={onAddTangoItem}
                className="flex items-center gap-2 w-full px-3 py-2 mt-1 text-[11px] font-medium text-green-600 hover:bg-offwhite rounded-lg transition-colors cursor-pointer"
              >
                <Plus size={14} strokeWidth={2} />
                <span>Adicionar item essencial</span>
              </button>
            </div>
          </div>
          <div className="px-5 py-3.5 border-t border-border bg-offwhite">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Total</span>
              <span className="text-base font-bold tabular-nums text-value-expense">
                {formatCurrency(totalVidaSimples)}
              </span>
            </div>
          </div>
        </div>

        {/* Coluna: Vida mais confortável */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-offwhite">
            <div className="flex items-center gap-2.5">
              <Gem size={16} strokeWidth={1.8} style={{ color: COLOR_CONFORTAVEL }} className="shrink-0" />
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: COLOR_CONFORTAVEL }}>
                  Vida mais confortável
                </h3>
                <p className="text-[10px] text-text-muted">Projeção com mais conforto</p>
              </div>
            </div>
          </div>

          {/* Navegação de mês (sincronizada) */}
          <div className="flex items-center justify-center px-4 py-2.5 border-b border-border bg-offwhite/50">
            <span className="text-[11px] font-semibold text-text-primary">
              {MONTH_NAMES[selectedMonth]} 2026
            </span>
          </div>

          <div className="px-3 py-3 max-h-[420px] overflow-y-auto">
            {/* Accordion: Gastos que já tenho (mesmos dados filtrados) */}
            <div className="mb-3">
              <button
                onClick={() => setAccordionOpenConf(!accordionOpenConf)}
                className="flex items-center justify-between w-full px-3 py-2.5 bg-offwhite/60 rounded-lg hover:bg-offwhite transition-colors cursor-pointer"
              >
                <span className="text-[11px] font-semibold text-text-secondary">
                  Gastos que já tenho
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold tabular-nums text-text-primary">
                    {formatCurrency(totalFiltered)}
                  </span>
                  {accordionOpenConf
                    ? <ChevronUp size={14} strokeWidth={2} className="text-text-muted" />
                    : <ChevronDown size={14} strokeWidth={2} className="text-text-muted" />
                  }
                </div>
              </button>

              {accordionOpenConf && (
                <div className="mt-1.5 space-y-0.5">
                  {filteredExpenses.length === 0 ? (
                    <p className="text-[11px] text-text-muted text-center py-3">
                      Nenhuma despesa neste mês
                    </p>
                  ) : (
                    filteredExpenses.map((group) => (
                      <div key={group.category} className="flex items-center gap-2 py-1.5 px-3">
                        <span className="flex-1 min-w-0 text-[11px] text-text-muted truncate">
                          {group.label}
                        </span>
                        <span className="text-[11px] font-medium tabular-nums text-text-muted shrink-0">
                          {formatCurrency(group.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
              <div className="mx-3 my-2 border-t border-dashed border-border" />
            </div>

            {/* Itens adicionais editáveis */}
            <div>
              <div className="space-y-0.5">
                {confortavelItems.map((item) => (
                  <ProjectionItem
                    key={item.id}
                    item={item}
                    onUpdate={onUpdateConfortavelItem}
                    onDelete={onDeleteConfortavelItem}
                    editable
                  />
                ))}
              </div>
              <button
                onClick={onAddConfortavelItem}
                className="flex items-center gap-2 w-full px-3 py-2 mt-1 text-[11px] font-medium hover:bg-offwhite rounded-lg transition-colors cursor-pointer"
                style={{ color: COLOR_CONFORTAVEL }}
              >
                <Plus size={14} strokeWidth={2} />
                <span>Adicionar item confortável</span>
              </button>
            </div>
          </div>
          <div className="px-5 py-3.5 border-t border-border bg-offwhite">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Total</span>
              <span className="text-base font-bold tabular-nums text-value-expense">
                {formatCurrency(totalVidaConfortavel)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Resumo comparativo */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-[10px] font-semibold text-primary uppercase tracking-wider">
            Resumo Comparativo
          </h3>
          <p className="text-[10px] text-text-muted mt-0.5">
            Vida mais simples vs Vida mais confortável
          </p>
        </div>

        <div className="grid grid-cols-4 gap-px bg-border">
          <div className="bg-surface px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={13} strokeWidth={2} className="text-primary" />
              <p className="text-[9px] font-semibold text-text-muted uppercase tracking-wider">Renda Mensal</p>
            </div>
            <p className="text-lg font-bold tabular-nums text-primary">{formatCurrency(monthlyIncome)}</p>
          </div>

          <div className="bg-surface px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <Leaf size={13} strokeWidth={2} style={{ color: COLOR_SIMPLES }} />
              <p className="text-[9px] font-semibold text-text-muted uppercase tracking-wider">Sobra (Simples)</p>
            </div>
            <p className={`text-lg font-bold tabular-nums ${(monthlyIncome - totalVidaSimples) >= 0 ? 'text-value-income' : 'text-value-expense'}`}>
              {formatCurrency(monthlyIncome - totalVidaSimples)}
            </p>
            {monthlyIncome > 0 && (
              <p className="text-[10px] text-text-muted mt-1">
                {(100 - (totalVidaSimples / monthlyIncome) * 100).toFixed(1)}% livre
              </p>
            )}
          </div>

          <div className="bg-surface px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <Gem size={13} strokeWidth={2} style={{ color: COLOR_CONFORTAVEL }} />
              <p className="text-[9px] font-semibold text-text-muted uppercase tracking-wider">Sobra (Confortável)</p>
            </div>
            <p className={`text-lg font-bold tabular-nums ${(monthlyIncome - totalVidaConfortavel) >= 0 ? 'text-value-income' : 'text-value-expense'}`}>
              {formatCurrency(monthlyIncome - totalVidaConfortavel)}
            </p>
            {monthlyIncome > 0 && (
              <p className="text-[10px] text-text-muted mt-1">
                {(100 - (totalVidaConfortavel / monthlyIncome) * 100).toFixed(1)}% livre
              </p>
            )}
          </div>

          <div className="bg-surface px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={13} strokeWidth={2} className="text-amber-500" />
              <p className="text-[9px] font-semibold text-text-muted uppercase tracking-wider">Diferença</p>
            </div>
            <p className="text-lg font-bold tabular-nums text-amber-600">
              +{formatCurrency(Math.abs(totalVidaConfortavel - totalVidaSimples))}
            </p>
            <p className="text-[10px] text-text-muted mt-1">
              conforto custa a mais
            </p>
          </div>
        </div>

        {/* Barras de comprometimento */}
        {monthlyIncome > 0 && (
          <div className="px-6 py-5 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Leaf size={12} strokeWidth={2} style={{ color: COLOR_SIMPLES }} />
                  <span className="text-[10px] font-semibold text-text-secondary">Vida mais simples</span>
                </div>
                <span className="text-[10px] font-bold tabular-nums text-text-primary">
                  {((totalVidaSimples / monthlyIncome) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2.5 bg-offwhite rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((totalVidaSimples / monthlyIncome) * 100, 100)}%`,
                    backgroundColor: COLOR_SIMPLES,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Gem size={12} strokeWidth={2} style={{ color: COLOR_CONFORTAVEL }} />
                  <span className="text-[10px] font-semibold text-text-secondary">Vida mais confortável</span>
                </div>
                <span className="text-[10px] font-bold tabular-nums text-text-primary">
                  {((totalVidaConfortavel / monthlyIncome) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2.5 bg-offwhite rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((totalVidaConfortavel / monthlyIncome) * 100, 100)}%`,
                    backgroundColor: COLOR_CONFORTAVEL,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Componente principal                                                */
/* ------------------------------------------------------------------ */

export default function ProjectionPage({ entries }) {
  const { config } = useWorkspace()
  const prefix = config.collectionsPrefix

  const [activeTab, setActiveTab] = useState('projecao')
  const [projectionData, setProjectionData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingIncome, setEditingIncome] = useState(false)
  const [incomeInput, setIncomeInput] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchProjectionData(prefix).then((data) => {
      if (cancelled) return
      if (data) {
        if (!data.scenarios) data.scenarios = DEFAULT_SCENARIOS
        if (!data.tangoItems) data.tangoItems = DEFAULT_TANGO_ITEMS
        if (!data.confortavelItems) data.confortavelItems = DEFAULT_CONFORTAVEL_ITEMS
        setProjectionData(data)
      } else {
        setProjectionData({ monthlyIncome: 0, newItems: DEFAULT_NEW_ITEMS, scenarios: DEFAULT_SCENARIOS, tangoItems: DEFAULT_TANGO_ITEMS, confortavelItems: DEFAULT_CONFORTAVEL_ITEMS })
      }
      setLoading(false)
    }).catch(() => {
      if (cancelled) return
      setProjectionData({ monthlyIncome: 0, newItems: DEFAULT_NEW_ITEMS, scenarios: DEFAULT_SCENARIOS, tangoItems: DEFAULT_TANGO_ITEMS, confortavelItems: DEFAULT_CONFORTAVEL_ITEMS })
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [prefix])

  const persistData = useCallback(async (data) => {
    setSaving(true)
    try {
      await saveProjectionData(data, prefix)
    } catch (err) {
      console.error('[Projection] save error:', err)
    }
    setSaving(false)
  }, [prefix])

  const currentMonthExpenses = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth()

    const monthEntries = entries.filter((e) => {
      if (!e.dueDate || e.type !== 'Despesa') return false
      const d = new Date(e.dueDate + 'T12:00:00')
      return d.getFullYear() === y && d.getMonth() === m
    })

    const byCategory = {}
    for (const e of monthEntries) {
      const cat = e.categoryId || 'outros-pessoal'
      if (!byCategory[cat]) {
        byCategory[cat] = { category: cat, label: CATEGORY_LABEL_MAP[cat] || cat, amount: 0, items: [] }
      }
      byCategory[cat].amount += Math.abs(e.amount)
      byCategory[cat].items.push(e)
    }

    return Object.values(byCategory).sort((a, b) => b.amount - a.amount)
  }, [entries])

  const currentMonthIncome = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth()

    return entries.filter((e) => {
      if (!e.dueDate || e.type !== 'Receita') return false
      const d = new Date(e.dueDate + 'T12:00:00')
      return d.getFullYear() === y && d.getMonth() === m
    }).reduce((sum, e) => sum + Math.abs(e.amount), 0)
  }, [entries])

  const totalCurrentExpenses = useMemo(
    () => currentMonthExpenses.reduce((sum, g) => sum + g.amount, 0),
    [currentMonthExpenses],
  )

  const avgMonthlyExpenses = useMemo(() => {
    const now = new Date()
    const startYear = now.getFullYear()
    const startMonth = now.getMonth()

    const expensesByMonth = {}
    for (const e of entries) {
      if (!e.dueDate || e.type !== 'Despesa') continue
      const d = new Date(e.dueDate + 'T12:00:00')
      const key = `${d.getFullYear()}-${d.getMonth()}`
      expensesByMonth[key] = (expensesByMonth[key] || 0) + Math.abs(e.amount)
    }

    const currentKey = `${startYear}-${startMonth}`
    const fallback = expensesByMonth[currentKey] || 0
    let total = 0
    for (let i = 0; i < 12; i++) {
      let m = startMonth + i
      let y = startYear
      while (m >= 12) { m -= 12; y++ }
      total += expensesByMonth[`${y}-${m}`] || fallback
    }
    return total / 12
  }, [entries])

  const newItems = projectionData?.newItems || []
  const tangoItems = projectionData?.tangoItems || []
  const confortavelItems = projectionData?.confortavelItems || []
  const totalNewItems = newItems.reduce((sum, i) => sum + (i.amount || 0), 0)
  const totalProjectedExpenses = totalCurrentExpenses + totalNewItems
  const monthlyIncome = projectionData?.monthlyIncome || currentMonthIncome
  const sobraAtual = monthlyIncome - totalCurrentExpenses
  const sobraProjetada = monthlyIncome - totalProjectedExpenses
  const impacto = totalNewItems
  const pctAtual = monthlyIncome > 0 ? (totalCurrentExpenses / monthlyIncome) * 100 : 0
  const pctProjetado = monthlyIncome > 0 ? (totalProjectedExpenses / monthlyIncome) * 100 : 0

  const handleUpdateItem = (updatedItem) => {
    const next = {
      ...projectionData,
      newItems: newItems.map((i) => (i.id === updatedItem.id ? updatedItem : i)),
    }
    setProjectionData(next)
    persistData(next)
  }

  const handleDeleteItem = (itemId) => {
    const next = {
      ...projectionData,
      newItems: newItems.filter((i) => i.id !== itemId),
    }
    setProjectionData(next)
    persistData(next)
  }

  const handleAddItem = () => {
    const item = { id: generateId(), category: 'outros-pessoal', label: 'Novo gasto', amount: 0 }
    const next = {
      ...projectionData,
      newItems: [...newItems, item],
    }
    setProjectionData(next)
    persistData(next)
  }

  const handleUpdateTangoItem = (updatedItem) => {
    const next = {
      ...projectionData,
      tangoItems: tangoItems.map((i) => (i.id === updatedItem.id ? updatedItem : i)),
    }
    setProjectionData(next)
    persistData(next)
  }

  const handleDeleteTangoItem = (itemId) => {
    const next = {
      ...projectionData,
      tangoItems: tangoItems.filter((i) => i.id !== itemId),
    }
    setProjectionData(next)
    persistData(next)
  }

  const handleAddTangoItem = () => {
    const item = { id: generateId(), label: 'Novo item essencial', amount: 0 }
    const next = {
      ...projectionData,
      tangoItems: [...tangoItems, item],
    }
    setProjectionData(next)
    persistData(next)
  }

  const handleUpdateConfortavelItem = (updatedItem) => {
    const next = {
      ...projectionData,
      confortavelItems: confortavelItems.map((i) => (i.id === updatedItem.id ? updatedItem : i)),
    }
    setProjectionData(next)
    persistData(next)
  }

  const handleDeleteConfortavelItem = (itemId) => {
    const next = {
      ...projectionData,
      confortavelItems: confortavelItems.filter((i) => i.id !== itemId),
    }
    setProjectionData(next)
    persistData(next)
  }

  const handleAddConfortavelItem = () => {
    const item = { id: generateId(), label: 'Novo item confortável', amount: 0 }
    const next = {
      ...projectionData,
      confortavelItems: [...confortavelItems, item],
    }
    setProjectionData(next)
    persistData(next)
  }

  const handleSaveIncome = () => {
    const value = parseFloat(incomeInput) || 0
    const next = { ...projectionData, monthlyIncome: value }
    setProjectionData(next)
    persistData(next)
    setEditingIncome(false)
  }

  const handleStartEditIncome = () => {
    setIncomeInput(String(monthlyIncome || ''))
    setEditingIncome(true)
  }

  const scenarios = projectionData?.scenarios || DEFAULT_SCENARIOS

  const handleScenarioUpdateItem = (scenarioKey, updatedItem) => {
    const scenario = scenarios[scenarioKey]
    const nextScenarios = {
      ...scenarios,
      [scenarioKey]: {
        ...scenario,
        items: scenario.items.map((i) => (i.id === updatedItem.id ? updatedItem : i)),
      },
    }
    const next = { ...projectionData, scenarios: nextScenarios }
    setProjectionData(next)
    persistData(next)
  }

  const handleScenarioDeleteItem = (scenarioKey, itemId) => {
    const scenario = scenarios[scenarioKey]
    const nextScenarios = {
      ...scenarios,
      [scenarioKey]: {
        ...scenario,
        items: scenario.items.filter((i) => i.id !== itemId),
      },
    }
    const next = { ...projectionData, scenarios: nextScenarios }
    setProjectionData(next)
    persistData(next)
  }

  const handleScenarioAddItem = (scenarioKey) => {
    const scenario = scenarios[scenarioKey]
    const item = { id: generateId(), label: 'Novo item', amount: 0 }
    const nextScenarios = {
      ...scenarios,
      [scenarioKey]: {
        ...scenario,
        items: [...scenario.items, item],
      },
    }
    const next = { ...projectionData, scenarios: nextScenarios }
    setProjectionData(next)
    persistData(next)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <section>
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <ArrowLeftRight size={22} strokeWidth={1.8} className="text-primary" />
          <h2 className="text-2xl font-bold tracking-tight uppercase">Projeção: Sair de Casa</h2>
          {saving && <span className="text-[10px] text-text-muted animate-pulse">Salvando...</span>}
        </div>
        <p className="text-sm text-text-muted font-semibold">
          Compare sua situação atual com o cenário de morar sozinho
        </p>
      </header>

      {/* Renda mensal (compartilhada entre abas) */}
      <div className="bg-surface rounded-xl border border-border px-6 py-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign size={18} strokeWidth={1.8} className="text-primary shrink-0" />
            <div>
              <h4 className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                Renda Mensal (Pró-labore)
              </h4>
              <p className="text-[10px] text-text-muted mt-0.5">
                Quanto você retira da empresa mensalmente
              </p>
            </div>
          </div>
          {editingIncome ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-text-muted">R$</span>
                <input
                  type="number"
                  value={incomeInput}
                  onChange={(e) => setIncomeInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveIncome(); if (e.key === 'Escape') setEditingIncome(false) }}
                  className="w-36 text-[13px] bg-white border border-border rounded-lg pl-8 pr-3 py-2 text-right focus:outline-none focus:ring-1 focus:ring-primary tabular-nums"
                  autoFocus
                  step="0.01"
                />
              </div>
              <button onClick={handleSaveIncome} className="p-1.5 text-value-income hover:bg-offwhite rounded-lg cursor-pointer">
                <Check size={16} strokeWidth={2} />
              </button>
              <button onClick={() => setEditingIncome(false)} className="p-1.5 text-text-muted hover:bg-offwhite rounded-lg cursor-pointer">
                <X size={16} strokeWidth={2} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleStartEditIncome}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-offwhite transition-colors cursor-pointer group"
            >
              <span className="text-xl font-bold tabular-nums text-primary">
                {formatCurrency(monthlyIncome)}
              </span>
              <Edit3 size={14} strokeWidth={2} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>
      </div>

      {/* Sub-abas */}
      <div className="flex items-center gap-1 mb-6 border-b border-border">
        {SUB_TABS.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
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

      {/* Conteúdo da aba ativa */}
      {activeTab === 'projecao' && (
        <ProjecaoTab
          entries={entries}
          monthlyIncome={monthlyIncome}
          totalSimplesExtra={tangoItems.reduce((s, i) => s + (i.amount || 0), 0)}
          totalConfortavelExtra={confortavelItems.reduce((s, i) => s + (i.amount || 0), 0)}
        />
      )}

      {activeTab === 'cenarios' && (
        <CenariosTab
          scenarios={scenarios}
          avgMonthlyExpenses={avgMonthlyExpenses}
          monthlyIncome={monthlyIncome}
          onUpdateItem={handleScenarioUpdateItem}
          onDeleteItem={handleScenarioDeleteItem}
          onAddItem={handleScenarioAddItem}
        />
      )}

      {activeTab === 'comparativo' && (
        <ComparativoTab
          entries={entries}
          monthlyIncome={monthlyIncome}
          tangoItems={tangoItems}
          onUpdateTangoItem={handleUpdateTangoItem}
          onDeleteTangoItem={handleDeleteTangoItem}
          onAddTangoItem={handleAddTangoItem}
          confortavelItems={confortavelItems}
          onUpdateConfortavelItem={handleUpdateConfortavelItem}
          onDeleteConfortavelItem={handleDeleteConfortavelItem}
          onAddConfortavelItem={handleAddConfortavelItem}
        />
      )}
    </section>
  )
}
