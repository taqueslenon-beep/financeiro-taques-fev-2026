import AccountCard from './AccountCard'
import { getAccountsByOwner } from '../data/accounts'

const lenonAccounts = getAccountsByOwner('lenon')
const bernaAccounts = getAccountsByOwner('berna')

export default function AccountsPage() {
  return (
    <section>
      {/* Cabeçalho da página */}
      <header className="mb-10">
        <h2 className="text-2xl font-bold tracking-tight uppercase">Contas Bancárias / Cartões</h2>
        <p className="text-sm text-text-muted mt-1 font-semibold">
          Visão geral das contas bancárias e cartões de crédito
        </p>
      </header>

      {/* Grid de duas colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Coluna Lenon */}
        <div>
          <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-4">
            CONTAS DO LENON
          </h3>
          <div className="space-y-1">
            {lenonAccounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        </div>

        {/* Coluna Berna */}
        <div>
          <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-4">
            CONTAS DA BERNA
          </h3>
          <div className="space-y-1">
            {bernaAccounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
