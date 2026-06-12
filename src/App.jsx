import { useEffect, useMemo, useState } from 'react'
import { FleetRanking } from './components/FleetRanking'
import { Hero } from './components/Hero'
import { MetricsGrid } from './components/MetricsGrid'
import { RoutePlanner } from './components/RoutePlanner'
import { calculateSustainabilityImpact } from './domain/financialImpactEngine'
import { findBestVehicle, getMaintenanceRecommendation } from './domain/maintenanceEngine'
import { calculateVehicleRisk, classifyRisk, getRiskTone } from './domain/riskEngine'
import {
  calculateRouteStress,
  estimateRouteFuelLiters,
  getRouteDifficulty,
} from './domain/routeStressEngine'
import { fetchFleetData, getMockFleetData } from './services/fleetDataService'

function buildFleetAnalysisForRoute(route, fleetVehicles) {
  const rankedVehicles = fleetVehicles.map((vehicle) => {
    const riskScore = calculateVehicleRisk(vehicle, route)

    return {
      ...vehicle,
      riskScore,
      riskLevel: classifyRisk(riskScore),
      riskTone: getRiskTone(riskScore),
      fuelLiters: estimateRouteFuelLiters(route, vehicle),
    }
  })

  const bestVehicle = findBestVehicle(rankedVehicles)

  return rankedVehicles
    .map((vehicle) => ({
      ...vehicle,
      recommendation: getMaintenanceRecommendation(vehicle, vehicle.riskScore, route),
      impact: calculateSustainabilityImpact(route, vehicle, vehicle.riskScore, bestVehicle),
      isBest: vehicle.id === bestVehicle.id,
    }))
    .sort((a, b) => a.riskScore - b.riskScore)
}

function classifyRouteOperation(route) {
  if (route.congestionLevel >= 74 && route.deadlineHours <= 4) return 'delayed'
  return 'available'
}

function estimateDelayRiskMinutes(route, routeStress) {
  const congestionDelay = Math.max(route.congestionLevel - 58, 0) * 1.2
  const deadlinePressure = Math.max(5 - route.deadlineHours, 0) * 9
  const stressDelay = Math.max(routeStress - 65, 0) * 0.8

  return Math.round(congestionDelay + deadlinePressure + stressDelay)
}

function buildRouteOperation(route, fleetVehicles, assignedVehicleId) {
  const fleetAnalysis = buildFleetAnalysisForRoute(route, fleetVehicles)
  const recommendedVehicle = fleetAnalysis.find((vehicle) => vehicle.isBest)
  const requestedManualVehicle = assignedVehicleId
    ? fleetAnalysis.find((vehicle) => vehicle.id === assignedVehicleId)
    : null
  const manuallyAssignedVehicle =
    requestedManualVehicle && !isCriticalVehicle(requestedManualVehicle)
      ? requestedManualVehicle
      : null
  const assignedVehicle = manuallyAssignedVehicle ?? recommendedVehicle
  const routeStress = calculateRouteStress(route)

  return {
    route,
    routeStress,
    difficulty: getRouteDifficulty(routeStress),
    assignedVehicle,
    recommendedVehicle,
    manualAssignedVehicleId: manuallyAssignedVehicle?.id ?? null,
    assignmentMode: manuallyAssignedVehicle ? 'manual' : 'automatic',
    delayRiskMinutes: estimateDelayRiskMinutes(route, routeStress),
    status: classifyRouteOperation(route),
    fleetAnalysis: fleetAnalysis.map((vehicle) => ({
      ...vehicle,
      isAssigned: vehicle.id === assignedVehicle.id,
    })),
  }
}

function isCriticalVehicle(vehicle) {
  return vehicle.riskScore >= 82
}

function App() {
  const [theme, setTheme] = useState(() => {
    try {
      return window.localStorage.getItem('nexus-theme') === 'light' ? 'light' : 'dark'
    } catch {
      return 'dark'
    }
  })
  const [fleetData, setFleetData] = useState(getMockFleetData)
  const [syncState, setSyncState] = useState({
    status: 'idle',
    source: 'mock',
    syncedAt: fleetData.syncedAt,
    error: null,
  })
  const [selectedRouteId, setSelectedRouteId] = useState(fleetData.routes[0].id)
  const [assignedVehicleByRoute, setAssignedVehicleByRoute] = useState({})
  const routes = fleetData.routes
  const vehicles = fleetData.vehicles
  const routeOperations = useMemo(
    () => {
      const assignedVehicleIds = new Set()

      return routes.map((route) => {
        const requestedVehicleId = assignedVehicleByRoute[route.id] || route.assignedVehicleId
        const assignedVehicleId =
          requestedVehicleId && !assignedVehicleIds.has(requestedVehicleId)
            ? requestedVehicleId
            : ''

        const operation = buildRouteOperation(route, vehicles, assignedVehicleId)

        if (operation.manualAssignedVehicleId) {
          assignedVehicleIds.add(operation.manualAssignedVehicleId)
        }

        return operation
      })
    },
    [assignedVehicleByRoute, routes, vehicles],
  )
  const selectedRouteOperation =
    routeOperations.find((operation) => operation.route.id === selectedRouteId) ?? routeOperations[0]
  const selectedRoute = selectedRouteOperation.route

  const fleetAnalysis = selectedRouteOperation.fleetAnalysis

  const bestVehicle = selectedRouteOperation.assignedVehicle
  const criticalVehicles = fleetAnalysis.filter((vehicle) => vehicle.riskScore >= 82).length
  const routeStress = selectedRouteOperation.routeStress
  const averageRisk = Math.round(
    fleetAnalysis.reduce((total, vehicle) => total + vehicle.riskScore, 0) / fleetAnalysis.length,
  )
  const avoidableCo2 = fleetAnalysis.reduce(
    (total, vehicle) => total + vehicle.impact.avoidableCo2Kg,
    0,
  )

  useEffect(() => {
    syncFleetData({ silent: true })
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme

    try {
      window.localStorage.setItem('nexus-theme', theme)
    } catch {
      // Local storage can be unavailable in restricted browser contexts.
    }
  }, [theme])

  useEffect(() => {
    if (!routeOperations.some((operation) => operation.route.id === selectedRouteId)) {
      setSelectedRouteId(routeOperations[0].route.id)
    }
  }, [routeOperations, selectedRouteId])

  const metrics = [
    {
      label: 'Risco médio da frota',
      value: `${averageRisk}/100`,
      detail: 'score operacional',
    },
    {
      label: 'Veículos críticos',
      value: criticalVehicles,
      detail: 'exigem ação preventiva',
    },
    {
      label: 'Estresse da rota',
      value: `${routeStress}/100`,
      detail: getRouteDifficulty(routeStress),
    },
    {
      label: 'CO2 evitável',
      value: `${avoidableCo2.toFixed(1)} kg`,
      detail: 'comparando com o melhor veículo',
    },
  ]

  function handleAssignVehicle(routeId, vehicleId) {
    const assignmentBlock = getAssignmentBlock(routeId, vehicleId)

    if (assignmentBlock) return assignmentBlock

    setAssignedVehicleByRoute((currentAssignments) => {
      const nextAssignments = { ...currentAssignments }

      if (vehicleId) {
        nextAssignments[routeId] = vehicleId
      } else {
        delete nextAssignments[routeId]
      }

      return nextAssignments
    })

    return { ok: true }
  }

  function getAssignmentBlock(routeId, vehicleId) {
    if (!vehicleId) return null

    const routeOperation = routeOperations.find((operation) => operation.route.id === routeId)
    const selectedVehicle = routeOperation?.fleetAnalysis.find((vehicle) => vehicle.id === vehicleId)
    const routeWithVehicle = routeOperations.find(
      (operation) =>
        operation.route.id !== routeId && operation.manualAssignedVehicleId === vehicleId,
    )

    if (routeWithVehicle) {
      return {
        ok: false,
        reason: 'duplicate',
        message: `${vehicleId} já está atribuído em ${routeWithVehicle.route.name}.`,
      }
    }

    if (selectedVehicle && isCriticalVehicle(selectedVehicle)) {
      return {
        ok: false,
        reason: 'critical',
        message: buildCriticalAssignmentMessage(selectedVehicle),
      }
    }

    return null
  }

  async function syncFleetData({ silent = false } = {}) {
    if (!silent) {
      setSyncState((currentState) => ({
        ...currentState,
        status: 'syncing',
        error: null,
      }))
    }

    try {
      const nextFleetData = await fetchFleetData()

      setFleetData(nextFleetData)
      setSyncState({
        status: 'idle',
        source: nextFleetData.source,
        syncedAt: nextFleetData.syncedAt,
        error: null,
      })

      setAssignedVehicleByRoute((currentAssignments) =>
        pruneAssignments(currentAssignments, nextFleetData.routes, nextFleetData.vehicles),
      )
    } catch (error) {
      setSyncState((currentState) => ({
        ...currentState,
        status: 'error',
        error: error.message,
      }))
    }
  }

  return (
    <main className="app-shell min-h-screen" data-theme={theme}>
      <Hero />
      <MetricsGrid metrics={metrics} />
      <SyncPanel
        syncState={syncState}
        theme={theme}
        onSync={() => syncFleetData()}
        onThemeChange={setTheme}
      />
      <RoutePlanner
        bestVehicle={bestVehicle}
        routes={routes}
        routeOperations={routeOperations}
        selectedRoute={selectedRoute}
        selectedRouteId={selectedRouteId}
        selectedRouteOperation={selectedRouteOperation}
        onAssignVehicle={handleAssignVehicle}
        onSelectRoute={setSelectedRouteId}
      />
      <FleetRanking vehicles={fleetAnalysis} />
    </main>
  )
}

function buildCriticalAssignmentMessage(vehicle) {
  return `${vehicle.id} não pode ser atribuído: risco crítico ${vehicle.riskScore}/100. ${vehicle.recommendation.action}: ${vehicle.recommendation.detail}`
}

function SyncPanel({ syncState, theme, onSync, onThemeChange }) {
  const sourceLabel = syncState.source === 'airtable' ? 'AirTable' : 'Mocks locais'
  const syncLabel =
    syncState.status === 'syncing'
      ? 'Sincronizando...'
      : `Fonte: ${sourceLabel} · ${formatSyncDate(syncState.syncedAt)}`

  return (
    <section className="mx-auto mt-4 max-w-[1220px] px-6">
      <div className="theme-panel flex flex-col gap-3 rounded-lg border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <strong className="theme-title block font-black">Sincronização de dados</strong>
          <span className="theme-soft text-xs font-bold">{syncLabel}</span>
          {syncState.error ? (
            <span className="mt-1 block text-xs font-bold text-[#9a2b2b]">
              Falha ao sincronizar: {syncState.error}
            </span>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <ThemeToggle theme={theme} onThemeChange={onThemeChange} />
          <button
            className="theme-primary-button min-h-10 rounded-[7px] border px-3.5 text-sm font-black transition disabled:cursor-wait disabled:opacity-70"
            disabled={syncState.status === 'syncing'}
            onClick={onSync}
            type="button"
          >
            Atualizar dados
          </button>
        </div>
      </div>
    </section>
  )
}

function ThemeToggle({ theme, onThemeChange }) {
  return (
    <div
      className="theme-toggle inline-grid min-h-10 grid-cols-2 rounded-[7px] border p-1 text-xs font-black uppercase"
      aria-label="Tema da interface"
      role="group"
    >
      {[
        ['light', 'Claro'],
        ['dark', 'Escuro'],
      ].map(([value, label]) => (
        <button
          className={
            theme === value
              ? 'theme-toggle-option-active rounded-[5px] px-3 transition'
              : 'theme-toggle-option rounded-[5px] px-3 transition'
          }
          key={value}
          type="button"
          aria-pressed={theme === value}
          onClick={() => onThemeChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function pruneAssignments(assignments, nextRoutes, nextVehicles) {
  const routeIds = new Set(nextRoutes.map((route) => route.id))
  const vehicleIds = new Set(nextVehicles.map((vehicle) => vehicle.id))

  return Object.fromEntries(
    Object.entries(assignments).filter(
      ([routeId, vehicleId]) => routeIds.has(routeId) && vehicleIds.has(vehicleId),
    ),
  )
}

function formatSyncDate(value) {
  if (!value) return 'aguardando sincronização'

  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value))
}

export default App
