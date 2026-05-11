# Remunera.ai - Sistema de Gestão de Comissões

Sistema para gestão de campanhas, metas e apuração automática de comissões baseado em vendas.

## 🏗️ Decisões de Arquitetura

O projeto foi construído seguindo os princípios de **Clean Architecture** e **Domain-Driven Design (DDD)**. Esta escolha foi estratégica para garantir não apenas manutenibilidade e escalabilidade, mas principalmente para **facilitar a correção do desafio e a legibilidade do código**, permitindo uma navegação intuitiva entre as camadas de domínio, aplicação e infraestrutura.

### 1. Separação de Responsabilidades (API vs Worker)
*   **API (Backend):** Responsável pelo gerenciamento de entidades (Vendedores, Produtos, Metas) e pelo agendamento de apurações.
*   **Worker:** Processo isolado que consome as tarefas de apuração. Isso evita que cálculos pesados de comissão travem a interface do usuário ou a resposta da API.

### 2. Estratégia de Apuração (Background Processing)
*   **Fila via Banco de Dados:** Utilizamos o PostgreSQL como fila de tarefas. O Worker busca registros com status `PENDING`.
*   **Concorrência Segura:** Implementado via SQL nativo usando `FOR UPDATE SKIP LOCKED`. Isso permite que múltiplos Workers rodem em paralelo sem processar a mesma apuração duas vezes.
*   **Polling Inteligente:** O Worker utiliza um `AppraisalPoller` com `setTimeout` recursivo. Isso garante que uma nova tarefa só seja buscada após a conclusão da anterior, respeitando um intervalo de descanso para o banco de dados.

### 3. Frontend Moderno
*   **Dashboard:** Visualização rápida de métricas e status das apurações.
*   **Condition Builder:** Interface intuitiva para criar regras complexas de elegibilidade (ex: "Valor Total > 1000 E Região = Sul").

---

## 🚀 Como Rodar o Projeto

O projeto está totalmente containerizado com Docker.

### Pré-requisitos
*   Docker e Docker Compose instalados.

### Passo a Passo

1.  **Configuração de Ambiente:**
    O projeto já possui um arquivo `env.example` pronto para uso.

2.  **Subir os Containers:**
    Execute o comando abaixo na raiz do projeto:
    ```bash
    docker compose --env-file env.example up -d
    ```

3.  **O que este comando faz:**
    *   Sobe o banco de dados **PostgreSQL**.
    *   Inicia o **Backend** (API na porta `3000`).
    *   Inicia o **Worker** para processamento de apurações.
    *   Inicia o **Frontend** (Vite na porta `5174`).
    *   Executa as migrações do banco e o **Seed** (dados iniciais de teste).

### Acesso
*   **Frontend:** [http://localhost:5174](http://localhost:5174)
*   **API:** [http://localhost:3000](http://localhost:3000)

---

## 🛠️ Tecnologias Principais
*   **Backend:** Node.js, TypeScript, Express, Prisma ORM.
*   **Frontend:** React, TypeScript, Tailwind CSS, Shadcn UI.
*   **Infra:** Docker, PostgreSQL.
