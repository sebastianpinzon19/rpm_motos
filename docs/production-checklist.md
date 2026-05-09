# Checklist de producción - RMP Motos

## Seguridad base

- [ ] Definir `JWT_SECRET` fuerte y único en variables de entorno.
- [ ] Cambiar `PGPASSWORD` por una contraseña robusta de PostgreSQL.
- [ ] Desactivar credenciales por defecto del archivo `.env.example`.
- [ ] Servir la app detrás de HTTPS.
- [ ] Limitar CORS al dominio real de producción.
- [ ] Mantener `helmet` y `rate-limit` activos.

## Datos y backups

- [ ] Programar backup diario de PostgreSQL.
- [ ] Probar restauración de backup al menos una vez por semana.
- [ ] Guardar backups fuera del servidor principal.
- [ ] Documentar procedimiento de recuperación.

## Antibots / abuso

- [ ] Mantener limitación de tasa por IP.
- [ ] Agregar captcha en formularios públicos si el tráfico crece.
- [ ] Registrar intentos fallidos de login admin.
- [ ] Revocar refresh tokens tras cambio de contraseña.

## Mantenimiento

- [ ] Ejecutar `npm audit` en cada actualización.
- [ ] Revisar dependencias con alertas de seguridad.
- [ ] Hacer deploy solo desde un pipeline controlado.
- [ ] Monitorear logs del API y de PostgreSQL.
