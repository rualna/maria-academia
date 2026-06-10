# Variables de entorno

Dónde va cada variable: **local** = `.env.local` (gitignoreado, no se sube). **Producción** = Vercel → Project Settings → Environment Variables.

| Variable | ¿Obligatoria? | Local (`.env.local`) | Producción (Vercel) | Para qué |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ sí | tu URL de Supabase | misma | Endpoint de la API de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ sí | anon key | misma | Cliente público (auth) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ sí | service role key | misma | Backend (acceso admin) |
| `OPENAI_API_KEY` | ✅ sí | tu key | misma | Chat + Whisper + evaluación |
| `NEXT_PUBLIC_SITE_URL` | ✅ sí (reset password) | `http://localhost:3000` | URL pública real (ver abajo) | Arma el link de recuperación de contraseña |
| `STRIPE_SECRET_KEY` | ⬜ opcional | — | cuando se active Stripe | Pagos (stub hoy) |
| `RESEND_API_KEY` | ⬜ opcional | — | cuando se activen emails | Emails (stub hoy) |
| `DATABASE_URL` | ⬜ no la usa la app | solo para scripts de schema/RLS | no setear | Conexión Postgres directa (introspección/migraciones) |

## NEXT_PUBLIC_SITE_URL — detalle importante

El código (`src/app/forgot-password/page.tsx`) hace:
```ts
redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/update-password`
```

- **Valor local:** `http://localhost:3000`
- **Valor producción:** la URL pública **exacta** donde se sirve la app, **sin barra final**.
  Ejemplos: `https://academ-ia.com` o la URL de Vercel `https://maria-academia.vercel.app`.
  ⚠️ Sin trailing slash (si no, el link sale `https://...//update-password`).
- Es `NEXT_PUBLIC_*` → se **inyecta en build**. Si la cambiás en Vercel, hay que **redeployar** para que tome efecto.

## ⚠️ Paso obligatorio en Supabase (sin esto, el link igual falla)

Aunque la variable esté bien, Supabase **rechaza** el redirect si la URL no está en la allowlist.
En el dashboard: **Authentication → URL Configuration**:
1. **Site URL:** la URL pública de producción (la misma de `NEXT_PUBLIC_SITE_URL`).
2. **Redirect URLs:** agregar `https://TU-DOMINIO/update-password` (y `http://localhost:3000/update-password` para dev).

Recién con (a) la variable seteada **y** (b) la URL en la allowlist de Supabase, el flujo de recuperación de contraseña funciona end-to-end.
