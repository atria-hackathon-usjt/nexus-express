import { calculateRouteStress } from './routeStressEngine'

export function calculateVehicleRisk(vehicle, route) {
  const kmSinceMaintenance = vehicle.odometerKm - vehicle.lastMaintenanceKm
  const maintenanceScore = Math.min(kmSinceMaintenance / 25000, 1.4) * 24
  const calendarScore = Math.min(vehicle.daysSinceMaintenance / 120, 1.3) * 16
  const odometerScore = Math.min(vehicle.odometerKm / 380000, 1.2) * 14
  const consumptionGap = Math.max(
    (vehicle.expectedConsumptionKmL - vehicle.averageConsumptionKmL) /
      vehicle.expectedConsumptionKmL,
    0,
  )
  const consumptionScore = Math.min(consumptionGap / 0.22, 1.4) * 14
  const failuresScore = Math.min(vehicle.failureHistory / 4, 1.25) * 12
  const tireScore = Math.min(vehicle.tireWearPct / 85, 1.2) * 9
  const brakeScore = Math.min(vehicle.brakeWearPct / 80, 1.2) * 8
  const temperatureScore = Math.max(vehicle.engineTemperatureC - 88, 0) * 1.2
  const routeScore = route ? calculateRouteStress(route) * 0.16 : 0
  const overloadPenalty =
    route && route.cargoKg > vehicle.payloadCapacityKg
      ? ((route.cargoKg - vehicle.payloadCapacityKg) / vehicle.payloadCapacityKg) * 55
      : 0

  return Math.round(
    Math.min(
      maintenanceScore +
        calendarScore +
        odometerScore +
        consumptionScore +
        failuresScore +
        tireScore +
        brakeScore +
        temperatureScore +
        routeScore +
        overloadPenalty,
      100,
    ),
  )
}

export function classifyRisk(score) {
  if (score >= 82) return 'Crítico'
  if (score >= 64) return 'Alto'
  if (score >= 42) return 'Médio'
  return 'Baixo'
}

export function getRiskTone(score) {
  if (score >= 82) return 'critical'
  if (score >= 64) return 'high'
  if (score >= 42) return 'medium'
  return 'low'
}
