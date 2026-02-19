const statusConfig = {
  pago: {
    bg: 'bg-status-paid-bg',
    text: 'text-status-paid-text',
    label: 'Pago',
  },
  pendente: {
    bg: 'bg-status-pending-bg',
    text: 'text-status-pending-text',
    label: 'Pendente',
  },
  atrasado: {
    bg: 'bg-status-overdue-bg',
    text: 'text-status-overdue-text',
    label: 'Atrasado',
  },
  aguardando: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    label: 'Aguardando',
  },
}

export default function StatusBadge({ status }) {
  const config = statusConfig[status]
  if (!config) return null

  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full
        text-xs font-medium ${config.bg} ${config.text}
      `}
    >
      {config.label}
    </span>
  )
}
