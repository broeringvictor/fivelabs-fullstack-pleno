export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Express API",
    version: "1.0.0",
    description: "API de gestão de comissões de vendas e apuração de metas.",
    contact: {
      name: "Suporte Técnico",
      email: "suporte@empresa.com",
    },
  },
  servers: [
    {
      url: "/api",
      description: "Servidor Principal (Gateway)",
    },
  ],
  tags: [
    {
      name: "Auth",
      description: "Operações relacionadas a autenticação, controle de acesso e registro de novos usuários.",
    },
    {
      name: "Campaigns",
      description: "Gerenciamento de campanhas de comissão.",
    },
    {
      name: "Goals",
      description: "Metas vinculadas a campanhas, com condições e regras de compensação.",
    },
    {
      name: "Appraisals",
      description: "Apuração de comissões: disparo e consulta de resultados.",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      UserInfo: {
        type: "object",
        description: "Informações consolidadas do perfil do usuário",
        required: ["id", "name", "email", "role"],
        properties: {
          id: { 
            type: "string", 
            format: "uuid", 
            example: "01965366-a7bf-8c8d-b791-b2fef0ddf742",
            description: "Identificador único (UUID v7)"
          },
          name: { 
            type: "string", 
            example: "Alice Silva",
            description: "Nome completo cadastrado"
          },
          email: { 
            type: "string", 
            format: "email", 
            example: "alice@example.com",
            description: "E-mail institucional único"
          },
          role: { 
            type: "string", 
            enum: ["ADMIN", "MANAGER", "VIEWER"], 
            example: "VIEWER",
            description: "Nível de permissão no sistema"
          },
        },
      },
      AuthResponse: {
        type: "object",
        description: "Payload retornado após autenticação bem-sucedida",
        required: ["token", "user"],
        properties: {
          token: { 
            type: "string", 
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            description: "Token JWT (Bearer) com validade de 7 dias"
          },
          user: { $ref: "#/components/schemas/UserInfo" },
        },
      },
      ErrorResponse: {
        type: "object",
        description: "Estrutura padrão de erro de negócio",
        required: ["error", "code"],
        properties: {
          error: { 
            type: "string", 
            example: "Email already in use: alice@example.com",
            description: "Mensagem amigável descrevendo o erro"
          },
          code: { 
            type: "string", 
            example: "CONFLICT",
            description: "Código identificador do erro (ex: NOT_FOUND, CONFLICT)"
          },
        },
      },
      ValidationErrorResponse: {
        type: "object",
        description: "Detalhes de falhas na validação de campos (Yup)",
        required: ["errors"],
        properties: {
          errors: {
            type: "array",
            items: { type: "string" },
            example: ["email must be a valid email", "password is a required field"],
            description: "Lista de inconsistências encontradas no payload"
          },
        },
      },
      Campaign: {
        type: "object",
        required: ["id", "name", "description", "createdById", "createdAt"],
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Q1 2024 Sales" },
          description: { type: "string", example: "Campanha do primeiro trimestre" },
          createdById: { type: "string", format: "uuid" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      CampaignPatch: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          description: { type: "string" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ConditionGroupSchema: {
        type: "object",
        description: "Grupo de condições que pode ser aninhado recursivamente. Cada nó pode conter condições folha e/ou grupos filhos (children), permitindo árvores de lógica AND/OR de qualquer profundidade.",
        required: ["logicalOperator"],
        properties: {
          logicalOperator: { type: "string", enum: ["AND", "OR"] },
          conditions: {
            type: "array",
            items: {
              type: "object",
              required: ["field", "operator", "value"],
              properties: {
                field: { type: "string", enum: ["TOTAL_VALUE", "REGION", "PRODUCT", "SALESPERSON"] },
                operator: { type: "string", enum: ["GT", "GTE", "LT", "LTE", "EQ", "NEQ", "IN", "NOT_IN"] },
                value: { example: 1000000 },
              },
            },
          },
          children: {
            type: "array",
            description: "Grupos filhos (recursivo)",
            items: { $ref: "#/components/schemas/ConditionGroupSchema" },
          },
        },
      },
      Goal: {
        type: "object",
        required: ["id", "campaignId", "name", "validFrom", "validTo", "compensationType", "compensationValue", "compensationCurrency"],
        properties: {
          id: { type: "string", format: "uuid" },
          campaignId: { type: "string", format: "uuid" },
          name: { type: "string", example: "Meta Sudeste" },
          validFrom: { type: "string", format: "date", example: "2024-01-01" },
          validTo: { type: "string", format: "date", example: "2024-12-31" },
          compensationType: { type: "string", enum: ["FIXED", "PERCENTAGE"] },
          compensationValue: { type: "number", example: 5000 },
          compensationCurrency: { type: "string", example: "BRL" },
        },
      },
      AppraisalSummary: {
        type: "object",
        required: ["id", "status", "createdAt"],
        properties: {
          id: { type: "string", format: "uuid" },
          status: { type: "string", enum: ["PENDING", "PROCESSING", "DONE", "FAILED"] },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      AppraisalResult: {
        type: "object",
        required: ["goalId", "salespersonId", "achievedValue", "achievedCurrency", "goalMet", "payableAmount", "payableCurrency"],
        properties: {
          goalId: { type: "string", format: "uuid" },
          salespersonId: { type: "string", format: "uuid" },
          achievedValue: { type: "string", example: "1200000.00" },
          achievedCurrency: { type: "string", example: "BRL" },
          goalMet: { type: "boolean" },
          payableAmount: { type: "string", example: "1000.00" },
          payableCurrency: { type: "string", example: "BRL" },
        },
      },
      AppraisalDetail: {
        allOf: [
          { $ref: "#/components/schemas/AppraisalSummary" },
          {
            type: "object",
            properties: {
              finishedAt: { type: "string", format: "date-time", nullable: true },
              results: {
                type: "array",
                items: { $ref: "#/components/schemas/AppraisalResult" },
              },
            },
          },
        ],
      },
    },
  },
  paths: {
    "/v1/auth/sign-up": {
      post: {
        tags: ["Auth"],
        summary: "Registro de Usuário",
        description: "Realiza o cadastro de um novo usuário e já retorna o token de acesso.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { 
                    type: "string", 
                    minLength: 2, 
                    maxLength: 120, 
                    example: "Alice Silva",
                    description: "Nome de exibição"
                  },
                  email: { 
                    type: "string", 
                    format: "email", 
                    example: "alice@example.com",
                    description: "E-mail institucional"
                  },
                  password: { 
                    type: "string", 
                    minLength: 8, 
                    example: "secret123",
                    description: "Senha (mínimo 8 caracteres)"
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Conta criada com sucesso",
            content: { 
              "application/json": { 
                schema: { $ref: "#/components/schemas/AuthResponse" } 
              } 
            },
          },
          "400": {
            description: "Dados inválidos",
            content: { 
              "application/json": { 
                schema: { $ref: "#/components/schemas/ValidationErrorResponse" } 
              } 
            },
          },
          "409": {
            description: "E-mail já está sendo utilizado",
            content: { 
              "application/json": { 
                schema: { $ref: "#/components/schemas/ErrorResponse" } 
              } 
            },
          },
        },
      },
    },
    "/v1/auth/sign-in": {
      post: {
        tags: ["Auth"],
        summary: "Login de Usuário",
        description: "Autentica o usuário via e-mail e senha, retornando o token de sessão.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { 
                    type: "string", 
                    format: "email", 
                    example: "alice@example.com",
                    description: "E-mail cadastrado"
                  },
                  password: { 
                    type: "string", 
                    example: "secret123",
                    description: "Senha secreta"
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Autenticado com sucesso",
            content: { 
              "application/json": { 
                schema: { $ref: "#/components/schemas/AuthResponse" } 
              } 
            },
          },
          "400": {
            description: "Credenciais inválidas",
            content: { 
              "application/json": { 
                schema: { $ref: "#/components/schemas/ErrorResponse" } 
              } 
            },
          },
          "404": {
            description: "Usuário não encontrado",
            content: { 
              "application/json": { 
                schema: { $ref: "#/components/schemas/ErrorResponse" } 
              } 
            },
          },
        },
      },
    },
    "/v1/campaigns": {
      post: {
        tags: ["Campaigns"],
        summary: "Criar campanha",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "description"],
                properties: {
                  name: { type: "string", minLength: 2, maxLength: 120, example: "Q1 2024 Sales" },
                  description: { type: "string", maxLength: 500, example: "Campanha do primeiro trimestre" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Campanha criada",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Campaign" } } },
          },
          "401": {
            description: "Não autorizado",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
      get: {
        tags: ["Campaigns"],
        summary: "Listar campanhas",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Lista de campanhas",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Campaign" } },
              },
            },
          },
          "401": {
            description: "Não autorizado",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/v1/campaigns/{id}": {
      patch: {
        tags: ["Campaigns"],
        summary: "Atualizar campanha",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Campanha atualizada",
            content: { "application/json": { schema: { $ref: "#/components/schemas/CampaignPatch" } } },
          },
          "401": {
            description: "Não autorizado",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "404": {
            description: "Campanha não encontrada",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/v1/goals": {
      post: {
        tags: ["Goals"],
        summary: "Criar meta",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["campaignId", "name", "validFrom", "validTo", "compensationType", "compensationValue", "compensationCurrency"],
                properties: {
                  campaignId: { type: "string", format: "uuid" },
                  name: { type: "string", example: "Meta Sudeste" },
                  validFrom: { type: "string", format: "date", example: "2024-01-01" },
                  validTo: { type: "string", format: "date", example: "2024-12-31" },
                  compensationType: { type: "string", enum: ["FIXED", "PERCENTAGE"] },
                  compensationValue: { type: "number", example: 5000 },
                  compensationCurrency: { type: "string", example: "BRL" },
                  conditionTree: { $ref: "#/components/schemas/ConditionGroupSchema" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Meta criada",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Goal" } } },
          },
          "400": {
            description: "Dados inválidos",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationErrorResponse" } } },
          },
          "404": {
            description: "Campanha não encontrada",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
      get: {
        tags: ["Goals"],
        summary: "Listar metas de uma campanha",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "campaignId", in: "query", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": {
            description: "Lista de metas",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Goal" } },
              },
            },
          },
          "401": {
            description: "Não autorizado",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/v1/appraisals": {
      post: {
        tags: ["Appraisals"],
        summary: "Disparar apuração",
        security: [{ bearerAuth: [] }],
        responses: {
          "202": {
            description: "Apuração iniciada",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AppraisalSummary" } } },
          },
          "401": {
            description: "Não autorizado",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/v1/appraisals/{id}": {
      get: {
        tags: ["Appraisals"],
        summary: "Consultar apuração",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Detalhes da apuração",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AppraisalDetail" } } },
          },
          "401": {
            description: "Não autorizado",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "404": {
            description: "Apuração não encontrada",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/v1/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Perfil do Usuário Logado",
        description: "Retorna as informações do usuário associado ao token JWT enviado no cabeçalho.",
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "Informações do perfil",
            content: { 
              "application/json": { 
                schema: { $ref: "#/components/schemas/UserInfo" } 
              } 
            },
          },
          "401": {
            description: "Token inválido ou ausente",
            content: { 
              "application/json": { 
                schema: { $ref: "#/components/schemas/ErrorResponse" } 
              } 
            },
          },
        },
      },
    },
  },
} as const;
