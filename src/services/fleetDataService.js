import { routes as mockRoutes } from '../data/routes.mock'
import { vehicles as mockVehicles } from '../data/vehicles.mock'

const AIRTABLE_API_BASE_URL = 'https://api.airtable.com/v0'

const airtableConfig = {
  apiKey: import.meta.env.VITE_AIRTABLE_API_KEY,
  baseId: import.meta.env.VITE_AIRTABLE_BASE_ID,
  routesTable: import.meta.env.VITE_AIRTABLE_ROUTES_TABLE || 'Routes',
  vehiclesTable: import.meta.env.VITE_AIRTABLE_VEHICLES_TABLE || 'Vehicles',
}

export function getMockFleetData() {
  return {
    routes: mockRoutes,
    vehicles: mockVehicles,
    source: 'mock',
    syncedAt: new Date().toISOString(),
  }
}

export async function fetchFleetData() {
  if (!isAirtableConfigured()) return getMockFleetData()

  const [routeRecords, vehicleRecords] = await Promise.all([
    fetchAirtableTable(airtableConfig.routesTable),
    fetchAirtableTable(airtableConfig.vehiclesTable),
  ])

  const routes = routeRecords.map(normalizeRouteRecord)
  const vehicles = vehicleRecords.map(normalizeVehicleRecord)

  if (!routes.length || !vehicles.length) {
    throw new Error('Base AirTable sem rotas ou caminhões cadastrados')
  }

  return {
    routes,
    vehicles,
    source: 'airtable',
    syncedAt: new Date().toISOString(),
  }
}

function isAirtableConfigured() {
  return Boolean(airtableConfig.apiKey && airtableConfig.baseId)
}

async function fetchAirtableTable(tableName) {
  const records = []
  let offset = null

  do {
    const url = new URL(
      `${AIRTABLE_API_BASE_URL}/${airtableConfig.baseId}/${encodeURIComponent(tableName)}`,
    )
    if (offset) url.searchParams.set('offset', offset)

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${airtableConfig.apiKey}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Airtable ${tableName}: ${response.status} ${response.statusText}`)
    }

    const payload = await response.json()
    records.push(...(payload.records ?? []))
    offset = payload.offset
  } while (offset)

  return records
}

function normalizeRouteRecord(record) {
  const fields = record.fields ?? {}

  return {
    airtableRecordId: record.id,
    id: text(fields, ['id', 'ID', 'Route ID', 'Código', 'Codigo'], record.id),
    name: text(fields, ['name', 'Nome', 'Rota', 'Route Name'], 'Rota sem nome'),
    type: text(fields, ['type', 'Tipo', 'Categoria'], 'Operacional'),
    distanceKm: number(fields, ['distanceKm', 'Distância km', 'Distancia km', 'Distance Km'], 0),
    terrain: text(fields, ['terrain', 'Terreno'], 'rodovia'),
    terrainFactor: number(fields, ['terrainFactor', 'Fator terreno'], 1),
    elevationGainM: number(fields, ['elevationGainM', 'Elevação m', 'Elevacao m'], 0),
    congestionLevel: number(fields, ['congestionLevel', 'Congestionamento %'], 0),
    stopCount: number(fields, ['stopCount', 'Paradas'], 0),
    cargoKg: number(fields, ['cargoKg', 'Carga kg'], 0),
    deadlineHours: number(fields, ['deadlineHours', 'Prazo h', 'Prazo horas'], 1),
    baselineConsumptionKmL: number(fields, ['baselineConsumptionKmL', 'Consumo base km/l'], 5),
    assignedVehicleId: text(
      fields,
      ['assignedVehicleId', 'Caminhão atribuído', 'Caminhao atribuido', 'Assigned Vehicle'],
      '',
    ),
    map: {
      origin: {
        label: text(fields, ['originLabel', 'Origem'], 'Origem'),
        lat: number(fields, ['originLat', 'Origem lat'], 0),
        lng: number(fields, ['originLng', 'Origem lng'], 0),
      },
      destination: {
        label: text(fields, ['destinationLabel', 'Destino'], 'Destino'),
        lat: number(fields, ['destinationLat', 'Destino lat'], 0),
        lng: number(fields, ['destinationLng', 'Destino lng'], 0),
      },
    },
  }
}

function normalizeVehicleRecord(record) {
  const fields = record.fields ?? {}

  return {
    airtableRecordId: record.id,
    id: text(fields, ['id', 'ID', 'Vehicle ID', 'Código', 'Codigo'], record.id),
    plate: text(fields, ['plate', 'Placa'], '-'),
    model: text(fields, ['model', 'Modelo'], 'Caminhão'),
    category: text(fields, ['category', 'Categoria'], 'Frota'),
    year: number(fields, ['year', 'Ano'], new Date().getFullYear()),
    odometerKm: number(fields, ['odometerKm', 'Odômetro km', 'Odometro km'], 0),
    lastMaintenanceKm: number(fields, ['lastMaintenanceKm', 'Última manutenção km'], 0),
    daysSinceMaintenance: number(fields, ['daysSinceMaintenance', 'Dias desde manutenção'], 0),
    averageConsumptionKmL: number(fields, ['averageConsumptionKmL', 'Consumo médio km/l'], 5),
    expectedConsumptionKmL: number(fields, ['expectedConsumptionKmL', 'Consumo esperado km/l'], 5),
    fuelType: text(fields, ['fuelType', 'Combustível'], 'dieselS10'),
    payloadCapacityKg: number(fields, ['payloadCapacityKg', 'Capacidade kg'], 1),
    currentPayloadKg: number(fields, ['currentPayloadKg', 'Carga atual kg'], 0),
    failureHistory: number(fields, ['failureHistory', 'Histórico de falhas'], 0),
    tireWearPct: number(fields, ['tireWearPct', 'Pneus %'], 0),
    brakeWearPct: number(fields, ['brakeWearPct', 'Freios %'], 0),
    engineTemperatureC: number(fields, ['engineTemperatureC', 'Temperatura motor C'], 85),
    availability: text(fields, ['availability', 'Disponibilidade'], 'Disponível'),
  }
}

function text(fields, names, fallback) {
  const value = getField(fields, names)
  if (Array.isArray(value)) return value[0] ? String(value[0]) : fallback
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

function number(fields, names, fallback) {
  const value = getField(fields, names)
  const parsedValue = Number(Array.isArray(value) ? value[0] : value)
  return Number.isFinite(parsedValue) ? parsedValue : fallback
}

function getField(fields, names) {
  return names.map((name) => fields[name]).find((value) => value !== undefined)
}
