import { getAuthUser, unauthorized } from '@/lib/auth'
import { buildDashboard } from '@/lib/dashboard'

// ============================================================
// GET /api/dashboard — datos reales del estudiante autenticado.
// Validado por JWT (igual que el resto del camino vivo): opera solo
// sobre el dueño del token, nunca sobre un student_id del body/query.
// ============================================================
export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request)
    if (!user) return unauthorized()

    const dashboard = await buildDashboard(user.id)
    return Response.json({ success: true, dashboard })
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
