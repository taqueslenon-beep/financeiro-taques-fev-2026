/**
 * Categorias de lançamento agrupadas por tipo.
 *
 * Quando o usuário seleciona "Receita" ou "Despesa" na Fase 1 do modal,
 * o menu de categorias é filtrado dinamicamente usando este mapa.
 */

export const categories = {
  receita: [
    { id: 'honorarios-iniciais', label: 'Honorários iniciais' },
    { id: 'honorarios-exito', label: 'Honorários de êxito' },
    { id: 'honorarios-sucumbencia', label: 'Honorários de sucumbência' },
    { id: 'estornos', label: 'Estornos' },
  ],
  despesa: [
    { id: 'aluguel', label: 'Aluguel' },
    { id: 'mercado', label: 'Mercado' },
    { id: 'folha-pagamento', label: 'Folha de pagamento' },
    { id: 'tecnologia', label: 'Tecnologia' },
    { id: 'contabilidade', label: 'Contabilidade' },
    { id: 'anuidade-oab', label: 'Anuidade OAB' },
    { id: 'impostos', label: 'Impostos' },
    { id: 'taxas', label: 'Taxas' },
    { id: 'deslocamentos-viagens', label: 'Deslocamentos e viagens' },
    { id: 'manutencao-escritorio', label: 'Manutenção do escritório' },
    { id: 'moveis', label: 'Móveis' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'pro-labore', label: 'Pró-labore' },
    { id: 'distribuicao-lucros', label: 'Distribuição de lucros' },
    { id: 'material-escritorio', label: 'Material de escritório' },
    { id: 'treinamentos-cursos', label: 'Treinamentos e cursos' },
    { id: 'repasse-parceiro', label: 'Repasse a parceiro' },
    { id: 'financiamento-veiculo', label: 'Financiamento de veículo' },
    { id: 'seguro-veiculo', label: 'Seguro de veículo' },
    { id: 'tarifas-bancarias', label: 'Tarifas bancárias' },
  ],
}

export const personalCategories = {
  receita: [
    { id: 'pro-labore-pessoal', label: 'Pró-labore' },
    { id: 'retirada-pessoal', label: 'Retirada / Distribuição' },
    { id: 'salario', label: 'Salário' },
    { id: 'freelance', label: 'Freelance' },
    { id: 'rendimentos', label: 'Rendimento de investimentos' },
    { id: 'aluguel-recebido', label: 'Aluguel recebido' },
    { id: 'bonus', label: 'Bônus / 13o' },
    { id: 'outras-receitas-pessoal', label: 'Outras receitas' },
  ],
  despesa: [
    { id: 'moradia', label: 'Moradia' },
    { id: 'alimentacao', label: 'Alimentação' },
    { id: 'transporte', label: 'Transporte' },
    { id: 'saude', label: 'Saúde' },
    { id: 'educacao', label: 'Educação' },
    { id: 'lazer', label: 'Lazer e entretenimento' },
    { id: 'vestuario', label: 'Vestuário' },
    { id: 'assinaturas', label: 'Assinaturas e serviços' },
    { id: 'seguros', label: 'Seguros' },
    { id: 'impostos-pessoais', label: 'Impostos pessoais' },
    { id: 'pets', label: 'Pets' },
    { id: 'presentes', label: 'Presentes e doações' },
    { id: 'cuidados-pessoais', label: 'Cuidados pessoais' },
    { id: 'financiamento', label: 'Financiamento' },
    { id: 'condominio', label: 'Condomínio' },
    { id: 'energia-agua-gas', label: 'Energia / Água / Gás' },
    { id: 'internet-telefone', label: 'Internet / Telefone' },
    { id: 'outros-pessoal', label: 'Outros' },
  ],
}

/** Retorna as categorias disponíveis para um tipo de lançamento */
export const getCategoriesByType = (type) => categories[type] || []

/**
 * Opções de tipo para despesas (define o campo `recurrence`).
 * Exibidas apenas quando o tipo de lançamento é "despesa".
 */
export const tipoOptions = [
  { id: 'fixa', label: 'Fixa' },
  { id: 'previsao', label: 'Previsão' },
  { id: 'variavel', label: 'Variável' },
  { id: 'parcelamento', label: 'Parcelamento' },
]

export const personalTipoOptions = [
  { id: 'fixa', label: 'Despesa fixa' },
  { id: 'previsao', label: 'Previsão' },
  { id: 'parcelamento', label: 'Parcelamento' },
  { id: 'variavel', label: 'Despesa variável' },
]

/* ── Workspace-aware helpers ────────────────────────────────────── */

export function getCategoriesForWorkspace(workspace) {
  return workspace === 'pessoal' ? personalCategories : categories
}

export function getCategoriesByTypeForWorkspace(workspace, type) {
  const cats = getCategoriesForWorkspace(workspace)
  return cats[type] || []
}

export function getTipoOptionsForWorkspace(workspace) {
  return workspace === 'pessoal' ? personalTipoOptions : tipoOptions
}
