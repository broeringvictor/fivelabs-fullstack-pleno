# Plano de implementação — Entidades

> Escopo: do `schema.prisma` à entidade TS pronta para uso em use cases.
> Referências: [`./architecture.md`](./architecture.md), [`./entities.md`](./entities.md)
> **Pasta `prisma/` fica na raiz do projeto** (schema + migrations).
> Em `src/infra/`: `database/client.ts`, `mappers/` (modelos do ORM **e** funções de mapeamento), `repositories/`, `service/`.

---

## 0. Layout final esperado

```
.
├── prisma/                            # ← na raiz: schema + migrations
│   ├── schema.prisma                  # único arquivo de schema
│   └── migrations/                    # geradas por `prisma migrate dev`
│       └── <timestamp>_init/
│           └── migration.sql
├── generated/
│   └── prisma/                        # output do generator (já configurado)
├── src/
│   ├── domain/
│   │   ├── entities/                  # uma classe por entidade
│   │   ├── value-objects/             # Money, Period, Percentage, Compensation, ConditionValue
│   │   ├── enums/                     # mirror dos enums Prisma + helpers
│   │   ├── errors/
│   │   │   └── domain.error.ts
│   │   └── shared/
│   │       └── base.entity.ts         # BaseEntity + SoftDeletableEntity
│   ├── application/
│   │   └── shared/
│   │       └── result.ts              # Result<T, E>
│   └── infra/
│       ├── database/
│       │   └── client.ts              # singleton Prisma + adapter-pg
│       ├── mappers/                   # ORM models (re-export do gerado) + toDomain/toPersistence
│       ├── repositories/              # (vazio nesta entrega — vem com os primeiros use cases)
│       └── service/                   # (vazio nesta entrega — auth/clock chegam depois)
└── .env                               # DATABASE_URL
```

---

## 1. Pré-requisitos (Fase 0)

| Tarefa                                                            | Critério de pronto                                       |
| ----------------------------------------------------------------- | -------------------------------------------------------- |
| Postgres ≥ 14 acessível (local Docker ou hospedado)               | `psql $DATABASE_URL -c 'SELECT 1'` retorna `1`           |
| `.env` com `DATABASE_URL=postgresql://...`                        | `dotenv` carrega                                         |
| `.env.example` versionado (sem segredos)                          | commit                                                   |
| `prisma/schema.prisma` com `datasource.url = env("DATABASE_URL")` | `npx prisma validate` passa                              |
| `tsconfig.json` com `strict: true`, `target: ES2022`              | `tsc --noEmit` roda sem erro nos arquivos atuais         |
| Decisão sobre **driver adapter** (`@prisma/adapter-pg` já no `package.json`) — usar ou não | escolha registrada (ver §4)              |

> Nada de instalar libs novas nessa fase — `package.json` atual já cobre Prisma + pg + adapter-pg + tsx + dotenv.

---

## 2. Fase 1 — `schema.prisma` completo

Editar **`prisma/schema.prisma`** (raiz). Ordem topológica para o leitor:

1. **Header** — `generator` (manter `prisma-client` → `../generated/prisma`), `datasource`.
2. **Enums** — `Role`, `CompensationType`, `LogicalOperator`, `ConditionField`, `ConditionOperator`, `AppraisalStatus`.
3. **Modelos** nesta ordem (das folhas para o tronco):
   - `User`
   - `Salesperson`, `Product`, `Region` (independentes)
   - `Campaign` (depende de `User`)
   - `Goal` (depende de `Campaign`)
   - `ConditionGroup` (depende de `Goal`, self-ref)
   - `Condition` (depende de `ConditionGroup`)
   - `Sale` (depende de `Salesperson`, `Product`, `Region`)
   - `Appraisal` (depende de `User`)
   - `AppraisalResult` (depende de `Appraisal`, `Goal`, `Salesperson`)

### Convenções de mapeamento (aplicar em **todos** os modelos)

| TS / domínio        | Prisma                                                       |
| ------------------- | ------------------------------------------------------------ |
| `id: UUID v7`       | `id String @id @default(uuid(7)) @db.Uuid`                   |
| `createdAt`         | `createdAt DateTime @default(now()) @db.Timestamptz()`       |
| `updatedAt`         | `updatedAt DateTime @updatedAt @db.Timestamptz()`            |
| `deletedAt`         | `deletedAt DateTime? @db.Timestamptz()`                      |
| `Money.amount`      | `amount Decimal @db.Decimal(18, 2)`                          |
| `Money.currency`    | `currency String @default("BRL") @db.VarChar(3)`             |
| `Compensation.value`| `compensationValue Decimal @db.Decimal(18, 4)`               |
| `Percentage`        | `Decimal @db.Decimal(5, 2)`                                  |
| `Period`            | 2 colunas `@db.Timestamptz()` (ex.: `validFrom`, `validTo`)  |
| `ConditionValue`    | `value Json @db.JsonB`                                       |
| FK                  | `@db.Uuid` + `@@index([fkId])` se não houver outro índice    |

### Pontos específicos

- **`ConditionGroup` self-ref**: `parent ConditionGroup? @relation("Tree", fields: [parentGroupId], references: [id], onDelete: Restrict, onUpdate: Cascade)` + `children ConditionGroup[] @relation("Tree")`. Usar `onDelete: Restrict` no self-ref — exclusão em cascata recursiva é arriscada; deletar grupo da árvore é responsabilidade do use case.
- **Cascades**:
  - `Goal.campaignId` → `onDelete: Cascade`
  - `ConditionGroup.goalId` → `onDelete: Cascade`
  - `Condition.groupId` → `onDelete: Cascade`
  - `AppraisalResult.appraisalId` → `onDelete: Cascade`
  - Demais FKs (`Sale.*`, `AppraisalResult.goalId/salespersonId`, `Campaign.createdById`, `Appraisal.triggeredById`) → `onDelete: Restrict` (ou `SetNull` quando o campo é `Nullable`).
- **UNIQUE**:
  - `User.email`, `Salesperson.document`, `Product.sku`
  - `@@unique([appraisalId, goalId, salespersonId])` em `AppraisalResult` — **idempotência do worker**
- **Compostos**:
  - `@@index([salespersonId, soldAt])` em `Sale`
  - `@@index([status, nextAttemptAt])` em `Appraisal`
- **Colunas extras de fila** em `Appraisal` (vêm de `architecture.md` §5.2):
  - `attempts Int @default(0)`
  - `nextAttemptAt DateTime @default(now()) @db.Timestamptz()`
  - `lastError String?`

### Critério de pronto

- `npx prisma validate` passa.
- `npx prisma format` deixa idempotente.
- Modelos refletem 1:1 a tabela em [`./entities.md`](./entities.md).

---

## 3. Fase 2 — Migração inicial

```bash
npx prisma migrate dev --name init
```

- Gera `prisma/migrations/<timestamp>_init/migration.sql`.
- **Inspecionar o SQL antes de seguir**:
  - Tipos `TIMESTAMPTZ`, `UUID`, `JSONB`, `DECIMAL` corretos.
  - ENUMs nativos (`CREATE TYPE ... AS ENUM (...)`).
  - Índices e UNIQUEs presentes.
  - Cascade rules conforme §2.
- Commit do diretório de migration junto com o schema.

> **Não** usar `db push` — perde histórico, e migrations são parte do contrato.

### Critério de pronto

- Schema aplicado em DB local (`prisma migrate dev` finalizou sem erro).
- `\dt` no `psql` lista todas as 11 tabelas.
- `\dT+` lista os 6 enums.
- Migration committada.

---

## 4. Fase 3 — Cliente Prisma (infra)

Criar `src/infra/database/client.ts`:

- Importar `PrismaClient` de `../../../generated/prisma` (output configurado).
- Usar `@prisma/adapter-pg` (já instalado): `new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }) })`.
- Exportar instância única (singleton); guardar referência em `globalThis` em dev para evitar leaks com `tsx --watch`.
- Função `disconnect()` exportada para uso no shutdown da API e do worker.

### Critério de pronto

- `import { prisma } from '@/infra/database/client'; await prisma.$queryRaw\`SELECT 1\`` funciona via script tsx.

---

## 5. Fase 4 — Domínio (TS, sem dependência de infra)

Trabalhar nessa ordem para não ficar bloqueado:

### 5.1 Fundações (sem dependência entre si)

- `src/application/shared/result.ts` — `Result<T, E>` + helpers `ok()`, `err()`, type guards `isOk`/`isErr`.
- `src/domain/errors/domain.error.ts` — classe-base `DomainError` + subtipos comuns (`InvariantViolation`, `NotFound`, `Conflict`).
- `src/domain/shared/base.entity.ts` — `BaseEntity` (`id`, `createdAt`, `updatedAt`) + `SoftDeletableEntity` (estende com `deletedAt`).

### 5.2 Enums (mirror)

- `src/domain/enums/` — um arquivo por enum, exportando `as const` + tipo unionado. Não importar do `generated/prisma` no domínio (manter domain isolado). Em mappers, faz-se a tradução.

### 5.3 Value Objects (independentes)

Cada VO em `src/domain/value-objects/<name>.ts`:

| VO              | Invariantes a validar no `create()`                                                  |
| --------------- | ------------------------------------------------------------------------------------ |
| `Money`         | `amount >= 0` (ou permitir negativo se houver caso de estorno — decidir e documentar); `currency` em formato ISO-4217 (3 letras). |
| `Percentage`    | `0 <= value <= 100`                                                                  |
| `Period`        | `end >= start`                                                                       |
| `Compensation`  | `value >= 0`; quando `type = PERCENTAGE`, `value <= 100`; `currency` obrigatório quando `FIXED`. |
| `ConditionValue`| Tipo do `value` casa com `operator` (e.g. `IN` exige array; `GT` exige number). Validação cruzada vive aqui. |

Construtores **privados**; `static create(...)` retorna `Result<VO, DomainError>`.

### 5.4 Entidades

Para cada entidade em `src/domain/entities/<name>.ts`:

- Estende `BaseEntity` ou `SoftDeletableEntity` conforme `entities.md` §1.
- Construtor privado; `static create(props)` retorna `Result<Entity, DomainError>`.
- `static reconstruct(props)` (para uso por mappers) — sem validar invariantes (DB já validou; reconstruir não é criar).
- Métodos de domínio que pertencem à entidade (e.g. `Goal.calculateCompensation(achieved: Money): Money`, `ConditionTree.matches(sale): boolean`) — só esqueleto agora; lógica completa vem na Fase 5 do roadmap macro.

Ordem de implementação (folhas → tronco):

1. `User`
2. `Salesperson`, `Product`, `Region`
3. `Campaign`
4. `Goal`
5. `ConditionGroup` + `Condition` + `ConditionTree` (agregado)
6. `Sale`
7. `Appraisal`
8. `AppraisalResult`

### Critério de pronto

- `tsc --noEmit` limpo.
- Cada entidade e VO tem teste unitário mínimo cobrindo:
  - Caso feliz (`create` retorna `Ok`).
  - Pelo menos uma invariante (`create` retorna `Err`).

---

## 6. Fase 5 — Mappers (infra)

`src/infra/mappers/<name>.mapper.ts` por entidade. Funções puras (não classes); a "model" do ORM é o tipo gerado pelo Prisma — pode ser re-exportada do próprio mapper para manter um único ponto de entrada por agregado:

```ts
// src/infra/mappers/user.mapper.ts
import type { User as UserModel, Prisma } from '../../../generated/prisma';
import { User } from '../../domain/entities/user';

export type { UserModel };  // model do ORM disponível para repositórios

export const userMapper = {
  toDomain(row: UserModel): User { /* usa User.reconstruct */ },
  toPersistence(entity: User): Prisma.UserCreateInput { /* shape do Prisma */ },
};
```

Pontos de atenção:

- **`Money` em 2 colunas** — mapper junta/desmonta `(amount, currency)` em VO.
- **`Compensation` em 3 colunas** (`compensationType`, `compensationValue`, `currency` opcional).
- **`Period` em 2 colunas** (`validFrom`, `validTo`).
- **`ConditionTree`** — `ConditionGroup` + `Condition` carregados separadamente; mapper monta a árvore via `parentGroupId` em memória. Manter função `buildTree(groups, conditions): ConditionTree` testada.
- **Decimal** — Prisma retorna `Decimal` (lib runtime). Domínio pode usar `Decimal` diretamente ou converter para `string` no VO `Money` — decidir e padronizar antes de implementar.

### Critério de pronto

- Roundtrip `toPersistence → save no DB → findById → toDomain` retorna entidade equivalente. Teste de integração com banco real (containerized) cobrindo ao menos `Campaign + Goal + ConditionTree + Sale`.

---

## 7. Fase 6 — Smoke verification

Script único `scripts/smoke-entities.ts` (rodar com `tsx`):

1. Cria `User` (admin).
2. Cria `Campaign` com 1 `Goal` cuja `ConditionTree` é `(TOTAL_VALUE > 1000) AND (REGION IN ['SP','RJ'])`.
3. Cria `Salesperson`, `Product`, `Region`.
4. Cria 3 `Sale` (1 que casa, 2 que não casam).
5. Cria `Appraisal` com `status=PENDING`.
6. Lê tudo de volta; imprime árvore montada e payload.

Se rodar limpo: entidades/mappers/migration estão consistentes.

---

## 8. Ordem de execução resumida

```
Fase 0 ─► Fase 1 (schema) ─► Fase 2 (migrate) ─┐
                                                ├─► Fase 6 (smoke)
Fase 3 (client) ─────────────────┐              │
Fase 4 (domain — em paralelo) ───┼──► Fase 5 ───┘
                                 │  (mappers)
```

- Fase 4 (domínio) é **paralelizável** com Fase 1–2 (schema/migration). O domínio não depende do Prisma.
- Mappers (Fase 5) são o ponto de junção — só começa quando schema **e** entidades estão prontos.

---

## 9. Definition of Done desta entrega

- [ ] `prisma/schema.prisma` completo, validado, formatado.
- [ ] Migration `init` aplicada e committada.
- [ ] `src/domain/entities/`, `value-objects/`, `enums/`, `shared/`, `errors/` populados.
- [ ] `src/application/shared/result.ts` pronto.
- [ ] `src/infra/database/client.ts` + mappers em `src/infra/mappers/` para todas as 11 entidades.
- [ ] Testes unitários mínimos de domínio passando.
- [ ] Smoke script roda fim-a-fim sem erro.
- [ ] `tsc --noEmit` e ESLint limpos.

---

## 10. O que **não** está nesse plano (fica para fases seguintes)

- Repositórios (`IXRepository` em `application/ports/repositories/` + impl em `src/infra/repositories/`) — vêm com o primeiro use case que precisar.
- Adapters de serviço (`src/infra/service/auth/`, `src/infra/service/clock/`) — entram junto com os use cases que os consomem (`auth/*`, `appraisal/*`).
- `claimNextPending` (raw SQL `FOR UPDATE SKIP LOCKED`) — vem na Fase 6 do roadmap macro (worker).
- Poller (`src/infra/poller/appraisal.poller.ts`) e bootstrap do `worker.ts`.
- Use cases, controllers, rotas, container DI.
- Seeds de dados realistas.
- Auth (bcrypt/JWT).
