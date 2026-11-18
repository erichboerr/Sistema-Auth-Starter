# Checklist de producción

- [ ] `NODE_ENV=production` y `COOKIE_SECURE=true`.
- [ ] Secretos JWT generados aleatoriamente y fuera del repositorio.
- [ ] `DATABASE_URL` con usuario PostgreSQL de privilegios mínimos.
- [ ] Migraciones ejecutadas; nunca usar sincronización automática.
- [ ] HTTPS terminado en Nginx y headers `X-Forwarded-*` configurados.
- [ ] CORS limitado a los orígenes reales.
- [ ] Redis configurado para rate limiting distribuido.
- [ ] PostgreSQL con backups, cifrado y acceso restringido.
- [ ] Logs sin contraseñas, tokens, cookies ni hashes.
- [ ] Rotación de secretos y procedimiento de revocación documentados.
- [ ] `npm audit`, build y pruebas ejecutados en CI.
- [ ] PM2/systemd con usuario sin privilegios y reinicio controlado.
- [ ] Endpoint de Swagger protegido o deshabilitado externamente.
- [ ] MFA obligatorio para administradores cuando el módulo esté habilitado.
