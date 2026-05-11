# Frontend Dashboard Implementation Plan

**Goal:** Transformar o dashboard em uma central de comando analítica para acompanhamento de metas e resultados de apuração, utilizando os componentes modernos do Shadcn UI (Dashboard-01).

---

## 🏗️ Arquitetura
- **Component-driven:** Blocos isolados e reutilizáveis no `src/components`.
- **Data Fetching:** TanStack Query para cache e gerenciamento de estado assíncrono (polling).
- **Service Layer:** `src/services/api.service.ts` centraliza chamadas Axios.
- **Visual:** Tailwind CSS v4 + Shadcn UI (Preset Nova) com suporte a OKLCH.

---

## 🗺️ Mapa de Componentes

```
DashboardPage (Página Principal)
│
├── MainLayout (Shell com Sidebar e Header)
│
├── SectionCards (KPIs de topo: Comissões, Metas, Vendedores)
│   └── Baseado em: shadcn/section-cards.tsx
│
├── ChartAreaInteractive (Gráfico de evolução do realizado)
│   └── Baseado em: shadcn/chart-area-interactive.tsx
│
└── DataTable (Relatório detalhado por Vendedor/Meta)
    └── Baseado em: shadcn/data-table.tsx
```

---

## 🛠️ Etapas de Execução

### Etapa 1: Contratos e Serviços (The Pipes)
Definição de tipos e integração com os endpoints de apuração e relatórios do backend.

- [ ] **Definir interfaces em `src/types/api.ts`**
  - Criar `AppraisalResult` (detalhes por vendedor).
  - Criar `DashboardReport` (agregados para os cards).
- [ ] **Implementar Service em `src/services/api.service.ts`**
  - Adicionar `reportService.getDashboard`.
  - Garantir tratamento de erros e injeção de token via interceptores.

### Etapa 2: Layout e Blocos Visuais (The Shell)
Montar a estrutura baseada nas referências do Shadcn.

- [ ] **Configurar `DashboardPage.tsx` com o Grid Principal**
  - Integrar `SectionCards` no topo.
  - Dividir o meio entre `ChartAreaInteractive` e área de status.
  - Adicionar a `DataTable` na base para visualização detalhada.

### Etapa 3: Integração e Polling (The Intelligence)
Lidar com o processamento assíncrono (Worker) do backend.

- [ ] **Implementar Polling Estratégico**
  - Usar `refetchInterval` do TanStack Query para atualizar a tela enquanto uma apuração estiver `PROCESSING`.
- [ ] **Ações de Apuração**
  - Vincular o botão "Executar Apuração" à mutação que dispara o worker.
  - Mostrar feedback visual (toasts/spinners) durante o processo.

### Etapa 4: Refinamento de UI (The Details)
Adaptar os componentes de exemplo para o domínio de metas de vendas.

- [ ] **Ajustar DataTable**
  - Colunas: Vendedor, Campanha, Status (Badge), Realizado (BRL), Valor a Pagar (BRL).
  - Implementar Drawer de detalhes para mostrar a árvore de condições validada.
- [ ] **Ajustar Gráfico de Área**
  - Eixo X: Dias da vigência.
  - Eixo Y: Valor acumulado vs. Meta projetada.
- [ ] **Polimento Visual**
  - Garantir consistência com Tailwind v4 e variáveis de cor do sistema.

---

## 📈 Critérios de Sucesso (Visão do Cliente)
1. O usuário abre o dashboard e vê imediatamente o total de comissões a pagar.
2. Ao disparar uma apuração, a tela se atualiza sozinha quando o cálculo termina.
3. É possível identificar rapidamente quais vendedores bateram a meta e por que (visão detalhada).
