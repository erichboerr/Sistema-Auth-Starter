# Sistema Auth Starter

Template profesional con Node.js LTS, TypeScript estricto, Express, PostgreSQL y Sequelize.

## Implementado

- JWT con access token corto y refresh token opaco rotativo en cookie HttpOnly.
- Sesiones revocables, logout, revocación global y detección de reutilización.
- CSRF, Helmet, CORS, rate limiting y Redis opcional.
- Bloqueo por intentos fallidos e historial de las últimas tres contraseñas.
- MFA TOTP opcional con secreto cifrado.
- ABM de usuarios, baja lógica y permisos granulares.
- Auditoría persistente y Swagger en `/api/docs`.
- Pruebas unitarias, HTTP e integración con PostgreSQL de test.

## Desarrollo

```powershell
cd F:\Proyectos_Web\Sistema-Auth-Starter\backend
npm install
npm run db:migrate
npm run dev
```

Swagger: `http://localhost:3000/api/docs`

Guía completa de despliegue en Ubuntu Server: [docs/PRODUCTION-DEPLOYMENT-GUIDE.md](./docs/PRODUCTION-DEPLOYMENT-GUIDE.md)

Generar `MFA_ENCRYPTION_KEY`:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Pruebas

Usar una base PostgreSQL independiente configurada en `.env.test`:

```powershell
npm run test:db:migrate
npm test -- --run
npm run test:integration
```

## Pendiente antes de producción

- Códigos de recuperación MFA de un solo uso.
- Pruebas específicas de activación y login MFA.
- Decidir si MFA será obligatorio para administradores.
- Retención y filtros avanzados de auditoría.
- Redis real con failover.
- Nginx, HTTPS, backups y rotación de secretos.
- CI con audit, lint, build y pruebas.
- Proteger o deshabilitar Swagger externamente.
- Revisión de seguridad independiente.

Nunca registrar contraseñas, tokens, cookies, hashes ni secretos. En producción usar migraciones, no sincronización automática de Sequelize.
