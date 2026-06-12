export function RoutePlanner({
  bestVehicle,
  routes,
  selectedRoute,
  selectedRouteId,
  onSelectRoute,
}) {
  return (
    <section className="mx-auto mt-4 grid max-w-[1220px] grid-cols-1 gap-4 px-6 lg:grid-cols-[0.86fr_1.14fr]">
      <div className="rounded-lg border border-[#d8ded6] bg-white/80 p-5.5 shadow-[0_16px_40px_rgba(33,54,42,0.08)]">
        <SectionHeading eyebrow="Mock de rotas" title="Simulador de expedição" />
        <div className="mt-[18px] grid max-h-[360px] gap-2.5 overflow-y-auto pr-1 overscroll-contain [scrollbar-color:#8aa090_transparent] [scrollbar-width:thin] lg:max-h-[430px]">
          {routes.map((route) => (
            <button
              className={
                route.id === selectedRouteId
                  ? 'min-h-16 w-full cursor-pointer rounded-[7px] border border-[#5f876d] bg-[#e9f2eb] px-3.5 py-3 text-left text-[#1d2b23] shadow-[inset_4px_0_0_#5f876d]'
                  : 'min-h-16 w-full cursor-pointer rounded-[7px] border border-[#d8ded6] bg-[#fbfcf8] px-3.5 py-3 text-left text-[#1d2b23]'
              }
              key={route.id}
              onClick={() => onSelectRoute(route.id)}
              type="button"
            >
              <span className="block font-extrabold">{route.name}</span>
              <small className="mt-0.5 block text-[#65756c]">
                {route.distanceKm} km · {route.type}
              </small>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-[#d8ded6] bg-white/80 p-5.5 shadow-[0_16px_40px_rgba(33,54,42,0.08)]">
        <SectionHeading eyebrow="Variáveis da rota" title={selectedRoute.name} />
        <div className="mt-[18px] grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          <Stat label="Terreno" value={selectedRoute.terrain} />
          <Stat label="Elevação" value={`${selectedRoute.elevationGainM} m`} />
          <Stat label="Congestionamento" value={`${selectedRoute.congestionLevel}%`} />
          <Stat label="Paradas" value={selectedRoute.stopCount} />
          <Stat label="Carga" value={`${selectedRoute.cargoKg.toLocaleString('pt-BR')} kg`} />
          <Stat label="Prazo" value={`${selectedRoute.deadlineHours} h`} />
        </div>
        <div className="mt-[18px] rounded-lg bg-[#17372d] p-[18px] text-left text-[#edf4ed]">
          <span className="mb-2.5 inline-flex rounded-full bg-[#4df06b] px-2 py-1 text-[0.72rem] font-extrabold text-[#17201b] uppercase">
            Recomendado
          </span>
          <strong className="block">{bestVehicle.model}</strong>
          <p className="mt-1.5 text-[#cfdcd2]">
            {bestVehicle.id} tem menor risco combinado para esta rota e estima{' '}
            {bestVehicle.impact.co2Kg} kg de CO2 na operação.
          </p>
        </div>
      </div>
    </section>
  )
}

function SectionHeading({ eyebrow, title }) {
  return (
    <div>
      <p className="mb-2.5 text-xs font-extrabold tracking-[0.08em] text-[#52725e] uppercase">
        {eyebrow}
      </p>
      <h2 className="text-[1.35rem] font-semibold tracking-normal text-[#13251b]">{title}</h2>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="min-h-[72px] rounded-[7px] border border-[#dde2db] bg-[#fbfcf8] p-3.5">
      <span className="text-xs text-[#65756c]">{label}</span>
      <strong className="mt-1.5 block text-base text-[#17201b]">{value}</strong>
    </div>
  )
}
