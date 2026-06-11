import { classifyRisk } from './riskEngine'

export function getMaintenanceRecommendation(vehicle, riskScore, route) {
  const risk = classifyRisk(riskScore)
  const kmSinceMaintenance = vehicle.odometerKm - vehicle.lastMaintenanceKm
  const alerts = []

  if (kmSinceMaintenance > 22000) alerts.push('revisão por quilometragem vencida')
  if (vehicle.daysSinceMaintenance > 100) alerts.push('janela de manutenção expirada')
  if (vehicle.tireWearPct > 65) alerts.push('desgaste elevado dos pneus')
  if (vehicle.brakeWearPct > 58) alerts.push('freios próximos do limite')
  if (vehicle.engineTemperatureC > 94) alerts.push('temperatura do motor acima do ideal')
  if (vehicle.averageConsumptionKmL < vehicle.expectedConsumptionKmL * 0.9) {
    alerts.push('consumo fora do padrão esperado')
  }
  if (route?.cargoKg > vehicle.payloadCapacityKg) alerts.push('carga acima da capacidade')

  if (risk === 'Crítico') {
    return {
      action: 'Retirar da escala',
      detail: `Agendar inspeção preventiva antes da próxima rota: ${alerts.join(', ')}.`,
    }
  }

  if (risk === 'Alto') {
    return {
      action: 'Liberar com restrição',
      detail: `Usar somente em rota curta e abrir ordem preventiva: ${alerts.join(', ') || 'risco acumulado elevado'}.`,
    }
  }

  if (risk === 'Médio') {
    return {
      action: 'Monitorar operação',
      detail: `Veículo apto, com checagem rápida antes da saída: ${alerts.join(', ') || 'sem alerta crítico'}.`,
    }
  }

  return {
    action: 'Apto para rota',
    detail: 'Bom candidato para reduzir paradas, atrasos e consumo desnecessário.',
  }
}

export function findBestVehicle(options) {
  return [...options].sort((a, b) => a.riskScore - b.riskScore || a.fuelLiters - b.fuelLiters)[0]
}
