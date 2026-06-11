import { estimateRouteFuelLiters } from './routeStressEngine'

const DIESEL_CO2_KG_PER_LITER = 2.68
const DIESEL_PRICE_BRL = 6.05
const UNPLANNED_STOP_COST_BRL = 4200

export function calculateSustainabilityImpact(route, vehicle, riskScore, bestVehicle) {
  const fuelLiters = estimateRouteFuelLiters(route, vehicle)
  const bestFuelLiters = bestVehicle
    ? estimateRouteFuelLiters(route, bestVehicle)
    : fuelLiters
  const avoidableFuelLiters = Math.max(fuelLiters - bestFuelLiters, 0)
  const co2Kg = fuelLiters * DIESEL_CO2_KG_PER_LITER
  const avoidableCo2Kg = avoidableFuelLiters * DIESEL_CO2_KG_PER_LITER
  const stopProbability = Math.min(0.08 + riskScore / 135, 0.86)

  return {
    fuelLiters: round(fuelLiters, 1),
    co2Kg: round(co2Kg, 1),
    avoidableFuelLiters: round(avoidableFuelLiters, 1),
    avoidableCo2Kg: round(avoidableCo2Kg, 1),
    estimatedCostBrl: round(fuelLiters * DIESEL_PRICE_BRL, 0),
    expectedUnplannedCostBrl: round(stopProbability * UNPLANNED_STOP_COST_BRL, 0),
  }
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

function round(value, digits) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
