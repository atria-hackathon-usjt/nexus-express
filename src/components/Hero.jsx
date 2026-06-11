import heroImage from '../assets/atria-corp.jpg'

export function Hero() {
  return (
    <section className="mx-auto grid max-w-305 grid-cols-1 items-stretch gap-10 px-6 pt-11 pb-7 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.74fr)]">
      <div className="flex min-h-80 flex-col justify-center lg:min-h-97.5">
        <p className="mb-2.5 text-xs font-extrabold tracking-[0.08em] text-[#52725e] uppercase">
          Nexus Predict Hackathon
        </p>
        <h1 className="max-w-212.5 text-[clamp(2.4rem,5vw,5.8rem)] leading-[0.94] font-semibold tracking-normal text-[#102017]">
          Manutenção preventiva automatizada para decisões logísticas mais limpas.
        </h1>
        <p className="mt-5 max-w-190 text-base text-[#45524b]">
          O protótipo cruza telemetria simulada, histórico de manutenção e estresse de rota
          para recomendar o caminhão mais seguro, econômico e sustentável antes da expedição.
        </p>
      </div>

      <div
        className="flex aspect-square min-h-80 items-center justify-center overflow-hidden border border-[#d7ddd5] bg-[#0b1f28] p-8 lg:min-h-97.5 rounded-3xl"
        aria-label="Espaço reservado para imagem da operação logística"
      >
        {heroImage ? (
          <img
            className="max-h-full max-w-full object-contain"
            src={heroImage}
            alt="Operação logística monitorada pelo Nexus Predict"
          />
        ) : null}
      </div>
    </section>
  )
}
