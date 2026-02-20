import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  ArrowLeftRight, Home, Plus, Trash2, Edit3, Check, X,
  DollarSign, AlertTriangle, ShoppingCart, LayoutDashboard,
  BarChart3, Layers, Leaf, Gem, TrendingDown, Wallet,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  UtensilsCrossed, Sofa, BedDouble, Bath, WashingMachine, Monitor, Package,
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

const DEFAULT_SETUP_CATEGORIES = [
  {
    id: 'cozinha', label: 'Cozinha', items: [
      { id: 'geladeira', label: 'Geladeira', kitnet: 0, mediano: 0, confortavel: 0 },
      { id: 'fogao', label: 'Fogão', kitnet: 0, mediano: 0, confortavel: 0 },
      { id: 'microondas', label: 'Microondas', kitnet: 0, mediano: 0, confortavel: 0 },
      { id: 'maq-lavar-louca', label: 'Máquina de lavar louça', kitnet: 0, mediano: 0, confortavel: 0 },
      { id: 'utensilios-cozinha', label: 'Utensílios de cozinha', kitnet: 0, mediano: 0, confortavel: 0 },
      { id: 'panelas', label: 'Jogo de panelas', kitnet: 0, mediano: 0, confortavel: 0 },
      { id: 'talheres-pratos', label: 'Talheres e pratos', kitnet: 0, mediano: 0, confortavel: 0 },
    ],
  },
  {
    id: 'sala', label: 'Sala', items: [
      { id: 'sofa', label: 'Sofá', kitnet: 0, mediano: 0, confortavel: 0 },
      { id: 'mesa-jantar', label: 'Mesa de jantar', kitnet: 0, mediano: 0, confortavel: 0 },
      { id: 'cadeiras', label: 'Cadeiras', kitnet: 0, mediano: 0, confortavel: 0 },
      { id: 'tv', label: 'TV', kitnet: 0, mediano: 0, confortavel: 0 },
      { id: 'rack-tv', label: 'Rack / Painel de TV', kitnet: 0, mediano: 0, confortavel: 0 },
    ],
  },
  {
    id: 'quarto', label: 'Quarto', items: [
      { id: 'cama', label: 'Cama', kitnet: 0, mediano: 0, confortavel: 0 },
      { id: 'colchao', label: 'Colchão', kitnet: 0, mediano: 0, confortavel: 0 },
      { id: 'guarda-roupa', label: 'Guarda-roupa', kitnet: 0, mediano: 0, confortavel: 0 },
      { id: 'roupa-cama', label: 'Roupa de cama', kitnet: 0, mediano: 0, confortavel: 0 },
      { id: 'travesseiros', label: 'Travesseiros', kitnet: 0, mediano: 0, confortavel: 0 },
      { id: 'cortinas', label: 'Cortinas', kitnet: 0, mediano: 0, confortavel: 0 },
    ],
  },
  {
    id: 'banheiro', label: 'Banheiro', items: [
      { id: 'toalhas', label: 'Jogo de toalhas', kitnet: 0, mediano: 0, confortavel: 0 },
      { id: 'espelho', label: 'Espelho', kitnet: 0, mediano: 0, confortavel: 0 },
      { id: 'acess-banheiro', label: 'Acessórios (saboneteira etc.)', kitnet: 0, mediano: 0, confortavel: 0 },
    ],
  },
  {
    id: 'lavanderia', label: 'Lavanderia', items: [
      { id: 'maq-lavar-roupa', label: 'Máquina de lavar roupa', kitnet: 0, mediano: 0, confortavel: 0 },
      { id: 'varal', label: 'Varal', kitnet: 0, mediano: 0, confortavel: 0 },
      { id: 'ferro-passar', label: 'Ferro de passar', kitnet: 0, mediano: 0, confortavel: 0 },
      { id: 'tabua-passar', label: 'Tábua de passar', kitnet: 0, mediano: 0, confortavel: 0 },
    ],
  },
  {
    id: 'escritorio', label: 'Escritório / Home Office', items: [
      { id: 'mesa-escritorio', label: 'Mesa', kitnet: 0, mediano: 0, confortavel: 0 },
      { id: 'cadeira-escritorio', label: 'Cadeira', kitnet: 0, mediano: 0, confortavel: 0 },
      { id: 'luminaria', label: 'Luminária', kitnet: 0, mediano: 0, confortavel: 0 },
    ],
  },
  {
    id: 'utensilios-diversos', label: 'Utensílios Diversos', items: [
      { id: 'aspirador', label: 'Aspirador de pó', kitnet: 0, mediano: 0, confortavel: 0 },
      { id: 'lixeiras', label: 'Lixeiras', kitnet: 0, mediano: 0, confortavel: 0 },
      { id: 'organizadores', label: 'Organizadores', kitnet: 0, mediano: 0, confortavel: 0 },
      { id: 'cabides', label: 'Cabides', kitnet: 0, mediano: 0, confortavel: 0 },
    ],
  },
]

// Categorias excluídas dos cenários pessoais (gastos da casa dos pais que não teremos)
const EXCLUDED_CATEGORIES = ['moradia', 'internet-telefone']


const SUB_TABS = [
  { id: 'visao-geral', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'caixa-necessario', label: 'Caixa Necessária', icon: Wallet },
  { id: 'projecao', label: 'Projeção 12 Meses', icon: BarChart3 },
  { id: 'cenarios', label: 'Cenários', icon: Layers },
  { id: 'investimento', label: 'Investimento Inicial', icon: ShoppingCart },
]

const COLOR_EM_CASA = '#EA580C'       // laranja — ficando na casa dos pais
const COLOR_SIMPLES = '#3B82F6'       // azul claro — vida mais simples
const COLOR_CONFORTAVEL = '#16A34A'   // verde — vida mais confortável
const COLOR_INCOME = '#7C3AED'        // roxo — linha de renda
const COLOR_KITNET = '#F59E0B'        // amarelo — kitnet
const COLOR_MEDIANO = '#8B5CF6'       // violeta — apartamento mediano
const COLOR_CONFORT_INV = '#0EA5E9'   // sky blue — apartamento confortável

function calculateAverageExpenses(entries, totalSimplesExtra, totalConfortavelExtra) {
  const allByMonth = {}
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

  const months = Object.keys(allByMonth)
  const countAll = months.length || 1
  const totalAll = Object.values(allByMonth).reduce((s, v) => s + v, 0)
  const totalFiltered = Object.values(filteredByMonth).reduce((s, v) => s + v, 0)

  return {
    emCasa: totalAll / countAll,
    baseFiltered: totalFiltered / countAll,
    simples: (totalFiltered / countAll) + totalSimplesExtra,
    confortavel: (totalFiltered / countAll) + totalConfortavelExtra,
  }
}

function calculateSetupInvestmentTotals(setupCategories) {
  let kitnet = 0
  let mediano = 0
  let confortavel = 0
  for (const cat of setupCategories) {
    for (const item of cat.items) {
      kitnet += item.kitnet || 0
      mediano += item.mediano || 0
      confortavel += item.confortavel || 0
    }
  }
  return { kitnet, mediano, confortavel }
}

/* ------------------------------------------------------------------ */
/*  Sub-aba: Visão Geral                                                */
/* ------------------------------------------------------------------ */

function VisaoGeralTab({ entries, monthlyIncome, totalSimplesExtra, totalConfortavelExtra, setupCategories }) {
  const avgExpenses = useMemo(() => {
    return calculateAverageExpenses(entries, totalSimplesExtra, totalConfortavelExtra)
  }, [entries, totalSimplesExtra, totalConfortavelExtra])

  const invTotals = useMemo(() => {
    return calculateSetupInvestmentTotals(setupCategories)
  }, [setupCategories])

  const sobraSimples = monthlyIncome - avgExpenses.simples
  const sobraConfortavel = monthlyIncome - avgExpenses.confortavel
  const sobraEmCasa = monthlyIncome - avgExpenses.emCasa

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface rounded-xl border border-border px-6 py-5">
        <h3 className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-1">
          Resumo da Projeção
        </h3>
        <p className="text-[10px] text-text-muted">
          Visão consolidada dos custos mensais e investimento inicial para sair de casa
        </p>
      </div>

      {/* Gastos mensais médios */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown size={15} strokeWidth={2} className="text-primary" />
          <h3 className="text-[11px] font-bold text-primary uppercase tracking-wider">Custo Mensal Médio</h3>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Em Casa */}
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Home size={14} strokeWidth={2} style={{ color: COLOR_EM_CASA }} />
                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Em Casa (atual)</p>
              </div>
              <p className="text-2xl font-bold tabular-nums" style={{ color: COLOR_EM_CASA }}>
                {formatCurrency(avgExpenses.emCasa)}
              </p>
              {monthlyIncome > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-text-muted">Sobra mensal</span>
                    <span className={`text-[12px] font-bold tabular-nums ${sobraEmCasa >= 0 ? 'text-value-income' : 'text-value-expense'}`}>
                      {formatCurrency(sobraEmCasa)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-offwhite rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min((avgExpenses.emCasa / monthlyIncome) * 100, 100)}%`, backgroundColor: COLOR_EM_CASA }}
                    />
                  </div>
                  <p className="text-[9px] text-text-muted text-right mt-1">
                    {((avgExpenses.emCasa / monthlyIncome) * 100).toFixed(0)}% da renda
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Vida Simples */}
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Leaf size={14} strokeWidth={2} style={{ color: COLOR_SIMPLES }} />
                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Vida Mais Simples</p>
              </div>
              <p className="text-2xl font-bold tabular-nums" style={{ color: COLOR_SIMPLES }}>
                {formatCurrency(avgExpenses.simples)}
              </p>
              {monthlyIncome > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-text-muted">Sobra mensal</span>
                    <span className={`text-[12px] font-bold tabular-nums ${sobraSimples >= 0 ? 'text-value-income' : 'text-value-expense'}`}>
                      {formatCurrency(sobraSimples)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-offwhite rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min((avgExpenses.simples / monthlyIncome) * 100, 100)}%`, backgroundColor: COLOR_SIMPLES }}
                    />
                  </div>
                  <p className="text-[9px] text-text-muted text-right mt-1">
                    {((avgExpenses.simples / monthlyIncome) * 100).toFixed(0)}% da renda
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Vida Confortável */}
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Gem size={14} strokeWidth={2} style={{ color: COLOR_CONFORTAVEL }} />
                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Vida Mais Confortável</p>
              </div>
              <p className="text-2xl font-bold tabular-nums" style={{ color: COLOR_CONFORTAVEL }}>
                {formatCurrency(avgExpenses.confortavel)}
              </p>
              {monthlyIncome > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-text-muted">Sobra mensal</span>
                    <span className={`text-[12px] font-bold tabular-nums ${sobraConfortavel >= 0 ? 'text-value-income' : 'text-value-expense'}`}>
                      {formatCurrency(sobraConfortavel)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-offwhite rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min((avgExpenses.confortavel / monthlyIncome) * 100, 100)}%`, backgroundColor: COLOR_CONFORTAVEL }}
                    />
                  </div>
                  <p className="text-[9px] text-text-muted text-right mt-1">
                    {((avgExpenses.confortavel / monthlyIncome) * 100).toFixed(0)}% da renda
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Investimento Inicial */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Wallet size={15} strokeWidth={2} className="text-primary" />
          <h3 className="text-[11px] font-bold text-primary uppercase tracking-wider">Investimento Inicial (Montagem)</h3>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Kitnet / Studio', total: invTotals.kitnet, color: COLOR_KITNET, icon: Home },
            { label: 'Ap. Mediano', total: invTotals.mediano, color: COLOR_MEDIANO, icon: Layers },
            { label: 'Ap. Confortável', total: invTotals.confortavel, color: COLOR_CONFORT_INV, icon: Gem },
          ].map((s) => {
            const meses = monthlyIncome > 0 ? s.total / monthlyIncome : 0
            return (
              <div key={s.label} className="bg-surface rounded-xl border border-border px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <s.icon size={14} strokeWidth={2} style={{ color: s.color }} />
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{s.label}</p>
                </div>
                <p className="text-2xl font-bold tabular-nums" style={{ color: s.color }}>
                  {formatCurrency(s.total)}
                </p>
                {monthlyIncome > 0 && (
                  <p className="text-[10px] mt-2 text-text-muted">
                    ~{meses.toFixed(1)} meses de renda para juntar
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabela comparativa final */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-[10px] font-semibold text-primary uppercase tracking-wider">
            Comparativo Consolidado
          </h3>
          <p className="text-[10px] text-text-muted mt-0.5">Quanto custa cada cenário por mês + investimento para começar</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-offwhite border-b border-border">
                <th className="text-left px-4 py-2.5 font-semibold text-text-secondary uppercase tracking-wider" />
                <th className="text-right px-4 py-2.5 font-semibold uppercase tracking-wider" style={{ color: COLOR_EM_CASA }}>Em Casa</th>
                <th className="text-right px-4 py-2.5 font-semibold uppercase tracking-wider" style={{ color: COLOR_SIMPLES }}>Vida Simples</th>
                <th className="text-right px-4 py-2.5 font-semibold uppercase tracking-wider" style={{ color: COLOR_CONFORTAVEL }}>Vida Confortável</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-4 py-3 font-semibold text-text-primary">Gasto mensal médio</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium" style={{ color: COLOR_EM_CASA }}>{formatCurrency(avgExpenses.emCasa)}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium" style={{ color: COLOR_SIMPLES }}>{formatCurrency(avgExpenses.simples)}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium" style={{ color: COLOR_CONFORTAVEL }}>{formatCurrency(avgExpenses.confortavel)}</td>
              </tr>
              {monthlyIncome > 0 && (
                <tr className="border-b border-border bg-offwhite/50">
                  <td className="px-4 py-3 font-semibold text-text-primary">Sobra mensal</td>
                  <td className={`px-4 py-3 text-right tabular-nums font-medium ${sobraEmCasa >= 0 ? 'text-value-income' : 'text-value-expense'}`}>{formatCurrency(sobraEmCasa)}</td>
                  <td className={`px-4 py-3 text-right tabular-nums font-medium ${sobraSimples >= 0 ? 'text-value-income' : 'text-value-expense'}`}>{formatCurrency(sobraSimples)}</td>
                  <td className={`px-4 py-3 text-right tabular-nums font-medium ${sobraConfortavel >= 0 ? 'text-value-income' : 'text-value-expense'}`}>{formatCurrency(sobraConfortavel)}</td>
                </tr>
              )}
              <tr className="border-b border-border">
                <td className="px-4 py-3 font-semibold text-text-primary">Investimento inicial</td>
                <td className="px-4 py-3 text-right tabular-nums text-text-muted">—</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium" style={{ color: COLOR_MEDIANO }}>{formatCurrency(invTotals.mediano)}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium" style={{ color: COLOR_CONFORT_INV }}>{formatCurrency(invTotals.confortavel)}</td>
              </tr>
              {monthlyIncome > 0 && (
                <tr className="bg-offwhite/50">
                  <td className="px-4 py-3 font-semibold text-text-primary">Meses para juntar investimento</td>
                  <td className="px-4 py-3 text-right tabular-nums text-text-muted">—</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-text-secondary">
                    {sobraSimples > 0 ? `${(invTotals.mediano / sobraSimples).toFixed(1)} meses` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-text-secondary">
                    {sobraConfortavel > 0 ? `${(invTotals.confortavel / sobraConfortavel).toFixed(1)} meses` : '—'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function CaixaNecessarioTab({ entries, totalSimplesExtra, totalConfortavelExtra, setupCategories }) {
  const avgExpenses = useMemo(
    () => calculateAverageExpenses(entries, totalSimplesExtra, totalConfortavelExtra),
    [entries, totalSimplesExtra, totalConfortavelExtra],
  )
  const invTotals = useMemo(
    () => calculateSetupInvestmentTotals(setupCategories),
    [setupCategories],
  )

  const reserveRows = [3, 6, 12].map((months) => {
    const simples = avgExpenses.simples * months
    const confortavel = avgExpenses.confortavel * months
    const simplesComMediano = simples + invTotals.mediano
    const confortavelComConfortavel = confortavel + invTotals.confortavel
    return {
      months,
      simples,
      confortavel,
      simplesComMediano,
      confortavelComConfortavel,
    }
  })
  const metaPassoConforto = reserveRows.find((r) => r.months === 3)?.confortavelComConfortavel || 0
  const metaPassoSimples = reserveRows.find((r) => r.months === 3)?.simplesComMediano || 0

  return (
    <div className="space-y-6">
      <div className="bg-surface rounded-xl border border-border px-6 py-5">
        <h3 className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-1">
          Caixa Necessária
        </h3>
        <p className="text-[10px] text-text-muted">
          Quanto você precisa ter em conta para dar o passo com segurança, já somando reserva e moradia.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface rounded-xl border border-border px-5 py-4">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Meta para dar o passo com conforto</p>
          <p className="text-[11px] text-text-secondary mb-2">3 meses de vida confortável + AP confortável</p>
          <p className="text-[22px] font-bold tabular-nums" style={{ color: COLOR_CONFORTAVEL }}>
            {formatCurrency(metaPassoConforto)}
          </p>
        </div>
        <div className="bg-surface rounded-xl border border-border px-5 py-4">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Meta para passo mais simples</p>
          <p className="text-[11px] text-text-secondary mb-2">3 meses de vida simples + AP mediano</p>
          <p className="text-[22px] font-bold tabular-nums" style={{ color: COLOR_SIMPLES }}>
            {formatCurrency(metaPassoSimples)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl border border-border px-4 py-3">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Vida mais simples</p>
          <p className="text-[14px] font-semibold tabular-nums" style={{ color: COLOR_SIMPLES }}>
            {formatCurrency(avgExpenses.simples)}/mês
          </p>
        </div>
        <div className="bg-surface rounded-xl border border-border px-4 py-3">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Vida confortável</p>
          <p className="text-[14px] font-semibold tabular-nums" style={{ color: COLOR_CONFORTAVEL }}>
            {formatCurrency(avgExpenses.confortavel)}/mês
          </p>
        </div>
        <div className="bg-surface rounded-xl border border-border px-4 py-3">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">AP mediano</p>
          <p className="text-[14px] font-semibold tabular-nums" style={{ color: COLOR_MEDIANO }}>
            +{formatCurrency(invTotals.mediano)}
          </p>
        </div>
        <div className="bg-surface rounded-xl border border-border px-4 py-3">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">AP confortável</p>
          <p className="text-[14px] font-semibold tabular-nums" style={{ color: COLOR_CONFORT_INV }}>
            +{formatCurrency(invTotals.confortavel)}
          </p>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-offwhite border-b border-border">
                <th className="text-left px-4 py-3 font-semibold text-text-secondary uppercase tracking-wider">Reserva</th>
                <th className="text-right px-4 py-3 font-semibold uppercase tracking-wider" style={{ color: COLOR_SIMPLES }}>Vida simples</th>
                <th className="text-right px-4 py-3 font-semibold uppercase tracking-wider" style={{ color: COLOR_CONFORTAVEL }}>Vida confortável</th>
                <th className="text-right px-4 py-3 font-semibold uppercase tracking-wider" style={{ color: COLOR_MEDIANO }}>Simples + AP mediano</th>
                <th className="text-right px-4 py-3 font-semibold uppercase tracking-wider" style={{ color: COLOR_CONFORT_INV }}>Confortável + AP confortável</th>
              </tr>
            </thead>
            <tbody>
              {reserveRows.map((row, idx) => (
                <tr key={row.months} className={`border-b border-border ${idx % 2 === 0 ? '' : 'bg-offwhite/40'}`}>
                  <td className="px-4 py-3 font-semibold text-text-primary">{row.months} meses</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(row.simples)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(row.confortavel)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(row.simplesComMediano)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(row.confortavelComConfortavel)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

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
/*  Sub-aba: Cenários (Vida mais simples x Vida mais confortável)        */
/* ------------------------------------------------------------------ */

function CenariosTab({
  entries, monthlyIncome,
  tangoItems, onUpdateTangoItem, onDeleteTangoItem, onAddTangoItem,
  confortavelItems, onUpdateConfortavelItem, onDeleteConfortavelItem, onAddConfortavelItem,
}) {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth()) // 0-11
  const [accordionOpen, setAccordionOpen] = useState(false)
  const [accordionOpenConf, setAccordionOpenConf] = useState(false)

  const filteredExpenses = useMemo(() => {
    const y = 2026

    const getMonthExpenses = (month) =>
      entries.filter((e) => {
        if (!e.dueDate || e.type !== 'Despesa') return false
        const d = new Date(e.dueDate + 'T12:00:00')
        return d.getFullYear() === y && d.getMonth() === month
      })

    let monthEntries = getMonthExpenses(selectedMonth)

    if (monthEntries.length === 0) {
      for (let fb = selectedMonth - 1; fb >= 0; fb--) {
        const fallback = getMonthExpenses(fb)
        if (fallback.length > 0) { monthEntries = fallback; break }
      }
    }

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
/*  Sub-aba: Investimento Inicial (tabela unificada)                    */
/* ------------------------------------------------------------------ */

function CurrencyInput({ value, onChange, color }) {
  const [editing, setEditing] = useState(false)
  const [raw, setRaw] = useState('')

  const handleStart = () => { setRaw(String(value || '')); setEditing(true) }
  const handleSave = () => { onChange(parseFloat(raw) || 0); setEditing(false) }
  const handleKey = (e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }

  if (editing) {
    return (
      <input
        type="number"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKey}
        className="w-full text-[11px] bg-white border border-border rounded px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-primary tabular-nums"
        autoFocus
        step="0.01"
        min="0"
      />
    )
  }

  return (
    <button
      onClick={handleStart}
      className={`w-full text-[11px] tabular-nums text-right px-2 py-1 rounded hover:bg-offwhite transition-colors cursor-pointer ${value > 0 ? 'font-semibold' : 'text-text-muted'}`}
      style={value > 0 ? { color } : undefined}
    >
      {value > 0 ? formatCurrency(value) : '—'}
    </button>
  )
}

function InvestimentoInicialTab({ monthlyIncome, setupCategories, onUpdateSetup }) {
  const totals = useMemo(() => {
    let kitnet = 0, mediano = 0, confortavel = 0
    for (const cat of setupCategories) {
      for (const item of cat.items) {
        kitnet += item.kitnet || 0
        mediano += item.mediano || 0
        confortavel += item.confortavel || 0
      }
    }
    return { kitnet, mediano, confortavel }
  }, [setupCategories])

  const maxTotal = Math.max(totals.kitnet, totals.mediano, totals.confortavel, 1)

  const handleValueChange = (catId, itemId, scenario, value) => {
    const next = setupCategories.map((cat) => {
      if (cat.id !== catId) return cat
      return {
        ...cat,
        items: cat.items.map((item) => {
          if (item.id !== itemId) return item
          return { ...item, [scenario]: value }
        }),
      }
    })
    onUpdateSetup(next)
  }

  const handleAddItem = (catId) => {
    const next = setupCategories.map((cat) => {
      if (cat.id !== catId) return cat
      return {
        ...cat,
        items: [...cat.items, { id: generateId(), label: 'Novo item', kitnet: 0, mediano: 0, confortavel: 0 }],
      }
    })
    onUpdateSetup(next)
  }

  const handleDeleteItem = (catId, itemId) => {
    const next = setupCategories.map((cat) => {
      if (cat.id !== catId) return cat
      return { ...cat, items: cat.items.filter((i) => i.id !== itemId) }
    })
    onUpdateSetup(next)
  }

  const handleRenameItem = (catId, itemId, label) => {
    const next = setupCategories.map((cat) => {
      if (cat.id !== catId) return cat
      return {
        ...cat,
        items: cat.items.map((i) => (i.id === itemId ? { ...i, label } : i)),
      }
    })
    onUpdateSetup(next)
  }

  const handleRenameCategory = (catId, newLabel) => {
    const next = setupCategories.map((cat) => {
      if (cat.id !== catId) return cat
      return { ...cat, label: newLabel }
    })
    onUpdateSetup(next)
  }

  const handleDeleteCategory = (catId) => {
    const next = setupCategories.filter((cat) => cat.id !== catId)
    onUpdateSetup(next)
  }

  const handleAddCategory = () => {
    const next = [...setupCategories, {
      id: generateId(),
      label: 'Nova categoria',
      items: [{ id: generateId(), label: 'Novo item', kitnet: 0, mediano: 0, confortavel: 0 }],
    }]
    onUpdateSetup(next)
  }

  const scenarios = [
    { key: 'kitnet', label: 'Kitnet / Studio', color: COLOR_KITNET, total: totals.kitnet },
    { key: 'mediano', label: 'Ap. Mediano', color: COLOR_MEDIANO, total: totals.mediano },
    { key: 'confortavel', label: 'Ap. Confortável', color: COLOR_CONFORT_INV, total: totals.confortavel },
  ]

  return (
    <div className="space-y-6">
      {/* Cards resumo */}
      <div className="grid grid-cols-3 gap-4">
        {scenarios.map((s) => {
          const meses = monthlyIncome > 0 ? s.total / monthlyIncome : 0
          return (
            <div key={s.key} className="bg-surface rounded-xl border border-border px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                <p className="text-[9px] font-semibold text-text-muted uppercase tracking-wider">{s.label}</p>
              </div>
              <p className="text-lg font-bold tabular-nums" style={{ color: s.color }}>
                {formatCurrency(s.total)}
              </p>
              {monthlyIncome > 0 && (
                <p className="text-[10px] mt-1 text-text-muted">~{meses.toFixed(1)} meses de renda</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Barra comparativa */}
      <div className="bg-surface rounded-xl border border-border px-6 py-5">
        <h3 className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-4">
          Comparativo de Investimento
        </h3>
        <div className="space-y-4">
          {scenarios.map((s) => (
            <div key={s.key}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-text-secondary">{s.label}</span>
                <span className="text-[11px] font-bold tabular-nums text-text-primary">{formatCurrency(s.total)}</span>
              </div>
              <div className="h-2.5 bg-offwhite rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((s.total / maxTotal) * 100, 100)}%`, backgroundColor: s.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabela unificada */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-[10px] font-semibold text-primary uppercase tracking-wider">
            Montagem do Lar — Comparativo por Item
          </h3>
          <p className="text-[10px] text-text-muted mt-0.5">Clique no valor para editar. Itens que não precisa comprar deixe como "—".</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-offwhite border-b border-border">
                <th className="text-left px-4 py-2.5 font-semibold text-text-secondary uppercase tracking-wider w-[260px]">Item</th>
                <th className="text-right px-3 py-2.5 font-semibold uppercase tracking-wider w-[140px]" style={{ color: COLOR_KITNET }}>Kitnet / Studio</th>
                <th className="text-right px-3 py-2.5 font-semibold uppercase tracking-wider w-[140px]" style={{ color: COLOR_MEDIANO }}>Ap. Mediano</th>
                <th className="text-right px-3 py-2.5 font-semibold uppercase tracking-wider w-[140px]" style={{ color: COLOR_CONFORT_INV }}>Ap. Confortável</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {setupCategories.map((cat) => {
                const catTotals = { kitnet: 0, mediano: 0, confortavel: 0 }
                for (const item of cat.items) {
                  catTotals.kitnet += item.kitnet || 0
                  catTotals.mediano += item.mediano || 0
                  catTotals.confortavel += item.confortavel || 0
                }
                return (
                  <CategoryBlock
                    key={cat.id}
                    cat={cat}
                    catTotals={catTotals}
                    onValueChange={handleValueChange}
                    onAddItem={handleAddItem}
                    onDeleteItem={handleDeleteItem}
                    onRenameItem={handleRenameItem}
                    onRenameCategory={handleRenameCategory}
                    onDeleteCategory={handleDeleteCategory}
                  />
                )
              })}

              {/* Total geral */}
              <tr className="bg-offwhite font-semibold border-t-2 border-border">
                <td className="px-4 py-3 text-text-primary uppercase tracking-wider text-[10px]">Total Geral</td>
                <td className="px-3 py-3 text-right tabular-nums" style={{ color: COLOR_KITNET }}>{formatCurrency(totals.kitnet)}</td>
                <td className="px-3 py-3 text-right tabular-nums" style={{ color: COLOR_MEDIANO }}>{formatCurrency(totals.mediano)}</td>
                <td className="px-3 py-3 text-right tabular-nums" style={{ color: COLOR_CONFORT_INV }}>{formatCurrency(totals.confortavel)}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-border">
          <button
            onClick={handleAddCategory}
            className="flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-primary hover:bg-offwhite rounded-lg transition-colors cursor-pointer"
          >
            <Plus size={14} strokeWidth={2} />
            <span>Adicionar categoria</span>
          </button>
        </div>
      </div>
    </div>
  )
}

const CATEGORY_ICONS = {
  cozinha: UtensilsCrossed,
  sala: Sofa,
  quarto: BedDouble,
  banheiro: Bath,
  lavanderia: WashingMachine,
  escritorio: Monitor,
  'utensilios-diversos': Package,
}

const CATEGORY_COLORS = {
  cozinha: '#E11D48',
  sala: '#7C3AED',
  quarto: '#2563EB',
  banheiro: '#0891B2',
  lavanderia: '#059669',
  escritorio: '#D97706',
  'utensilios-diversos': '#6B7280',
}

function CategoryBlock({ cat, catTotals, onValueChange, onAddItem, onDeleteItem, onRenameItem, onRenameCategory, onDeleteCategory }) {
  const [editingLabel, setEditingLabel] = useState(null)
  const [labelInput, setLabelInput] = useState('')
  const [editingCatName, setEditingCatName] = useState(false)
  const [catNameInput, setCatNameInput] = useState('')

  const startRename = (itemId, currentLabel) => { setEditingLabel(itemId); setLabelInput(currentLabel) }
  const saveRename = (catId, itemId) => { onRenameItem(catId, itemId, labelInput.trim() || 'Item'); setEditingLabel(null) }

  const startRenameCat = () => { setCatNameInput(cat.label); setEditingCatName(true) }
  const saveRenameCat = () => { onRenameCategory(cat.id, catNameInput.trim() || 'Categoria'); setEditingCatName(false) }

  const CatIcon = CATEGORY_ICONS[cat.id] || Package
  const catColor = CATEGORY_COLORS[cat.id] || '#6B7280'

  return (
    <>
      {/* Header da categoria */}
      <tr className="border-t-2 border-border" style={{ backgroundColor: `${catColor}08` }}>
        <td colSpan={4} className="px-4 py-2.5">
          <div className="flex items-center gap-2.5 group/cat">
            <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `${catColor}15` }}>
              <CatIcon size={13} strokeWidth={2} style={{ color: catColor }} />
            </div>
            {editingCatName ? (
              <input
                type="text"
                value={catNameInput}
                onChange={(e) => setCatNameInput(e.target.value)}
                onBlur={saveRenameCat}
                onKeyDown={(e) => { if (e.key === 'Enter') saveRenameCat(); if (e.key === 'Escape') setEditingCatName(false) }}
                className="flex-1 text-[11px] font-bold bg-white border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary uppercase tracking-wider"
                autoFocus
              />
            ) : (
              <button
                onClick={startRenameCat}
                className="text-[11px] font-bold uppercase tracking-wider hover:underline transition-colors cursor-pointer"
                style={{ color: catColor }}
              >
                {cat.label}
              </button>
            )}
            <button
              onClick={() => onDeleteCategory(cat.id)}
              className="p-1 text-text-muted hover:text-red-600 rounded opacity-0 group-hover/cat:opacity-100 transition-all cursor-pointer ml-auto"
              title="Remover categoria"
            >
              <Trash2 size={11} strokeWidth={2} />
            </button>
          </div>
        </td>
        <td style={{ backgroundColor: `${catColor}08` }} />
      </tr>

      {/* Itens */}
      {cat.items.map((item, idx) => (
        <tr key={item.id} className={`border-b border-border/50 group hover:bg-offwhite/40 transition-colors ${idx % 2 === 0 ? '' : 'bg-offwhite/20'}`}>
          <td className="py-1.5" style={{ paddingLeft: '3rem' }}>
            {editingLabel === item.id ? (
              <input
                type="text"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onBlur={() => saveRename(cat.id, item.id)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveRename(cat.id, item.id); if (e.key === 'Escape') setEditingLabel(null) }}
                className="w-full text-[11px] bg-white border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
            ) : (
              <button
                onClick={() => startRename(item.id, item.label)}
                className="text-[11px] text-text-primary hover:text-primary transition-colors cursor-pointer text-left"
              >
                {item.label}
              </button>
            )}
          </td>
          <td className="px-3 py-1.5">
            <CurrencyInput value={item.kitnet} onChange={(v) => onValueChange(cat.id, item.id, 'kitnet', v)} color={COLOR_KITNET} />
          </td>
          <td className="px-3 py-1.5">
            <CurrencyInput value={item.mediano} onChange={(v) => onValueChange(cat.id, item.id, 'mediano', v)} color={COLOR_MEDIANO} />
          </td>
          <td className="px-3 py-1.5">
            <CurrencyInput value={item.confortavel} onChange={(v) => onValueChange(cat.id, item.id, 'confortavel', v)} color={COLOR_CONFORT_INV} />
          </td>
          <td className="px-1 py-1.5">
            <button
              onClick={() => onDeleteItem(cat.id, item.id)}
              className="p-1 text-text-muted hover:text-red-600 rounded opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
            >
              <Trash2 size={11} strokeWidth={2} />
            </button>
          </td>
        </tr>
      ))}

      {/* Subtotal + botão adicionar */}
      <tr className="border-b border-border" style={{ backgroundColor: `${catColor}06` }}>
        <td className="py-2" style={{ paddingLeft: '3rem' }}>
          <button
            onClick={() => onAddItem(cat.id)}
            className="flex items-center gap-1.5 text-[10px] font-medium transition-colors cursor-pointer"
            style={{ color: catColor }}
          >
            <Plus size={12} strokeWidth={2} />
            <span>Adicionar item</span>
          </button>
        </td>
        <td className="px-3 py-2 text-right text-[10px] font-bold tabular-nums" style={{ color: catTotals.kitnet > 0 ? COLOR_KITNET : undefined }}>
          {catTotals.kitnet > 0 ? formatCurrency(catTotals.kitnet) : ''}
        </td>
        <td className="px-3 py-2 text-right text-[10px] font-bold tabular-nums" style={{ color: catTotals.mediano > 0 ? COLOR_MEDIANO : undefined }}>
          {catTotals.mediano > 0 ? formatCurrency(catTotals.mediano) : ''}
        </td>
        <td className="px-3 py-2 text-right text-[10px] font-bold tabular-nums" style={{ color: catTotals.confortavel > 0 ? COLOR_CONFORT_INV : undefined }}>
          {catTotals.confortavel > 0 ? formatCurrency(catTotals.confortavel) : ''}
        </td>
        <td />
      </tr>
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Componente principal                                                */
/* ------------------------------------------------------------------ */

export default function ProjectionPage({ entries }) {
  const { config } = useWorkspace()
  const prefix = config.collectionsPrefix

  const [activeTab, setActiveTab] = useState('visao-geral')
  const [projectionData, setProjectionData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingIncome, setEditingIncome] = useState(false)
  const [incomeInput, setIncomeInput] = useState('')
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchProjectionData(prefix).then((data) => {
      if (cancelled) return
      if (data) {
        setProjectionData({
          monthlyIncome: data.monthlyIncome ?? 0,
          newItems: Array.isArray(data.newItems) ? data.newItems : DEFAULT_NEW_ITEMS,
          tangoItems: Array.isArray(data.tangoItems) ? data.tangoItems : DEFAULT_TANGO_ITEMS,
          confortavelItems: Array.isArray(data.confortavelItems) ? data.confortavelItems : DEFAULT_CONFORTAVEL_ITEMS,
          setupCategories: Array.isArray(data.setupCategories) ? data.setupCategories : DEFAULT_SETUP_CATEGORIES,
        })
      } else {
        setProjectionData({
          monthlyIncome: 0, newItems: DEFAULT_NEW_ITEMS, tangoItems: DEFAULT_TANGO_ITEMS, confortavelItems: DEFAULT_CONFORTAVEL_ITEMS,
          setupCategories: DEFAULT_SETUP_CATEGORIES,
        })
      }
      setLoading(false)
    }).catch((err) => {
      if (cancelled) return
      console.error('[Projection] load error:', err)
      setProjectionData({
        monthlyIncome: 0, newItems: DEFAULT_NEW_ITEMS, tangoItems: DEFAULT_TANGO_ITEMS, confortavelItems: DEFAULT_CONFORTAVEL_ITEMS,
        setupCategories: DEFAULT_SETUP_CATEGORIES,
      })
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [prefix])

  const persistData = useCallback(async (data) => {
    setSaving(true)
    setSaveError(null)
    try {
      await saveProjectionData(data, prefix)
    } catch (err) {
      console.error('[Projection] save error:', err)
      setSaveError('Erro ao salvar. Tente novamente.')
      setTimeout(() => setSaveError(null), 4000)
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

  const newItems = projectionData?.newItems || []
  const tangoItems = projectionData?.tangoItems || []
  const confortavelItems = projectionData?.confortavelItems || []
  const setupCategories = projectionData?.setupCategories || DEFAULT_SETUP_CATEGORIES
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

  const handleUpdateSetup = (newCategories) => {
    const next = { ...projectionData, setupCategories: newCategories }
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
          {saveError && <span className="text-[10px] text-red-600 font-medium">{saveError}</span>}
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
      {activeTab === 'visao-geral' && (
        <VisaoGeralTab
          entries={entries}
          monthlyIncome={monthlyIncome}
          totalSimplesExtra={tangoItems.reduce((s, i) => s + (i.amount || 0), 0)}
          totalConfortavelExtra={confortavelItems.reduce((s, i) => s + (i.amount || 0), 0)}
          setupCategories={setupCategories}
        />
      )}

      {activeTab === 'projecao' && (
        <ProjecaoTab
          entries={entries}
          monthlyIncome={monthlyIncome}
          totalSimplesExtra={tangoItems.reduce((s, i) => s + (i.amount || 0), 0)}
          totalConfortavelExtra={confortavelItems.reduce((s, i) => s + (i.amount || 0), 0)}
        />
      )}

      {activeTab === 'caixa-necessario' && (
        <CaixaNecessarioTab
          entries={entries}
          totalSimplesExtra={tangoItems.reduce((s, i) => s + (i.amount || 0), 0)}
          totalConfortavelExtra={confortavelItems.reduce((s, i) => s + (i.amount || 0), 0)}
          setupCategories={setupCategories}
        />
      )}

      {activeTab === 'cenarios' && (
        <CenariosTab
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

      {activeTab === 'investimento' && (
        <InvestimentoInicialTab
          monthlyIncome={monthlyIncome}
          setupCategories={setupCategories}
          onUpdateSetup={handleUpdateSetup}
        />
      )}
    </section>
  )
}
