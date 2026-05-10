# Arquitetura

> **Stack**: Node.js · TypeScript · Express · Prisma · PostgreSQL
> **Estilo**: Clean Architecture + DDD com **vertical slices** por feature
> **Processos**: 2 entrypoints — `main.ts` (API HTTP) e `worker.ts` (poller de jobs no Postgres)
> **Async**: banco como fila via `FOR UPDATE SKIP LOCKED` — sem Redis/BullMQ enquanto não justificar

---

## 1. Princípios

1. **Dependências apontam para dentro** — domínio não conhece infra; infra implementa contratos da application.
2. **Vertical slices por feature** — cada use case é uma pasta autocontida (request + response + use case). A rota chama o use case diretamente — sem classe controller intermediária.
3. **Ports na application, adapters na infra** — quem define o contrato é dono dele.
4. **Domain rico, services magros** — lógica mora nas entidades; domain services só quando a regra cruza várias.
5. **Convenção > configuração** — todo slice tem o mesmo formato. Copia, renomeia, adapta.
6. **Erros de negócio são valores, não exceções** — `Result<T, E>` para falhas previstas; exceções apenas para o inesperado.
7. **Async via banco** — jobs são linhas com `status`. Worker usa `FOR UPDATE SKIP LOCKED` para reivindicar trabalho. Atomicidade é uma transação Prisma. Sem broker enquanto não doer.

---

## 2. Estrutura de pastas

> **`prisma/` mora na raiz do projeto** (alongside `src/`), não dentro de `src/infra/`. Schema e migrations são artefatos de build/release — ficam fora do código aplicacional.

```
.
├── prisma/                       # ← raiz: contrato com o banco
│   ├── schema.prisma
│   └── migrations/
│
├── generated/
│   └── prisma/                   # output do generator (configurado em schema.prisma)
│
└── src/
    ├── domain/                       # núcleo: zero dependências externas
    │   ├── entities/                 # Campaign, Goal, Sale, Appraisal, ConditionTree, ...
    │   ├── value-objects/            # Money, Period, Percentage, Compensation
    │   ├── enums/                    # Role, CompensationType, AppraisalStatus, ...
    │   ├── services/                 # apenas lógica que cruza múltiplas entidades
    │   └── errors/                   # DomainError + subtipos
    │
    ├── application/                  # use cases + contratos
    │   ├── use-cases/                # ← VERTICAL SLICES
    │   │   ├── campaign/
    │   │   │   ├── create-campaign/
    │   │   │   │   ├── create-campaign.request.ts      # Yup schema + tipo InferType
    │   │   │   │   ├── create-campaign.response.ts     # DTO de saída
    │   │   │   │   ├── create-campaign.use-case.ts
    │   │   │   │   └── create-campaign.use-case.spec.ts
    │   │   │   ├── update-campaign/
    │   │   │   └── list-campaigns/
    │   │   ├── goal/
    │   │   ├── sale/
    │   │   ├── appraisal/
    │   │   │   ├── trigger-appraisal/
    │   │   │   ├── process-appraisal/                  # SEM rota HTTP (worker)
    │   │   │   └── get-appraisal-status/
    │   │   └── auth/
    │   ├── ports/                    # ← interfaces que use cases consomem
    │   │   ├── repositories/
    │   │   ├── crypto/
    │   │   └── clock/
    │   └── shared/
    │       └── result.ts             # Result<T, E> + helpers ok()/err()
    │
    ├── infra/                        # adapters concretos — implementa application/ports
    │   ├── client.ts             # Prisma client singleton (driver adapter pg)
    │   ├── repositories/             # PrismaXRepository implements IXRepository
    │   ├── mappers/                  # ORM models (re-export do gerado) + toDomain/toPersistence
    │   ├── service/                  # adapters de portas de "serviço" (não-repositório)
    │   │   ├── auth/
    │   │   │   ├── bcrypt-hasher.ts
    │   │   │   └── jwt-token-issuer.ts
    │   │   └── clock/
    │   │       └── system.clock.ts
    │   └── poller/
    │       └── appraisal.poller.ts   # loop SKIP LOCKED → ProcessAppraisalUseCase
    │
    ├── api/                          # entrypoint HTTP + composition root
    │   ├── server.ts                 # cria app Express
    │   ├── container.ts              # DI manual (composition root)
    │   ├── env.ts                    # validação de env com Yup, falha rápido
    │   ├── routes/
    │   │   ├── index.ts
    │   │   ├── campaign.routes.ts
    │   │   ├── goal.routes.ts
    │   │   ├── sale.routes.ts
    │   │   ├── appraisal.routes.ts
    │   │   └── auth.routes.ts
    │   └── middlewares/
    │       ├── auth.middleware.ts
    │       ├── validate.middleware.ts        # genérico: recebe schema Yup
    │       ├── error-handler.middleware.ts   # DomainError → HTTP
    │       └── request-logger.middleware.ts
    │
    ├── shared/                       # utilitários puros, zero acoplamento
    │   ├── logger/
    │   ├── errors/
    │   └── utils/
    │
    ├── main.ts                       # bootstrap API
    └── worker.ts                     # bootstrap worker
```

---

## 3. Regras de dependência

| Camada        | Pode importar de                                         |
| ------------- | -------------------------------------------------------- |
| `domain`      | nada                                                     |
| `application` | `domain`                                                 |
| `infra`       | `application`, `domain`                                  |
| `api`         | `application`, `infra`, `domain`, `shared`               |
| `shared`      | nada                                                     |
| `main.ts`     | `api`                                                    |
| `worker.ts`   | `api/container.ts`, `infra/poller`, `infra/database`     |

> Use **eslint-plugin-boundaries** ou **dependency-cruiser** para travar isso no CI desde o dia 1.

---

## 4. Anatomia de um slice

Pasta `application/use-cases/campaign/create-campaign/`:

```ts
// create-campaign.request.ts
import * as yup from 'yup';

export const createCampaignSchema = yup.object({
  name: yup.string().required().max(120),
  startsAt: yup.date().required(),
  endsAt: yup.date().required().min(yup.ref('startsAt')),
  goals: yup.array().of(goalSchema).min(1).required(),
});

export type CreateCampaignRequest = yup.InferType<typeof createCampaignSchema>;
```

```ts
// create-campaign.response.ts
export type CreateCampaignResponse = {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  goalsCount: number;
};
```

```ts
// create-campaign.use-case.ts
export class CreateCampaignUseCase {
  constructor(
    private readonly campaigns: ICampaignRepository,
    private readonly clock: IClock,
  ) {}

  async execute(req: CreateCampaignRequest): Promise<Result<CreateCampaignResponse, DomainError>> {
    const period = Period.create(req.startsAt, req.endsAt);
    if (period.isErr()) return err(period.error);

    const campaign = Campaign.create({ name: req.name, period: period.value, goals: req.goals });
    await this.campaigns.save(campaign);

    return ok({
      id: campaign.id,
      name: campaign.name,
      startsAt: campaign.period.start.toISOString(),
      endsAt: campaign.period.end.toISOString(),
      goalsCount: campaign.goals.length,
    });
  }
}
```

```ts
// na rota (api/routes/v1/campaign.routes.ts)
router.post('/', validate(createCampaignSchema), async (req, res, next) => {
  const result = await container.createCampaignUseCase.execute(req.body);
  if (!result.ok) { next(result.error); return; }
  res.status(201).json(result.value);
});
```

> **Toda feature nova é uma pasta nova com 3 arquivos.** A rota chama o use case diretamente — sem classe controller intermediária. Controller seria só um wrapper fino que vaza Express para dentro de `application/`.

---

## 5. Fluxos críticos

### 5.1 CRUD síncrono

```
POST /campaigns
  └─► validate(schema) ─► CreateCampaignController
        └─► CreateCampaignUseCase
              └─► ICampaignRepository  (prisma.$transaction abrange Campaign → Goal → Conditions)
                    └─► PostgreSQL
```

### 5.2 Apuração assíncrona — banco como fila

**Sem broker externo.** A própria tabela `Appraisal` carrega o estado do job via `status`. Workers competem por linhas usando `FOR UPDATE SKIP LOCKED` — Postgres garante que cada job é entregue a um único worker, mesmo com N processos rodando.

```
HTTP POST /appraisals
  └─► TriggerAppraisalUseCase
        └─► appraisalRepo.create({ status: PENDING })   # 1 transação. Pronto.
        └─► HTTP 202 { appraisalId }

────────────────────────  Worker (worker.ts → AppraisalPoller)  ─────────────────────────

  loop forever:
    claimed = appraisalRepo.claimNextPending()   # SELECT ... FOR UPDATE SKIP LOCKED
                                                 # UPDATE status = 'PROCESSING'
                                                 # tudo na mesma tx
    if !claimed:
      sleep(2s); continue

    try:
      await processAppraisalUseCase.execute(claimed.id)
    catch err:
      await appraisalRepo.markFailed(claimed.id, err)

  ProcessAppraisalUseCase.execute(appraisalId):
    appraisal = repo.findById(appraisalId)
    if appraisal.status === DONE → return         # idempotência defensiva
    for each goal × salesperson:
      sales    = saleRepo.findByPeriod(goal.period, salesperson, cursor=true)
      filtered = sales.filter(s => goal.conditionTree.matches(s))
      achieved = filtered.reduce(sum)
      compensation = goal.calculateCompensation(achieved)
      results.push({ appraisalId, goalId, salespersonId, achieved, compensation })
    prisma.$transaction([
      appraisalResult.upsertMany(results, conflictOn: [appraisalId, goalId, salespersonId]),
      appraisal.update({ status: DONE })
    ])
```

**SQL do `claimNextPending`** (núcleo do mecanismo):

```sql
UPDATE appraisal
SET status = 'PROCESSING', started_at = NOW(), attempts = attempts + 1
WHERE id = (
  SELECT id FROM appraisal
  WHERE status = 'PENDING'
  ORDER BY created_at
  FOR UPDATE SKIP LOCKED
  LIMIT 1
)
RETURNING *;
```

**Garantias**:

- **Atomicidade Pg**: criar `Appraisal` é 1 transação. Sem dois sistemas para sincronizar.
- **Concorrência**: `SKIP LOCKED` faz N workers pegarem linhas diferentes sem serializar. Sem deadlock.
- **Idempotência**: `UNIQUE(appraisal_id, goal_id, salesperson_id)` em `appraisal_result` + `ON CONFLICT DO UPDATE`. Crash no meio do processamento é seguro: ao retomar, sobrescreve.
- **Retry**: linha tem `attempts` e `next_attempt_at`. `WHERE status='PENDING' AND next_attempt_at <= NOW()` cobre backoff. Política fica em código, não no broker.
- **Recovery de worker morto**: linhas presas em `PROCESSING` por mais que `T` minutos voltam para `PENDING` por uma cleanup query agendada (cron interno).

---

## 6. Padrões transversais

| Concern             | Onde                                                                        |
| ------------------- | --------------------------------------------------------------------------- |
| Validação de input  | Yup schema no `*.request.ts` do slice                                       |
| Validação de domínio| Construtores das entidades/VOs retornam `Result<T, DomainError>`            |
| Auth                | Middleware Express + `ITokenIssuer` (port)                                  |
| Erros               | `DomainError` propagado via `Result`; rota passa para `next(err)`           |
| Logs                | `ILogger` injetado pelo container                                           |
| Config              | `api/env.ts` valida com Yup no boot — *fail fast*                           |
| Transações          | `prisma.$transaction([...])` no repositório ou no use case                  |
| Tempo               | `IClock` (port) — torna testes determinísticos                              |
| DI                  | `api/container.ts` manual; mesmo container usado por API e Worker           |
| Idempotência        | Constraint única no banco + `ON CONFLICT`                                   |
| Async / fila        | Tabela com `status` + `FOR UPDATE SKIP LOCKED`. Sem broker.                 |
| Backoff / retry     | Colunas `attempts` + `next_attempt_at` na própria tabela do job             |
| Worker travado      | Cron interno: `PROCESSING` há > N min volta para `PENDING`                  |

---

## 7. Estratégia para **escalabilidade** e **velocidade de implementação**

Os dois objetivos puxam em direções opostas. A estratégia abaixo é como conciliar.

### 7.1 Velocidade hoje

| Alavanca                       | O que fazer                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------- |
| **Slice template**             | Criar gerador (`plop` ou script) `npm run make:use-case <feature> <action>` que cria os 4 arquivos do slice já com imports e classe vazia. Velocidade marginal por feature cai pela metade. |
| **Convenção rígida**           | Todo slice = 4 arquivos. Nome de classe = nome do arquivo PascalCase. ESLint rule custom para isso. |
| **DI manual, um arquivo só**   | `container.ts` é um arquivo grande e chato — mas é **explícito**. Você lê de cima para baixo e vê o grafo inteiro. Sem decoradores, sem reflexão, sem mágica. |
| **Repositórios magros**        | Métodos só pelo que o use case precisa (`findActiveByCompany`, `saveWithGoals`). Sem CRUD genérico. Quando aparece duplicação, refatora. |
| **Mappers como funções puras** | `campaignMapper.toDomain(row)` / `toPersistence(entity)`. Testáveis sem mock, copiáveis entre repositórios. |
| **Tests onde dói**             | Domínio: 100% (puro, rápido). Use cases: com repos fakes em memória, cobre fluxos. Integração: só nas bordas críticas (outbox, worker, auth). Rotas não têm classe própria — não há o que testar isolado. |
| **Não construa o que não precisa hoje** | Sem CQRS, sem event sourcing, sem microserviços. Vertical slice + outbox + idempotência já te dá fôlego para 6+ meses. |

### 7.2 Escala depois — pontos de extensão deixados prontos

A arquitetura permite trocar peças sem reescrever:

| Pressão futura                                | Como atacar sem reescrever                                                                                            |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| API gargalando                                | Mais réplicas atrás de LB. Stateless. Já está pronto.                                                                 |
| Apuração lenta                                | Subir N `worker.ts` em paralelo. `SKIP LOCKED` distribui jobs sem coordenar. Idempotência garante segurança.          |
| Banco gargalando em leitura                   | Adicionar read replica → `IRepository` ganha métodos de leitura num adapter separado. Use cases não mudam.            |
| Volume de `Sale` enorme                       | `findByPeriod` retorna `AsyncIterable` (cursor). Nada precisa carregar tudo em memória. Já assumido no design.        |
| Trocar Postgres por outro banco               | Reescreve `infra/prisma/`. Application e domain intactos.                                                             |
| Migrar para BullMQ/SQS quando justificar      | Cria `IJobQueue` em `application/ports/`, adapter em `infra/queue/`. Use cases não mudam. (Ver §11.)                  |
| Quebrar em microserviços                      | Cada bounded context (`campaign`, `appraisal`, `auth`) já é uma fatia natural. Move a pasta + ports + infra junto.    |
| Multi-tenancy                                 | Adicionar `companyId` nos VOs do domínio + filtro nos repositórios. Concentra mudança em `infra/prisma/repositories`. |
| Auditoria / event sourcing                    | Outbox já existe. Vira event log. Subscribers consomem.                                                               |

### 7.3 O que NÃO fazer agora (YAGNI explícito)

- Framework de DI (tsyringe, inversify, awilix) — ganho marginal, custo de mágica alto.
- CQRS (separar read models) — adiar até performance dolorida.
- Event sourcing — adiar até auditoria virar requisito.
- DTOs compartilhados entre slices — duplicação aqui é **feature**, não bug. Slices independentes são fáceis de mover/deletar.
- Base classes abstratas (`AbstractUseCase`, `BaseEntity` com 200 linhas) — composição > herança.
- Microserviços — começa monolito modular. Quebra quando uma fatia justificar.

---

## 8. Roadmap de implementação sugerido

Construir em **fatias verticais ponta-a-ponta**. Cada fatia é demonstrável.

| Fase | Entrega                                                          | Por quê primeiro                                                       |
| ---- | ---------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 0    | Setup: `tsconfig`, ESLint boundaries, Prisma, container vazio, env, error handler, `Result`, `IClock` | Fundação. Tudo abaixo depende.                              |
| 1    | Auth (sign-up + sign-in + middleware)                            | Toda rota subsequente precisa.                                         |
| 2    | CRUD de `Campaign` + `Goal` + `ConditionTree` (vertical slice completo, com migrações Prisma) | Valida o template do slice. Padrão estabelecido. |
| 3    | CRUD de `Salesperson`, `Product`, `Region`                       | Dados de apoio para registrar venda.                                   |
| 4    | `RegisterSale` use case                                          | Alimenta o motor de apuração.                                          |
| 5    | Domain: `ConditionTree.matches()`, `Goal.calculateCompensation()`, com testes unitários exaustivos | Core de negócio. Sem ele, nada funciona. |
| 6    | `TriggerAppraisalUseCase` + `ProcessAppraisalUseCase` + `AppraisalPoller` (worker.ts) + cleanup cron | Mecânica assíncrona inteira. Sem Redis. |
| 7    | `GetAppraisalStatus` + endpoints de leitura dos resultados        | Fecha o loop para o cliente da API.                                    |
| 8    | Hardening: rate limit, observabilidade, error tracking, seeds    | Pré-produção.                                                          |

> **Regra**: cada fase termina com testes verdes, lint verde, e um exemplo `curl` documentado no README do escopo.

---

## 9. Sinais de que a arquitetura está saudável

- Nova feature = nova pasta de slice. Sem editar 8 arquivos espalhados.
- Trocar Prisma por outro ORM = mexer em uma pasta.
- Rodar testes de domínio em ms, sem subir Postgres/Redis.
- `container.ts` lido de cima a baixo conta a história inteira do app.
- PR de feature toca: 1 slice + 1 mapper + 1 migration. Nada mais.

## 10. Sinais de alerta

- `domain/` importando algo de `infra/` ou `application/` → quebrou a regra. CI deve falhar.
- Domain service com mais de 3 métodos → provavelmente é uma entidade disfarçada.
- Use case com mais de ~80 linhas → orquestração demais; quebrar em domain service ou novo use case.
- Repositório com método genérico (`find`, `query`, `where`) → puxando lógica de negócio para infra.
- 2 use cases compartilhando DTO → repete a struct nos 2 slices; quando 3+ compartilharem, considera promover para `application/shared`.

---

## 11. Quando migrar de banco-como-fila para broker dedicado

Banco como fila é a escolha **certa para começar**. Em algum momento pode deixar de ser. Critérios objetivos para migrar:

| Sinal                                                              | Por quê dói                                                       |
| ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `pg_stat_activity` mostra `LWLock` competindo no `claim`            | Polling está estressando o Postgres                                |
| Throughput sustentado > 100 jobs/seg                                | DB-as-queue confortável até dezenas/seg                            |
| Necessidade de fan-out (1 evento → múltiplos consumidores)          | Tabela única não modela bem múltiplos consumidores                 |
| Necessidade de delay/agendamento de minuto-a-minuto preciso          | Polling com `next_attempt_at` tem granularidade limitada           |
| Time pedindo dashboard pronto (Bull Board) em vez de SQL ad-hoc     | Custo operacional, não técnico — vale ponderar                     |

**Caminho de migração** (zero reescrita de use case):

1. Criar `IJobQueue` em `application/ports/queue/`.
2. Implementar `PostgresJobQueue` (envelopa o que já existe) **e** `BullMqJobQueue` lado a lado em `infra/queue/`.
3. Trocar a injeção no `container.ts`. Use case nem fica sabendo.

> Esse caminho só fica barato porque os contratos foram desenhados certo desde o começo. É **por isso** que vale ter `application/ports/` mesmo sem multi-implementação hoje.
