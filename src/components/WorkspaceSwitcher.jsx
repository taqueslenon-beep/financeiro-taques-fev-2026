import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Briefcase, User } from 'lucide-react'
import { useWorkspace, WORKSPACES } from '../contexts/WorkspaceContext'

const ICONS = {
  trabalho: Briefcase,
  pessoal: User,
}

export default function WorkspaceSwitcher() {
  const { workspaceId, switchWorkspace } = useWorkspace()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const current = WORKSPACES[workspaceId]
  const CurrentIcon = ICONS[workspaceId]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 px-4 py-2 rounded-lg border border-border bg-surface
                   hover:bg-offwhite transition-colors duration-150 cursor-pointer"
      >
        <CurrentIcon size={16} strokeWidth={1.8} className="text-primary" />
        <div className="text-left">
          <p className="text-[12px] font-semibold text-text-primary leading-none">{current.label}</p>
          <p className="text-[10px] text-text-muted leading-none mt-0.5">{current.subtitle}</p>
        </div>
        <ChevronDown size={14} className={`text-text-muted transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-56 bg-surface border border-border rounded-xl shadow-lg z-50 py-1.5 overflow-hidden">
          {Object.values(WORKSPACES).map((ws) => {
            const Icon = ICONS[ws.id]
            const isActive = ws.id === workspaceId
            return (
              <button
                key={ws.id}
                onClick={() => { switchWorkspace(ws.id); setOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100 cursor-pointer
                  ${isActive ? 'bg-primary/5' : 'hover:bg-offwhite'}`}
              >
                <Icon size={16} strokeWidth={1.8} className={isActive ? 'text-primary' : 'text-text-muted'} />
                <div>
                  <p className={`text-[12px] font-semibold leading-none ${isActive ? 'text-primary' : 'text-text-primary'}`}>
                    {ws.label}
                  </p>
                  <p className="text-[10px] text-text-muted leading-none mt-0.5">{ws.subtitle}</p>
                </div>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
