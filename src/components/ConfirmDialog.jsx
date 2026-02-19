import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null

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
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-status-overdue-bg shrink-0">
              <AlertTriangle size={20} className="text-status-overdue-text" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-primary">
                {title}
              </h3>
              <p className="text-sm text-text-muted mt-1">
                {message}
              </p>
            </div>
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
            onClick={onConfirm}
            className="
              px-5 py-2.5 rounded-lg text-sm font-medium
              bg-status-overdue-text text-white
              hover:bg-status-overdue-text/90
              transition-colors duration-150 cursor-pointer
            "
          >
            Confirmar Exclusão
          </button>
        </div>
      </div>
    </div>
  )
}
