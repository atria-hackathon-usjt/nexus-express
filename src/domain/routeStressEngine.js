export function calculateRouteStress(route) {
  const congestionStress = route.congestionLevel / 100
  const elevationStress = Math.min(route.elevationGainM / 1200, 1.25)
  const stopStress = Math.min(route.stopCount / 18, 1)
  const loadStress = Math.min(route.cargoKg / 14000, 1.2)
  const distanceStress = Math.min(route.distanceKm / 140, 1.1)

  const stress =
    route.terrainFactor * 22 +
    congestionStress * 22 +
    elevationStress * 18 +
    stopStress * 14 +
    loadStress * 14 +
    distanceStress * 10

  return Math.round(Math.min(stress, 100))
}

export function getRouteDifficulty(score) {
  if (score >= 78) return 'Crítica'
  if (score >= 62) return 'Alta'
  if (score >= 44) return 'Média'
  return 'Baixa'
}

export function estimateRouteFuelLiters(route, vehicle) {
  const payloadRatio = route.cargoKg / vehicle.payloadCapacityKg
  const loadPenalty = Math.max(payloadRatio - 0.55, 0) * 0.18
  const congestionPenalty = (route.congestionLevel / 100) * 0.16
  const elevationPenalty = Math.min(route.elevationGainM / 1400, 1) * 0.14
  const stopPenalty = Math.min(route.stopCount / 20, 1) * 0.1
  const adjustedConsumption =
    vehicle.averageConsumptionKmL /
    (route.terrainFactor + loadPenalty + congestionPenalty + elevationPenalty + stopPenalty)

  return route.distanceKm / Math.max(adjustedConsumption, 1.8)
}
