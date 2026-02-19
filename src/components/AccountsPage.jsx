import AccountCard from './AccountCard'
import { useWorkspaceData } from '../contexts/WorkspaceContext'

export default function AccountsPage({ onSelectAccount }) {
  const { getAccountsByOwner } = useWorkspaceData()
  const lenonAccounts = getAccountsByOwner('lenon')
  const bernaAccounts = getAccountsByOwner('berna')

  return (
    <section>
      <header className="mb-10">
        <h2 className="text-2xl font-bold tracking-tight uppercase">Contas Bancárias / Cartões</h2>
        <p className="text-sm text-text-muted mt-1 font-semibold">
          Clique em uma conta para ver o extrato mensal
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-4">
            CONTAS DO LENON
          </h3>
          <div className="space-y-1">
            {lenonAccounts.map((account) => (
              <AccountCard key={account.id} account={account} onClick={onSelectAccount} />
            ))}
          </div>
        </div>

        {bernaAccounts.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-4">
              CONTAS DA BERNA
            </h3>
            <div className="space-y-1">
              {bernaAccounts.map((account) => (
                <AccountCard key={account.id} account={account} onClick={onSelectAccount} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
