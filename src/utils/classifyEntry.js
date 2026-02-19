/**
 * Classifica uma entry de Despesa em um dos 7 tipos do sistema.
 *
 * Tipos Despesa:
 *   'Fixa'               — despesa recorrente (mensal ou anual)
 *   'Impostos'           — tributos e taxas
 *   'Parcelamento'       — despesa parcelada
 *   'Repasse Parceiros'  — repasse para escritórios parceiros
 *   'Retirada Gilberto'  — saídas do Gilberto
 *   'Pró-labore'         — retiradas do Lenon
 *   'Variável'           — lançamento único / avulso
 *
 * Tipos Receita:
 *   'Honorários Lenon'      — honorários captados pelo Lenon
 *   'Honorários Gilberto'   — honorários captados pelo Gilberto
 *   'Empréstimo'            — capital de giro, empréstimos bancários
 *   'Aporte de Sócio'       — aportes e contribuições dos sócios
 *   'Impostos Gilberto'     — alíquotas de imposto a receber do Gilberto
 *   'Outras Receitas'       — estornos, devoluções, etc.
 */

/* ── Helpers Despesa ─────────────────────────────────────────── */

const TAX_CATEGORIES = new Set(['impostos', 'simples-nacional', 'anuidade-oab'])

function isImposto(entry) {
  if (TAX_CATEGORIES.has(entry.categoryId)) return true
  const desc = (entry.description || '').toLowerCase()
  return desc.includes('simples nacional') || desc.includes('oab')
}

function isRetiradaGilberto(entry) {
  const desc = (entry.description || '').toLowerCase()
  return desc.includes('gilberto') && (
    entry.categoryId === 'retirada-socio' || entry.rateioLevel === 2
  )
}

function isProLabore(entry) {
  if (entry.categoryId !== 'retirada-socio') return false
  const desc = (entry.description || '').toLowerCase()
  return desc.includes('lenon') || desc.includes('pró-labore')
}

function isRepasseParceiro(entry) {
  if (isRetiradaGilberto(entry)) return false
  return entry.rateioLevel === 2
}

function isParcelamento(entry) {
  return (
    entry.recurrence === 'Parcelamento' ||
    /\(Parcela \d+\/\d+\)/.test(entry.description)
  )
}

export function classifyEntry(entry) {
  if (isRetiradaGilberto(entry)) return 'Retirada Gilberto'
  if (isProLabore(entry)) return 'Pró-labore'
  if (isRepasseParceiro(entry)) return 'Repasse Parceiros'
  if (isImposto(entry)) return 'Impostos'
  if (isParcelamento(entry)) return 'Parcelamento'
  if (entry.recurrence === 'Fixa' || entry.recurrence === 'Fixa/Anual') return 'Fixa'
  return 'Variável'
}

/* ── Helpers Receita ─────────────────────────────────────────── */

const EMPRESTIMO_CATEGORIES = new Set(['emprestimo-bancario', 'capital-giro'])
const APORTE_CATEGORIES = new Set(['aporte-socio', 'contribuicao-socio'])

export function classifyReceita(entry) {
  const cat = entry.categoryId || ''
  const desc = (entry.description || '').toLowerCase()

  if (desc.includes('alíquota') && desc.includes('gilberto')) return 'Impostos Gilberto'
  if (cat === 'retirada-socio' && desc.includes('gilberto')) return 'Impostos Gilberto'

  if (EMPRESTIMO_CATEGORIES.has(cat) || desc.includes('capital de giro') || desc.includes('empréstimo')) return 'Empréstimo'

  if (APORTE_CATEGORIES.has(cat) || desc.includes('aporte') || desc.includes('contribuição')) return 'Aporte de Sócio'

  if (cat === 'honorarios' || desc.includes('honorários') || desc.includes('honorarios')) {
    if (entry.captador === 'gilberto') return 'Honorários Gilberto'
    return 'Honorários Lenon'
  }

  return 'Outras Receitas'
}

/* ── Options / Labels ────────────────────────────────────────── */

export const TIPO_DESPESA_OPTIONS = [
  { value: '', label: 'Ver tudo' },
  { value: 'Fixa', label: 'Fixa' },
  { value: 'Impostos', label: 'Impostos' },
  { value: 'Parcelamento', label: 'Parcelamento' },
  { value: 'Repasse Parceiros', label: 'Repasse Parceiros' },
  { value: 'Retirada Gilberto', label: 'Retirada Gilberto' },
  { value: 'Pró-labore', label: 'Pró-labore' },
  { value: 'Variável', label: 'Variável' },
]

export const TIPO_RECEITA_OPTIONS = [
  { value: '', label: 'Ver tudo' },
  { value: 'Honorários Lenon', label: 'Honorários Lenon' },
  { value: 'Honorários Gilberto', label: 'Honorários Gilberto' },
  { value: 'Empréstimo', label: 'Empréstimo' },
  { value: 'Aporte de Sócio', label: 'Aporte de Sócio' },
  { value: 'Impostos Gilberto', label: 'Impostos Gilberto' },
  { value: 'Outras Receitas', label: 'Outras Receitas' },
]

export const TIPO_OPTIONS = [
  { value: '', label: 'Ver tudo' },
  { value: 'Fixa', label: 'Fixa' },
  { value: 'Impostos', label: 'Impostos' },
  { value: 'Parcelamento', label: 'Parcelamento' },
  { value: 'Repasse Parceiros', label: 'Repasse Parceiros' },
  { value: 'Retirada Gilberto', label: 'Retirada Gilberto' },
  { value: 'Pró-labore', label: 'Pró-labore' },
  { value: 'Variável', label: 'Variável' },
  { value: 'Honorários Lenon', label: 'Honorários Lenon' },
  { value: 'Honorários Gilberto', label: 'Honorários Gilberto' },
  { value: 'Empréstimo', label: 'Empréstimo' },
  { value: 'Aporte de Sócio', label: 'Aporte de Sócio' },
  { value: 'Impostos Gilberto', label: 'Impostos Gilberto' },
  { value: 'Outras Receitas', label: 'Outras Receitas' },
]

/* ── Classificação pessoal (finanças pessoais) ──────────────────── */

function classifyPersonalEntry(entry) {
  if (entry.recurrence === 'Parcelamento' || /\(Parcela \d+\/\d+\)/.test(entry.description)) return 'Parcelamento'
  if (entry.recurrence === 'Fixa' || entry.recurrence === 'Fixa/Anual') return 'Fixa'
  return 'Variável'
}

function classifyPersonalReceita(entry) {
  const cat = entry.categoryId || ''
  if (cat === 'salario') return 'Salário'
  if (cat === 'freelance') return 'Freelance'
  if (cat === 'rendimentos') return 'Investimentos'
  if (cat === 'aluguel-recebido') return 'Aluguel'
  if (cat === 'bonus') return 'Bônus'
  return 'Outras Receitas'
}

const PERSONAL_TIPO_DESPESA_OPTIONS = [
  { value: '', label: 'Ver tudo' },
  { value: 'Fixa', label: 'Fixa' },
  { value: 'Variável', label: 'Variável' },
  { value: 'Parcelamento', label: 'Parcelamento' },
]

const PERSONAL_TIPO_RECEITA_OPTIONS = [
  { value: '', label: 'Ver tudo' },
  { value: 'Salário', label: 'Salário' },
  { value: 'Freelance', label: 'Freelance' },
  { value: 'Investimentos', label: 'Investimentos' },
  { value: 'Aluguel', label: 'Aluguel' },
  { value: 'Bônus', label: 'Bônus' },
  { value: 'Outras Receitas', label: 'Outras Receitas' },
]

const PERSONAL_TIPO_OPTIONS = [
  { value: '', label: 'Ver tudo' },
  ...PERSONAL_TIPO_DESPESA_OPTIONS.slice(1),
  ...PERSONAL_TIPO_RECEITA_OPTIONS.slice(1),
]

export function getClassifiersForWorkspace(workspace) {
  if (workspace === 'pessoal') {
    return {
      classifyEntry: classifyPersonalEntry,
      classifyReceita: classifyPersonalReceita,
      TIPO_OPTIONS: PERSONAL_TIPO_OPTIONS,
      TIPO_DESPESA_OPTIONS: PERSONAL_TIPO_DESPESA_OPTIONS,
      TIPO_RECEITA_OPTIONS: PERSONAL_TIPO_RECEITA_OPTIONS,
    }
  }
  return {
    classifyEntry,
    classifyReceita,
    TIPO_OPTIONS,
    TIPO_DESPESA_OPTIONS,
    TIPO_RECEITA_OPTIONS,
  }
}
