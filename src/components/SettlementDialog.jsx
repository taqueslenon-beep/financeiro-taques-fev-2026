import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'

export default function SettlementDialog({ isOpen, onClose, onConfirm, entry }) {
  const [date, setDate] = useState('')

  // Reseta a data sempre que abre
  useEffect(() => {
    if (isOpen) {
      // Pré-preenche com a data de hoje
      const today = new Date()
      const yyyy = today.getFullYear()
      const mm = String(today.getMonth() + 1).padStart(2, '0')
      const dd = String(today.getDate()).padStart(2, '0')
      setDate(`${yyyy}-${mm}-${dd}`)
    }
  }, [isOpen])

  if (!isOpen || !entry) return null

  const isReceita = entry.type === 'Receita'
  const dateLabel = isReceita ? 'Data do recebimento' : 'Data do pagamento'
  const canConfirm = date !== ''

  const handleConfirm = () => {
    if (!canConfirm) return
    onConfirm(entry.id, date)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Painel */}
      <div className="relative bg-surface rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="px-7 pt-7 pb-5">
          {/* Ícone + título */}
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-status-paid-bg shrink-0">
              <Check size={20} className="text-status-paid-text" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-primary">
                Confirmar Efetivação
              </h3>
              <p className="text-sm text-text-muted mt-1">
                {entry.description}
              </p>
            </div>
          </div>

          {/* Campo de data */}
          <div className="mt-6">
            <label className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">
              {dateLabel}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="
                w-full bg-surface border border-border rounded-xl
                px-4 py-3.5 text-sm text-text-primary
                focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                transition-colors duration-150
              "
            />
          </div>
        </div>

        {/* Botões */}
        <div className="flex items-center justify-end gap-3 px-7 pb-7 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="
              px-5 py-2.5 rounded-lg text-sm font-medium
              text-text-secondary hover:bg-offwhite
              transition-colors duration-150 cursor-pointer
            "
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={`
              px-5 py-2.5 rounded-lg text-sm font-medium
              transition-all duration-150
              ${
                canConfirm
                  ? 'bg-primary text-white hover:bg-primary-light cursor-pointer'
                  : 'bg-border text-text-muted cursor-not-allowed'
              }
            `}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
