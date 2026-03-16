import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import logo from '../assets/logo.webp'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import PasswordInput from '../components/ui/PasswordInput'

export default function LoginPage() {
  // useAuth nos da el estado de sesión actual (viene de AuthContext)
  const { user, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  // "submitting" es distinto de "loading" (que es el estado de sesión global)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const successMessage = (location.state as { message?: string } | null)?.message ?? null

  // Si ya hay sesión activa al cargar la página, redirigir automáticamente
  // Equivalente a un guard en Angular (canActivate)
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [loading, user, navigate])

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    // 1. Intentar login con Supabase Auth
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      // Mensaje genérico siempre — no revelar si el email existe o no
      setError('Email o contraseña incorrectos')
      setSubmitting(false)
      return
    }

    // 2. Obtener el usuario recién autenticado
    const { data: { user: loggedUser } } = await supabase.auth.getUser()
    if (!loggedUser) return

    // 3. Leer su perfil para saber rol y estado
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol, activo')
      .eq('id', loggedUser.id)
      .single()

    // Empleado desactivado → pantalla de acceso restringido
    if (!profile?.activo && profile?.rol !== 'admin') {
      navigate('/acceso-denegado', { replace: true })
      return
    }

    // Admin → siempre al dashboard
    if (profile?.rol === 'admin') {
      navigate('/dashboard', { replace: true })
      return
    }

    // Empleado activo → comprobar cuántos servicios tiene asignados
    const { data: assignments } = await supabase
      .from('service_employees')
      .select('service_id')
      .eq('employee_id', loggedUser.id)

    if (assignments?.length === 1) {
      // Un solo servicio → ir directo sin pasar por el dashboard
      navigate(`/services/${assignments[0].service_id}`, { replace: true })
    } else {
      // Varios servicios (o ninguno) → dashboard para elegir
      navigate('/dashboard', { replace: true })
    }

    setSubmitting(false)
  }

  // Mientras AuthContext verifica la sesión, no renderizar nada para evitar flash
  if (loading) return null

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <img src={logo} alt="Vértice" className="h-16 mx-auto mb-3 object-contain" />
          <p className="text-sm text-gray-500">Centro deportivo multidisciplinar</p>
        </div>

        {/* Banner de éxito — aparece tras cambio de contraseña */}
        {successMessage && (
          <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
            {successMessage}
          </div>
        )}

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="p-8">
            <h2 className="text-base font-semibold text-gray-900 mb-5">Accede a tu cuenta</h2>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.es"
                  required
                  autoComplete="email"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contraseña
                </label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-accent hover:bg-accent-dark text-gray-900 font-medium text-sm py-2.5 rounded-lg transition-colors disabled:opacity-60"
              >
                {submitting ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  )
}
