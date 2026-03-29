import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { AuthUser } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface Profile {
  id: string
  nombre: string
  email: string
  rol: 'admin' | 'employee'
  activo: boolean
}

interface AuthContextType {
  user: AuthUser | null
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
  isActive: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Comprobar sesión activa al cargar
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        if (session?.user) fetchProfile(session.user.id)
        else setLoading(false)
      })
      .catch(() => setLoading(false))

    // Escuchar cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          // Volver a poner loading=true mientras se carga el perfil.
          // Sin esto hay un flash donde user!=null pero profile=null,
          // lo que hace isActive=false y ProtectedRoute redirige a /acceso-denegado.
          setLoading(true)
          fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      setProfile(data)
    } catch {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  // useMemo evita que el objeto value sea una referencia nueva en cada render,
  // lo que forzaría re-renders innecesarios en todos los consumidores del contexto
  const value = useMemo<AuthContextType>(() => ({
    user,
    profile,
    loading,
    isAdmin: profile?.rol === 'admin',
    // isActive es true si el perfil existe y activo = true
    // El admin siempre se considera activo independientemente del campo activo
    isActive: profile?.activo === true || profile?.rol === 'admin',
  }), [user, profile, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
