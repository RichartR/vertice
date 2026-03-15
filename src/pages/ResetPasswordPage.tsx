// Página de cambio de contraseña — accesible desde el enlace del email de reset/invitación.
// Supabase procesa los tokens de la URL automáticamente; solo hay que escuchar
// el evento PASSWORD_RECOVERY con onAuthStateChange para saber que el usuario está listo.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.webp'
import { supabase } from '../lib/supabase'

type Estado = 'esperando' | 'listo' | 'expirado'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [estado, setEstado] = useState<Estado>('esperando')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    // Supabase emite PASSWORD_RECOVERY cuando procesa el token del email.
    // Si el token ya fue procesado antes de montar (SPA recarga), getSession() lo detecta.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setEstado('listo')
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setEstado('listo')
      if (event === 'SIGNED_OUT') setEstado('expirado')
    })

    // Si pasados 5 s no hay sesión, el enlace probablemente expiró
    const timeout = setTimeout(() => {
      setEstado(prev => prev === 'esperando' ? 'expirado' : prev)
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setGuardando(true)
    setError(null)

    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError('Error al actualizar la contraseña. El enlace puede haber expirado.')
      setGuardando(false)
      return
    }

    await supabase.auth.signOut()
    navigate('/login', { state: { message: 'Contraseña actualizada correctamente. Inicia sesión.' } })
  }

  const inputCls = 'w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <img src={logo} alt="Vértice" className="h-16 mx-auto mb-3 object-contain" />
          <p className="text-sm text-gray-500">Centro deportivo multidisciplinar</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="p-8">

            {estado === 'esperando' && (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {estado === 'expirado' && (
              <div className="text-center py-4">
                <p className="text-base font-semibold text-gray-900 mb-2">Enlace expirado</p>
                <p className="text-sm text-gray-500 mb-6">
                  El enlace de cambio de contraseña ha caducado o ya fue utilizado.
                  Solicita uno nuevo desde el panel de administración.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            )}

            {estado === 'listo' && (
              <>
                <h2 className="text-base font-semibold text-gray-900 mb-5">Establece tu contraseña</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Nueva contraseña
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      autoComplete="new-password"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Confirmar contraseña
                    </label>
                    <input
                      id="confirm"
                      type="password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Repite la contraseña"
                      required
                      autoComplete="new-password"
                      className={inputCls}
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={guardando}
                    className="w-full bg-accent hover:bg-accent-dark text-gray-900 font-medium text-sm py-2.5 rounded-lg transition-colors disabled:opacity-60"
                  >
                    {guardando ? 'Guardando...' : 'Guardar contraseña'}
                  </button>
                </form>
              </>
            )}

          </div>
        </div>

      </div>
    </div>
  )
}
