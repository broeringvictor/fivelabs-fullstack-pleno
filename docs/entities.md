# Entidades

> **Stack persistência**: PostgreSQL via Prisma
> **Convenções**: ver §0. Arquitetura: [`./architecture.md`](./architecture.md)
> Toda entidade aqui mora em `src/domain/entities/`. Mappers (`toDomain` / `toPersistence`) em `src/infra/prisma/mappers/`.

---

## 0. Decisões fechadas

| Decisão                       | Valor                                                              |
| ----------------------------- | ------------------------------------------------------------------ |
| Identidade                    | `UUID v7` em todas as entidades                                    |
| Valor monetário               | `Decimal` (nunca `float`)                                          |
| Datas                         | `TIMESTAMPTZ` (timestamp with time zone)                           |
| Domínio finito                | `ENUM` no banco                                                    |
| Valor de condição             | `JSONB` (suporta number, string, array para `IN`)                  |
| Soft delete                   | Em entidades de parametrização (User, Campaign, Goal, ConditionGroup, Condition) |
| Soft delete em dados de fato  | **Não** (Sale, Appraisal, AppraisalResult — históricos imutáveis)  |

---

## 1. BaseEntity & mixin SoftDeletable

```ts
// domain/entities/base.entity.ts
abstract class BaseEntity {
  id: UUID;          // UUID v7
  createdAt: Date;   // TIMESTAMPTZ
  updatedAt: Date;   // TIMESTAMPTZ
}

abstract class SoftDeletableEntity extends BaseEntity {
  deletedAt: Date | null;
}
```

| Entidade        | Estende                |
| --------------- | ---------------------- |
| User            | `SoftDeletableEntity`  |
| Campaign        | `SoftDeletableEntity`  |
| Goal            | `SoftDeletableEntity`  |
| ConditionGroup  | `SoftDeletableEntity`  |
| Condition       | `SoftDeletableEntity`  |
| Salesperson     | `BaseEntity`           |
| Product         | `BaseEntity`           |
| Region          | `BaseEntity`           |
| Sale            | `BaseEntity`           |
| Appraisal       | `BaseEntity`           |
| AppraisalResult | `BaseEntity`           |

> Repositórios das entidades soft-deletable filtram `deletedAt IS NULL` por padrão; método explícito `findIncludingDeleted` quando precisar.

---

## 2. Value Objects

VOs vivem em `src/domain/value-objects/`. São **persistidos como colunas** (não como JSON), exceto `ConditionValue`.

| VO              | Composição                                                                                | Persistência                                          |
| --------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `Money`         | `amount: Decimal(18, 2)` + `currency: string` (default `BRL`)                             | 2 colunas: `amount` `DECIMAL(18,2)`, `currency` `TEXT`|
| `Percentage`    | `value: Decimal(5, 2)` (0–100, com 2 casas)                                               | 1 coluna `DECIMAL(5,2)`                                |
| `Period`        | `start: Date` + `end: Date` — invariante `end >= start`                                   | 2 colunas `TIMESTAMPTZ`                                |
| `Compensation`  | `type: CompensationType` + `value: Decimal(18, 4)` + `currency?: string`                  | 3 colunas (`type`, `value`, `currency`)                |
| `ConditionValue`| `value: unknown` (number, string, array para operadores de coleção)                       | 1 coluna `JSONB`                                       |

> Construtores de VO retornam `Result<T, DomainError>` — invariantes (e.g. `endDate >= startDate`) verificados no `create`.

---

## 3. ENUMs

```sql
Role               ::= ADMIN | MANAGER | VIEWER
CompensationType   ::= FIXED | PERCENTAGE
LogicalOperator    ::= AND | OR
ConditionField     ::= TOTAL_VALUE | REGION | PRODUCT | SALESPERSON
ConditionOperator  ::= EQ | NEQ | GT | GTE | LT | LTE | IN | NOT_IN
AppraisalStatus    ::= PENDING | PROCESSING | DONE | FAILED
```

> Enums são declarados no `schema.prisma` e refletem em tipos `enum` no Postgres. Adicionar valor = migração.

---

## 4. Entidades

### 4.1 User  *(SoftDeletable)*

| Campo          | Tipo               | Notas                       |
| -------------- | ------------------ | --------------------------- |
| `id`           | UUID v7 (PK)       |                             |
| `name`         | TEXT               |                             |
| `email`        | TEXT               | **UNIQUE**                  |
| `passwordHash` | TEXT               | bcrypt; nunca expor em DTO  |
| `role`         | ENUM `Role`        |                             |
| `createdAt`    | TIMESTAMPTZ        |                             |
| `updatedAt`    | TIMESTAMPTZ        |                             |
| `deletedAt`    | TIMESTAMPTZ NULL   |                             |

---

### 4.2 Campaign  *(SoftDeletable)*

| Campo          | Tipo                         | Notas                                |
| -------------- | ---------------------------- | ------------------------------------ |
| `id`           | UUID v7 (PK)                 |                                      |
| `name`         | TEXT                         |                                      |
| `description`  | TEXT                         |                                      |
| `createdById`  | UUID (FK → `User.id`)        | `ON DELETE RESTRICT`                 |
| `createdAt`    | TIMESTAMPTZ                  |                                      |
| `updatedAt`    | TIMESTAMPTZ                  |                                      |
| `deletedAt`    | TIMESTAMPTZ NULL             |                                      |

Relacionamentos: 1 — N `Goal`.

---

### 4.3 Goal  *(SoftDeletable)*

| Campo                | Tipo                              | Notas                                                |
| -------------------- | --------------------------------- | ---------------------------------------------------- |
| `id`                 | UUID v7 (PK)                      |                                                      |
| `campaignId`         | UUID (FK → `Campaign.id`)         | `ON DELETE CASCADE`                                  |
| `name`               | TEXT                              |                                                      |
| `validFrom`          | TIMESTAMPTZ                       | parte do VO `Period`                                 |
| `validTo`            | TIMESTAMPTZ                       | invariante `validTo >= validFrom`                    |
| `compensationType`   | ENUM `CompensationType`           | parte do VO `Compensation`                           |
| `compensationValue`  | DECIMAL(18, 4)                    | parte do VO `Compensation`                           |
| `createdAt`          | TIMESTAMPTZ                       |                                                      |
| `updatedAt`          | TIMESTAMPTZ                       |                                                      |
| `deletedAt`          | TIMESTAMPTZ NULL                  |                                                      |

Relacionamentos: N — 1 `Campaign`; 1 — N `ConditionGroup` (root group via `parentGroupId IS NULL`).

---

### 4.4 ConditionGroup  *(SoftDeletable, recursivo)*

| Campo             | Tipo                                              | Notas                                              |
| ----------------- | ------------------------------------------------- | -------------------------------------------------- |
| `id`              | UUID v7 (PK)                                      |                                                    |
| `goalId`          | UUID (FK → `Goal.id`)                             | `ON DELETE CASCADE`                                |
| `parentGroupId`   | UUID NULL (FK → `ConditionGroup.id`, self-ref)    | `NULL` ⇒ raiz do `ConditionTree` do Goal           |
| `logicalOperator` | ENUM `LogicalOperator`                            | `AND` ou `OR`                                      |
| `createdAt`       | TIMESTAMPTZ                                       |                                                    |
| `updatedAt`       | TIMESTAMPTZ                                       |                                                    |
| `deletedAt`       | TIMESTAMPTZ NULL                                  |                                                    |

> Modela a árvore booleana de condições do Goal. Avaliação no domínio: `ConditionTree.matches(sale)`.

---

### 4.5 Condition  *(SoftDeletable)*

| Campo       | Tipo                          | Notas                                        |
| ----------- | ----------------------------- | -------------------------------------------- |
| `id`        | UUID v7 (PK)                  |                                              |
| `groupId`   | UUID (FK → `ConditionGroup.id`) | `ON DELETE CASCADE`                        |
| `field`     | ENUM `ConditionField`         | `TOTAL_VALUE`, `REGION`, `PRODUCT`, `SALESPERSON` |
| `operator`  | ENUM `ConditionOperator`      | escalar (`EQ`/`GT`/...) ou coleção (`IN`/`NOT_IN`) |
| `value`     | JSONB                         | escalar ou array conforme `operator`         |
| `createdAt` | TIMESTAMPTZ                   |                                              |
| `updatedAt` | TIMESTAMPTZ                   |                                              |
| `deletedAt` | TIMESTAMPTZ NULL              |                                              |

> Validação cruzada `field × operator × value` mora no construtor do VO `Condition` (domínio), não em check constraint.

---

### 4.6 Salesperson

| Campo       | Tipo          | Notas       |
| ----------- | ------------- | ----------- |
| `id`        | UUID v7 (PK)  |             |
| `name`      | TEXT          |             |
| `document`  | TEXT          | **UNIQUE**  |
| `createdAt` | TIMESTAMPTZ   |             |
| `updatedAt` | TIMESTAMPTZ   |             |

---

### 4.7 Product

| Campo       | Tipo          | Notas       |
| ----------- | ------------- | ----------- |
| `id`        | UUID v7 (PK)  |             |
| `name`      | TEXT          |             |
| `sku`       | TEXT          | **UNIQUE**  |
| `createdAt` | TIMESTAMPTZ   |             |
| `updatedAt` | TIMESTAMPTZ   |             |

---

### 4.8 Region

| Campo       | Tipo          |
| ----------- | ------------- |
| `id`        | UUID v7 (PK)  |
| `name`      | TEXT          |
| `createdAt` | TIMESTAMPTZ   |
| `updatedAt` | TIMESTAMPTZ   |

---

### 4.9 Sale

| Campo            | Tipo                              | Notas                              |
| ---------------- | --------------------------------- | ---------------------------------- |
| `id`             | UUID v7 (PK)                      |                                    |
| `salespersonId`  | UUID (FK → `Salesperson.id`)      | `ON DELETE RESTRICT`               |
| `productId`      | UUID (FK → `Product.id`)          | `ON DELETE RESTRICT`               |
| `regionId`       | UUID (FK → `Region.id`)           | `ON DELETE RESTRICT`               |
| `amount`         | DECIMAL(18, 2)                    | parte do VO `Money`                |
| `currency`       | TEXT                              | default `'BRL'` — parte de `Money` |
| `soldAt`         | TIMESTAMPTZ                       | momento da venda (regra de negócio)|
| `createdAt`      | TIMESTAMPTZ                       |                                    |
| `updatedAt`      | TIMESTAMPTZ                       |                                    |

> Sem soft delete: dado de fato. Estorno = nova `Sale` com `amount` negativo (a definir nas regras de negócio).

---

### 4.10 Appraisal

| Campo            | Tipo                                  | Notas                                                                  |
| ---------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| `id`             | UUID v7 (PK)                          |                                                                        |
| `triggeredById`  | UUID NULL (FK → `User.id`)            | `NULL` quando disparado por sistema (cron, etc.)                       |
| `status`         | ENUM `AppraisalStatus`                | `PENDING` → `PROCESSING` → `DONE` ou `FAILED`                          |
| `attempts`       | INT NOT NULL DEFAULT 0                | incrementado pelo `claimNextPending` (ver `architecture.md` §5.2)      |
| `nextAttemptAt`  | TIMESTAMPTZ NOT NULL DEFAULT NOW()    | controle de backoff; worker filtra `nextAttemptAt <= NOW()`            |
| `lastError`      | TEXT NULL                             | mensagem da última falha (para debug)                                  |
| `startedAt`      | TIMESTAMPTZ NULL                      | preenchido ao entrar em `PROCESSING`                                   |
| `finishedAt`     | TIMESTAMPTZ NULL                      | preenchido ao virar `DONE` ou `FAILED`                                 |
| `createdAt`      | TIMESTAMPTZ                           |                                                                        |
| `updatedAt`      | TIMESTAMPTZ                           |                                                                        |

> **`attempts`, `nextAttemptAt`, `lastError`** vêm da §5.2 da arquitetura — esta tabela **é** a fila. Sem broker.
> Sem soft delete: histórico de execuções.

---

### 4.11 AppraisalResult

| Campo            | Tipo                                  | Notas                              |
| ---------------- | ------------------------------------- | ---------------------------------- |
| `id`             | UUID v7 (PK)                          |                                    |
| `appraisalId`    | UUID (FK → `Appraisal.id`)            | `ON DELETE CASCADE`                |
| `goalId`         | UUID (FK → `Goal.id`)                 | `ON DELETE RESTRICT`               |
| `salespersonId`  | UUID (FK → `Salesperson.id`)          | `ON DELETE RESTRICT`               |
| `achievedValue`  | DECIMAL(18, 2)                        | VO `Money` — total apurado         |
| `achievedCurrency` | TEXT                                | parte de `Money`                   |
| `goalMet`        | BOOLEAN                               | atingiu meta?                      |
| `payableAmount`  | DECIMAL(18, 2)                        | VO `Money` — comissão devida       |
| `payableCurrency`| TEXT                                  | parte de `Money`                   |
| `evaluatedAt`    | TIMESTAMPTZ                           | momento de cálculo                 |
| `createdAt`      | TIMESTAMPTZ                           |                                    |
| `updatedAt`      | TIMESTAMPTZ                           |                                    |

---

## 5. Diagrama de relacionamentos (textual)

```
User ──< Campaign (createdById)
Campaign ──< Goal
Goal ──< ConditionGroup (root: parentGroupId IS NULL)
ConditionGroup ──< ConditionGroup (parentGroupId — árvore)
ConditionGroup ──< Condition

Salesperson ──< Sale
Product     ──< Sale
Region      ──< Sale

User       ──< Appraisal (triggeredById, nullable)
Appraisal  ──< AppraisalResult
Goal       ──< AppraisalResult
Salesperson──< AppraisalResult
```

---

## 6. Índices

### B-Tree em FKs (todas as relações)

- `campaign(createdById)`
- `goal(campaignId)`
- `condition_group(goalId)`, `condition_group(parentGroupId)`
- `condition(groupId)`
- `sale(salespersonId)`, `sale(productId)`, `sale(regionId)`
- `appraisal(triggeredById)`
- `appraisal_result(appraisalId)`, `appraisal_result(goalId)`, `appraisal_result(salespersonId)`

### UNIQUE

- `user(email)`
- `salesperson(document)`
- `product(sku)`
- `appraisal_result(appraisalId, goalId, salespersonId)` — **idempotência** do `ProcessAppraisalUseCase` (ver `architecture.md` §5.2)

### Compostos

- `sale(salespersonId, soldAt)` — recorte temporal por vendedor durante apuração
- `appraisal(status, nextAttemptAt)` — usado pelo `claimNextPending`; faz o `FOR UPDATE SKIP LOCKED` saltar PENDING agendados
- Parciais (otimização opcional): `WHERE deletedAt IS NULL` em índices de listagem para soft-deletable

---

## 7. Notas de modelagem

- **VOs como colunas, não JSON**: `Money` é `(amount, currency)` em duas colunas — permite filtrar/ordenar em SQL. JSON só para coisas genuinamente flexíveis (`Condition.value`).
- **ConditionTree**: árvore via `ConditionGroup.parentGroupId`. Carregamento eficiente: 1 query para todos os `ConditionGroup` do `goalId` + 1 para `Condition` correspondentes; mapper monta a árvore em memória.
- **Idempotência do worker**: a `UNIQUE(appraisalId, goalId, salespersonId)` em `AppraisalResult` permite `ON CONFLICT DO UPDATE` — reprocessar é seguro.
- **Sem soft delete em `Sale` / `Appraisal*`**: dados de fato/auditoria. Apagar histórico de apuração corrompe relatórios passados.
- **`Appraisal` é a fila**: as colunas `status`, `attempts`, `nextAttemptAt`, `lastError` são o que o `AppraisalPoller` opera. Não criar tabela `job` separada.
