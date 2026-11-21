// Especificación OpenAPI mantenida junto al código para que la documentación
// pueda evolucionar con los endpoints y no quede desactualizada.
export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Sistema Auth Starter API",
    version: "0.1.0",
    description: "API de autenticación profesional",
  },
  servers: [{ url: "http://localhost:3000", description: "Desarrollo local" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "admin@example.com" },
          password: { type: "string", format: "password", minLength: 8, example: "ContraseñaSegura_123!" },
          mfaCode: { type: "string", example: "123456" },
          recoveryCode: { type: "string", example: "A1B2C3D4-11223344" },
        },
      },
      AccessTokenResponse: {
        type: "object",
        properties: { accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIs..." } },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          role: { type: "object" },
          roleId: { type: "string", format: "uuid" },
          isActive: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      CreateUserRequest: {
        type: "object",
        required: ["email", "password", "roleId"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password", minLength: 12 },
          roleId: { type: "string", format: "uuid" },
        },
      },
      UpdateUserRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password", minLength: 12 },
          roleId: { type: "string", format: "uuid" },
          isActive: { type: "boolean" },
        },
      },
      ChangePasswordRequest: {
        type: "object",
        required: ["currentPassword", "newPassword"],
        properties: {
          currentPassword: { type: "string", format: "password" },
          newPassword: { type: "string", format: "password", minLength: 12 },
        },
      },
      MfaCodeRequest: {
        type: "object",
        required: ["code"],
        properties: { code: { type: "string", pattern: "^[0-9]{6}$" } },
      },
      Session: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          createdAt: { type: "string", format: "date-time" },
          lastUsedAt: { type: "string", format: "date-time", nullable: true },
          expiresAt: { type: "string", format: "date-time" },
          userAgent: { type: "string", nullable: true },
          ipAddress: { type: "string", nullable: true },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        summary: "Estado de la API",
        responses: { "200": { description: "API disponible" } },
      },
    },
    "/api/auth/login": {
      post: {
        summary: "Iniciar sesión",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Autenticación exitosa", content: { "application/json": { schema: { $ref: "#/components/schemas/AccessTokenResponse" } } } },
          "401": { description: "Credenciales inválidas o MFA inválido", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "423": { description: "Cuenta bloqueada" },
        },
      },
    },
    "/api/auth/refresh": {
      post: {
        summary: "Rotar refresh token",
        responses: {
          "200": { description: "Nuevo access token" },
          "401": { description: "Refresh token inválido" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        summary: "Cerrar sesión",
        responses: { "204": { description: "Sesión revocada" } },
      },
    },
    "/api/auth/change-password": {
      post: {
        summary: "Cambiar contraseña",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ChangePasswordRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Contraseña actualizada y sesiones revocadas" },
          "401": { description: "Contraseña actual inválida" },
        },
      },
    },
    "/api/auth/csrf": {
      get: {
        summary: "Obtener cookie CSRF",
        responses: { "204": { description: "Cookie CSRF creada" } },
      },
    },
    "/api/auth/mfa/setup": {
      post: {
        summary: "Preparar MFA TOTP",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Secreto, URI y códigos de recuperación para Authenticator", content: { "application/json": { example: { secret: "JBSWY3DPEHPK3PXP", otpauthUrl: "otpauth://totp/Sistema%20Auth%20Starter:admin%40example.com", recoveryCodes: ["A1B2C3D4-11223344"] } } } },
        },
      },
    },
    "/api/auth/mfa/enable": {
      post: {
        summary: "Activar MFA TOTP",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MfaCodeRequest" },
            },
          },
        },
        responses: { "200": { description: "MFA activado" } },
      },
    },
    "/api/auth/mfa/disable": {
      post: {
        summary: "Desactivar MFA TOTP",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "MFA desactivado" } },
      },
    },
    "/api/sessions": {
      get: {
        summary: "Listar sesiones activas",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Sesiones activas" },
          "401": { description: "No autenticado" },
        },
      },
    },
    "/api/sessions/all": {
      delete: {
        summary: "Revocar todas las demás sesiones",
        security: [{ bearerAuth: [] }],
        responses: { "204": { description: "Sesiones revocadas" } },
      },
    },
    "/api/sessions/{sessionId}": {
      delete: {
        summary: "Revocar una sesión",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "sessionId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "204": { description: "Sesión revocada" },
          "404": { description: "Sesión no encontrada" },
        },
      },
    },
    "/api/users": {
      get: {
        summary: "Listar usuarios",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", minimum: 1, default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
          },
        ],
        responses: {
          "200": { description: "Usuarios paginados" },
          "403": { description: "Requiere rol admin" },
        },
      },
      post: {
        summary: "Crear usuario",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateUserRequest" },
            },
          },
        },
        responses: {
          "201": { description: "Usuario creado" },
          "409": { description: "Email ya registrado" },
        },
      },
    },
    "/api/users/{id}": {
      get: {
        summary: "Obtener usuario",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": { description: "Usuario" },
          "404": { description: "Usuario no encontrado" },
        },
      },
      patch: {
        summary: "Actualizar usuario",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateUserRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Usuario actualizado" },
          "404": { description: "Usuario no encontrado" },
        },
      },
      delete: {
        summary: "Baja lógica de usuario",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "204": { description: "Usuario eliminado" },
          "400": { description: "No se permite autoeliminación" },
        },
      },
    },
    "/api/audit": {
      get: {
        summary: "Consultar auditoría administrativa",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 50, maximum: 100 },
          },
          { name: "userId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "event", in: "query", schema: { type: "string", example: "login" } },
          { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
        ],
        responses: { "200": { description: "Eventos auditados", content: { "application/json": { example: { items: [{ event: "login", success: true, createdAt: "2026-11-21T12:00:00.000Z" }], total: 1, page: 1, limit: 20 } } } } },
      },
    },
  },
} as const;
