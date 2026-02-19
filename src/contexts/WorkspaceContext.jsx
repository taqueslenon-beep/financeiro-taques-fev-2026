import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { getAccountsForWorkspace, getAccountsByOwnerForWorkspace, getAccountByIdForWorkspace, getGroupedAccountsForWorkspace } from '../data/accounts'
import { getCategoriesForWorkspace, getCategoriesByTypeForWorkspace, getTipoOptionsForWorkspace } from '../data/categories'
import { getClassifiersForWorkspace } from '../utils/classifyEntry'

const WorkspaceContext = createContext(null)

export const WORKSPACES = {
  trabalho: {
    id: 'trabalho',
    label: 'Trabalho',
    subtitle: 'Taques Advogados',
    collectionsPrefix: '',
    settingsDoc: 'settings',
  },
  pessoal: {
    id: 'pessoal',
    label: 'Pessoal',
    subtitle: 'Finanças Pessoais',
    collectionsPrefix: 'personal_',
    settingsDoc: 'personal_settings',
  },
}

export function WorkspaceProvider({ children }) {
  const [workspaceId, setWorkspaceId] = useState(() => {
    return localStorage.getItem('fin-workspace') || 'trabalho'
  })

  const switchWorkspace = useCallback((id) => {
    setWorkspaceId(id)
    localStorage.setItem('fin-workspace', id)
  }, [])

  const config = WORKSPACES[workspaceId]

  return (
    <WorkspaceContext.Provider value={{ workspaceId, config, switchWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace deve ser usado dentro de WorkspaceProvider')
  return ctx
}

export function useWorkspaceData() {
  const { workspaceId } = useWorkspace()

  return useMemo(() => {
    const accounts = getAccountsForWorkspace(workspaceId)
    const categories = getCategoriesForWorkspace(workspaceId)
    const { classifyEntry, classifyReceita, TIPO_OPTIONS, TIPO_DESPESA_OPTIONS, TIPO_RECEITA_OPTIONS } = getClassifiersForWorkspace(workspaceId)

    return {
      accounts,
      categories,
      getAccountsByOwner: (owner) => getAccountsByOwnerForWorkspace(workspaceId, owner),
      getAccountById: (id) => getAccountByIdForWorkspace(workspaceId, id),
      getGroupedAccountsForUser: (user) => getGroupedAccountsForWorkspace(workspaceId, user),
      getCategoriesByType: (type) => getCategoriesByTypeForWorkspace(workspaceId, type),
      tipoOptions: getTipoOptionsForWorkspace(workspaceId),
      classifyEntry,
      classifyReceita,
      TIPO_OPTIONS,
      TIPO_DESPESA_OPTIONS,
      TIPO_RECEITA_OPTIONS,
    }
  }, [workspaceId])
}
