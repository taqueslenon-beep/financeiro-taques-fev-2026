import { Plus } from 'lucide-react'

export default function Header({ onNewEntry }) {
  return (
    <header className="flex items-center justify-between mb-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight uppercase">Contas a Pagar e Receber</h2>
        <p className="text-sm text-text-muted mt-1 font-semibold">
          Gerencie suas receitas e despesas
        </p>
      </div>

      <button
        onClick={onNewEntry}
        className="
          flex items-center gap-2 bg-primary text-white
          px-5 py-2.5 rounded-lg text-sm font-medium
          hover:bg-primary-light transition-colors duration-150
          cursor-pointer
        "
      >
        <Plus size={18} strokeWidth={2} />
        Novo Lançamento
      </button>
    </header>
  )
}
