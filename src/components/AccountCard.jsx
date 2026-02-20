import { Landmark, CreditCard, Banknote, ChevronRight } from 'lucide-react'

const iconMap = {
  banco: Landmark,
  cartao: CreditCard,
  dinheiro: Banknote,
}

export default function AccountCard({ account, onClick }) {
  const Icon = iconMap[account.type] || Landmark

  return (
    <button
      onClick={() => onClick?.(account)}
      className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 hover:bg-offwhite group cursor-pointer text-left"
    >
      <Icon size={16} strokeWidth={1.6} className="text-text-muted/50 shrink-0 group-hover:text-text-muted" />

      <span className="flex-1 min-w-0 text-sm text-text-primary truncate">
        {account.label}
      </span>

      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: account.color }}
      />

      <ChevronRight size={14} strokeWidth={1.6} className="text-text-muted/30 shrink-0 group-hover:text-text-muted transition-colors" />
    </button>
  )
}
