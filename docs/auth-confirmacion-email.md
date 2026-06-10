# Configuración de confirmación de email (Auth)

## Estado y decisión

- **Decisión de negocio (piloto):** "Confirm email" **OFF** → el estudiante se registra y entra
  directo, sin pasar por el correo. (`mailer_autoconfirm = true`)
- **Lanzamiento oficial (octubre 2026):** **REVERTIR a ON**, una vez que haya un SMTP real
  configurado (Resend o Zetly Mail). Con confirmación ON + SMTP default de Supabase, los
  signups se traban: el envío de correo se satura enseguida (`email rate limit exceeded`).

## ⚠️ Acción manual pendiente

El toggle NO se pudo cambiar por código: la Management API de Supabase requiere un
**Personal Access Token** (`sbp_...`); el `service_role` key es rechazado (`401 JWT failed verification`).

Para apagarlo, en el **Supabase Dashboard**:
`Authentication → Sign In / Providers → Email → desactivar "Confirm email"`
(equivale a `mailer_autoconfirm = true`).

Verificación rápida del estado actual:
```
GET https://<project-ref>.supabase.co/auth/v1/settings   (header: apikey = anon key)
→ "mailer_autoconfirm": false  significa confirmación ON
→ "mailer_autoconfirm": true   significa confirmación OFF
```

## Contexto

- El alta del perfil en `students` se hace en `POST /api/create-student` (service role),
  llamado por `src/app/page.tsx` al entrar. Antes el front llamaba a un endpoint inexistente
  y el 404 se tragaba en silencio — corregido.
- Última verificación end-to-end: alta de usuario nuevo OK (`students`: 1 → 2 → 1).
