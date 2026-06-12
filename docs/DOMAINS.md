# DOMAINS

Documentação dos arquivos presentes em `src/domain`.

Os cálculos atuais são **heurísticos**. Isso significa que os pesos e limites foram definidos manualmente para criar um protótipo plausível, fácil de explicar e útil para uma hackathon. Eles não vieram de um modelo estatístico treinado com dados reais.

Em produção, esses pesos deveriam ser calibrados com histórico real de telemetria, manutenções, falhas, consumo, rotas, atrasos e custos operacionais.

## Sumário

1. [Visão geral](#visão-geral)
2. [Score de risco do veículo](#score-de-risco-do-veículo)
3. [Estresse da rota](#estresse-da-rota)
4. [Estimativa de combustível](#estimativa-de-combustível)
5. [Recomendação de manutenção](#recomendação-de-manutenção)
6. [Impacto financeiro e sustentável](#impacto-financeiro-e-sustentável)
7. [Escolha do melhor veículo](#escolha-do-melhor-veículo)
8. [Como explicar os pesos](#como-explicar-os-pesos)
9. [O que evoluir depois](#o-que-evoluir-depois)

## Visão geral

O domínio foi separado em quatro responsabilidades:

| Arquivo | Responsabilidade |
| --- | --- |
| `riskEngine.js` | Calcula o risco preventivo de cada veículo. |
| `routeStressEngine.js` | Calcula o nível de esforço de uma rota e estima combustível. |
| `maintenanceEngine.js` | Transforma risco em ação operacional. |
| `financialImpactEngine.js` | Calcula custo, diesel, CO2 e impacto evitável. |

O fluxo principal é:

```txt
Veículo + Rota
      ↓
Score de risco
      ↓
Recomendação preventiva
      ↓
Impacto financeiro e ambiental
      ↓
Ranking do melhor veículo
```

## Score de risco do veículo

Arquivo: `src/domain/riskEngine.js`

Função principal:

```js
calculateVehicleRisk(vehicle, route)
```

Essa função soma vários critérios de risco e retorna um score entre `0` e `100`.

### Como o score é formado

Cada critério é normalizado e multiplicado por um peso.

```txt
score final =
  manutenção por km
  + manutenção por tempo
  + odômetro total
  + consumo anormal
  + histórico de falhas
  + desgaste dos pneus
  + desgaste dos freios
  + temperatura do motor
  + dificuldade da rota
  + penalidade por excesso de carga
```

### Pesos usados

| Critério | Peso base | Motivo |
| --- | ---: | --- |
| Km desde última manutenção | `24` | É o principal sinal de manutenção preventiva vencida. |
| Dias desde manutenção | `16` | Tempo também degrada componentes, mesmo com pouca rodagem. |
| Odômetro total | `14` | Veículos muito rodados tendem a acumular desgaste. |
| Consumo anormal | `14` | Pode indicar falha mecânica e também afeta CO2. |
| Histórico de falhas | `12` | Falhas recorrentes aumentam chance de parada. |
| Pneus | `9` | Afetam segurança, consumo e chance de parada. |
| Freios | `8` | Afetam segurança, especialmente em rotas pesadas. |
| Temperatura | variável | Cada grau acima do ideal aumenta risco. |
| Rota | até `16` | A rota adiciona risco contextual ao veículo. |
| Excesso de carga | variável | Penaliza quando a carga passa da capacidade. |

### Por que esses pesos?

Os pesos foram distribuídos por impacto esperado.

Critérios que costumam afetar mais diretamente a chance de falha ou parada receberam pesos maiores. Por isso manutenção vencida pesa mais que pneus ou freios isoladamente.

A intenção não é que cada peso seja uma verdade absoluta, mas que o ranking final faça sentido:

```txt
manutenção vencida > consumo anormal > falhas recorrentes > desgastes pontuais
```

### Exemplo: manutenção por quilometragem

```js
const maintenanceScore = Math.min(kmSinceMaintenance / 25000, 1.4) * 24
```

Raciocínio:

| Parte | Significado |
| --- | --- |
| `25000` | Janela preventiva aproximada de revisão. |
| `kmSinceMaintenance / 25000` | Converte km rodados em proporção. |
| `1.4` | Teto: pode pesar até 40% acima do peso base. |
| `24` | Peso do critério no score. |

Exemplo:

```txt
12.500 km desde revisão = 0.5 * 24 = 12 pontos
25.000 km desde revisão = 1.0 * 24 = 24 pontos
35.000 km desde revisão = 1.4 * 24 = 33,6 pontos
```

### Exemplo: consumo anormal

```js
const consumptionScore = Math.min(consumptionGap / 0.22, 1.4) * 14
```

Raciocínio:

| Parte | Significado |
| --- | --- |
| `consumptionGap` | Diferença percentual entre consumo esperado e consumo real. |
| `0.22` | 22% pior que o esperado é tratado como anomalia forte. |
| `1.4` | Teto: pode pesar até 40% acima do peso base. |
| `14` | Peso do consumo no risco. |

Se o caminhão deveria fazer `5 km/L` e faz `4 km/L`:

```txt
gap = (5 - 4) / 5 = 0.20
score = (0.20 / 0.22) * 14 = 12,7 pontos
```

### Por que existem tetos como `1.4`, `1.3`, `1.25` e `1.2`?

Os tetos controlam o quanto um critério pode passar do peso base.

| Teto | Interpretação |
| ---: | --- |
| `1.2` | Pode pesar até 20% acima do peso base. |
| `1.25` | Pode pesar até 25% acima do peso base. |
| `1.3` | Pode pesar até 30% acima do peso base. |
| `1.4` | Pode pesar até 40% acima do peso base. |

Eles existem para evitar que um único critério exploda o score sozinho.

Exemplo:

```js
Math.min(consumptionGap / 0.22, 1.4) * 14
```

Mesmo que o consumo esteja muito ruim, ele para em:

```txt
1.4 * 14 = 19,6 pontos
```

Ou seja: pesa bastante, mas não decide tudo sozinho.

### Classificação do risco

```js
if (score >= 82) return 'Crítico'
if (score >= 64) return 'Alto'
if (score >= 42) return 'Médio'
return 'Baixo'
```

| Faixa | Significado |
| --- | --- |
| `Baixo` | Veículo apto. |
| `Médio` | Pode operar, mas merece monitoramento. |
| `Alto` | Operação com restrição. |
| `Crítico` | Deve sair da escala. |

Esses cortes foram escolhidos para criar níveis úteis na interface e na decisão operacional.

## Estresse da rota

Arquivo: `src/domain/routeStressEngine.js`

Função principal:

```js
calculateRouteStress(route)
```

Essa função calcula o quão pesada é uma rota. O resultado também vai de `0` a `100`.

### Critérios usados

| Critério | Peso | Motivo |
| --- | ---: | --- |
| Terreno | `22` | Tipo de piso e condição da rota afetam consumo e desgaste. |
| Congestionamento | `22` | Trânsito aumenta marcha lenta, freio, temperatura e atraso. |
| Elevação | `18` | Aclives exigem motor e freios. |
| Paradas | `14` | Muitas paradas aumentam arrancadas e frenagens. |
| Carga | `14` | Carga maior exige mais do motor e aumenta consumo. |
| Distância | `10` | Importa, mas uma rota longa plana pode ser menos agressiva que uma urbana curta. |

### Por que esses valores somam perto de 100?

A ideia é criar uma escala intuitiva.

```txt
22 + 22 + 18 + 14 + 14 + 10 = 100
```

Os critérios mais importantes recebem mais pontos dentro desse total.

Então sim: primeiro foram escolhidos os critérios, depois os `100` pontos foram distribuídos entre eles conforme impacto esperado.

### Normalização dos critérios

Antes de aplicar os pesos, os dados são convertidos para proporções.

```js
const congestionStress = route.congestionLevel / 100
const elevationStress = Math.min(route.elevationGainM / 1200, 1.25)
const stopStress = Math.min(route.stopCount / 18, 1)
const loadStress = Math.min(route.cargoKg / 14000, 1.2)
const distanceStress = Math.min(route.distanceKm / 140, 1.1)
```

Exemplo:

```txt
Congestionamento de 64%
64 / 100 = 0.64
0.64 * 22 = 14,08 pontos
```

Por isso aparecem valores quebrados. Eles vêm das proporções calculadas a partir dos mocks.

### Classificação da rota

```js
if (score >= 78) return 'Crítica'
if (score >= 62) return 'Alta'
if (score >= 44) return 'Média'
return 'Baixa'
```

| Faixa | Significado |
| --- | --- |
| `Baixa` | Rota simples. |
| `Média` | Exige atenção. |
| `Alta` | Rota operacionalmente pesada. |
| `Crítica` | Rota muito exigente. |

## Estimativa de combustível

Arquivo: `src/domain/routeStressEngine.js`

Função:

```js
estimateRouteFuelLiters(route, vehicle)
```

Essa função estima quantos litros de diesel um veículo gastaria em uma rota.

### Lógica

O consumo médio do veículo é ajustado por penalidades da rota.

```js
const adjustedConsumption =
  vehicle.averageConsumptionKmL /
  (route.terrainFactor + loadPenalty + congestionPenalty + elevationPenalty + stopPenalty)
```

Quanto mais pesada a rota, maior o divisor. Quanto maior o divisor, menor o km/L ajustado.

### Penalidades

| Penalidade | Cálculo | Motivo |
| --- | --- | --- |
| Carga | `Math.max(payloadRatio - 0.55, 0) * 0.18` | Carga acima de 55% da capacidade começa a aumentar consumo. |
| Congestionamento | `(congestionLevel / 100) * 0.16` | Trânsito afeta consumo de forma forte. |
| Elevação | `(elevationGainM / 1400) * 0.14` | Aclives aumentam esforço do motor. |
| Paradas | `(stopCount / 20) * 0.1` | Arrancadas e frenagens aumentam consumo. |

### Por que existe mínimo de `1.8 km/L`?

```js
return route.distanceKm / Math.max(adjustedConsumption, 1.8)
```

Esse mínimo evita resultados absurdos em rotas muito pesadas ou dados extremos. É uma trava de segurança para o protótipo.

## Recomendação de manutenção

Arquivo: `src/domain/maintenanceEngine.js`

Função principal:

```js
getMaintenanceRecommendation(vehicle, riskScore, route)
```

Essa função transforma o score de risco em uma ação clara para o gestor.

### Alertas usados

| Alerta | Limite | Motivo |
| --- | ---: | --- |
| Revisão por km vencida | `> 22000 km` | Avisa antes da janela de 25.000 km usada no score. |
| Janela por tempo expirada | `> 100 dias` | Avisa antes dos 120 dias usados no score. |
| Pneus desgastados | `> 65%` | Preventivo, antes de chegar no limite alto. |
| Freios próximos do limite | `> 58%` | Preventivo por segurança. |
| Temperatura alta | `> 94°C` | Indica sinal claro de atenção. |
| Consumo fora do padrão | `< 90% do esperado` | Consumo 10% pior já merece alerta. |
| Carga acima da capacidade | `cargoKg > payloadCapacityKg` | A rota exige mais do que o veículo suporta. |

### Ações

| Risco | Ação |
| --- | --- |
| `Crítico` | Retirar da escala. |
| `Alto` | Liberar com restrição. |
| `Médio` | Monitorar operação. |
| `Baixo` | Apto para rota. |

Essa camada é importante porque o usuário não precisa interpretar apenas números. Ele recebe uma recomendação operacional.

## Impacto financeiro e sustentável

Arquivo: `src/domain/financialImpactEngine.js`

Função principal:

```js
calculateSustainabilityImpact(route, vehicle, riskScore, bestVehicle)
```

Essa função calcula:

- litros estimados;
- CO2 estimado;
- diesel evitável;
- CO2 evitável;
- custo estimado de combustível;
- custo esperado de parada não planejada.

### Constantes

| Constante | Valor | Motivo |
| --- | ---: | --- |
| `DIESEL_CO2_KG_PER_LITER` | `2.68` | Estimativa simplificada de CO2 emitido por litro de diesel queimado. |
| `DIESEL_PRICE_BRL` | `6.05` | Preço médio simulado do diesel para calcular custo. |
| `UNPLANNED_STOP_COST_BRL` | `4200` | Estimativa de custo de uma parada não planejada. |

### CO2 estimado

```js
const co2Kg = fuelLiters * DIESEL_CO2_KG_PER_LITER
```

Exemplo:

```txt
20 litros * 2.68 = 53,6 kg de CO2
```

### CO2 evitável

```js
const avoidableFuelLiters = Math.max(fuelLiters - bestFuelLiters, 0)
const avoidableCo2Kg = avoidableFuelLiters * DIESEL_CO2_KG_PER_LITER
```

O sistema compara cada veículo com o melhor veículo recomendado.

Se um caminhão gastaria `31 L` e o melhor gastaria `25 L`:

```txt
31 - 25 = 6 L evitáveis
6 * 2.68 = 16,08 kg de CO2 evitáveis
```

### Custo esperado de parada

```js
const stopProbability = Math.min(0.08 + riskScore / 135, 0.86)
```

| Parte | Significado |
| --- | --- |
| `0.08` | Risco mínimo operacional de imprevisto. |
| `riskScore / 135` | Converte score de risco em probabilidade aproximada. |
| `0.86` | Teto para não afirmar 100% de parada. |

Depois:

```js
expectedUnplannedCostBrl = stopProbability * UNPLANNED_STOP_COST_BRL
```

Esse valor não é uma previsão estatística real. Ele serve para demonstrar impacto financeiro esperado.

## Escolha do melhor veículo

Arquivo: `src/domain/maintenanceEngine.js`

Função:

```js
findBestVehicle(options)
```

Critério:

```js
return [...options].sort((a, b) => a.riskScore - b.riskScore || a.fuelLiters - b.fuelLiters)[0]
```

A escolha segue duas etapas:

1. Menor risco preventivo.
2. Em caso de empate, menor consumo estimado.

Isso evita recomendar um veículo econômico, mas mecanicamente perigoso.

## Como explicar os pesos

Explicação curta para apresentação:

> Os pesos foram definidos manualmente para o protótipo. Primeiro separamos os critérios que impactam risco, consumo e desgaste. Depois distribuímos uma escala próxima de 100 pontos entre eles. Critérios com maior impacto operacional, como manutenção vencida, terreno e congestionamento, receberam pesos maiores. Os tetos impedem que um único critério domine todo o score.

Explicação ainda mais curta:

> É um modelo heurístico: os critérios mais importantes recebem mais peso, tudo é normalizado e o resultado vira um score de 0 a 100.

## O que evoluir depois

Em uma versão real, os valores deveriam sair de dados ou configuração.

Possíveis evoluções:

- pesos calibrados com histórico real de falhas;
- limites por modelo de caminhão;
- consumo esperado por tipo de rota;
- preço do diesel configurável por região;
- fator de emissão por tipo de combustível;
- custo de parada por cliente, contrato ou SLA;
- bloqueio automático por excesso de carga;
- dados reais de trânsito, elevação e GPS;
- modelo preditivo treinado com ordens de serviço e telemetria.
