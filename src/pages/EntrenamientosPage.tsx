// Página de entrada al módulo de entrenamientos.
// Muestra accesos rápidos a los distintos subapartados.
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function EntrenamientosPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        <div className="shrink-0 mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Entrenamientos</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de entrenamientos.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/entrenamientos/bloques')}
            className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-200 hover:border-accent hover:shadow-sm transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/30 flex items-center justify-center text-gray-500 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 group-hover:text-gray-700">Entrenamientos Clientes</p>
              <p className="text-sm text-gray-400 mt-0.5">Ver y gestionar bloques de clientes</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/entrenamientos/iniciar')}
            className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-200 hover:border-accent hover:shadow-sm transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/30 flex items-center justify-center text-gray-500 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 group-hover:text-gray-700">Iniciar Entrenamiento</p>
              <p className="text-sm text-gray-400 mt-0.5">Comenzar sesión de entrenamiento</p>
            </div>
          </button>
        </div>

      </main>
    </div>
  )
}
