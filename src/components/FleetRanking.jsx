import { formatCurrency } from '../domain/financialImpactEngine'

const riskStyles = {
  low: 'bg-[#dcefe3] text-[#27613d]',
  medium: 'bg-[#f5e8c7] text-[#7a5b13]',
  high: 'bg-[#f4d4bd] text-[#8b421d]',
  critical: 'bg-[#f0c8c8] text-[#8e2828]',
}

export function FleetRanking({ vehicles }) {
  return (
    <section className="mx-auto mt-4 mb-8 max-w-[1220px] px-6">
      <div className="rounded-lg border border-[#d8ded6] bg-white/80 p-5.5 shadow-[0_16px_40px_rgba(33,54,42,0.08)]">
        <div>
          <p className="mb-2.5 text-xs font-extrabold tracking-[0.08em] text-[#52725e] uppercase">
            Mock de veículos
          </p>
          <h2 className="text-[1.35rem] font-semibold tracking-normal text-[#13251b]">
            Ranking preventivo da frota
          </h2>
        </div>

        <div
          className="mt-[18px] grid max-h-[560px] gap-2 overflow-y-auto pr-1 overscroll-contain [scrollbar-color:#8aa090_transparent] [scrollbar-width:thin] lg:max-h-[620px]"
          role="table"
          aria-label="Ranking de veículos"
        >
          <div
            className="hidden min-h-10 grid-cols-[1.35fr_0.55fr_1.4fr_0.65fr_0.95fr] gap-3.5 px-3.5 py-3 text-xs font-extrabold text-[#65756c] uppercase lg:grid"
            role="row"
          >
            <span>Veículo</span>
            <span>Risco</span>
            <span>Manutenção</span>
            <span>CO2</span>
            <span>Impacto</span>
          </div>

          {vehicles.map((vehicle) => (
            <div
              className="grid min-h-[82px] grid-cols-1 items-center gap-3.5 rounded-[7px] border border-[#dde2db] bg-[#fbfcf8] px-3.5 py-3 text-left lg:grid-cols-[1.35fr_0.55fr_1.4fr_0.65fr_0.95fr]"
              role="row"
              key={vehicle.id}
            >
              <div>
                <strong className="block text-[#17201b]">{vehicle.model}</strong>
                <small className="block text-xs text-[#65756c]">
                  {vehicle.id} · {vehicle.category} · {vehicle.plate}
                </small>
              </div>
              <div>
                <span
                  className={`inline-flex min-w-[76px] justify-center rounded-full px-2 py-1 text-xs font-black ${riskStyles[vehicle.riskTone]}`}
                >
                  {vehicle.riskLevel}
                </span>
                <small className="block text-xs text-[#65756c]">{vehicle.riskScore}/100</small>
              </div>
              <div>
                <strong className="block text-[#17201b]">{vehicle.recommendation.action}</strong>
                <small className="block text-xs text-[#65756c]">
                  {vehicle.recommendation.detail}
                </small>
              </div>
              <div>
                <strong className="block text-[#17201b]">{vehicle.impact.co2Kg} kg</strong>
                <small className="block text-xs text-[#65756c]">
                  {vehicle.impact.fuelLiters} L diesel estimados
                </small>
              </div>
              <div>
                <strong className="block text-[#17201b]">
                  {formatCurrency(vehicle.impact.expectedUnplannedCostBrl)}
                </strong>
                <small className="block text-xs text-[#65756c]">
                  {vehicle.impact.avoidableCo2Kg} kg CO2 evitável ·{' '}
                  {formatCurrency(vehicle.impact.estimatedCostBrl)} combustível
                </small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
