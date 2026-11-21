# Guía de API para frontend

Base URL local:

```text
http://localhost:3000
```

Todas las respuestas de error siguen esta forma:

```json
{ "error": { "code": "ERROR_CODE", "message": "Mensaje" } }
```

## Health y documentación

### `GET /health`

No requiere autenticación. Devuelve `200` si la API está disponible.

### `GET /api/docs`

Interfaz Swagger interactiva.

## Flujo de autenticación

### `GET /api/auth/csrf`

Obtiene la cookie `csrf_token`. El frontend debe leerla y enviarla como `X-CSRF-Token` en `refresh` y `logout`.

### `POST /api/auth/login`

Body:

```json
{ "email": "admin@example.com", "password": "ContraseñaSegura_123!" }
```

Con MFA activo:

```json
{ "email": "admin@example.com", "password": "...", "mfaCode": "123456" }
```

Como alternativa de recuperación:

```json
{ "email": "admin@example.com", "password": "...", "recoveryCode": "A1B2C3D4-11223344" }
```

Devuelve `accessToken` en JSON y establece `refresh_token` como cookie HttpOnly. El frontend debe conservar el access token solo en memoria.

### `POST /api/auth/refresh`

No requiere body. Debe enviarse con credenciales/cookies y header:

```http
X-CSRF-Token: valor_de_csrf_token
```

Devuelve un nuevo `accessToken` y rota la cookie refresh. El frontend debe actualizar el token en memoria.

### `POST /api/auth/logout`

Header requerido:

```http
X-CSRF-Token: valor_de_csrf_token
```

Devuelve `204 No Content`, revoca la sesión y elimina la cookie.

### `POST /api/auth/change-password`

Requiere `Authorization: Bearer ACCESS_TOKEN`.

```json
{ "currentPassword": "actual", "newPassword": "NuevaSegura_123!" }
```

Devuelve `200` y revoca todas las sesiones.

## MFA TOTP

Todos requieren Bearer token.

### `POST /api/auth/mfa/setup`

Devuelve `secret`, `otpauthUrl` y `recoveryCodes`. Mostrar los códigos una sola vez y pedir al usuario que los guarde.

### `POST /api/auth/mfa/enable`

```json
{ "code": "123456" }
```

Activa MFA después de validar el código de Google Authenticator y revoca sesiones.

### `POST /api/auth/mfa/disable`

Desactiva MFA y revoca sesiones.

## Sesiones

Requieren Bearer token.

| Método | Endpoint | Acción |
| --- | --- | --- |
| GET | `/api/sessions` | Lista sesiones activas |
| DELETE | `/api/sessions/:sessionId` | Revoca una sesión |
| DELETE | `/api/sessions/all` | Revoca todas excepto la actual |

## Usuarios y permisos

Requieren Bearer token y permisos granulares.

| Método | Endpoint | Permiso | Acción |
| --- | --- | --- | --- |
| GET | `/api/users` | `users:read` | Lista paginada |
| POST | `/api/users` | `users:create` | Crea usuario |
| GET | `/api/users/:id` | `users:read` | Obtiene usuario |
| PATCH | `/api/users/:id` | `users:update` | Actualiza usuario |
| DELETE | `/api/users/:id` | `users:delete` | Baja lógica |

Crear usuario:

```json
{ "email": "user@example.com", "password": "UsuarioSeguro_123!", "roleId": "UUID_DEL_ROL" }
```

Nunca se devuelve `passwordHash`.

## Auditoría

### `GET /api/audit`

Requiere `audit:read`.

Filtros opcionales:

```text
/api/audit?page=1&limit=20&userId=UUID&event=login&from=2026-11-01T00:00:00Z&to=2026-11-30T23:59:59Z
```

Devuelve `items`, `total`, `page` y `limit`. No expone metadata sensible.

## Recomendaciones para el cliente

- Mantener el access token en memoria, no en `localStorage`.
- Usar `credentials: "include"` en refresh, logout y CSRF.
- Interceptar `401`, intentar un único refresh y luego cerrar sesión.
- No reintentar indefinidamente un refresh fallido.
- Tratar `423` como cuenta bloqueada.
- Tratar `403` como falta de permisos o CSRF inválido según el código.
- No mostrar ni registrar tokens, cookies, contraseñas ni códigos MFA.
