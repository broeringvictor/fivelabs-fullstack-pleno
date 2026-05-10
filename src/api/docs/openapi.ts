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
  },
} as const;
