import { createClient } from '@supabase/supabase-js'

// ============================================================
// Verificación de identidad por JWT.
// Los endpoints NO deben confiar en un student_id del body:
// usan getAuthUser() para validar el token del usuario y operar
// solo sobre SUS datos.
// ============================================================

// Cliente liviano solo para validar tokens (anon key).
// getUser(token) valida el JWT contra Supabase Auth (chequea firma y expiración).
const authClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

export type AuthUser = { id: string; email: string | null }

// Extrae el Bearer token del header Authorization y lo valida.
// Devuelve el usuario autenticado, o null si no hay token válido.
export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  const header = request.headers.get('authorization') || request.headers.get('Authorization')
  const token = header?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return null

  const { data, error } = await authClient.auth.getUser(token)
  if (error || !data.user) return null

  return { id: data.user.id, email: data.user.email ?? null }
}

// Respuesta estándar 401 para endpoints protegidos.
export function unauthorized() {
  return Response.json({ success: false, error: 'No autorizado' }, { status: 401 })
}
