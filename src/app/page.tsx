'use client'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

// Header con el JWT del usuario para autenticar las llamadas a la API
async function authHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}

export default function Dashboard() {
  const [d, setD] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const { data: u } = await supabase.auth.getUser()
      if (!u.user) { window.location.href = '/login'; return }

      // Alta idempotente del perfil (por si entra directo al dashboard)
      await fetch('/api/create-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify({ id: u.user.id, email: u.user.email }),
      }).catch(() => {})

      const res = await fetch('/api/dashboard', { headers: await authHeader() })
      const j = await res.json()
      if (j.success) setD(j.dashboard)
      setLoading(false)
    }
    init()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="h-16 bg-slate-800 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[0,1,2,3].map(i => <div key={i} className="h-24 bg-slate-800 rounded-2xl animate-pulse" />)}
          </div>
          <div className="h-40 bg-slate-800 rounded-2xl animate-pulse" />
        </div>
      </main>
    )
  }

  if (!d) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <p className="text-slate-300">Tuvimos un problemita cargando tu información.</p>
          <button onClick={() => location.reload()} className="bg-emerald-500 text-slate-950 font-bold px-5 py-2 rounded-xl">Reintentar</button>
        </div>
      </main>
    )
  }

  const { student, stats, courses, languages, is_new } = d
  const nextMin = stats.next_level?.min ?? stats.level.min
  const xpPct = stats.next_level ? Math.min(100, Math.round((stats.xp / nextMin) * 100)) : 100

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Header: Choco saludando ── */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-amber-400/15 border-2 border-amber-400 flex items-center justify-center text-3xl shrink-0">🐻</div>
            <div>
              <p className="text-amber-300 text-xs sm:text-sm font-medium">
                {is_new ? '¡Bienvenido a AcademIA! Soy Choco 🎉' : '¡Qué bueno verte de nuevo! — Choco'}
              </p>
              <h1 className="text-xl sm:text-2xl font-bold leading-tight">¡Hola, {student.name}!</h1>
              <p className="text-slate-400 text-xs sm:text-sm">
                {is_new ? 'Empecemos tu primer día de inglés 🚀' : 'Listo para tu inglés de hoy?'}
              </p>
            </div>
          </div>
          <button
            onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm px-3 py-2 rounded-xl shrink-0"
          >
            Salir
          </button>
        </div>

        {/* ── Stats: Racha, XP, Chokis, Nivel ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat icon="🔥" label="Racha" value={stats.streak_days > 0 ? `${stats.streak_days} ${stats.streak_days === 1 ? 'día' : 'días'}` : '—'}
                hint={stats.streak_days > 0 ? 'sin parar' : 'Empezá hoy'} accent="text-orange-400" />
          <Stat icon="⭐" label="XP" value={stats.xp.toLocaleString()} hint={`Nivel ${stats.level.title}`} accent="text-yellow-400" />
          <Stat icon="🪙" label="Chokis" value={stats.chokis.toLocaleString()} hint={stats.chokis > 0 ? 'ganados' : 'a ganar'} accent="text-emerald-400" />
          <Stat icon={stats.level.emoji} label="Nivel" value={stats.level.title}
                hint={stats.next_level ? `${stats.xp_to_next} XP → ${stats.next_level.title}` : '¡Máximo!'} accent="text-purple-300" />
        </div>

        {/* Barra de progreso de XP al próximo nivel */}
        {stats.next_level && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>{stats.level.emoji} {stats.level.title}</span>
              <span>{stats.next_level.emoji} {stats.next_level.title}</span>
            </div>
            <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-yellow-400 rounded-full" style={{ width: `${xpPct}%` }} />
            </div>
            <p className="text-center text-xs text-slate-500 mt-2">{stats.xp} / {nextMin} XP</p>
          </div>
        )}

        {/* ── Acciones principales ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href="/chat" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl p-5 flex items-center gap-3">
            <span className="text-3xl">💬</span>
            <span><span className="block text-lg">Hablar con María</span><span className="block text-sm font-medium opacity-80">Tu tutora IA, lista para vos</span></span>
          </a>
          <a href="/speaking" className="bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-2xl p-5 flex items-center gap-3">
            <span className="text-3xl">🎤</span>
            <span><span className="block text-lg">Practicar Speaking</span><span className="block text-sm font-medium opacity-80">Hablá y recibí tu score real</span></span>
          </a>
        </div>

        {/* ── Cursos por nivel ── */}
        <div>
          <h2 className="text-lg font-bold mb-3">Tu camino a C1 🎯</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {courses.map((c: any) => <CourseCard key={c.level} c={c} />)}
          </div>
        </div>

        {/* ── Idiomas ── */}
        <div>
          <h2 className="text-lg font-bold mb-3">Idiomas</h2>
          <div className="flex flex-wrap gap-3">
            {languages.map((l: any) => (
              <div key={l.code}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl border ${
                  l.active ? 'bg-emerald-500/10 border-emerald-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}>
                <span className={`text-2xl ${l.active ? '' : 'grayscale opacity-60'}`}>{l.flag}</span>
                <div>
                  <p className="font-bold text-sm">{l.name}</p>
                  <p className="text-xs">{l.active ? '✓ Activo' : 'Próximamente'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs pt-2">AcademIA — Aprendés inglés de verdad, con una IA que te corrige, te escucha y te entiende.</p>
      </div>
    </main>
  )
}

function Stat({ icon, label, value, hint, accent }: any) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
      <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
        <span className="text-base">{icon}</span>{label}
      </div>
      <p className={`text-xl sm:text-2xl font-bold ${accent}`}>{value}</p>
      <p className="text-slate-500 text-xs mt-0.5">{hint}</p>
    </div>
  )
}

function CourseCard({ c }: any) {
  const locked = c.status === 'locked'
  const active = c.status === 'active'
  const completed = c.status === 'completed'

  return (
    <div className={`rounded-2xl p-4 border ${
      active ? 'bg-slate-900 border-emerald-500' : completed ? 'bg-slate-900 border-slate-700' : 'bg-slate-900/50 border-slate-800'
    }`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`font-bold ${locked ? 'text-slate-500' : 'text-white'}`}>
          {c.level} — {c.name}
        </span>
        <span className="text-lg">{completed ? '✅' : active ? '📘' : '🔒'}</span>
      </div>

      {active && (
        <>
          {c.has_content ? (
            <>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden my-2">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${c.progress_pct}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{c.completed}/{c.total} lecciones · {c.progress_pct}%</span>
                <a href="/speaking" className="text-xs font-bold bg-emerald-500 text-slate-950 px-3 py-1.5 rounded-lg">
                  {c.progress_pct > 0 ? 'Continuar' : 'Empezar'}
                </a>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-400 mt-1">Contenido en camino 🚧</p>
          )}
        </>
      )}

      {completed && <p className="text-xs text-emerald-400 mt-1">Completado</p>}
      {locked && <p className="text-xs text-slate-500 mt-1">Se desbloquea al avanzar</p>}
    </div>
  )
}
