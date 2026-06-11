# Nexus Predict

Protótipo desenvolvido para hackathon com foco em manutenção preventiva automatizada e apoio à decisão em operações logísticas.

O projeto simula uma central inteligente de monitoramento de frota, capaz de analisar dados operacionais dos veículos, calcular riscos de manutenção, identificar anomalias e recomendar o caminhão mais adequado para uma rota.

## Problema

Empresas de logística frequentemente lidam com atrasos, consumo elevado de combustível, falhas inesperadas e manutenções não planejadas.

Mesmo quando os dados da frota existem, muitas vezes eles ficam espalhados entre planilhas, sistemas de rastreamento, controles de manutenção e relatórios manuais. Isso dificulta a tomada de decisão rápida por parte do gestor logístico.

## Solução

O Nexus Predict centraliza dados simulados da frota e utiliza regras automatizadas para calcular o risco operacional de cada veículo.

A solução considera fatores como:

* Quilometragem atual
* Tempo desde a última manutenção
* Consumo médio de combustível
* Histórico de falhas
* Tipo de carga
* Distância da rota
* Condições operacionais da entrega

Com base nesses dados, o sistema gera uma classificação de risco e recomenda ações preventivas para reduzir falhas, atrasos e custos operacionais.

## Funcionalidades do Protótipo

* Dashboard com visão geral da frota
* Cálculo automático de score de risco dos veículos
* Classificação por nível de risco: baixo, médio, alto ou crítico
* Simulador de rota para avaliar o melhor caminhão para uma entrega
* Detecção simples de anomalias de consumo
* Recomendações preventivas para manutenção
* Resumo operacional gerado com apoio de IA
* Estimativa de impacto financeiro e operacional

## Como Funciona

O sistema utiliza uma base simulada de veículos e rotas.

Cada caminhão recebe um score de risco com base em suas condições operacionais. Em seguida, o sistema cruza esse risco com as características da rota para indicar se o veículo é adequado ou não para a entrega.

A IA é utilizada como uma camada de explicação, transformando os dados técnicos em uma recomendação clara para o gestor.

Exemplo de recomendação:

> O veículo NX-330 apresenta risco crítico devido à manutenção vencida, alta quilometragem e consumo abaixo do esperado. Recomenda-se removê-lo de rotas longas e agendar uma inspeção preventiva antes da próxima operação.

## Objetivo

O objetivo do protótipo é demonstrar como automação e IA podem apoiar decisões logísticas antes que problemas aconteçam.

Em vez de apenas reagir a falhas, o sistema ajuda o gestor a agir preventivamente, escolhendo veículos mais adequados, evitando paradas inesperadas e reduzindo custos operacionais.

## Tecnologias Utilizadas

* JavaScript
* Dados mockados em JSON
* API de IA para geração de recomendações
* Tailwind CSS

## Estrutura Esperada

```txt
src/
  data/
    vehicles.ts
    routes.ts

  utils/
    riskEngine.ts
    routeStressEngine.ts
    recommendationEngine.ts

  components/
    DashboardCards.tsx
    FleetTable.tsx
    AlertPanel.tsx
    RouteSimulator.tsx
    AiSummary.tsx
```

## Próximos Passos

* Integrar dados reais de GPS e telemetria
* Utilizar histórico real de manutenção
* Conectar com APIs de mapas e trânsito
* Criar alertas automáticos por e-mail, Slack ou WhatsApp
* Implementar banco de dados para persistência das análises
* Evoluir o modelo de risco com dados históricos reais
* Gerar relatórios automáticos de performance da frota

## Licença

Este projeto está licenciado sob a licença MIT.
