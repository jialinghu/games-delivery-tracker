import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)       // supabase auth user
  const [profile, setProfile] = useState(null)  // { display_name, role }
  const [loading, setLoading] = useState(true)

  // Load profile from `profiles` table
  async function loadProfile(authUser) {
    if (!supabase || !authUser) { setProfile(null); return }
    const { data } = await supabase
      .from('profiles')
      .select('display_name, role')
      .eq('id', authUser.id)
      .single()
    setProfile(data || { display_name: authUser.email, role: 'PM' })
  }

  useEffect(() => {
    if (!supabase) { setLoading(false); return }

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) await loadProfile(session.user)
        else setProfile(null)
      }
    )

    return () => subscription.unsubscribe()
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

  const value = {
    user,
    profile,
    loading,
    signIn,
    signOut,
    isAdmin: profile?.role === 'admin',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
