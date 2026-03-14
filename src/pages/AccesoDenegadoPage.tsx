import logo from '../assets/logo.webp'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function AccesoDenegadoPage() {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">

        <img src={logo} alt="Vértice" className="h-16 mx-auto mb-6 object-contain" />

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Acceso restringido</h1>
          <p className="text-sm text-gray-500 mb-6">
            Tu cuenta está desactivada. Contacta con el administrador para más información.
          </p>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>

      </div>
    </div>
  )
}
