# Sincronização AirTable

O frontend usa `src/services/fleetDataService.js` como camada de dados.

Sem variáveis de ambiente, o painel continua usando os mocks locais. Quando as variáveis abaixo existirem, ele busca rotas e caminhões no AirTable:

```txt
VITE_AIRTABLE_API_KEY
VITE_AIRTABLE_BASE_ID
VITE_AIRTABLE_ROUTES_TABLE
VITE_AIRTABLE_VEHICLES_TABLE
```

## Tabela de rotas

Campos aceitos:

| Campo interno | Nomes aceitos no AirTable |
| --- | --- |
| `id` | `id`, `ID`, `Route ID`, `Código`, `Codigo` |
| `name` | `name`, `Nome`, `Rota`, `Route Name` |
| `type` | `type`, `Tipo`, `Categoria` |
| `distanceKm` | `distanceKm`, `Distância km`, `Distancia km`, `Distance Km` |
| `terrain` | `terrain`, `Terreno` |
| `terrainFactor` | `terrainFactor`, `Fator terreno` |
| `elevationGainM` | `elevationGainM`, `Elevação m`, `Elevacao m` |
| `congestionLevel` | `congestionLevel`, `Congestionamento %` |
| `stopCount` | `stopCount`, `Paradas` |
| `cargoKg` | `cargoKg`, `Carga kg` |
| `deadlineHours` | `deadlineHours`, `Prazo h`, `Prazo horas` |
| `baselineConsumptionKmL` | `baselineConsumptionKmL`, `Consumo base km/l` |
| `assignedVehicleId` | `assignedVehicleId`, `Caminhão atribuído`, `Caminhao atribuido`, `Assigned Vehicle` |

O campo `assignedVehicleId` pode ser escrito pelo n8n. Quando ele existir, o frontend já exibe essa atribuição.

## Tabela de caminhões

Campos aceitos:

| Campo interno | Nomes aceitos no AirTable |
| --- | --- |
| `id` | `id`, `ID`, `Vehicle ID`, `Código`, `Codigo` |
| `plate` | `plate`, `Placa` |
| `model` | `model`, `Modelo` |
| `category` | `category`, `Categoria` |
| `year` | `year`, `Ano` |
| `odometerKm` | `odometerKm`, `Odômetro km`, `Odometro km` |
| `lastMaintenanceKm` | `lastMaintenanceKm`, `Última manutenção km` |
| `daysSinceMaintenance` | `daysSinceMaintenance`, `Dias desde manutenção` |
| `averageConsumptionKmL` | `averageConsumptionKmL`, `Consumo médio km/l` |
| `expectedConsumptionKmL` | `expectedConsumptionKmL`, `Consumo esperado km/l` |
| `fuelType` | `fuelType`, `Combustível` |
| `payloadCapacityKg` | `payloadCapacityKg`, `Capacidade kg` |
| `currentPayloadKg` | `currentPayloadKg`, `Carga atual kg` |
| `failureHistory` | `failureHistory`, `Histórico de falhas` |
| `tireWearPct` | `tireWearPct`, `Pneus %` |
| `brakeWearPct` | `brakeWearPct`, `Freios %` |
| `engineTemperatureC` | `engineTemperatureC`, `Temperatura motor C` |
| `availability` | `availability`, `Disponibilidade` |

## Observação

Para demonstração, o frontend pode ler direto do AirTable. Em produção, a chave do AirTable não deve ficar no navegador; o ideal é passar por n8n, backend ou edge function.
