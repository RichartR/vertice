import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    // Prototipo: admin@vertice.es → dashboard admin, cualquier otro → dashboard empleado
    if (email === 'admin@vertice.es') {
      navigate('/admin/dashboard')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo / nombre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-4">
            <span className="text-xl font-bold text-gray-800">V</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Vértice</h1>
          <p className="text-sm text-gray-500 mt-1">Centro deportivo multidisciplinar</p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Accede a tu cuenta</h2>

          {/* Credenciales de prueba */}
          <div className="mb-5 p-3 rounded-lg bg-green-50 border border-green-200 text-xs text-gray-600 space-y-1">
            <p className="font-semibold text-gray-700">Credenciales de prueba:</p>
            <p>👤 <span className="font-mono font-medium">admin@vertice.es</span> → Dashboard admin</p>
            <p>👤 <span className="font-mono font-medium">empleado@vertice.es</span> → Dashboard empleado</p>
            <p className="text-gray-400 pt-0.5">(cualquier contraseña)</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@vertice.es"
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-accent hover:bg-accent-dark text-gray-900 font-medium text-sm py-2.5 rounded-lg transition-colors"
            >
              Entrar
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
