import ContractScoreForm from '../components/trust/ContractScoreForm'
import TrustRecordTable from '../components/trust/TrustRecordTable'
import { useTrust } from '../hooks/useTrust'

export default function TrustRegistry(): JSX.Element {
  const trust = useTrust()

  return (
    <div className="space-y-6">
      <div className="arbiter-card">
        <div className="arbiter-label">Trust registry</div>
        <h2 className="mt-2 text-xl font-semibold text-sand">Score or remove contracts</h2>
        <div className="mt-5">
          <ContractScoreForm onSubmit={(payload) => trust.scoreContract.mutate(payload)} isPending={trust.scoreContract.isPending} />
        </div>
      </div>

      <div className="arbiter-card">
        <div className="arbiter-label">Registry table</div>
        <div className="mt-4">
          <TrustRecordTable
            records={trust.records.data ?? []}
            onDelete={(contractAddress) => trust.deleteContract.mutate(contractAddress)}
          />
        </div>
      </div>
    </div>
  )
}
