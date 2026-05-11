# Backend - Express

## Setup

```bash
npm install
```

## Database

```bash
# Setup database
npm run migrate

# Seed database
npm run seed
```

## Development

⚠️ **IMPORTANTE**: O backend roda em 2 processos separados:

### 1. Servidor API (porta 3000)
```bash
npm run dev
```

### 2. Worker de Apurações (em outro terminal)
```bash
npm run dev:worker
```

**Você PRECISA rodar ambos para que o sistema funcione corretamente:**
- O servidor API recebe as requisições do frontend
- O worker processa as apurações em background

### Problema Resolvido
Se você estava recebendo muitos chamados repetitivos para `/api/v1/reports/dashboard`, era porque:

1. **Worker não estava rodando** → as apurações ficavam com status PENDING/PROCESSING
2. **Frontend fazia polling infinito** → refetchInterval continuava chamando a API
3. **Headers de cache causavam 304** → cliente recebia "Not Modified"

Agora:
- ✅ Headers de cache foram ajustados (no-cache)
- ✅ Polling tem timeout de 30 segundos
- ✅ Tratamento de erro melhorado
- ✅ Worker processa apurações corretamente

## Production

```bash
npm run compile
npm run start
```

Note: Em produção, você precisa rodar o worker em um processo separado ou usar uma fila (Bull, BullMQ, etc).

