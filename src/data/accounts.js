/**
 * Dados das contas financeiras.
 *
 * Este arquivo é a fonte única de verdade para as contas do sistema.
 * É importado pela página "Contas", pelo modal de lançamentos e
 * pelo controle de acesso simplificado.
 *
 * Cada conta possui:
 *   - id           identificador único
 *   - label        nome de exibição
 *   - owner        responsável ("lenon" | "berna")
 *   - color        cor de identificação visual (hex)
 *   - type         categoria da conta ("banco" | "cartao" | "dinheiro")
 */

export const accounts = [
  {
    id: 'sicoob-lenon',
    label: 'Sicoob — Conta principal (Lenon)',
    owner: 'lenon',
    color: '#004D4A',
    type: 'banco',
  },
  {
    id: 'cartao-sicoob-lenon',
    label: 'Cartão de crédito Sicoob — Conta principal (Lenon)',
    owner: 'lenon',
    color: '#004D4A',
    type: 'cartao',
  },
  {
    id: 'dinheiro-lenon',
    label: 'Dinheiro físico recebido por Lenon',
    owner: 'lenon',
    color: '#D97706',
    type: 'dinheiro',
  },
  {
    id: 'sicoob-berna',
    label: 'Sicoob — Subconta (Berna)',
    owner: 'berna',
    color: '#C4D600',
    type: 'banco',
  },
  {
    id: 'cartao-sicoob-berna',
    label: 'Cartão de crédito Sicoob — Subconta (Berna)',
    owner: 'berna',
    color: '#C4D600',
    type: 'cartao',
  },
  {
    id: 'dinheiro-berna',
    label: 'Dinheiro físico recebido por Berna',
    owner: 'berna',
    color: '#FDBA74',
    type: 'dinheiro',
  },
  {
    id: 'reserva-emergencia',
    label: 'Reserva de Emergência — Sicoob Invest',
    owner: 'lenon',
    color: '#223631',
    type: 'reserva',
  },
]

export const personalAccounts = [
  {
    id: 'banco-pessoal-lenon',
    label: 'Conta Pessoal — Sicoob (Lenon)',
    owner: 'lenon',
    color: '#1e3a5f',
    type: 'banco',
  },
  {
    id: 'cartao-pessoal-lenon',
    label: 'Cartão de Crédito Pessoal (Lenon)',
    owner: 'lenon',
    color: '#2563eb',
    type: 'cartao',
  },
  {
    id: 'poupanca-lenon',
    label: 'Poupança (Lenon)',
    owner: 'lenon',
    color: '#3b82f6',
    type: 'banco',
  },
  {
    id: 'investimentos-lenon',
    label: 'Investimentos (Lenon)',
    owner: 'lenon',
    color: '#1d4ed8',
    type: 'reserva',
  },
  {
    id: 'banco-pessoal-berna',
    label: 'Conta Pessoal — Sicoob (Berna)',
    owner: 'berna',
    color: '#7c3aed',
    type: 'banco',
  },
  {
    id: 'cartao-pessoal-berna',
    label: 'Cartão de Crédito Pessoal (Berna)',
    owner: 'berna',
    color: '#8b5cf6',
    type: 'cartao',
  },
]

/** Filtra contas por responsável */
export const getAccountsByOwner = (owner) =>
  accounts.filter((a) => a.owner === owner)

/** Busca conta por id */
export const getAccountById = (id) => accounts.find((a) => a.id === id)

/**
 * Retorna as contas visíveis para um usuário, agrupadas por responsável.
 *
 * - lenon: vê tudo (grupo Lenon + grupo Berna)
 * - berna: vê apenas suas próprias contas
 *
 * Retorna um array de { groupLabel, accounts[] } para renderizar <optgroup>.
 */
export function getGroupedAccountsForUser(currentUser) {
  if (currentUser === 'berna') {
    return [
      { groupLabel: 'Contas da Berna', accounts: getAccountsByOwner('berna') },
    ]
  }

  // lenon (gestor) vê tudo
  return [
    { groupLabel: 'Contas do Lenon', accounts: getAccountsByOwner('lenon') },
    { groupLabel: 'Contas da Berna', accounts: getAccountsByOwner('berna') },
  ]
}

/* ── Workspace-aware helpers ────────────────────────────────────── */

export function getAccountsForWorkspace(workspace) {
  return workspace === 'pessoal' ? personalAccounts : accounts
}

export function getAccountsByOwnerForWorkspace(workspace, owner) {
  return getAccountsForWorkspace(workspace).filter((a) => a.owner === owner)
}

export function getAccountByIdForWorkspace(workspace, id) {
  return getAccountsForWorkspace(workspace).find((a) => a.id === id)
}

export function getGroupedAccountsForWorkspace(workspace, currentUser) {
  const src = getAccountsForWorkspace(workspace)
  const byOwner = (owner) => src.filter((a) => a.owner === owner)

  if (currentUser === 'berna') {
    return [{ groupLabel: 'Contas da Berna', accounts: byOwner('berna') }]
  }
  return [
    { groupLabel: 'Contas do Lenon', accounts: byOwner('lenon') },
    { groupLabel: 'Contas da Berna', accounts: byOwner('berna') },
  ]
}
