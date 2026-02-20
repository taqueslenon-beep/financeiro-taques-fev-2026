import { LayoutDashboard, CalendarCheck, Landmark, ShieldAlert, ScrollText, TrendingUp, ArrowLeftRight } from 'lucide-react'
import { useWorkspace } from '../contexts/WorkspaceContext'

const menuItems = [
  { id: 'painel', label: 'Painel do Lenon', icon: LayoutDashboard },
  { id: 'contas-pagar-receber', label: 'Pagamentos / Recebimentos', icon: CalendarCheck },
  { id: 'lancamentos-por-conta', label: 'Contas Bancárias / Cartões', icon: Landmark },
  { id: 'projecao-pessoal', label: 'Projeção: Sair de Casa', icon: ArrowLeftRight, workspace: 'pessoal' },
  { id: 'inadimplencia', label: 'Inadimplência', icon: ShieldAlert, comingSoon: true, workspace: 'trabalho' },
  { id: 'gestao-contratos', label: 'Gestão de Contratos', icon: ScrollText, comingSoon: true, workspace: 'trabalho' },
  { id: 'honorarios-exito', label: 'Honorários de Êxito', icon: TrendingUp, comingSoon: true, workspace: 'trabalho' },
]

export default function Sidebar({ activePage, onNavigate }) {
  const { config, workspaceId } = useWorkspace()

  return (
    <aside className="w-72 min-h-screen bg-surface border-r border-border flex flex-col">
      <div className="px-6 py-8">
        <h1 className="text-lg font-semibold tracking-tight text-primary">
          Taques
        </h1>
        <p className="text-xs text-text-muted mt-0.5">{config.subtitle}</p>
      </div>

      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {menuItems.filter((item) => !item.workspace || item.workspace === workspaceId).map((item) => {
            const isActive = !item.comingSoon && item.id === activePage

            return (
              <li key={item.id}>
                <button
                  onClick={item.comingSoon ? undefined : () => onNavigate(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[12.5px] font-medium tracking-tight
                    transition-colors duration-150 text-left leading-snug
                    ${
                      item.comingSoon
                        ? 'opacity-45 cursor-default'
                        : isActive
                          ? 'bg-primary text-white cursor-pointer'
                          : 'text-text-secondary hover:bg-offwhite cursor-pointer'
                    }
                  `}
                >
                  <item.icon size={18} strokeWidth={1.8} className="shrink-0" />
                  <span className="min-w-0 whitespace-nowrap">{item.label}</span>
                  {item.comingSoon && (
                    <span className="ml-auto text-[9px] font-semibold uppercase tracking-wider text-text-muted bg-offwhite px-1.5 py-0.5 rounded-full whitespace-nowrap">
                      Em breve
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="px-6 py-6 border-t border-border">
        <p className="text-xs text-text-muted">v1.0.0</p>
      </div>
    </aside>
  )
}
