import { X, TrendingUp, TrendingDown, CreditCard, GitBranch } from 'lucide-react'

/**
 * Modal de seleção: primeiro passo ao clicar em "+ Novo Lançamento".
 * Apresenta 4 opções: RECEITA, DESPESA, CARTÃO DE CRÉDITO, RATEIO.
 */
export default function SelectionModal({ isOpen, onClose, onSelect }) {
  if (!isOpen) return null

  const options = [
    {
      id: 'receita',
      label: 'Receita',
      description: 'Honorários, recebimentos e créditos',
      Icon: TrendingUp,
      color: 'text-emerald-600',
      hoverBg: 'hover:bg-emerald-50',
      hoverBorder: 'hover:border-emerald-200',
    },
    {
      id: 'despesa',
      label: 'Despesa',
      description: 'Pagamentos, contas e débitos',
      Icon: TrendingDown,
      color: 'text-red-500',
      hoverBg: 'hover:bg-red-50',
      hoverBorder: 'hover:border-red-200',
    },
    {
      id: 'cartao',
      label: 'Cartão de Crédito',
      description: 'Lançamentos na fatura Sicoob',
      Icon: CreditCard,
      color: 'text-[#004D4A]',
      hoverBg: 'hover:bg-[#E8F5F0]',
      hoverBorder: 'hover:border-[#004D4A]/30',
    },
    {
      id: 'rateio',
      label: 'Rateio',
      description: 'Receita com repasses a parceiros',
      Icon: GitBranch,
      color: 'text-amber-600',
      hoverBg: 'hover:bg-amber-50',
      hoverBorder: 'hover:border-amber-200',
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative bg-surface rounded-2xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="px-8 pt-8 pb-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-text-primary uppercase tracking-wide">
                Novo Lançamento
              </h3>
              <p className="text-sm text-text-muted mt-0.5 font-semibold">
                Selecione o tipo de lançamento
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 -mt-1 rounded-lg text-text-muted hover:bg-offwhite hover:text-text-primary transition-colors duration-150 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Opções */}
        <div className="px-8 py-6 space-y-3">
          {options.map(({ id, label, description, Icon, color, hoverBg, hoverBorder }) => (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={`
                w-full flex items-center gap-4 px-5 py-4 rounded-xl
                border border-border bg-surface
                transition-all duration-150 cursor-pointer
                ${hoverBg} ${hoverBorder}
                group
              `}
            >
              <div className={`${color} transition-colors duration-150`}>
                <Icon size={24} strokeWidth={1.8} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-text-primary uppercase tracking-wide">
                  {label}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  {description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
