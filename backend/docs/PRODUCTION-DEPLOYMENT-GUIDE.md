# Guía de paso a producción — Sistema Auth Starter

Documento operativo para desplegar el backend en Ubuntu Server. Completarlo durante la implementación real y conservarlo como bitácora.

> Nunca copiar contraseñas, tokens, claves JWT, claves MFA ni credenciales reales dentro de este documento o del repositorio.

## 1. Datos que deben definirse antes del despliegue

- Dominio de la API: `api.example.com`.
- Dominio del frontend permitido por CORS.
- Proveedor de Ubuntu Server y versión LTS.
- Proveedor de PostgreSQL y política de backups.
- Redis administrado o servidor Redis con réplica/failover.
- Método de entrega: CI/CD o despliegue manual controlado.
- Responsable de rotación de secretos y respuesta ante incidentes.

## 2. Preparar Ubuntu Server

```bash
sudo apt update && sudo apt upgrade -y
sudo adduser --disabled-password --gecos "" authapp
sudo usermod -aG www-data authapp
sudo apt install -y nginx ca-certificates curl git build-essential
```

Instalar Node.js LTS mediante el método aprobado por el equipo. Verificar:

```bash
node --version
npm --version
```

No ejecutar la aplicación como `root`.

## 3. Obtener y preparar el código

```bash
sudo mkdir -p /var/www/sistema-auth-starter
sudo chown -R authapp:authapp /var/www/sistema-auth-starter
sudo -u authapp git clone REPOSITORY_URL /var/www/sistema-auth-starter
cd /var/www/sistema-auth-starter/backend
npm ci --omit=dev
```

Antes de desplegar, el commit debe pasar localmente:

```bash
npm run build
npm test -- --run
npm run test:integration
npm audit
```

## 4. Configurar secretos y variables

Crear el archivo de producción fuera de Git:

```bash
sudo -u authapp nano /var/www/sistema-auth-starter/backend/.env.production
chmod 600 /var/www/sistema-auth-starter/backend/.env.production
```

Variables mínimas:

```env
NODE_ENV=production
PORT=3000
APP_ORIGINS=https://frontend.example.com
DATABASE_URL=postgres://APP_USER:SECRET@DB_HOST:5432/sistema_auth_starter
JWT_ACCESS_SECRET=GENERATED_SECRET
JWT_REFRESH_SECRET=GENERATED_SECRET
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
MFA_ENCRYPTION_KEY=64_HEX_CHARACTERS
REDIS_URL=redis://REDIS_USER:SECRET@REDIS_HOST:6379
AUDIT_RETENTION_DAYS=365
LOG_LEVEL=info
```

Generar secretos con un gestor seguro o:

```bash
openssl rand -hex 64
openssl rand -hex 32
```

## 5. PostgreSQL

- Crear una base y un usuario exclusivos para la aplicación.
- Conceder únicamente los permisos necesarios.
- Restringir conexiones por red y firewall.
- Activar TLS si PostgreSQL está fuera del servidor.
- Configurar backups automáticos y probar restauraciones.

Ejecutar migraciones desde la versión exacta desplegada:

```bash
cd /var/www/sistema-auth-starter/backend
npm run db:migrate
```

No usar `sequelize.sync()` en producción.

## 6. Redis y rate limiting

Configurar Redis con autenticación, red privada, TLS cuando corresponda y réplica/failover. Verificar que `REDIS_URL` esté definido; con múltiples instancias, no usar el store local en memoria.

Probar login y confirmar que los límites se comparten entre procesos.

## 7. PM2

Instalar PM2 según la política del servidor:

```bash
sudo npm install -g pm2
cd /var/www/sistema-auth-starter/backend
npm run build
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup systemd
```

Ejecutar el comando `pm2 startup` que entregue la terminal y validar:

```bash
pm2 status
pm2 logs sistema-auth-starter
```

## 8. Nginx y HTTPS

Crear el virtual host para el dominio de la API. Nginx debe reenviar a `127.0.0.1:3000`, conservar `Host`, IP real y protocolo original, y no exponer directamente el puerto Node.

Después de validar HTTP, emitir el certificado con la herramienta aprobada, por ejemplo Certbot, y forzar HTTPS. Confirmar que las cookies lleguen con `Secure` y que CORS use únicamente el frontend real.

## 9. Crear el primer administrador

Ejecutar el comando de forma interactiva y segura:

```bash
cd /var/www/sistema-auth-starter/backend
npm run admin:create
```

No usar seeders con contraseñas conocidas. Activar MFA del administrador y guardar los códigos de recuperación fuera del servidor.

## 10. Verificación posterior al despliegue

```bash
curl -i https://api.example.com/health
```

Verificar manualmente o mediante smoke tests:

- Login correcto e incorrecto.
- Cookie refresh con `HttpOnly`, `Secure` y `SameSite` esperado.
- CSRF en refresh y logout.
- Rotación y reutilización de refresh token.
- Logout y revocación inmediata.
- MFA con Google Authenticator.
- Códigos de recuperación de un solo uso.
- ABM y permisos granulares.
- Auditoría administrativa.
- Rate limiting.

## 11. Logs, auditoría y retención

No registrar contraseñas, tokens, cookies, hashes ni secretos. Configurar rotación de logs del sistema y ejecutar la retención de auditoría mediante cron o scheduler controlado:

```bash
npm run audit:purge
```

Registrar quién ejecutó la purga y conservar los eventos según la política legal/operativa.

## 12. Backups y recuperación

- Definir RPO y RTO.
- Ejecutar backups automáticos.
- Cifrar y almacenar copias fuera del servidor.
- Probar una restauración periódicamente.
- Documentar cómo reconstruir PostgreSQL, Redis, Nginx y la aplicación.

## 13. Rollback

Antes de cada despliegue:

1. Guardar el commit actualmente activo.
2. Confirmar backup válido.
3. Revisar migraciones nuevas.
4. Desplegar el nuevo commit.
5. Ejecutar smoke tests.

Ante un fallo, volver al commit anterior, reiniciar PM2 y mantener la base compatible. No ejecutar migraciones destructivas sin un plan de reversión probado.

## 14. Checklist de cierre

- [ ] Dominio y DNS configurados.
- [ ] Firewall y acceso SSH endurecidos.
- [ ] Node.js LTS instalado.
- [ ] Aplicación ejecutándose con usuario sin privilegios.
- [ ] `.env.production` fuera de Git y con permisos `600`.
- [ ] PostgreSQL protegido y con backups probados.
- [ ] Redis configurado con failover.
- [ ] Migraciones aplicadas.
- [ ] PM2 configurado para reinicio automático.
- [ ] Nginx configurado.
- [ ] HTTPS activo y renovable.
- [ ] CORS restringido.
- [ ] MFA activado para administradores.
- [ ] Smoke tests exitosos.
- [ ] Monitorización y alertas activas.
- [ ] Procedimiento de rollback probado.
- [ ] Revisión de seguridad independiente completada.
