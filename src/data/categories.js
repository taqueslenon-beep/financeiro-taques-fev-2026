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
  ],
}

/** Retorna as categorias disponíveis para um tipo de lançamento */
export const getCategoriesByType = (type) => categories[type] || []

/**
 * Opções de recorrência para despesas.
 * Exibidas apenas quando o tipo de lançamento é "despesa".
 */
export const recurrenceOptions = [
  { id: 'fixa', label: 'Fixa' },
  { id: 'variavel', label: 'Variável' },
]
