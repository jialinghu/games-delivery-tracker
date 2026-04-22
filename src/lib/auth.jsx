import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(authUser) {
    if (!supabase || !authUser) { setProfile(null); return }
    try {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, role')
        .eq('id', authUser.id)
        .single()
      setProfile(data || { display_name: authUser.email, role: 'PM' })
    } catch (err) {
      console.error('Profile load error:', err)
      setProfile({ display_name: authUser.email, role: 'PM' })
    }
  }

  useEffect(() => {
    if (!supabase) {
      console.warn('No Supabase client')
      setLoading(false)
      return
    }

    const timeout = setTimeout(() => {
      console.warn('Auth timeout - forcing past loading')
      setLoading(false)
    }, 5000)

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout)
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user)
      setLoading(false)
    }).catch((err) => {
      clearTimeout(timeout)
      console.error('Auth session error:', err)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) await loadProfile(session.user)
        else setProfile(null)
      }
    )

    return () => { clearTimeout(timeout); subscription.unsubscribe() }
  }, [])

  async function signIn(email, password) {
    if (!supabase) return { error: { message: 'Supabase not configured' } }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, isAdmin: profile?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
